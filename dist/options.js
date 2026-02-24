export const DEFAULT_SCHEDULER_INTERVAL_MS = 20_000;
export const DEFAULT_MAX_CONCURRENT_TASKS = 2;
export const DEFAULT_TASK_TIMEOUT_SECONDS = 30;
export const DEFAULT_SCHEDULE_STEP_MINUTES = 3;
export const DEFAULT_SCHEDULE_HORIZON_DAYS = 7;
export const DEFAULT_MIN_PERIOD_MINUTES = 3;
export const DEFAULT_SSE_POLL_INTERVAL_MS = 5_000;
export const DEFAULT_FIRST_RUN_DELAY_MINUTES = 3;
export const DEFAULT_TIMEZONE_OFFSET_HOURS = 3;
let pluginOptions = null;
export function setPluginOptions(options) {
    pluginOptions = options;
}
export function getPluginOptions() {
    if (!pluginOptions)
        throw new Error('payload-task-manager: plugin options not set');
    return pluginOptions;
}
export function getSchedulerIntervalMs() {
    return pluginOptions?.schedulerIntervalMs ?? DEFAULT_SCHEDULER_INTERVAL_MS;
}
export function getMaxConcurrentTasks() {
    return pluginOptions?.maxConcurrentTasks ?? DEFAULT_MAX_CONCURRENT_TASKS;
}
export function getDefaultTaskTimeoutSeconds() {
    return pluginOptions?.defaultTaskTimeoutSeconds ?? DEFAULT_TASK_TIMEOUT_SECONDS;
}
export function getScheduleStepMinutes() {
    return pluginOptions?.scheduleStepMinutes ?? DEFAULT_SCHEDULE_STEP_MINUTES;
}
export function getScheduleHorizonDays() {
    return pluginOptions?.scheduleHorizonDays ?? DEFAULT_SCHEDULE_HORIZON_DAYS;
}
export function getMinPeriodMinutes() {
    return pluginOptions?.minPeriodMinutes ?? DEFAULT_MIN_PERIOD_MINUTES;
}
export function getSsePollIntervalMs() {
    return pluginOptions?.ssePollIntervalMs ?? DEFAULT_SSE_POLL_INTERVAL_MS;
}
export function getFirstRunDelayMinutes() {
    return pluginOptions?.firstRunDelayMinutes ?? DEFAULT_FIRST_RUN_DELAY_MINUTES;
}
export function getTimezoneOffsetHours() {
    return pluginOptions?.timezoneOffsetHours ?? DEFAULT_TIMEZONE_OFFSET_HOURS;
}
