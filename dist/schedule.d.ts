/**
 * Schedule calculation: next_run_at and validation.
 * Supports period_minutes (step) and useCustomPeriod + custom_times (fixed times in 24h).
 * All times interpreted in plugin timezone (timezoneOffsetHours).
 */
import type { ScheduleCondition } from './types.js';
/** Parse "23:15, 3:41" -> [{ hours: 23, minutes: 15 }, { hours: 3, minutes: 41 }] */
export declare function parseCustomTimes(s: string | undefined): {
    hours: number;
    minutes: number;
}[];
/**
 * Calculate next_run_at from schedule_conditions (OR: minimum of all valid).
 */
export declare function calculateNextRunAt(startPoint: Date, scheduleConditions: ScheduleCondition[]): Date | null;
/**
 * Validate: can we find next run for each condition within horizon?
 */
export declare function validateScheduleConditions(scheduleConditions: ScheduleCondition[]): {
    valid: false;
    conditionIndex: number;
} | {
    valid: true;
};
//# sourceMappingURL=schedule.d.ts.map