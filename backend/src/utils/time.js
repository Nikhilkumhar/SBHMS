// All hostel time rules use Indian Standard Time (IST),
// no matter where the server is running.

const IST = "Asia/Kolkata";

// "2026-10-10" (today's date in India)
export const getISTDateString = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

// Minutes since midnight in India (e.g. 9:30 AM = 570)
export const getISTMinutes = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour").value);
  const minute = Number(parts.find((p) => p.type === "minute").value);

  return hour * 60 + minute;
};

// Midnight (00:00) of today in India, as a Date
export const startOfDayIST = (date = new Date()) =>
  new Date(`${getISTDateString(date)}T00:00:00+05:30`);

// 5:00 PM in India on the same day as the given date
export const collegeEndIST = (date) =>
  new Date(`${getISTDateString(date)}T17:00:00+05:30`);

// Build a Date from "2026-10-10" + "14:30" as India time
export const istDateTime = (dateStr, timeStr) => {
  const time = timeStr && timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${time}+05:30`);
};