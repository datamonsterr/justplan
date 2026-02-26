/**
 * Google API Module Exports
 */

// Auth
export {
  GOOGLE_SCOPES,
  createOAuth2Client,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getUserTokens,
  saveUserTokens,
  clearUserTokens,
  getAuthenticatedClient,
  isGoogleConnected,
} from "./auth";

// Calendar
export {
  listCalendars,
  fetchEvents,
  fetchAllEvents,
  createEvent as createCalendarEvent,
  updateEvent as updateCalendarEvent,
  deleteEvent as deleteCalendarEvent,
  type CalendarEvent,
  type Calendar,
  type CreateEventInput,
} from "./calendar";

// Tasks
export {
  listTaskLists,
  fetchTasks,
  fetchAllTasks,
  createTask as createGoogleTask,
  updateTask as updateGoogleTask,
  completeTask,
  deleteTask as deleteGoogleTask,
  moveTask,
  type GoogleTask,
  type GoogleTaskList,
  type CreateTaskInput as CreateGoogleTaskInput,
} from "./tasks";
