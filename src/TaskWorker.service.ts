/**
 * Task worker: scheduler and task execution using only Payload Local API.
 * All runtime updates use disableHooks: true.
 */

import type { Payload } from 'payload'
import {
  getSchedulerIntervalMs,
  getMaxConcurrentTasks,
  getDefaultTaskTimeoutSeconds,
} from './options.js'
import { calculateNextRunAt } from './schedule.js'
import type { ScheduleCondition, ScheduleIntervalKey, TaskContext, TaskProgress } from './types.js'

export type TaskDoc = {
  id: number
  method_name: string
  type: string
  is_active: boolean
  timeout_seconds?: number | null
  next_run_at?: string | null
  status?: string | null
  requested_action?: string | null
  run_options?: unknown
  log_enabled?: boolean | null
  log_level?: string | null
  schedule_conditions?: Array<{
    intervals?: ScheduleIntervalKey[]
    period_minutes?: number
    useCustomPeriod?: boolean
    custom_times?: string
  }> | null
  finished_at?: string | null
}

export class TaskWorkerService {
  private schedulerInterval: ReturnType<typeof setInterval> | null = null
  private runningTasks = new Map<number, AbortController>()
  private handlers: Record<string, (ctx: TaskContext) => Promise<void>>

  constructor(
    private readonly payload: Payload,
    handlers: Record<string, (ctx: TaskContext) => Promise<void>>,
  ) {
    this.handlers = handlers
  }

  async start(): Promise<void> {
    await this.initializeOnStart()
    this.schedulerInterval = setInterval(() => {
      void this.schedulerTick()
    }, getSchedulerIntervalMs())
  }

  async stop(): Promise<void> {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }
    for (const [, ctrl] of this.runningTasks) {
      ctrl.abort('worker stopping')
    }
    this.runningTasks.clear()
  }

  private async initializeOnStart(): Promise<void> {
    const now = new Date().toISOString()

    const running = await this.payload.find({
      collection: 'tasks',
      where: { status: { in: ['running', 'stopping'] } },
      limit: 1000,
      pagination: false,
    })

    for (const doc of running.docs) {
      const t = doc as { id: number }
    await (this.payload.update as (o: Record<string, unknown>) => Promise<unknown>)({
      collection: 'tasks',
      id: t.id,
      data: {
        status: 'error',
        error_message: 'Воркер перезапущен',
        finished_at: now,
        progress_current: null,
        progress_total: null,
        current_action: null,
        requested_action: null,
      },
      disableHooks: true,
    })
    }

    await this.syncTasksFromRegistry()

    const periodicActive = await this.payload.find({
      collection: 'tasks',
      where: {
        and: [
          { type: { equals: 'periodic' } },
          { is_active: { equals: true } },
        ],
      },
      limit: 500,
      pagination: false,
    })

    for (const doc of periodicActive.docs) {
      const t = doc as TaskDoc
      const nextRun = await this.recalculateNextRun(t.id, new Date())
      if (nextRun) {
        await (this.payload.update as (o: Record<string, unknown>) => Promise<unknown>)({
          collection: 'tasks',
          id: t.id,
          data: { next_run_at: nextRun.toISOString() },
          disableHooks: true,
        })
      }
    }
  }

  private async syncTasksFromRegistry(): Promise<void> {
    const registrySet = new Set<string>(Object.keys(this.handlers))

    const existing = await this.payload.find({
      collection: 'tasks',
      limit: 1000,
      pagination: false,
      depth: 0,
      select: { id: true, method_name: true, is_active: true },
    })

    const existingMethodNames = new Set<string>()
    for (const doc of existing.docs) {
      const t = doc as { id: number; method_name: string; is_active: boolean }
      existingMethodNames.add(t.method_name)
      if (!registrySet.has(t.method_name) && t.is_active) {
      await (this.payload.update as (o: Record<string, unknown>) => Promise<unknown>)({
        collection: 'tasks',
        id: t.id,
        data: { is_active: false },
        disableHooks: true,
      })
      }
    }

    for (const methodName of Object.keys(this.handlers)) {
      if (existingMethodNames.has(methodName)) continue
      await (this.payload.create as (o: Record<string, unknown>) => Promise<unknown>)({
        collection: 'tasks',
        data: {
          method_name: methodName,
          name: methodName,
          type: 'one-time',
          is_active: false,
          status: 'idle',
          timeout_seconds: getDefaultTaskTimeoutSeconds(),
          log_enabled: false,
        },
        disableHooks: true,
      })
    }
  }

  private async schedulerTick(): Promise<void> {
    const runningCount = this.runningTasks.size
    if (runningCount >= getMaxConcurrentTasks()) return

    const now = new Date().toISOString()

    const candidates = await this.payload.find({
      collection: 'tasks',
      where: {
        and: [
          { is_active: { equals: true } },
          {
            or: [
              {
                and: [
                  { next_run_at: { less_than_equal: now } },
                  { status: { in: ['idle', 'done', 'error'] } },
                ],
              },
              {
                and: [
                  { requested_action: { equals: 'start' } },
                  { status: { in: ['idle', 'done', 'error'] } },
                ],
              },
            ],
          },
        ],
      },
      limit: getMaxConcurrentTasks() - runningCount,
      pagination: false,
      depth: 0,
    })

    for (const doc of candidates.docs) {
      void this.runTask(doc as TaskDoc)
    }
  }

  private async runTask(task: TaskDoc): Promise<void> {
    const taskId = task.id
    const handler = this.handlers[task.method_name]

    await (this.payload.update as (o: Record<string, unknown>) => Promise<unknown>)({
      collection: 'tasks',
      id: taskId,
      data: {
        status: 'running',
        started_at: new Date().toISOString(),
        requested_action: null,
        error_message: null,
      },
      disableHooks: true,
    })

    const logs = await this.payload.find({
      collection: 'task-logs',
      where: { task: { equals: taskId } },
      limit: 1000,
      pagination: false,
    })
    for (const log of logs.docs) {
      await (this.payload.delete as (o: Record<string, unknown>) => Promise<unknown>)({
        collection: 'task-logs',
        id: (log as { id: number }).id,
        disableHooks: true,
      })
    }

    const controller = new AbortController()
    this.runningTasks.set(taskId, controller)

    const timeoutSeconds = Number(task.timeout_seconds) || getDefaultTaskTimeoutSeconds()
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutSeconds * 1000)

    if (!handler) {
      clearTimeout(timeoutId)
      this.runningTasks.delete(taskId)
      await this.finalizeTask(taskId, 'error', `Unknown method: ${task.method_name}`)
      return
    }

    const ctx = this.createTaskContext(task)
    const startTime = Date.now()

    if (task.log_enabled) {
      await ctx.log('info', `Время начала выполнения: ${new Date(startTime).toLocaleString('ru-RU')}`, {
        startedAt: new Date(startTime).toISOString(),
      })
    }

    try {
      await handler(ctx)
      clearTimeout(timeoutId)
      this.runningTasks.delete(taskId)
      if (task.log_enabled && task.log_level === 'debug') {
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
        await ctx.log('info', `Задача выполнена за ${durationSec} сек`, {
          durationSeconds: Number(durationSec),
          finishedAt: new Date().toISOString(),
        })
      }
      await this.finalizeTask(taskId, 'done')
    } catch (err) {
      clearTimeout(timeoutId)
      this.runningTasks.delete(taskId)
      const message = err instanceof Error ? err.message : String(err)
      if (task.log_enabled && task.log_level === 'debug') {
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
        const fullPayload: Record<string, string | number> = {
          message,
          error: String(err),
          durationSeconds: Number(durationSec),
        }
        if (err instanceof Error && err.stack) fullPayload.stack = err.stack
        await ctx.log('debug', `Ошибка. Время выполнения: ${durationSec} сек`, fullPayload)
      }
      await this.finalizeTask(taskId, 'error', message)
    }
  }

  private async finalizeTask(
    taskId: number,
    status: 'done' | 'error',
    errorMessage?: string,
  ): Promise<void> {
    const now = new Date().toISOString()
    await (this.payload.update as (o: Record<string, unknown>) => Promise<unknown>)({
      collection: 'tasks',
      id: taskId,
      data: {
        status,
        finished_at: now,
        error_message: errorMessage ?? null,
        requested_action: null,
        progress_current: null,
        progress_total: null,
        current_action: null,
      },
      disableHooks: true,
    })

    if (status === 'done') {
      const task = await this.payload.findByID({
        collection: 'tasks',
        id: taskId,
        depth: 1,
      }) as TaskDoc
      if (task?.type === 'periodic') {
        const nextRun = await this.recalculateNextRun(taskId, new Date(now))
        if (nextRun) {
          await (this.payload.update as (o: Record<string, unknown>) => Promise<unknown>)({
            collection: 'tasks',
            id: taskId,
            data: { next_run_at: nextRun.toISOString() },
            disableHooks: true,
          })
        }
      }
    }
  }

  private async recalculateNextRun(taskId: number, startPoint: Date): Promise<Date | null> {
    const task = await this.payload.findByID({
      collection: 'tasks',
      id: taskId,
      depth: 1,
    }) as TaskDoc | null

    if (!task?.schedule_conditions?.length) return null

    const conditions: ScheduleCondition[] = task.schedule_conditions.map((row) => ({
      intervals: row.intervals ?? undefined,
      period_minutes: row.period_minutes,
      useCustomPeriod: row.useCustomPeriod,
      custom_times: row.custom_times ?? undefined,
    }))

    return calculateNextRunAt(startPoint, conditions)
  }

  private createTaskContext(task: TaskDoc): TaskContext {
    const taskId = task.id
    const rawRunOptions = task.run_options
    const runOptions =
      rawRunOptions != null && typeof rawRunOptions === 'object'
        ? (rawRunOptions as Record<string, unknown>)
        : undefined

    return {
      taskId: String(taskId),
      signal: this.runningTasks.get(taskId)?.signal ?? new AbortController().signal,
      runOptions,

      update: async (data: TaskProgress) => {
        const set: Record<string, unknown> = {}
        if (data.progress_current !== undefined) set.progress_current = data.progress_current
        if (data.progress_total !== undefined) set.progress_total = data.progress_total
        if (data.current_action !== undefined) set.current_action = data.current_action
        if (Object.keys(set).length > 0) {
          await (this.payload.update as (o: Record<string, unknown>) => Promise<unknown>)({
            collection: 'tasks',
            id: taskId,
            data: set,
            disableHooks: true,
          })
        }
      },

      log: async (level, message, payload) => {
        if (!task.log_enabled) return
        if (level === 'debug' && task.log_level !== 'debug') return
        await (this.payload.create as (o: Record<string, unknown>) => Promise<unknown>)({
          collection: 'task-logs',
          data: {
            task: taskId,
            created_at: new Date().toISOString(),
            level,
            message,
            payload: payload ?? null,
          },
          disableHooks: true,
        })
      },

      isStopRequested: async () => {
        const t = await this.payload.findByID({
          collection: 'tasks',
          id: taskId,
          select: { requested_action: true },
        }) as { requested_action?: string | null } | null
        return t?.requested_action === 'stop'
      },
    }
  }
}
