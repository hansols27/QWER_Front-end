export type EventType = "B" | "C" | "E"; // Birthday, Concert, Event

export interface ScheduleEvent {
  start: Date;
  end: Date;
  type: EventType;
  title: string;
  allDay?: boolean;
}
