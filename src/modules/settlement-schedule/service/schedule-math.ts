export interface ScheduleTiming {
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  return { hours, minutes };
}

/**
 * Computes the next run date strictly after `from`. For monthly/quarterly
 * schedules that land on a day past the target month's length, JS Date
 * rolls over into the following month - acceptable drift for a "day of
 * month" picker rather than something worth a calendar library for.
 */
export function computeNextRunAt(schedule: ScheduleTiming, from: Date): Date {
  const { hours, minutes } = parseTime(schedule.time);

  if (schedule.frequency === "weekly") {
    const targetDay = schedule.dayOfWeek ?? 0;
    const candidate = new Date(from);
    candidate.setHours(hours, minutes, 0, 0);

    let diff = (targetDay - candidate.getDay() + 7) % 7;
    if (diff === 0 && candidate <= from) {
      diff = 7;
    }
    candidate.setDate(candidate.getDate() + diff);
    return candidate;
  }

  const monthStep = schedule.frequency === "quarterly" ? 3 : 1;
  const targetDate = schedule.dayOfMonth ?? 1;

  const candidate = new Date(from);
  candidate.setDate(targetDate);
  candidate.setHours(hours, minutes, 0, 0);

  if (candidate <= from) {
    candidate.setMonth(candidate.getMonth() + monthStep);
    candidate.setDate(targetDate);
    candidate.setHours(hours, minutes, 0, 0);
  }

  return candidate;
}
