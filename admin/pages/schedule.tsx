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
    const currentYear = new Date().getFullYear();
    // FullCalendar 렌더링을 위해 'YYYY-MM-DD' 형식의 문자열을 사용
    const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const eventType: EventType = isBirthday ? 'B' : type;

    return {
        id: `static-${eventType}-${month}-${day}`, 
        title,
        type: eventType,
        // State 관리를 위해 Date 객체를 생성하지만, 아래 캘린더 렌더링 시에는 YYYY-MM-DD 문자열만 사용됨
        start: new Date(dateStr),
        end: new Date(dateStr), 
        allDay: true,
        color: eventType === 'B' ? '#ff9800' : eventType === 'E' ? '#4caf50' : '#9e9e9e',
        isStatic: true,
    };
};

const getDebutEvents = createYearlyEvent('데뷔일 ♡', 'E', 10, 18);

const MEMBERS = [
    { name: 'CHODAN', month: 11, day: 1 },
    { name: 'MAJENTA', month: 6, day: 2 },
    { name: 'HINA', month: 1, day: 30 },
    { name: 'SIYEON', month: 5, day: 16 },
];

const getBirthdayEvents = MEMBERS.map(member => 
    createYearlyEvent(`${member.name} 생일`, 'B', member.month, member.day, true)
);

const STATIC_EVENTS: StaticScheduleEvent[] = [
    getDebutEvents, 
    ...getBirthdayEvents
];

// -----------------------------
// 일정 유형 정의
// -----------------------------

const ADMIN_EVENT_TYPES: { [key in 'E' | 'C']: string } = {
    C: "콘서트 (Concert)",
    E: "이벤트 (Event)",
};

const ALL_EVENT_TYPES: { [key in EventType]: string } = {
    B: "생일 (Birthday)",
    C: "콘서트 (Concert)",
    E: "이벤트 (Event)",
};

// ⭐️ 핵심 수정: Date 객체를 로컬 시간대 기준 'YYYY-MM-DD' 문자열로 변환하는 헬퍼 함수
const formatDateToInput = (date: Date): string => {
    // 로컬 시간(KST)을 기준으로 연, 월, 일을 추출하여 순수 날짜 문자열 반환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getErrorMessage = (error: any, defaultMessage: string = "요청 처리 중 오류가 발생했습니다."): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMessage;
};

// -----------------------------
// FullCalendar v6 타입 정의
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
                
                // 백엔드에서 받은 YYYY-MM-DD 문자열을 Date 객체로 변환
                const fetchedEvents = res.data.data.map(e => ({
                    ...e,
                    // DB에서 DATE 타입으로 저장된 문자열(YYYY-MM-DD)을 Date 객체로 변환
                    // 'YYYY-MM-DD' 형식은 로컬 시간대의 00:00:00으로 파싱됨
                    start: new Date(e.start), 
                    end: e.end ? new Date(e.end) : new Date(e.start),
                    isStatic: false,
                }));
                
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
        // FullCalendar에서 받은 Date 객체는 이미 로컬 시간대로 설정되어 있음
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
        const evt = events.find(e => e.id === arg.event.id);
        if (!evt) return;

        if ((evt as StaticScheduleEvent).isStatic) {
            console.log(`Static event clicked: ${evt.title}. Edit/Delete blocked.`);
            return;
        }

        setStartDate(evt.start);
        setEndDate(evt.end); 
        
        setTitle(evt.title);
        setType(evt.type as keyof typeof ADMIN_EVENT_TYPES);
        setAllDay(evt.allDay || true); 
        setEditId(evt.id);
        setAlertMessage(null); 
        setModalOpen(true);
    };

    // ===========================
    // 일정 저장 (Timezone 문제 해결 적용)
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
        
        // ⭐️ 수정: 로컬 시간 기준 날짜 문자열(YYYY-MM-DD)을 추출
        const startStr = formatDateToInput(startDate);
        const endStr = formatDateToInput(endDate);

        if (endStr < startStr) {
            setAlertMessage({ 
                message: "종료일자는 시작일자보다 빠를 수 없습니다.", 
                severity: "error" 
            });
            return; // 저장 중단
        }

        const eventToSend = {
            id: editId || uuidv4(),
            title: title.trim(),
            type,
            allDay: true,
            // ⭐️ 핵심 수정: ISO String 대신 순수 날짜 문자열(YYYY-MM-DD) 전송
            start: startStr, 
            end: endStr,
        };

        setLoading(true);
        try {
            const url = editId ? `/api/schedules/${editId}` : "/api/schedules";
            const method = editId ? api.put : api.post;

            const res = await method<{ success: boolean; data: ScheduleEvent[] }>(url, eventToSend);
            
            const updatedDbEvents = res.data.data.map(e => ({
                ...e,
                start: new Date(e.start),
                end: e.end ? new Date(e.end) : new Date(e.start),
                isStatic: false,
            }));
            
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
    // 일정 삭제
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
                isStatic: false,
            }));
            
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
                    events={events.map(e => ({
                        id: e.id,
                        title: e.title, 
                        // ⭐️ 수정: FullCalendar 렌더링 시 로컬 시간 기준 'YYYY-MM-DD' 문자열 전달
                        start: formatDateToInput(e.start),
                        end: formatDateToInput(e.end), 
                        allDay: true,
                        color: e.color, 
                    }))}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
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
                                onChange={e => {
                                    // ⭐️ 핵심 수정: KST 00:00:00을 기준으로 Date 객체를 생성
                                    const dateString = e.target.value; // YYYY-MM-DD
                                    setStartDate(new Date(`${dateString}T00:00:00`));
                                }}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            
                            {/* 4. 종료일자 */}
                            <TextField
                                label="종료일자"
                                type="date"
                                value={endDate ? formatDateToInput(endDate) : ''}
                                onChange={e => {
                                    // ⭐️ 핵심 수정: KST 00:00:00을 기준으로 Date 객체를 생성
                                    const dateString = e.target.value; // YYYY-MM-DD
                                    setEndDate(new Date(`${dateString}T00:00:00`));
                                }}
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