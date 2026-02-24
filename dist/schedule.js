/**
 * Schedule calculation: next_run_at and validation.
 * Supports period_minutes (step) and useCustomPeriod + custom_times (fixed times in 24h).
 * All times interpreted in plugin timezone (timezoneOffsetHours).
 */
import { getScheduleStepMinutes, getScheduleHorizonDays, getMinPeriodMinutes, getFirstRunDelayMinutes, getTimezoneOffsetHours, } from './options.js';
const MS_PER_MINUTE = 60 * 1000;
/** Apply timezone offset: UTC date -> "local" date for schedule (offset in hours) */
function toLocalScheduleDate(d, offsetHours) {
    const t = new Date(d);
    t.setUTCHours(t.getUTCHours() + offsetHours);
    return t;
}
/** "Local" date back to UTC for storage */
function fromLocalToUtc(local, offsetHours) {
    const t = new Date(local);
    t.setUTCHours(t.getUTCHours() - offsetHours);
    return t;
}
function isInInterval(d, key) {
    const day = d.getDay();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    switch (key) {
        case 'mon-fri':
            return day >= 1 && day <= 5;
        case 'sat-sun':
            return day === 0 || day === 6;
        case 'working-hours':
            return totalMinutes >= 8 * 60 && totalMinutes < 19 * 60;
        case 'morning-evening':
            return ((totalMinutes >= 5 * 60 && totalMinutes < 8 * 60) ||
                (totalMinutes >= 19 * 60 && totalMinutes < 22 * 60));
        case 'night':
            return totalMinutes >= 22 * 60 || totalMinutes < 5 * 60;
        default:
            return false;
    }
}
function matchesAllIntervals(d, intervals) {
    if (intervals.length === 0)
        return true;
    return intervals.every((key) => isInInterval(d, key));
}
/** Parse "23:15, 3:41" -> [{ hours: 23, minutes: 15 }, { hours: 3, minutes: 41 }] */
export function parseCustomTimes(s) {
    if (!s || typeof s !== 'string')
        return [];
    const result = [];
    for (const part of s.split(',').map((p) => p.trim())) {
        const match = part.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
            const hours = Math.min(23, Math.max(0, parseInt(match[1], 10)));
            const minutes = Math.min(59, Math.max(0, parseInt(match[2], 10)));
            result.push({ hours, minutes });
        }
    }
    return result;
}
/** Find next run for one condition: period_minutes mode (step) */
function findNextForPeriodCondition(startPointLocal, condition, stepMs, horizonMs, minPeriodMinutes) {
    const periodMs = Math.max(condition.period_minutes ?? minPeriodMinutes, minPeriodMinutes) * MS_PER_MINUTE;
    let candidate = new Date(startPointLocal.getTime() + periodMs);
    const endTime = startPointLocal.getTime() + horizonMs;
    const intervals = (condition.intervals ?? []);
    while (candidate.getTime() <= endTime) {
        if (matchesAllIntervals(candidate, intervals))
            return candidate;
        candidate = new Date(candidate.getTime() + stepMs);
    }
    return null;
}
/** Find next run for one condition: useCustomPeriod + custom_times (fixed times) */
function findNextForCustomTimesCondition(startPointLocal, condition, horizonMs, offsetHours) {
    const times = parseCustomTimes(condition.custom_times);
    if (times.length === 0)
        return null;
    const intervals = (condition.intervals ?? []);
    const endTime = startPointLocal.getTime() + horizonMs;
    const dayMs = 24 * 60 * MS_PER_MINUTE;
    let dayStart = new Date(startPointLocal);
    dayStart.setHours(0, 0, 0, 0);
    for (let day = 0; day < 32; day++) {
        const d = new Date(dayStart.getTime() + day * dayMs);
        if (d.getTime() > endTime)
            break;
        for (const { hours, minutes } of times) {
            const candidate = new Date(d);
            candidate.setHours(hours, minutes, 0, 0);
            if (candidate.getTime() >= startPointLocal.getTime() && candidate.getTime() <= endTime) {
                if (matchesAllIntervals(candidate, intervals))
                    return candidate;
            }
        }
    }
    return null;
}
function findNextForCondition(startPoint, condition, offsetHours, stepMs, horizonMs, minPeriodMinutes) {
    const startLocal = toLocalScheduleDate(startPoint, offsetHours);
    if (condition.useCustomPeriod && condition.custom_times) {
        const next = findNextForCustomTimesCondition(startLocal, condition, horizonMs, offsetHours);
        return next ? fromLocalToUtc(next, offsetHours) : null;
    }
    const next = findNextForPeriodCondition(startLocal, condition, stepMs, horizonMs, minPeriodMinutes);
    return next ? fromLocalToUtc(next, offsetHours) : null;
}
/**
 * Calculate next_run_at from schedule_conditions (OR: minimum of all valid).
 */
export function calculateNextRunAt(startPoint, scheduleConditions) {
    const stepMinutes = getScheduleStepMinutes();
    const horizonDays = getScheduleHorizonDays();
    const minPeriod = getMinPeriodMinutes();
    const offsetHours = getTimezoneOffsetHours();
    const stepMs = stepMinutes * MS_PER_MINUTE;
    const horizonMs = horizonDays * 24 * 60 * MS_PER_MINUTE;
    const candidates = [];
    for (const condition of scheduleConditions) {
        const next = findNextForCondition(startPoint, condition, offsetHours, stepMs, horizonMs, minPeriod);
        if (next)
            candidates.push(next);
    }
    if (candidates.length === 0)
        return null;
    return new Date(Math.min(...candidates.map((d) => d.getTime())));
}
/**
 * Validate: can we find next run for each condition within horizon?
 */
export function validateScheduleConditions(scheduleConditions) {
    const startPoint = new Date();
    startPoint.setMinutes(startPoint.getMinutes() + getFirstRunDelayMinutes());
    for (let i = 0; i < scheduleConditions.length; i++) {
        const next = calculateNextRunAt(startPoint, [scheduleConditions[i]]);
        if (!next)
            return { valid: false, conditionIndex: i };
    }
    return { valid: true };
}
