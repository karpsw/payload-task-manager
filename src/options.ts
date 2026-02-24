import type { TaskContext } from './types.js'

export const DEFAULT_SCHEDULER_INTERVAL_MS = 20_000
export const DEFAULT_MAX_CONCURRENT_TASKS = 2
export const DEFAULT_TASK_TIMEOUT_SECONDS = 30
export const DEFAULT_SCHEDULE_STEP_MINUTES = 3
export const DEFAULT_SCHEDULE_HORIZON_DAYS = 7
export const DEFAULT_MIN_PERIOD_MINUTES = 3
export const DEFAULT_SSE_POLL_INTERVAL_MS = 5_000
export const DEFAULT_FIRST_RUN_DELAY_MINUTES = 3
export const DEFAULT_TIMEZONE_OFFSET_HOURS = 3

export interface TaskManagerPluginOptions {
  /** Handlers are passed when creating TaskWorkerService in the app runner; optional here for config. */
  handlers?: Record<string, (ctx: TaskContext) => Promise<void>>
  schedulerIntervalMs?: number
  maxConcurrentTasks?: number
  defaultTaskTimeoutSeconds?: number
  scheduleStepMinutes?: number
  scheduleHorizonDays?: number
  minPeriodMinutes?: number
  ssePollIntervalMs?: number
  firstRunDelayMinutes?: number
  /** Timezone offset in hours for schedule (default 3 = UTC+3) */
  timezoneOffsetHours?: number
  /** Admin beforeList component path (e.g. '/components/Admin/TasksListHeader#TasksListHeader') */
  adminBeforeListComponent?: string
}

let pluginOptions: TaskManagerPluginOptions | null = null

export function setPluginOptions(options: TaskManagerPluginOptions): void {
  pluginOptions = options
}

export function getPluginOptions(): TaskManagerPluginOptions {
  if (!pluginOptions) throw new Error('payload-task-manager: plugin options not set')
  return pluginOptions
}

export function getSchedulerIntervalMs(): number {
  return pluginOptions?.schedulerIntervalMs ?? DEFAULT_SCHEDULER_INTERVAL_MS
}

export function getMaxConcurrentTasks(): number {
  return pluginOptions?.maxConcurrentTasks ?? DEFAULT_MAX_CONCURRENT_TASKS
}

export function getDefaultTaskTimeoutSeconds(): number {
  return pluginOptions?.defaultTaskTimeoutSeconds ?? DEFAULT_TASK_TIMEOUT_SECONDS
}

export function getScheduleStepMinutes(): number {
  return pluginOptions?.scheduleStepMinutes ?? DEFAULT_SCHEDULE_STEP_MINUTES
}

export function getScheduleHorizonDays(): number {
  return pluginOptions?.scheduleHorizonDays ?? DEFAULT_SCHEDULE_HORIZON_DAYS
}

export function getMinPeriodMinutes(): number {
  return pluginOptions?.minPeriodMinutes ?? DEFAULT_MIN_PERIOD_MINUTES
}

export function getSsePollIntervalMs(): number {
  return pluginOptions?.ssePollIntervalMs ?? DEFAULT_SSE_POLL_INTERVAL_MS
}

export function getFirstRunDelayMinutes(): number {
  return pluginOptions?.firstRunDelayMinutes ?? DEFAULT_FIRST_RUN_DELAY_MINUTES
}

export function getTimezoneOffsetHours(): number {
  return pluginOptions?.timezoneOffsetHours ?? DEFAULT_TIMEZONE_OFFSET_HOURS
}
