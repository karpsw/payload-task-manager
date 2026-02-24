import type { TaskContext } from './types.js';
export declare const DEFAULT_SCHEDULER_INTERVAL_MS = 20000;
export declare const DEFAULT_MAX_CONCURRENT_TASKS = 2;
export declare const DEFAULT_TASK_TIMEOUT_SECONDS = 30;
export declare const DEFAULT_SCHEDULE_STEP_MINUTES = 3;
export declare const DEFAULT_SCHEDULE_HORIZON_DAYS = 7;
export declare const DEFAULT_MIN_PERIOD_MINUTES = 3;
export declare const DEFAULT_SSE_POLL_INTERVAL_MS = 5000;
export declare const DEFAULT_FIRST_RUN_DELAY_MINUTES = 3;
export declare const DEFAULT_TIMEZONE_OFFSET_HOURS = 3;
export interface TaskManagerPluginOptions {
    /** Handlers are passed when creating TaskWorkerService in the app runner; optional here for config. */
    handlers?: Record<string, (ctx: TaskContext) => Promise<void>>;
    schedulerIntervalMs?: number;
    maxConcurrentTasks?: number;
    defaultTaskTimeoutSeconds?: number;
    scheduleStepMinutes?: number;
    scheduleHorizonDays?: number;
    minPeriodMinutes?: number;
    ssePollIntervalMs?: number;
    firstRunDelayMinutes?: number;
    /** Timezone offset in hours for schedule (default 3 = UTC+3) */
    timezoneOffsetHours?: number;
    /** Admin beforeList component path (e.g. '/components/Admin/TasksListHeader#TasksListHeader') */
    adminBeforeListComponent?: string;
}
export declare function setPluginOptions(options: TaskManagerPluginOptions): void;
export declare function getPluginOptions(): TaskManagerPluginOptions;
export declare function getSchedulerIntervalMs(): number;
export declare function getMaxConcurrentTasks(): number;
export declare function getDefaultTaskTimeoutSeconds(): number;
export declare function getScheduleStepMinutes(): number;
export declare function getScheduleHorizonDays(): number;
export declare function getMinPeriodMinutes(): number;
export declare function getSsePollIntervalMs(): number;
export declare function getFirstRunDelayMinutes(): number;
export declare function getTimezoneOffsetHours(): number;
//# sourceMappingURL=options.d.ts.map