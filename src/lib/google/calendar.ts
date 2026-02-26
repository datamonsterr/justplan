/**
 * Google Calendar API Client
 * Operations for Google Calendar sync
 */

import { google, calendar_v3 } from "googleapis";
import { getAuthenticatedClient } from "./auth";

export interface CalendarEvent {
  id: string;
  googleEventId: string;
  calendarId: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
}

export interface CreateEventInput {
  calendarId?: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  isAllDay?: boolean;
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  backgroundColor?: string;
}

/**
 * Get Google Calendar API client for a user
 */
async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
  const auth = await getAuthenticatedClient(userId);
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
}

/**
 * List user's calendars
 */
export async function listCalendars(userId: string): Promise<Calendar[]> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) {
    throw new Error("Google Calendar not connected");
  }

  const response = await calendar.calendarList.list({
    minAccessRole: "reader",
  });

  return (response.data.items || []).map((cal) => ({
    id: cal.id || "",
    summary: cal.summary || "",
    description: cal.description || undefined,
    primary: cal.primary || false,
    backgroundColor: cal.backgroundColor || undefined,
  }));
}

/**
 * Fetch events from a calendar within a date range
 */
export async function fetchEvents(
  userId: string,
  options: {
    calendarId?: string;
    timeMin: Date;
    timeMax: Date;
    maxResults?: number;
    pageToken?: string;
  }
): Promise<{
  events: CalendarEvent[];
  nextPageToken?: string;
}> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) {
    throw new Error("Google Calendar not connected");
  }

  const {
    calendarId = "primary",
    timeMin,
    timeMax,
    maxResults = 250,
    pageToken,
  } = options;

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults,
    pageToken,
    singleEvents: true, // Expand recurring events
    orderBy: "startTime",
  });

  const events: CalendarEvent[] = (response.data.items || [])
    .filter((event) => event.status !== "cancelled")
    .map((event) => parseGoogleEvent(event, calendarId));

  return {
    events,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

/**
 * Fetch all events within a date range (handles pagination)
 */
export async function fetchAllEvents(
  userId: string,
  options: {
    calendarId?: string;
    timeMin: Date;
    timeMax: Date;
  }
): Promise<CalendarEvent[]> {
  const allEvents: CalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const result = await fetchEvents(userId, {
      ...options,
      pageToken,
    });
    allEvents.push(...result.events);
    pageToken = result.nextPageToken;
  } while (pageToken);

  return allEvents;
}

/**
 * Create a new calendar event
 */
export async function createEvent(
  userId: string,
  input: CreateEventInput
): Promise<CalendarEvent> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) {
    throw new Error("Google Calendar not connected");
  }

  const { calendarId = "primary", summary, description, start, end, isAllDay } = input;

  const eventBody: calendar_v3.Schema$Event = {
    summary,
    description,
  };

  if (isAllDay) {
    // All-day events use date instead of dateTime
    eventBody.start = { date: formatDate(start) };
    eventBody.end = { date: formatDate(end) };
  } else {
    eventBody.start = { dateTime: start.toISOString() };
    eventBody.end = { dateTime: end.toISOString() };
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventBody,
  });

  if (!response.data.id) {
    throw new Error("Failed to create event");
  }

  return parseGoogleEvent(response.data, calendarId);
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  input: Partial<CreateEventInput> & { calendarId?: string }
): Promise<CalendarEvent> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) {
    throw new Error("Google Calendar not connected");
  }

  const { calendarId = "primary", summary, description, start, end, isAllDay } = input;

  const eventBody: calendar_v3.Schema$Event = {};

  if (summary !== undefined) eventBody.summary = summary;
  if (description !== undefined) eventBody.description = description;

  if (start && end) {
    if (isAllDay) {
      eventBody.start = { date: formatDate(start) };
      eventBody.end = { date: formatDate(end) };
    } else {
      eventBody.start = { dateTime: start.toISOString() };
      eventBody.end = { dateTime: end.toISOString() };
    }
  }

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: eventBody,
  });

  return parseGoogleEvent(response.data, calendarId);
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  userId: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<void> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) {
    throw new Error("Google Calendar not connected");
  }

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

/**
 * Parse Google Calendar event to our format
 */
function parseGoogleEvent(
  event: calendar_v3.Schema$Event,
  calendarId: string
): CalendarEvent {
  const isAllDay = !!event.start?.date;
  const start = isAllDay
    ? new Date(event.start?.date || "")
    : new Date(event.start?.dateTime || "");
  const end = isAllDay
    ? new Date(event.end?.date || "")
    : new Date(event.end?.dateTime || "");

  return {
    id: `${calendarId}:${event.id}`,
    googleEventId: event.id || "",
    calendarId,
    summary: event.summary || "Untitled",
    description: event.description || undefined,
    start,
    end,
    isAllDay,
    isRecurring: !!event.recurringEventId,
    recurrenceRule: event.recurrence?.[0],
  };
}

/**
 * Format date for all-day events (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
