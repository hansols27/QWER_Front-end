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
import '@front/styles/schedule.module.css';
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
    <div className="rbc-toolbar-custom flex items-center justify-between">
      <button className="nav-btn" onClick={handlePrev}>
        <Image src={btn_prev} alt="이전" />
      </button>
      <span className="rbc-toolbar-label text-lg font-semibold">
        {format(date, 'yyyy년 M월', { locale: ko })}
      </span>
      <button className="nav-btn" onClick={handleNext}>
        <Image src={btn_next} alt="다음" />
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
// Helper: Date → YYYY-MM-DD
// ===========================
const formatDateToInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ===========================
// 고정 이벤트(STATIC_EVENTS)
// ===========================
interface StaticScheduleEvent extends ScheduleEvent {
  isStatic: true;
}

// 고정 이벤트 생성 함수
const createYearlyEvent = (
  title: string,
  type: 'B' | 'C' | 'E',
  month: number,
  day: number
): StaticScheduleEvent => {
  const currentYear = new Date().getFullYear();
  const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return {
    id: `static-${type}-${month}-${day}`,
    title,
    type,
    start: new Date(dateStr),
    end: new Date(dateStr),
    allDay: true,
    color: type === 'B' ? '#ff9800' : type === 'E' ? '#4caf50' : '#9e9e9e',
    isStatic: true,
  };
};

// 데뷔일
const getDebutEvent = createYearlyEvent('데뷔일 ♡', 'E', 10, 18);

// 멤버 생일
const MEMBERS = [
  { name: 'CHODAN', month: 11, day: 1 },
  { name: 'MAJENTA', month: 6, day: 2 },
  { name: 'HINA', month: 1, day: 30 },
  { name: 'SIYEON', month: 5, day: 16 },
];

const birthdayEvents: StaticScheduleEvent[] = MEMBERS.map(member =>
  createYearlyEvent(`${member.name} 생일`, 'B', member.month, member.day)
);

// 전체 고정 이벤트
const STATIC_EVENTS: StaticScheduleEvent[] = [getDebutEvent, ...birthdayEvents];

// ===========================
// Schedule View Page
// ===========================
export default function ScheduleView() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState<ScheduleEvent[]>([]);

  // ===========================
  // API 이벤트 + STATIC_EVENTS 합치기
  // ===========================
  const fetchEvents = async () => {
    try {
      const res = await api.get<{ success: boolean; data: ScheduleEvent[] }>('/api/schedules');
      const dbEvents = res.data.data.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: e.end ? new Date(e.end) : new Date(e.start),
      }));
      // DB 이벤트 + 고정 이벤트 합치기
      const allEvents = [...dbEvents, ...STATIC_EVENTS];
      setEvents(allEvents);

      // 오늘 기준 이벤트
      const todayEvents = allEvents.filter((e) =>
        isWithinInterval(new Date(), { start: e.start, end: e.end })
      );
      setSelectedEvents(todayEvents);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ===========================
  // 날짜 클릭 시 좌측 일정 업데이트
  // ===========================
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    const filtered = events.filter((e) =>
      isWithinInterval(start, { start: e.start, end: e.end })
    );
    setSelectedEvents(filtered);
  };

  // ===========================
  // 이벤트 클릭 시 좌측 일정 업데이트
  // ===========================
  const handleSelectEvent = (event: ScheduleEvent) => {
    setSelectedDate(event.start);
    setSelectedEvents([event]);
  };

  // ===========================
  // 이벤트 스타일
  // ===========================
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

  // ===========================
  // 렌더링
  // ===========================
  return (
    <div className="container">
      {/* 왼쪽 사이드 */}
      <div id="side">
        <div className="side2">
          05
          <span className="s_line"></span>
          SCHEDULE
        </div>
      </div>

      {/* 본문 */}
      <div className="cont schedule">
        {/* 좌측 일정 목록 */}
        <div className="n_left">
          <div className="title n_tt">SCHEDULE</div>
          <div className="sch_cont">
            <div className="dt_date">
              {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
            </div>
            <ul className="sch_detail">
              {selectedEvents.length > 0 ? (
                selectedEvents.map((ev, idx) => (
                  <li key={idx}>
                    <span
                      className={
                        ev.type === 'B'
                          ? 'sbt_birthday'
                          : ev.type === 'C'
                          ? 'sbt_concert'
                          : 'sbt_event'
                      }
                    >
                      {ev.type}
                    </span>
                    {ev.title}{' '}
                    {ev.allDay
                      ? '(종일)'
                      : `(${format(ev.start, 'HH:mm')} - ${format(ev.end, 'HH:mm')})`}
                  </li>
                ))
              ) : (
                <li>등록된 일정이 없습니다.</li>
              )}
            </ul>
          </div>
        </div>

        {/* 우측 달력 */}
        <div className="n_right">
          <div className="cd_calendar">
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
                  <span
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
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
