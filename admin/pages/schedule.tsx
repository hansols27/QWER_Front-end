'use client';

import { useState, useEffect } from "react";
import Layout from "@components/common/layout";
import {
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
} from "@mui/material";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import type { ScheduleEvent, EventType } from "@shared/types/schedule";
import { api } from "@shared/services/axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// -----------------------------
// ⭐️ 고정 일정 데이터 및 헬퍼 함수
// -----------------------------

// 데뷔일 및 생일 같은 고정 일정임을 표시하기 위한 확장 타입
interface StaticScheduleEvent extends ScheduleEvent {
    isStatic: true;
}

// 매년 반복되는 고정 일정을 생성하는 헬퍼 함수
const createYearlyEvent = (
    title: string, 
    type: EventType, 
    month: number, // 1부터 12
    day: number,
    isBirthday: boolean = false
): StaticScheduleEvent => {
    // 고정 일정은 UTC 기준 자정 (YYYY-MM-DD T00:00:00Z)으로 설정하여 시간대 문제를 방지
    const currentYear = new Date().getFullYear();
    const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`;
    const date = new Date(dateStr);

    const eventType: EventType = isBirthday ? 'B' : type;

    return {
        // 고정 일정임을 나타내기 위해 특별한 ID 패턴 사용 (수정/삭제 방지용)
        id: `static-${eventType}-${month}-${day}`, 
        title,
        type: eventType,
        start: date,
        end: date,
        allDay: true,
        color: eventType === 'B' ? '#ff9800' : eventType === 'E' ? '#4caf50' : '#9e9e9e', // 색상 하드코딩 (B: 주황, E: 녹색)
        isStatic: true,
    };
};

// 1. 데뷔일 (요청: E 타입, 10월 18일)
const getDebutEvents = createYearlyEvent('데뷔일 ♡', 'E', 10, 18);

// 2. 멤버 생일
const MEMBERS = [
    { name: 'CHODAN', month: 11, day: 1 },
    { name: 'MAJENTA', month: 6, day: 2 },
    { name: 'HINA', month: 1, day: 30 },
    { name: 'SIYEON', month: 5, day: 16 },
];

const getBirthdayEvents = MEMBERS.map(member => 
    createYearlyEvent(`${member.name} 생일`, 'B', member.month, member.day, true)
);

// ⭐️ 모든 고정 일정
const STATIC_EVENTS: StaticScheduleEvent[] = [
    getDebutEvents, 
    ...getBirthdayEvents
];

// -----------------------------
// 일정 유형 정의 (기존 유지)
// -----------------------------

// ⭐️ 관리자 등록용 유형: 이벤트, 콘서트만
const ADMIN_EVENT_TYPES: { [key in 'E' | 'C']: string } = {
    C: "콘서트 (Concert)",
    E: "이벤트 (Event)",
};

// ⭐️ 사용자에게 보여지는 전체 유형 (하드코딩된 생일 포함)
const ALL_EVENT_TYPES: { [key in EventType]: string } = {
    B: "생일 (Birthday)",
    C: "콘서트 (Concert)",
    E: "이벤트 (Event)",
};

// Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환하는 헬퍼 함수 (기존 유지)
const formatDateToInput = (date: Date): string => {
    // toISOString()을 사용하여 UTC 기준으로 변환하고, 날짜 부분만 추출
    return date.toISOString().split('T')[0];
};

const getErrorMessage = (error: any, defaultMessage: string = "요청 처리 중 오류가 발생했습니다."): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMessage;
};

// -----------------------------
// FullCalendar v6 타입 정의 (기존 유지)
// -----------------------------
interface DateClickArg {
    date: Date;
    allDay: boolean;
    dayEl: HTMLElement;
    jsEvent: MouseEvent;
    view: any;
}

interface EventClickArg {
    event: {
        id: string;
        title: string;
        start: Date | null;
        end: Date | null;
        allDay?: boolean;
        extendedProps?: any;
    };
    el: HTMLElement;
    jsEvent: MouseEvent;
    view: any;
}

// -----------------------------
// SchedulePage 컴포넌트
// -----------------------------
const SchedulePage = () => {
    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="error">
                        <Typography fontWeight="bold">환경 설정 오류:</Typography>
                        .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않아 일정을 관리할 수 없습니다.
                    </Alert>
                </Box>
            </Layout>
        );
    }

    // ⭐️ ScheduleEvent와 StaticScheduleEvent를 모두 포함할 수 있도록 타입 확장
    const [events, setEvents] = useState<(ScheduleEvent | StaticScheduleEvent)[]>([]); 
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null); 
    
    const [title, setTitle] = useState("");
    const [type, setType] = useState<keyof typeof ADMIN_EVENT_TYPES>("E"); 
    
    const [allDay, setAllDay] = useState(true); 
    
    const [editId, setEditId] = useState<string | null>(null);

    // ===========================
    // 일정 목록 불러오기 (DB + 고정 일정)
    // ===========================
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setAlertMessage(null);
            try {
                const res = await api.get<{ success: boolean; data: ScheduleEvent[] }>("/api/schedules");
                
                const fetchedEvents = res.data.data.map(e => ({
                    ...e,
                    start: new Date(e.start),
                    end: e.end ? new Date(e.end) : new Date(e.start),
                    isStatic: false, // DB에서 온 이벤트는 정적 이벤트가 아님
                }));
                
                // ⭐️ DB 이벤트와 고정 일정을 합쳐서 저장
                setEvents([...fetchedEvents, ...STATIC_EVENTS]);
            } catch (err: any) {
                console.error("Failed to load schedule:", err);
                setAlertMessage({ message: getErrorMessage(err, "일정 로드에 실패했습니다. 백엔드 서버 상태를 확인하세요."), severity: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);
    
    // ===========================
    // 날짜 클릭 시 모달 열기 (새 일정 추가)
    // ===========================
    const handleDateClick = (arg: DateClickArg) => {
        setStartDate(arg.date);
        setEndDate(arg.date);
        
        setTitle("");
        setType("E"); // 기본값 Event
        setAllDay(true);
        setEditId(null);
        setAlertMessage(null); 
        setModalOpen(true);
    };

    // ===========================
    // 이벤트 클릭 시 수정 모달 열기 (수정 불가능한 일정 차단)
    // ===========================
    const handleEventClick = (arg: EventClickArg) => {
        // ⭐️ 고정 일정인지 확인
        const evt = events.find(e => e.id === arg.event.id);
        if (!evt) return;

        // ⭐️ 수정/삭제 불가능한 고정 일정(Static)이면 모달을 열지 않고 종료
        if ((evt as StaticScheduleEvent).isStatic) {
            console.log(`Static event clicked: ${evt.title}. Edit/Delete blocked.`);
            // 사용자에게 피드백이 필요하면 Alert를 사용할 수 있습니다.
            // setAlertMessage({ message: "생일이나 데뷔일 같은 고정 일정은 수정할 수 없습니다.", severity: "warning" });
            return;
        }

        // ⭐️ Date 객체를 그대로 사용
        setStartDate(evt.start);
        setEndDate(evt.end); 
        
        setTitle(evt.title);
        // DB에서 온 이벤트이므로 type은 ADMIN_EVENT_TYPES에 포함될 것이라 가정
        setType(evt.type as keyof typeof ADMIN_EVENT_TYPES);
        setAllDay(evt.allDay || true); 
        setEditId(evt.id);
        setAlertMessage(null); 
        setModalOpen(true);
    };

    // ===========================
    // 일정 저장 (기존 로직 유지)
    // ===========================
    const saveEvent = async () => {
        if (!startDate || !endDate) return;

        setAlertMessage(null);

        if (!title.trim()) {
            setAlertMessage({ 
                message: "일정 제목은 필수 입력 사항입니다.", 
                severity: "error" 
            });
            return; 
        }
        
        const startStr = formatDateToInput(startDate);
        const endStr = formatDateToInput(endDate);

        if (endStr < startStr) {
            setAlertMessage({ 
                message: "종료일자는 시작일자보다 빠를 수 없습니다.", 
                severity: "error" 
            });
            return; // 저장 중단
        }

        // FullCalendar 규칙: end Date는 다음날 자정으로 설정
        const actualEndDateForFC = new Date(endDate);
        actualEndDateForFC.setDate(actualEndDateForFC.getDate() + 1);

        const eventToSend = {
            id: editId || uuidv4(),
            title: title.trim(),
            type,
            allDay: true,
            start: startDate.toISOString(),
            end: actualEndDateForFC.toISOString(),
        };

        setLoading(true);
        try {
            const url = editId ? `/api/schedules/${editId}` : "/api/schedules";
            const method = editId ? api.put : api.post;

            const res = await method<{ success: boolean; data: ScheduleEvent[] }>(url, eventToSend);
            
            // 백엔드에서 받은 배열의 Date 문자열을 다시 Date 객체로 변환
            const updatedDbEvents = res.data.data.map(e => ({
                ...e,
                start: new Date(e.start),
                end: e.end ? new Date(e.end) : new Date(e.start),
                isStatic: false, // DB 이벤트임을 명시
            }));
            
            // ⭐️ DB 이벤트와 고정 일정을 합쳐서 setEvents 호출
            setEvents([...updatedDbEvents, ...STATIC_EVENTS]);

            setModalOpen(false);
            setAlertMessage({ message: "일정이 성공적으로 저장되었습니다!", severity: "success" });
        } catch (err: any) {
            console.error("Failed to save schedule:", err);
            setAlertMessage({ message: getErrorMessage(err, "일정 저장에 실패했습니다. 백엔드 로그를 확인하세요."), severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // ===========================
    // 일정 삭제 (기존 로직 유지)
    // ===========================
    const deleteEvent = async () => {
        if (!editId) return;
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.delete<{ success: boolean; data: ScheduleEvent[] }>(`/api/schedules/${editId}`);
            
            const updatedDbEvents = res.data.data.map(e => ({
                ...e,
                start: new Date(e.start),
                end: e.end ? new Date(e.end) : new Date(e.start),
                isStatic: false, // DB 이벤트임을 명시
            }));
            
            // ⭐️ DB 이벤트와 고정 일정을 합쳐서 setEvents 호출
            setEvents([...updatedDbEvents, ...STATIC_EVENTS]);
            
            setModalOpen(false);
            setAlertMessage({ message: "일정이 성공적으로 삭제되었습니다!", severity: "success" });
        } catch (err: any) {
            console.error("Failed to delete schedule:", err);
            setAlertMessage({ message: getErrorMessage(err, "일정 삭제에 실패했습니다."), severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">
                    일정관리
                </Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}
                {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}

                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    // ⭐️ events 배열에 DB 일정과 고정 일정이 모두 포함됨
                    events={events.map(e => ({
                        id: e.id,
                        // title에 유형 명칭 추가
                        title: `${ALL_EVENT_TYPES[e.type]}: ${e.title}`, 
                        start: e.start.toISOString().split('T')[0],
                        // FullCalendar는 end-1일까지 표시하므로 end 날짜를 그대로 사용
                        end: e.end.toISOString().split('T')[0], 
                        allDay: true,
                        // ⭐️ color는 이제 DB와 고정 일정 모두에서 color 필드를 사용하도록 수정
                        color: e.color, 
                    }))}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick} // ⭐️ 고정 일정 차단 로직 포함
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,dayGridWeek,dayGridDay",
                    }}
                    locale="ko"
                    height="auto"
                />

                {/* 일정 추가/수정 모달 */}
                <Dialog 
                    open={modalOpen} 
                    onClose={() => { setModalOpen(false); setAlertMessage(null); }}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>{editId ? "일정 수정" : "일정 추가"}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            {/* 1. 제목 입력 */}
                            <TextField
                                label="제목"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                fullWidth
                                required
                                error={!title.trim() && !loading && modalOpen}
                                helperText={!title.trim() && !loading && modalOpen ? "제목은 필수입니다." : ""}
                            />
                            
                            {/* 2. 유형 선택 (관리자용 E, C만) */}
                            <FormControl fullWidth required>
                                <InputLabel>유형</InputLabel>
                                <Select 
                                    value={type} 
                                    label="유형" 
                                    onChange={e => setType(e.target.value as keyof typeof ADMIN_EVENT_TYPES)}
                                >
                                    {Object.entries(ADMIN_EVENT_TYPES).map(([key, val]) => (
                                        <MenuItem key={key} value={key}>{val}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            {/* 3. 시작일자 */}
                            <TextField
                                label="시작일자"
                                type="date"
                                value={startDate ? formatDateToInput(startDate) : ''}
                                onChange={e => setStartDate(new Date(e.target.value))}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            
                            {/* 4. 종료일자 */}
                            <TextField
                                label="종료일자"
                                type="date"
                                value={endDate ? formatDateToInput(endDate) : ''}
                                onChange={e => setEndDate(new Date(e.target.value))}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        {editId && (
                            <Button color="error" onClick={deleteEvent} disabled={loading}>
                                삭제
                            </Button>
                        )}
                        <Button onClick={() => { setModalOpen(false); setAlertMessage(null); }} disabled={loading}>
                            취소
                        </Button>
                        <Button
                            variant="contained"
                            onClick={saveEvent}
                            disabled={loading || !title.trim() || !startDate || !endDate}
                            startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        >
                            {loading ? (editId ? "수정 중..." : "저장 중...") : "저장"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
};

export default SchedulePage;