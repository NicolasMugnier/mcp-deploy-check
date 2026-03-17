const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 17;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function nextDeployWindow(): string {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // If before business hours on a weekday (Mon–Thu), deploy today at 9:00
  if (day >= 1 && day <= 4 && hour < BUSINESS_HOURS_START) {
    return `today at ${BUSINESS_HOURS_START}:00`;
  }

  // Calculate days until next Monday (if Fri/Sat/Sun) or next day (Mon–Thu after hours)
  let daysUntilNext: number;
  if (day === 5 || day === 6) {
    daysUntilNext = (8 - day) % 7 || 7; // next Monday
  } else if (day === 0) {
    daysUntilNext = 1; // tomorrow = Monday
  } else {
    daysUntilNext = 1; // next weekday
  }

  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilNext);
  const nextDay = DAYS[next.getDay()];
  return `${nextDay} at ${BUSINESS_HOURS_START}:00`;
}

export function checkDeploy(): { allowed: boolean; reason: string } {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const dayName = DAYS[day];
  const time = `${hour}:${String(now.getMinutes()).padStart(2, "0")}`;

  if (day === 0 || day === 6) {
    return {
      allowed: false,
      reason: `It's ${dayName}. Nobody should be deploying on weekends. Next window: ${nextDeployWindow()}.`,
    };
  }

  if (day === 5) {
    return {
      allowed: false,
      reason: `It's Friday. Never deploy on a Friday unless you enjoy ruining your weekend. Next window: ${nextDeployWindow()}.`,
    };
  }

  if (hour < BUSINESS_HOURS_START) {
    return {
      allowed: false,
      reason: `It's ${time} — too early. Wait until ${BUSINESS_HOURS_START}:00 so the team is around. Next window: ${nextDeployWindow()}.`,
    };
  }

  if (hour >= BUSINESS_HOURS_END) {
    return {
      allowed: false,
      reason: `It's ${time} — end of business hours. Next window: ${nextDeployWindow()}.`,
    };
  }

  const timeLeft = BUSINESS_HOURS_END - hour;
  return {
    allowed: true,
    reason: `It's ${dayName} at ${time} — you're good to go! ~${timeLeft}h left in the deploy window. Ship it.`,
  };
}
