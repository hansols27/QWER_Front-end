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
import '@/ui/schedule.css';
import { ScheduleEvent } from '../../../shared/types/schedule';
import { getEventsInRange } from '@/data/schedule';
import btn_prev from '@/assets/icons/bg-btn-prev.png';
import btn_next from '@/assets/icons/bg-btn-next.png';

// date-fns localizer
const locales = { ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// 커스텀 툴바
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

// 타입별 이모지 매핑
const typeEmojiMap: Record<string, string> = {
  B: '🎂',
  C: '🎵',
  E: '⭐',
};

export default function Schedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState<ScheduleEvent[]>([]);

  // 범위 변경 시 이벤트 가져오기
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
    setEvents(getEventsInRange(start, end));
  };

  // 날짜 클릭
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    const filtered = events.filter((e) =>
      isWithinInterval(start, { start: e.start, end: e.end })
    );
    setSelectedEvents(filtered);
  };

  // 이벤트 클릭
  const handleSelectEvent = (event: ScheduleEvent) => {
    setSelectedDate(event.start);
    setSelectedEvents([event]);
  };

  useEffect(() => {
    const todayEvents = events.filter((e) =>
      isWithinInterval(new Date(), { start: e.start, end: e.end })
    );
    setSelectedEvents(todayEvents);
  }, [events]);

  // 이벤트 스타일
  const eventStyleGetter = (event: ScheduleEvent) => {
    let backgroundColor = '';
    if (event.type === 'B') backgroundColor = '#e79c89';
    if (event.type === 'C') backgroundColor = '#72d2c0';
    if (event.type === 'E') backgroundColor = '#f1bd4c';

    const style: CSSProperties = {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'inherit',
      fontSize: '1rem',
      textAlign: 'left', // ← 왼쪽 정렬
      padding: '0 10px',  // 좌우 여백 약간
    };

    return { style };
  };

  return (
    <div className="container">
      <div id="side">
        <div className="side2">
          05
          <span className="s_line"></span>
          SCHEDULE
        </div>
      </div>

      <div className="cont schedule">
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
        textAlign: 'left', // 반드시 여기에도 적용
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
