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

const EVENT_TYPES: { [key in EventType]: string } = {
  B: "Birthday",
  C: "Concert",
  E: "Event",
};

const SchedulePage = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
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
      setLoading(true);
      try {
        const res = await axios.get<{ success: boolean; data: ScheduleEvent[] }>("/api/schedule");
        setEvents(res.data.data);
      } catch (err) {
        console.error(err);
        setAlert("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 날짜 클릭
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

  // 이벤트 클릭
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
    if (!selectedDate) return;
    setLoading(true);

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
      const res = await axios.post<{ success: boolean; data: ScheduleEvent[] }>("/api/schedule", newEvent);
      setEvents(res.data.data);
      setModalOpen(false);
      setAlert("Event saved successfully!");
    } catch (err) {
      console.error(err);
      setAlert("Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  // 이벤트 삭제
  const deleteEvent = async () => {
    if (!editId) return;
    setLoading(true);
    try {
      const res = await axios.delete<{ success: boolean; data: ScheduleEvent[] }>(`/api/schedule/${editId}`);
      setEvents(res.data.data);
      setModalOpen(false);
      setAlert("Event deleted successfully!");
    } catch (err) {
      console.error(err);
      setAlert("Failed to delete event");
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

        {alert && <Alert severity="success" sx={{ mb: 2 }}>{alert}</Alert>}
        {loading && <CircularProgress sx={{ mb: 2 }} />}

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
          <DialogTitle>{editId ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={type} onChange={e => setType(e.target.value as EventType)}>
                  {Object.entries(EVENT_TYPES).map(([key, val]) => (
                    <MenuItem key={key} value={key}>{val}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>All Day</InputLabel>
                <Select value={allDay ? "yes" : "no"} onChange={e => setAllDay(e.target.value === "yes")}>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              {!allDay && (
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="End Time"
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    fullWidth
                  />
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            {editId && <Button color="error" onClick={deleteEvent}>삭제</Button>}
            <Button onClick={() => setModalOpen(false)}>취소</Button>
            <Button variant="contained" onClick={saveEvent}>{editId ? "저장" : "저장"}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default SchedulePage;
