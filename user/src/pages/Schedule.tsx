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
import '@front/ui/schedule.css';
import { ScheduleEvent } from '@shared/types/schedule';
import axios from 'axios';
import btn_prev from '@front/assets/icons/bg-btn-prev.png';
import btn_next from '@front/assets/icons/bg-btn-next.png';

// ===========================
// date-fns localizer 설정
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
// 커스텀 툴바
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
        <img src={btn_prev} alt="이전" />
      </button>
      <span className="rbc-toolbar-label text-lg font-semibold">
        {format(date, 'yyyy년 M월', { locale: ko })}
      </span>
      <button className="nav-btn" onClick={handleNext}>
        <img src={btn_next} alt="다음" />
      </button>
    </div>
  );
};

// ===========================
// 타입별 이모지 매핑
// ===========================
const typeEmojiMap: Record<string, string> = {
  B: '🎂', // Birthday
  C: '🎵', // Concert
  E: '⭐', // Event
};

// ===========================
// Schedule 페이지 컴포넌트
// ===========================
export default function Schedule() {
  // 상태 관리
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState<ScheduleEvent[]>([]);

  // ===========================
  // Firebase/Back-End에서 이벤트 불러오기
  // ===========================
  const fetchEvents = async () => {
    try {
      const res = await axios.get<ScheduleEvent[]>('/api/schedule');
      const data = res.data.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      setEvents(data);

      // 오늘 날짜 기준 이벤트 선택
      const todayEvents = data.filter((e) =>
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
  // 달력 범위 변경 시
  // ===========================
  const handleRangeChange = (range: any) => {
    let start: Date;
    let end: Date;
    if (Array.isArray(range)) {
      start = range[0];
      end = range[range.length - 1];
    } else {
      start = range.start;
      end = range.end;
    }

    // 범위 안 이벤트 필터링
    const filtered = events.filter((e) =>
      isWithinInterval(e.start, { start, end })
    );
    setEvents(filtered);
  };

  // ===========================
  // 날짜 클릭 시 좌측 일정 갱신
  // ===========================
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    const filtered = events.filter((e) =>
      isWithinInterval(start, { start: e.start, end: e.end })
    );
    setSelectedEvents(filtered);
  };

  // ===========================
  // 이벤트 클릭 시 좌측 일정 갱신
  // ===========================
  const handleSelectEvent = (event: ScheduleEvent) => {
    setSelectedDate(event.start);
    setSelectedEvents([event]);
  };

  // ===========================
  // 이벤트 스타일 설정
  // ===========================
  const eventStyleGetter = (event: ScheduleEvent) => {
    const style: CSSProperties = {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'inherit',
      fontSize: '1rem',
      textAlign: 'left',
      padding: '0 10px',
    };
    return { style };
  };

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
        {/* 좌측: 일정 목록 */}
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
                <li>이 날은 일정이 없습니다.</li>
              )}
            </ul>
          </div>
        </div>

        {/* 우측: 달력 */}
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
              onRangeChange={handleRangeChange}
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
