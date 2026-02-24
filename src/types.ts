/**
 * Types for payload-task-manager.
 */

export type TaskType = 'one-time' | 'periodic'

export type TaskStatus = 'idle' | 'running' | 'stopping' | 'done' | 'error'

export type RequestedAction = 'start' | 'stop' | null

export type TaskLogLevel = 'info' | 'debug'

export const SCHEDULE_INTERVAL_OPTIONS = [
  'mon-fri',
  'sat-sun',
  'working-hours',
  'morning-evening',
  'night',
] as const

export type ScheduleIntervalKey = (typeof SCHEDULE_INTERVAL_OPTIONS)[number]

export interface ScheduleCondition {
  intervals?: ScheduleIntervalKey[]
  /** Used when useCustomPeriod is false */
  period_minutes?: number
  /** When true, use custom_times instead of period_minutes */
  useCustomPeriod?: boolean
  /** Comma-separated 24h times, e.g. "23:15, 3:41" */
  custom_times?: string
}

export interface TaskProgress {
  progress_current?: number
  progress_total?: number
  current_action?: string
}

export interface TaskContext {
  taskId: string
  signal: AbortSignal
  runOptions?: Record<string, unknown>
  update: (data: TaskProgress) => Promise<void>
  log: (
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    payload?: Record<string, unknown>,
  ) => Promise<void>
  isStopRequested: () => Promise<boolean>
}

export interface TaskSSEData {
  id: string
  name: string
  status: string
  type: string
  next_run_at: string | null
  started_at: string | null
  progress_current: number | null
  progress_total: number | null
  current_action: string | null
  error_message: string | null
  log_enabled: boolean
}

export interface TaskLogRecord {
  id: string
  task_id: string
  created_at: string
  level: string
  message: string
  payload: Record<string, unknown> | null
}
