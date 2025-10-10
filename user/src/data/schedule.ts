// data/schedule.ts
import { RRule } from 'rrule';
import { ScheduleEvent } from '@shared/types/schedule';

// 📌 헬퍼: 1~12월 입력 → JS Date 월(0~11)로 변환
const makeDate = (year: number, month: number, day: number, hour = 0, min = 0) =>
  new Date(year, month - 1, day, hour, min);

// 단일 이벤트
export const FIXED_EVENTS: ScheduleEvent[] = [
  {
    start: makeDate(2025, 8, 16, 19, 40), 
    end: makeDate(2025, 8, 16, 20, 30),
    type: 'C',
    title: 'Concert',
    allDay: false,
  },
];

// 반복 이벤트 생성 유틸
const createYearlyEvent = (
  title: string,
  type: 'B' | 'E',
  month: number,
  day: number
) => {
  const rule = new RRule({
    freq: RRule.YEARLY,
    bymonth: month,       // 1~12 그대로
    bymonthday: day,
    dtstart: makeDate(2023, month -1, day), // 월 인덱스 맞춤
  });

  return (rangeStart: Date, rangeEnd: Date): ScheduleEvent[] =>
    rule.between(rangeStart, rangeEnd).map((date) => ({
      start: date,
      end: date, // 하루만 표시
      title,
      type,
      allDay: true,
    }));
};

// 데뷔일
const getDebutEvents = createYearlyEvent('Debut ♡', 'E', 10, 18);

// 멤버 생일
const MEMBERS = [
  { name: 'CHODAN', month: 11, day: 1 },
  { name: 'MAJENTA', month: 6, day: 2 },
  { name: 'HINA', month: 1, day: 30 },
  { name: 'SIYEON', month: 5, day: 16 },
];

const getBirthdayEvents = MEMBERS.map((m) =>
  createYearlyEvent(`${m.name} Birthday 🎂`, 'B', m.month, m.day)
);

// 범위 내 이벤트 가져오기
export const getEventsInRange = (start: Date, end: Date): ScheduleEvent[] => {
  const debutEvents = getDebutEvents(start, end);
  const birthdayEvents = getBirthdayEvents.flatMap((fn) => fn(start, end));
  return [...FIXED_EVENTS, ...debutEvents, ...birthdayEvents];
};
