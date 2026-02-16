/**
 * Example utility functions for the JustPlan application
 */

/**
 * Format a duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "1h 30m", "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) {
    throw new Error("Duration cannot be negative");
  }

  if (minutes === 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate total working minutes in a week
 * @param workingHours - Array of working hours per day (0 = Sunday)
 * @returns Total minutes available in a week
 */
export function calculateWeeklyWorkingMinutes(
  workingHours: Array<{
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
  }>
): number {
  return workingHours.reduce((total, day) => {
    if (!day.isWorkingDay) {
      return total;
    }

    const [startHour, startMinute] = day.startTime.split(":").map(Number);
    const [endHour, endMinute] = day.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return total + (endMinutes - startMinutes);
  }, 0);
}

/**
 * Check if a date is within working hours
 * @param date - Date to check
 * @param workingHours - Working hours configuration
 * @returns Boolean indicating if the date is within working hours
 */
export function isWithinWorkingHours(
  date: Date,
  workingHours: { startTime: string; endTime: string }
): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [startHour, startMinute] = workingHours.startTime
    .split(":")
    .map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Generate a color based on workflow state priority
 * @param priority - Priority boost value (-10 to +10)
 * @returns Tailwind color class
 */
export function getPriorityColor(priority: number): string {
  if (priority >= 5) return "text-red-500";
  if (priority >= 0) return "text-yellow-500";
  if (priority >= -5) return "text-blue-500";
  return "text-gray-500";
}
