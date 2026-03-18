const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 17;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

export const DEFAULT_TIMEZONE = "Europe/Paris";

interface LocalTime {
  day: number;
  hour: number;
  minute: number;
  dayName: string;
}

function getLocalTime(timezone: string): LocalTime {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const dayName = parts.find((p) => p.type === "weekday")?.value ?? "Monday";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0");

  return { day: DAY_INDEX[dayName] ?? 1, hour, minute, dayName };
}

function nextDeployWindow(timezone: string): string {
  const { day, hour } = getLocalTime(timezone);

  if (day >= 1 && day <= 4 && hour < BUSINESS_HOURS_START) {
    return `today at ${BUSINESS_HOURS_START}:00`;
  }

  let daysUntilNext: number;
  if (day === 5 || day === 6) {
    daysUntilNext = (8 - day) % 7 || 7; // next Monday
  } else if (day === 0) {
    daysUntilNext = 1; // tomorrow = Monday
  } else {
    daysUntilNext = 1; // next weekday
  }

  const next = new Date();
  next.setDate(next.getDate() + daysUntilNext);
  const nextDay = DAY_NAMES[next.getDay()];
  return `${nextDay} at ${BUSINESS_HOURS_START}:00`;
}

export function checkDeploy(timezone = DEFAULT_TIMEZONE): { allowed: boolean; reason: string } {
  const { day, hour, minute, dayName } = getLocalTime(timezone);
  const time = `${hour}:${String(minute).padStart(2, "0")}`;

  if (day === 0 || day === 6) {
    return {
      allowed: false,
      reason: `It's ${dayName}. Nobody should be deploying on weekends. Next window: ${nextDeployWindow(timezone)}.`,
    };
  }

  if (day === 5) {
    return {
      allowed: false,
      reason: `It's Friday. Never deploy on a Friday unless you enjoy ruining your weekend. Next window: ${nextDeployWindow(timezone)}.`,
    };
  }

  if (hour < BUSINESS_HOURS_START) {
    return {
      allowed: false,
      reason: `It's ${time} — too early. Wait until ${BUSINESS_HOURS_START}:00 so the team is around. Next window: ${nextDeployWindow(timezone)}.`,
    };
  }

  if (hour >= BUSINESS_HOURS_END) {
    return {
      allowed: false,
      reason: `It's ${time} — end of business hours. Next window: ${nextDeployWindow(timezone)}.`,
    };
  }

  const timeLeft = BUSINESS_HOURS_END - hour;
  return {
    allowed: true,
    reason: `It's ${dayName} at ${time} — you're good to go! ~${timeLeft}h left in the deploy window. Ship it.`,
  };
}
