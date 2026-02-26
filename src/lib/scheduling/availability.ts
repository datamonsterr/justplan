/**
 * Availability Calculator
 * Finds free time slots for scheduling tasks
 */

import {
  TimeSlot,
  CalendarEvent,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "./types";

/**
 * Calculate available time slots within a date range
 * Takes into account:
 * - Working hours preferences
 * - Working days
 * - Existing calendar events
 * - Already scheduled tasks
 */
export function calculateAvailability(
  startDate: Date,
  endDate: Date,
  existingEvents: CalendarEvent[],
  preferences: UserPreferences = DEFAULT_PREFERENCES
): TimeSlot[] {
  const availableSlots: TimeSlot[] = [];
  const currentDate = new Date(startDate);

  // Iterate through each day
  while (currentDate < endDate) {
    const dayOfWeek = currentDate.getDay();

    // Skip non-working days
    if (!preferences.workingDays.includes(dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Get working hours for this day
    const daySlots = getWorkingHoursForDay(currentDate, preferences);

    // Subtract existing events from working hours
    for (const daySlot of daySlots) {
      const freeSlots = subtractEventsFromSlot(daySlot, existingEvents);
      availableSlots.push(...freeSlots);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableSlots;
}

/**
 * Get working hours time slot for a specific day
 */
export function getWorkingHoursForDay(
  date: Date,
  preferences: UserPreferences
): TimeSlot[] {
  const [startHour, startMin] = preferences.workingHoursStart.split(":").map(Number);
  const [endHour, endMin] = preferences.workingHoursEnd.split(":").map(Number);

  const start = new Date(date);
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMin, 0, 0);

  // Handle overnight working hours (e.g., 22:00 - 06:00)
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return [{ start, end }];
}

/**
 * Subtract calendar events from a time slot
 * Returns remaining free time slots
 */
export function subtractEventsFromSlot(
  slot: TimeSlot,
  events: CalendarEvent[]
): TimeSlot[] {
  // Filter events that overlap with this slot
  const overlappingEvents = events
    .filter((event) => {
      // All-day events block the entire day
      if (event.isAllDay) {
        const eventDate = new Date(event.start);
        const slotDate = new Date(slot.start);
        return (
          eventDate.getFullYear() === slotDate.getFullYear() &&
          eventDate.getMonth() === slotDate.getMonth() &&
          eventDate.getDate() === slotDate.getDate()
        );
      }

      // Check for overlap
      return event.start < slot.end && event.end > slot.start;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // If all-day event, slot is completely blocked
  if (overlappingEvents.some((e) => e.isAllDay)) {
    return [];
  }

  // No overlapping events, return original slot
  if (overlappingEvents.length === 0) {
    return [slot];
  }

  // Calculate free slots between events
  const freeSlots: TimeSlot[] = [];
  let currentStart = new Date(slot.start);

  for (const event of overlappingEvents) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Free slot before this event
    if (currentStart < eventStart) {
      freeSlots.push({
        start: new Date(currentStart),
        end: new Date(Math.min(eventStart.getTime(), slot.end.getTime())),
      });
    }

    // Move current start to end of this event
    if (eventEnd > currentStart) {
      currentStart = new Date(eventEnd);
    }
  }

  // Free slot after last event
  if (currentStart < slot.end) {
    freeSlots.push({
      start: new Date(currentStart),
      end: new Date(slot.end),
    });
  }

  // Filter out slots that are too short (minimum 5 minutes)
  return freeSlots.filter(
    (s) => s.end.getTime() - s.start.getTime() >= 5 * 60 * 1000
  );
}

/**
 * Find the best slot for a task of given duration
 * Returns the slot that minimizes distance from preferred times
 */
export function findBestSlot(
  duration: number, // minutes
  availableSlots: TimeSlot[],
  preferences: UserPreferences,
  deadline?: Date
): TimeSlot | null {
  // Find slots that fit the duration (with break buffer)
  const totalNeeded = duration + preferences.breakBetweenTasks;
  
  const suitableSlots = availableSlots.filter((slot) => {
    const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
    return slotDuration >= totalNeeded;
  });

  if (suitableSlots.length === 0) {
    return null;
  }

  // Score each slot
  const scoredSlots = suitableSlots.map((slot) => ({
    slot,
    score: scoreSlot(slot, preferences, deadline),
  }));

  // Sort by score (highest first) and return best
  scoredSlots.sort((a, b) => b.score - a.score);

  const bestSlot = scoredSlots[0].slot;

  // Return a slot that exactly fits the task duration
  return {
    start: bestSlot.start,
    end: new Date(bestSlot.start.getTime() + duration * 60 * 1000),
  };
}

/**
 * Score a time slot based on preferences
 * Higher score = better slot
 */
function scoreSlot(
  slot: TimeSlot,
  preferences: UserPreferences,
  deadline?: Date
): number {
  let score = 100; // Base score

  // Prefer earlier slots if deadline exists and is soon
  if (deadline) {
    const timeUntilDeadline = deadline.getTime() - slot.start.getTime();
    const daysUntilDeadline = timeUntilDeadline / (1000 * 60 * 60 * 24);
    
    if (daysUntilDeadline < 1) {
      // Very urgent - prefer earliest possible slot
      score += 50 - (slot.start.getTime() - Date.now()) / (1000 * 60 * 60);
    } else if (daysUntilDeadline < 3) {
      // Urgent - slight preference for earlier
      score += 20 - (slot.start.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    }
  }

  // Prefer focus hours
  const slotHour = `${String(slot.start.getHours()).padStart(2, "0")}:00`;
  if (preferences.preferredFocusHours.includes(slotHour)) {
    score += 30;
  }

  // Slight penalty for late afternoon slots (cognitive decline)
  const hour = slot.start.getHours();
  if (hour >= 16) {
    score -= (hour - 16) * 5;
  }

  // Prefer morning slots for most tasks
  if (hour >= 9 && hour <= 11) {
    score += 10;
  }

  return score;
}

/**
 * Merge adjacent time slots
 */
export function mergeAdjacentSlots(slots: TimeSlot[]): TimeSlot[] {
  if (slots.length <= 1) return slots;

  // Sort by start time
  const sorted = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
  
  const merged: TimeSlot[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    
    // Check if slots are adjacent (within 1 minute)
    if (next.start.getTime() - current.end.getTime() <= 60 * 1000) {
      // Merge
      current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()));
    } else {
      // Push current and start new
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Calculate total available minutes
 */
export function getTotalAvailableMinutes(slots: TimeSlot[]): number {
  return slots.reduce((total, slot) => {
    return total + (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
  }, 0);
}

/**
 * Split a slot at a given time
 */
export function splitSlotAt(slot: TimeSlot, at: Date): TimeSlot[] {
  // If split point is outside the slot, return original
  if (at <= slot.start || at >= slot.end) {
    return [slot];
  }

  return [
    { start: slot.start, end: at },
    { start: at, end: slot.end },
  ];
}
