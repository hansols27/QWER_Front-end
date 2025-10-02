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

// ⭐️ 환경 변수를 사용하여 API 기본 URL 설정
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!NEXT_PUBLIC_API_URL) {
  console.error("API_BASE_URL 환경 변수가 설정되지 않았습니다. API 호출이 실패할 수 있습니다.");
}

const EVENT_TYPES: { [key in EventType]: string } = {
  B: "Birthday",
  C: "Concert",
  E: "Event",
};

const SchedulePage = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  // ⭐️ 알림 메시지를 객체 형태로 관리하여 severity도 표시
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("B");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!NEXT_PUBLIC_API_URL) {
        setAlertMessage({ message: "API 주소가 설정되지 않아 일정을 불러올 수 없습니다.", severity: "error" });
        return;
      }
      setLoading(true);
      setAlertMessage(null);
      try {
        // ⭐️ 절대 경로 사용
        const res = await axios.get<{ success: boolean; data: ScheduleEvent[] }>(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`);
        setEvents(res.data.data);
      } catch (err) {
        console.error(err);
        setAlertMessage({ message: "일정 로드에 실패했습니다.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 날짜 클릭 및 이벤트 클릭 핸들러는 API 호출과 관련 없으므로 생략 (기존 로직 유지)

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

  const handleEventClick = (arg: any) => {
    const evt = events.find(e => e.id === arg.event.id);
    if (!evt) return;

    const start = evt.start ? new Date(evt.start) : new Date();
    const end = evt.end ? new Date(evt.end) : start;

    setSelectedDate(start);
    setTitle(evt.title);
    setType(evt.type);
    setAllDay(evt.allDay || false);
    setStartTime(start.toISOString().slice(11, 16));
    setEndTime(end.toISOString().slice(11, 16));
    setEditId(evt.id);
    setModalOpen(true);
  };


  // 이벤트 저장
  const saveEvent = async () => {
    if (!selectedDate || !NEXT_PUBLIC_API_URL) return; // API_BASE_URL 없으면 저장 막기
    setLoading(true);
    setAlertMessage(null);

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
    }

    try {
      // ⭐️ 절대 경로 사용
      const res = await axios.post<{ success: boolean; data: ScheduleEvent[] }>(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, newEvent);
      setEvents(res.data.data);
      setModalOpen(false);
      setAlertMessage({ message: "일정이 성공적으로 저장되었습니다!", severity: "success" });
    } catch (err) {
      console.error(err);
      setAlertMessage({ message: "일정 저장에 실패했습니다. 백엔드 로그를 확인하세요.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 이벤트 삭제
  const deleteEvent = async () => {
    if (!editId || !NEXT_PUBLIC_API_URL) return; // API_BASE_URL 없으면 삭제 막기
    setLoading(true);
    setAlertMessage(null);
    try {
      // ⭐️ 절대 경로 사용
      const res = await axios.delete<{ success: boolean; data: ScheduleEvent[] }>(`${NEXT_PUBLIC_API_URL}/api/schedule/${editId}`);
      setEvents(res.data.data);
      setModalOpen(false);
      setAlertMessage({ message: "일정이 성공적으로 삭제되었습니다!", severity: "success" });
    } catch (err) {
      console.error(err);
      setAlertMessage({ message: "일정 삭제에 실패했습니다.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 캘린더 이벤트 매핑 로직은 그대로 유지

  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2}>
          일정관리
        </Typography>

        {/* ⭐️ 알림 메시지 상태 사용 */}
        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}
        
        {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events.map(e => ({
            id: e.id,
            title: EVENT_TYPES[e.type],
            start: e.start,
            end: e.end,
            allDay: e.allDay,
          }))}
          dateClick={(arg: any) => handleDateClick(arg)}
          eventClick={(arg: any) => handleEventClick(arg)}
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
                <InputLabel>하루 종일</InputLabel>
                <Select value={allDay ? "yes" : "no"} label="하루 종일" onChange={e => setAllDay(e.target.value === "yes")}>
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
            {/* ⭐️ 로딩 중일 때 버튼 비활성화 */}
            <Button 
              variant="contained" 
              onClick={saveEvent} 
              disabled={loading || !NEXT_PUBLIC_API_URL || !title} // API_BASE_URL 없거나 로딩 중이거나 제목 없으면 비활성화
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default SchedulePage;