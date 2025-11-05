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

const EVENT_TYPES: { [key in EventType]: string } = {
    B: "Birthday",
    C: "Concert",
    E: "Event",
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
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<EventType>("B");
    const [allDay, setAllDay] = useState(false);
    const [startTime, setStartTime] = useState("12:00");
    const [endTime, setEndTime] = useState("13:00");
    const [editId, setEditId] = useState<string | null>(null);

    // ===========================
    // 일정 목록 불러오기
    // ===========================
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setAlertMessage(null);
            try {
                const res = await api.get<{ success: boolean; data: ScheduleEvent[] }>("/schedule");
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

    // 날짜 클릭 시 모달 열기 (새 일정 추가)
    const handleDateClick = (arg: DateClickArg) => {
        setSelectedDate(arg.date);
        setTitle("");
        setType("B");
        setAllDay(arg.allDay);
        setStartTime("12:00");
        setEndTime("13:00");
        setEditId(null);
        setAlertMessage(null); // 🚨 개선: 경고 메시지 초기화
        setModalOpen(true);
    };

    // 이벤트 클릭 시 수정 모달 열기
    const handleEventClick = (arg: EventClickArg) => {
        // FullCalendar의 events prop에 들어간 이벤트 객체를 사용
        const evt = events.find(e => e.id === arg.event.id);
        if (!evt) return;

        const start = evt.start;
        const end = evt.end;

        setSelectedDate(start);
        setTitle(evt.title);
        setType(evt.type);
        setAllDay(evt.allDay || false);
        setEditId(evt.id);
        setAlertMessage(null); // 경고 메시지 초기화

        // 종일 이벤트는 시간 필드 초기화
        if (evt.allDay) {
            setStartTime("09:00"); // 기본값 설정
            setEndTime("10:00");
        } else {
            const formatTime = (date: Date) => date.toTimeString().slice(0, 5);
            setStartTime(formatTime(start));
            setEndTime(formatTime(end));
        }
        
        setModalOpen(true);
    };

    // ===========================
    // 일정 저장
    // ===========================
    const saveEvent = async () => {
        if (!selectedDate) return;

        setAlertMessage(null);

        // 제목 필수 입력 검사
        if (!title.trim()) {
            setAlertMessage({ 
                message: "일정 제목은 필수 입력 사항입니다.", 
                severity: "error" 
            });
            return; 
        }

        const newEvent: ScheduleEvent = {
            id: editId || uuidv4(),
            title: title.trim(), // 공백 제거
            type,
            allDay,
            start: new Date(selectedDate),
            end: new Date(selectedDate),
        };

        if (!allDay) {
            const [sh, sm] = startTime.split(":").map(Number);
            const [eh, em] = endTime.split(":").map(Number);
            
            newEvent.start.setHours(sh, sm);
            newEvent.end.setHours(eh, em);
            
            // 종료 시간이 시작 시간보다 빠른지 검증
            if (newEvent.end.getTime() <= newEvent.start.getTime()) {
                setAlertMessage({ 
                    message: "종료 시간은 시작 시간보다 늦어야 합니다.", 
                    severity: "error" 
                });
                return; // 저장 중단
            }
        } else {
            // 종일 이벤트: 시작/종료 모두 해당 날짜의 자정으로 설정
            newEvent.start.setHours(0, 0, 0, 0);
            newEvent.end.setHours(0, 0, 0, 0); 
        }

        // 백엔드 전송을 위해 Date 객체를 ISO 문자열로 변환
        const eventToSend = {
            ...newEvent,
            start: newEvent.start.toISOString(),
            end: newEvent.end.toISOString(),
        };

        setLoading(true);
        try {
            const res = await api.post<{ success: boolean; data: ScheduleEvent[] }>("/schedule", eventToSend);
            
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
    // 일정 삭제
    // ===========================
    const deleteEvent = async () => {
        if (!editId) return;
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.delete<{ success: boolean; data: ScheduleEvent[] }>(`/schedule/${editId}`);
            
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
                        // title에 유형 추가
                        title: `${EVENT_TYPES[e.type]}: ${e.title}`, 
                        start: e.start.toISOString(), // FullCalendar는 ISO 문자열을 선호
                        end: e.end.toISOString(),
                        allDay: e.allDay,
                        // 유형별 색상 설정
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
                <Dialog open={modalOpen} onClose={() => { setModalOpen(false); setAlertMessage(null); }}>
                    <DialogTitle>{editId ? "일정 수정" : "일정 추가"}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField
                                label="제목"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                fullWidth
                                error={!title && !loading && modalOpen} // 제목이 비어있을 때 시각적 오류 표시
                                helperText={!title && !loading && modalOpen ? "제목은 필수입니다." : ""}
                            />
                            <FormControl fullWidth>
                                <InputLabel>유형</InputLabel>
                                <Select value={type} label="유형" onChange={e => setType(e.target.value as EventType)}>
                                    {Object.entries(EVENT_TYPES).map(([key, val]) => (
                                        <MenuItem key={key} value={key}>{val}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>종일</InputLabel>
                                <Select
                                    value={allDay ? "yes" : "no"}
                                    label="종일"
                                    onChange={e => setAllDay(e.target.value === "yes")}
                                >
                                    <MenuItem value="yes">예</MenuItem>
                                    <MenuItem value="no">아니오</MenuItem>
                                </Select>
                            </FormControl>
                            {!allDay && (
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="시작 시간"
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="종료 시간"
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Stack>
                            )}
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
                            disabled={loading || !title.trim()} // 저장 버튼 활성화 조건 강화
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