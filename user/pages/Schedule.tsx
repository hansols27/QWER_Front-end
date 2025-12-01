'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  ToolbarProps,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CSSProperties } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from '@front/styles/schedule.module.css';
import Image from 'next/image';
import btn_prev from "@front/assets/icons/bg-btn-prev.png";
import btn_next from "@front/assets/icons/bg-btn-next.png";
import { ScheduleEvent } from '@shared/types/schedule';
import { api } from '@shared/services/axios';

// ===========================
// date-fns localizer
// ===========================
const locales = { ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// ===========================
// Custom Toolbar
// ===========================
const CustomToolbar = ({ date, onNavigate }: ToolbarProps<ScheduleEvent, object>) => {
  const handlePrev = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() - 1);
    onNavigate('DATE', newDate);
  };
  const handleNext = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    onNavigate('DATE', newDate);
  };

  return (
    <div className={`${styles['rbc-toolbar-custom']} flex items-center justify-between`}>
      <button className={styles['nav-btn']} onClick={handlePrev}>
        <Image src={btn_prev} alt="이전" width={24} height={24} />
      </button>
      <span className={`${styles['rbc-toolbar-label']} text-lg font-semibold`}>
        {format(date, 'yyyy년 M월', { locale: ko })}
      </span>
      <button className={styles['nav-btn']} onClick={handleNext}>
        <Image src={btn_next} alt="다음" width={24} height={24} />
      </button>
    </div>
  );
};

// ===========================
// 타입별 이모지
// ===========================
const typeEmojiMap: Record<string, string> = {
  B: '🎂',
  C: '🎵',
  E: '⭐',
};

// ===========================
// ScheduleView
// ===========================
export default function ScheduleView() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState<ScheduleEvent[]>([]);

  // ===========================
  // STATIC EVENTS
  // ===========================
  const createYearlyEvent = (title: string, type: 'B'|'C'|'E', month: number, day: number): ScheduleEvent => {
    const currentYear = new Date().getFullYear();
    const dateStr = `${currentYear}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return {
      id: `static-${type}-${month}-${day}`,
      title,
      type,
      start: new Date(dateStr),
      end: new Date(dateStr),
      allDay: true,
      color: type==='B'?'#ff9800':type==='E'?'#4caf50':'#9e9e9e',
      isStatic: true,
    } as ScheduleEvent;
  };

  const getDebutEvent = createYearlyEvent('데뷔일 ♡', 'E', 10, 18);
  const MEMBERS = [
    { name: 'CHODAN', month: 11, day: 1 },
    { name: 'MAJENTA', month: 6, day: 2 },
    { name: 'HINA', month: 1, day: 30 },
    { name: 'SIYEON', month: 5, day: 16 },
  ];
  const birthdayEvents = MEMBERS.map(m => createYearlyEvent(`${m.name} 생일`, 'B', m.month, m.day));
  const STATIC_EVENTS = [getDebutEvent, ...birthdayEvents];

  // ===========================
  // fetchEvents
  // ===========================
  const fetchEvents = async () => {
    try {
      const res = await api.get<{ success: boolean; data: ScheduleEvent[] }>('/api/schedules');
      const dbEvents = res.data.data.map(e => ({
        ...e,
        start: new Date(e.start),
        end: e.end ? new Date(e.end) : new Date(e.start),
      }));
      const allEvents = [...dbEvents, ...STATIC_EVENTS];
      setEvents(allEvents);

      // 오늘 기준 이벤트
      const todayEvents = allEvents.filter(e =>
        isWithinInterval(new Date(), { start: e.start, end: e.end })
      );
      setSelectedEvents(todayEvents);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    const filtered = events.filter(e => isWithinInterval(start, { start: e.start, end: e.end }));
    setSelectedEvents(filtered);
  };

  const handleSelectEvent = (event: ScheduleEvent) => {
    setSelectedDate(event.start);
    setSelectedEvents([event]);
  };

  const eventStyleGetter = (): { style: CSSProperties } => ({
    style: {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'inherit',
      fontSize: '1rem',
      textAlign: 'left',
      padding: '0 10px',
    },
  });

  return (
    <div className={styles.container}>
      {/* 왼쪽 사이드 */}
      <div id="side" className={styles.side}>
        <div className={styles.side2}>
          05
          <span className={styles.s_line}></span>
          SCHEDULE
        </div>
      </div>

      {/* 본문 */}
      <div className={`${styles.cont} ${styles.schedule}`}>
        <div className={styles.n_left}>
          <div className={`${styles.title} ${styles.n_tt}`}>SCHEDULE</div>
          <div className={styles.sch_cont}>
            <div className={styles.dt_date}>
              {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
            </div>
            <ul className={styles.sch_detail}>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((ev, idx) => (
                  <li key={idx}>
                    <span
                      className={
                        ev.type === 'B'
                          ? styles.sbt_birthday
                          : ev.type === 'C'
                          ? styles.sbt_concert
                          : styles.sbt_event
                      }
                    >
                      {ev.type}
                    </span>
                    {ev.title}{' '}
                    {ev.allDay
                      ? '(종일)'
                      : `(${format(ev.start,'HH:mm')} - ${format(ev.end,'HH:mm')})`}
                  </li>
                ))
              ) : (
                <li>등록된 일정이 없습니다.</li>
              )}
            </ul>
          </div>
        </div>

        <div className={styles.n_right}>
          <div className={styles.cd_calendar}>
            <Calendar<ScheduleEvent>
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              style={{ height: 500 }}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
                event: ({ event }) => (
                  <span style={{ display: 'block', width: '100%', textAlign: 'left' }}>
                    {typeEmojiMap[event.type] || ''}
                  </span>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
