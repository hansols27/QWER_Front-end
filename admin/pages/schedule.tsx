import { useState, useEffect } from "react";
import Layout from "../components/common/layout";
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
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// 환경 변수에서 API 기본 URL을 가져와 상수로 저장합니다.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const EVENT_TYPES: { [key in EventType]: string } = {
  B: "Birthday",
  C: "Concert",
  E: "Event",
};

const getErrorMessage = (error: any, defaultMessage: string = "요청 처리 중 오류가 발생했습니다."): string => {
    // 1. Axios Error 객체에서 상세 메시지 추출 시도
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    // 2. 일반적인 Error 객체의 메시지 반환
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    // 3. 기본 메시지 반환
    return defaultMessage;
};


const SchedulePage = () => {
  // ⭐️ API URL이 설정되지 않았다면 에러 메시지 출력 후 조기 종료
  if (!API_BASE_URL) {
    return (
      <Layout>
        <Box p={4}><Alert severity="error">
          <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않아 일정을 관리할 수 없습니다.
        </Alert></Box>
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

  // Fetch events (읽기 기능)
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setAlertMessage(null);
      try {
        // API_BASE_URL 상수를 사용하여 호출합니다.
        const res = await axios.get<{ success: boolean; data: ScheduleEvent[] }>(`${API_BASE_URL}/api/schedule`);
        setEvents(res.data.data);
      } catch (err) {
        console.error("Failed to load schedule:", err);
        // ⭐️ 안전한 오류 처리 로직 적용
        const errorMsg = getErrorMessage(err, "일정 로드에 실패했습니다. 백엔드 서버 상태를 확인하세요.");
        setAlertMessage({ message: errorMsg, severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 날짜 클릭 핸들러 (API 호출과 관련 없음)
  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date || new Date());
    setTitle("");
    setType("B");
    setAllDay(false);
    setStartTime("12:00");
    setEndTime("13:00");
    setEditId(null);
    setModalOpen(true);
  };

  // 이벤트 클릭 핸들러 (API 호출과 관련 없음)
  const handleEventClick = (arg: any) => {
    const evt = events.find(e => e.id === arg.event.id);
    if (!evt) return;

    // 날짜/시간 파싱 로직은 그대로 유지
    const start = evt.start ? new Date(evt.start) : new Date();
    const end = evt.end ? new Date(evt.end) : start;

    setSelectedDate(start);
    setTitle(evt.title);
    setType(evt.type);
    setAllDay(evt.allDay || false);
    
    // 시간 형식 (hh:mm)으로 변환
    const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

    setStartTime(formatTime(start));
    setEndTime(formatTime(end));
    setEditId(evt.id);
    setModalOpen(true);
  };


  // 이벤트 저장 (생성/수정 기능)
  const saveEvent = async () => {
    if (!selectedDate) return; 
    
    setLoading(true);
    setAlertMessage(null);

    // 날짜/시간 결합 로직은 그대로 유지
    const newEvent: ScheduleEvent = {
      id: editId || uuidv4(),
      title,
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
    } else {
        // All Day인 경우 시간 정보를 제거하고 UTC 자정으로 설정
        newEvent.start.setHours(0, 0, 0, 0);
        newEvent.end.setHours(0, 0, 0, 0);
    }
    
    // ISO 문자열로 변환하여 백엔드 전송
    const eventToSend = {
        ...newEvent,
        start: newEvent.start.toISOString(),
        end: newEvent.end.toISOString(),
    };

    try {
      // API_BASE_URL 상수를 사용하여 POST/PUT (백엔드에서 Upsert 처리 가정)
      const res = await axios.post<{ success: boolean; data: ScheduleEvent[] }>(`${API_BASE_URL}/api/schedule`, eventToSend);
      setEvents(res.data.data);
      setModalOpen(false);
      setAlertMessage({ message: "일정이 성공적으로 저장되었습니다!", severity: "success" });
    } catch (err) {
      console.error("Failed to save schedule:", err);
      // ⭐️ 안전한 오류 처리 로직 적용
      const errorMsg = getErrorMessage(err, "일정 저장에 실패했습니다. 백엔드 로그를 확인하세요.");
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 이벤트 삭제 (삭제 기능)
  const deleteEvent = async () => {
    if (!editId) return;
    
    setLoading(true);
    setAlertMessage(null);
    try {
      // API_BASE_URL 상수를 사용하여 DELETE 호출
      const res = await axios.delete<{ success: boolean; data: ScheduleEvent[] }>(`${API_BASE_URL}/api/schedule/${editId}`);
      setEvents(res.data.data);
      setModalOpen(false);
      setAlertMessage({ message: "일정이 성공적으로 삭제되었습니다!", severity: "success" });
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      // ⭐️ 안전한 오류 처리 로직 적용
      const errorMsg = getErrorMessage(err, "일정 삭제에 실패했습니다.");
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2}>
          일정관리
        </Typography>

        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}
        
        {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          // FullCalendar 이벤트 데이터 매핑 (날짜 객체를 string으로 변환하는 처리가 필요할 수 있음)
          events={events.map(e => ({
            id: e.id,
            title: `${EVENT_TYPES[e.type]}: ${e.title}`, // 제목을 유형과 함께 표시
            start: e.start,
            end: e.end,
            allDay: e.allDay,
            color: e.type === 'B' ? '#ff9800' : e.type === 'C' ? '#2196f3' : '#4caf50', // 색상 지정 예시
          }))}
          dateClick={(arg: any) => handleDateClick(arg)}
          eventClick={(arg: any) => handleEventClick(arg)}
          headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,dayGridDay'
          }}
          locale="ko" // 한글 로케일 추가
          height="auto"
        />

        {/* Modal */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
          <DialogTitle>{editId ? "일정 수정" : "일정 추가"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="제목"
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
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
                <Select value={allDay ? "yes" : "no"} label="종일" onChange={e => setAllDay(e.target.value === "yes")}>
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
            <Button onClick={() => setModalOpen(false)} disabled={loading}>
              취소
            </Button>
            <Button 
              variant="contained" 
              onClick={saveEvent} 
              disabled={loading || !title} 
              startIcon={loading && <CircularProgress size={20} />}
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