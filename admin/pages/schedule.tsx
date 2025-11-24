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

// ⭐️ 관리자 등록용 유형: 이벤트, 콘서트만
const ADMIN_EVENT_TYPES: { [key in 'E' | 'C']: string } = {
    C: "콘서트 (Concert)",
    E: "이벤트 (Event)",
};

// ⭐️ 사용자에게 보여지는 전체 유형 (하드코딩된 생일 포함)
// 참고: B, D 유형은 관리자가 등록하는 것이 아님.
const ALL_EVENT_TYPES: { [key in EventType]: string } = {
    B: "생일 (Birthday)", // 하드코딩될 항목
    C: "콘서트 (Concert)",
    E: "이벤트 (Event)",
    // D: "데뷔일 (Debut)" - 요청에 따라 '이벤트(E)'에 포함하여 별도 등록 불필요
};

// Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환하는 헬퍼 함수
const formatDateToInput = (date: Date): string => {
    // toISOString()을 사용하여 UTC 기준으로 변환하고, 날짜 부분만 추출
    // Date 객체가 로컬 타임존의 자정을 나타낸다고 가정
    return date.toISOString().split('T')[0];
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

    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    
    // ⭐️ 시작일자 (클릭한 날짜)
    const [startDate, setStartDate] = useState<Date | null>(null);
    // ⭐️ 종료일자 (새로 추가된 입력 필드)
    const [endDate, setEndDate] = useState<Date | null>(null); 
    
    const [title, setTitle] = useState("");
    // ⭐️ 기본값을 관리자 유형 중 하나인 E로 설정
    const [type, setType] = useState<keyof typeof ADMIN_EVENT_TYPES>("E"); 
    
    // ⭐️ 종일 이벤트 (기간 선택 시 항상 종일로 간주)
    const [allDay, setAllDay] = useState(true); 
    
    // ⭐️ 시간 상태 제거됨: [startTime, setStartTime], [endTime, setEndTime]
    
    const [editId, setEditId] = useState<string | null>(null);

    // ===========================
    // 일정 목록 불러오기 (DB에서)
    // ===========================
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setAlertMessage(null);
            try {
                const res = await api.get<{ success: boolean; data: ScheduleEvent[] }>("/api/schedules");
                
                // DB에서 문자열로 넘어온 start/end 필드를 Date 객체로 변환하여 저장
                const fetchedEvents = res.data.data.map(e => ({
                    ...e,
                    start: new Date(e.start),
                    end: e.end ? new Date(e.end) : new Date(e.start)
                }));
                setEvents(fetchedEvents);
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
        // ⭐️ 시작일자 설정
        setStartDate(arg.date);
        // ⭐️ 시작일자와 동일하게 종료일자 기본값 설정
        setEndDate(arg.date);
        
        setTitle("");
        setType("E"); // 기본값 Event
        setAllDay(true); // 기간 설정이므로 항상 true
        setEditId(null);
        setAlertMessage(null); 
        setModalOpen(true);
    };

    // ===========================
    // 이벤트 클릭 시 수정 모달 열기
    // ===========================
    const handleEventClick = (arg: EventClickArg) => {
        const evt = events.find(e => e.id === arg.event.id);
        if (!evt) return;

        // ⭐️ Date 객체를 그대로 사용 (캘린더의 DateClickArg와 유사하게)
        setStartDate(evt.start);
        setEndDate(evt.end); 
        
        setTitle(evt.title);
        // ⭐️ 관리자 등록 유형에 맞지 않는 B 타입인 경우 E로 임시 설정
        setType(evt.type === 'B' ? 'E' : evt.type as keyof typeof ADMIN_EVENT_TYPES);
        setAllDay(evt.allDay || true); // 기간 설정이므로 항상 true
        setEditId(evt.id);
        setAlertMessage(null); 
        setModalOpen(true);
    };

    // ===========================
    // 일정 저장
    // ===========================
    const saveEvent = async () => {
        if (!startDate || !endDate) return;

        setAlertMessage(null);

        // 제목 필수 입력 검사
        if (!title.trim()) {
            setAlertMessage({ 
                message: "일정 제목은 필수 입력 사항입니다.", 
                severity: "error" 
            });
            return; 
        }
        
        // ⭐️ 종료일자가 시작일자보다 빠른지 검증 (같은 날짜는 허용)
        // Date 객체를 비교하기 위해 'YYYY-MM-DD' 형식 문자열로 변환하여 비교하는 것이 안전
        const startStr = formatDateToInput(startDate);
        const endStr = formatDateToInput(endDate);

        if (endStr < startStr) {
            setAlertMessage({ 
                message: "종료일자는 시작일자보다 빠를 수 없습니다.", 
                severity: "error" 
            });
            return; // 저장 중단
        }

        // FullCalendar는 기간 이벤트를 표시할 때, end 필드에 지정된 날짜는 포함하지 않음.
        // 따라서 DB에 저장할 end Date는 선택된 end Date의 다음날 자정으로 설정해야 함.
        const actualEndDateForFC = new Date(endDate);
        actualEndDateForFC.setDate(actualEndDateForFC.getDate() + 1);

        const newEvent: ScheduleEvent = {
            id: editId || uuidv4(),
            title: title.trim(),
            type,
            allDay: true, // 기간 설정이므로 항상 true
            start: startDate,
            end: actualEndDateForFC, // FullCalendar 규칙에 따라 다음날로 설정
        };

        // 백엔드 전송을 위해 Date 객체를 ISO 문자열로 변환
        const eventToSend = {
            ...newEvent,
            start: newEvent.start.toISOString(),
            end: newEvent.end.toISOString(),
        };

        setLoading(true);
        try {
            // ⭐️ 수정/생성에 따라 POST/PUT 분기
            const url = editId ? `/api/schedules/${editId}` : "/api/schedules";
            const method = editId ? api.put : api.post;

            const res = await method<{ success: boolean; data: ScheduleEvent[] }>(url, eventToSend);
            
            // 백엔드에서 받은 배열의 Date 문자열을 다시 Date 객체로 변환
            const updatedEvents = res.data.data.map(e => ({
                ...e,
                start: new Date(e.start),
                end: e.end ? new Date(e.end) : new Date(e.start)
            }));
            
            setEvents(updatedEvents);
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
            
            // 백엔드에서 받은 배열의 Date 문자열을 다시 Date 객체로 변환
            const updatedEvents = res.data.data.map(e => ({
                ...e,
                start: new Date(e.start),
                end: e.end ? new Date(e.end) : new Date(e.start)
            }));
            
            setEvents(updatedEvents);
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
                        // ⭐️ 사용자에게 보여지는 전체 유형을 사용 (하드코딩될 B, D 포함 가능성 고려)
                        title: `${ALL_EVENT_TYPES[e.type]}: ${e.title}`, 
                        start: e.start.toISOString().split('T')[0], // 날짜만 표시
                        end: e.end.toISOString().split('T')[0], // FullCalendar는 end-1일까지 표시
                        allDay: true, // 기간 이벤트로 표시
                        // ⭐️ 사용자 유형에 따른 색상 설정 (B, C, E)
                        color: e.type === "B" ? "#ff9800" : e.type === "C" ? "#2196f3" : "#4caf50", 
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
                            
                            {/* 3. 시작일자 (클릭한 날짜) */}
                            <TextField
                                label="시작일자"
                                type="date"
                                // Date 객체를 'YYYY-MM-DD' 문자열로 변환하여 입력 필드에 표시
                                value={startDate ? formatDateToInput(startDate) : ''}
                                // 시작일자는 날짜 클릭으로 고정되지만, 수정 모드에서 변경 가능하도록 유지
                                onChange={e => setStartDate(new Date(e.target.value))}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            
                            {/* 4. 종료일자 (추가된 입력 필드) */}
                            <TextField
                                label="종료일자"
                                type="date"
                                // Date 객체를 'YYYY-MM-DD' 문자열로 변환하여 입력 필드에 표시
                                value={endDate ? formatDateToInput(endDate) : ''}
                                onChange={e => setEndDate(new Date(e.target.value))}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            
                            {/* ⭐️ 시간 선택 필드 제거됨 */}
                            
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