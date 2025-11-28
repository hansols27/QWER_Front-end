'use client'; // 클라이언트 컴포넌트로 유지

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    dateFnsLocalizer,
    ToolbarProps,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CSSProperties } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@front/ui/schedule.module.css';
import { ScheduleEvent, EventType } from '@shared/types/schedule'; 
import axios from 'axios';
import btn_prev from '@front/assets/icons/bg-btn-prev.png';
import btn_next from '@front/assets/icons/bg-btn-next.png';

// -----------------------------
// ⭐️ 고정 일정 데이터 및 헬퍼 함수
// -----------------------------

interface StaticScheduleEvent extends ScheduleEvent {
    isStatic: true;
}

const createYearlyEvent = (
    title: string, 
    type: EventType, 
    month: number, // 1부터 12
    day: number,
    isBirthday: boolean = false
): StaticScheduleEvent => {
    const currentYear = new Date().getFullYear();
    const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const eventType: EventType = isBirthday ? 'B' : type;

    return {
        id: `static-${eventType}-${month}-${day}`, 
        title,
        type: eventType,
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

const STATIC_EVENTS: ScheduleEvent[] = [
    getDebutEvents, 
    ...getBirthdayEvents
];

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
// 커스텀 툴바 (수정됨: Image -> img)
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
                {/* 💡 [수정] Next.js Image 대신 <img> 태그와 .src 사용 */}
                <img 
                    src={btn_prev.src} 
                    alt="이전" 
                    width={36} 
                    height={36} 
                />
            </button>
            <span className="rbc-toolbar-label text-lg font-semibold">
                {format(date, 'yyyy년 M월', { locale: ko })}
            </span>
            <button className="nav-btn" onClick={handleNext}>
                {/* 💡 [수정] Next.js Image 대신 <img> 태그와 .src 사용 */}
                <img 
                    src={btn_next.src} 
                    alt="다음" 
                    width={36} 
                    height={36} 
                />
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
    // Back-End에서 이벤트 불러오기
    // ===========================
    const fetchEvents = async () => {
        try {
            // 이 부분을 수정하지 않았으므로, 기존 로직을 유지
            const res = await axios.get<ScheduleEvent[]>('/api/schedule');
            const data: ScheduleEvent[] = res.data.map((e) => ({
                ...e,
                start: new Date(e.start),
                end: new Date(e.end),
            }));
            
            // ⭐️ API 이벤트와 하드코딩된 정적 이벤트를 결합
            const combinedEvents: ScheduleEvent[] = [...data, ...STATIC_EVENTS];
            
            setEvents(combinedEvents);

            // 오늘 날짜 기준 이벤트 선택 (결합된 이벤트를 사용)
            const todayEvents = combinedEvents.filter((e) =>
                isWithinInterval(new Date(), { start: e.start, end: e.end })
            );
            setSelectedEvents(todayEvents);
        } catch (err) {
            console.error('Failed to fetch events', err);
            // 💡 API 호출 오류 시 정적 일정만 보여줌
            setEvents(STATIC_EVENTS);
            const todayStaticEvents = STATIC_EVENTS.filter((e) =>
                isWithinInterval(new Date(), { start: e.start, end: e.end })
            );
            setSelectedEvents(todayStaticEvents); 
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // ===========================
    // 달력 범위 변경 시
    // ===========================
    const handleRangeChange = (range: any) => {
        // 이 로직은 주석 처리된 상태로 유지합니다.
    };

    // ===========================
    // 날짜 클릭 시 좌측 일정 갱신
    // ===========================
    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedDate(start);
        // API에서 불러온 전체 events (정적 일정 포함)에서 필터링
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
        // 선택된 이벤트를 기준으로 시작일/종료일 내에 있는 모든 이벤트를 필터링하여 목록에 표시
        const filtered = events.filter((e) =>
            isWithinInterval(event.start, { start: e.start, end: e.end })
        );
        setSelectedEvents(filtered);
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