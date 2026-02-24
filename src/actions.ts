import type { Payload } from 'payload'
import type { TaskLogRecord, TaskSSEData } from './types.js'

export async function getTasksState(payload: Payload): Promise<TaskSSEData[]> {
  const result = await payload.find({
    collection: 'tasks',
    where: { is_active: { equals: true } },
    limit: 1000,
    pagination: false,
    sort: 'id',
    depth: 0,
  })

  return result.docs.map((doc) => {
    const d = doc as Record<string, unknown>
    return {
      id: String(d.id),
      name: (d.name as string) ?? '',
      status: (d.status as string) ?? 'idle',
      type: (d.type as string) ?? 'periodic',
      next_run_at: (d.next_run_at as string) ?? null,
      started_at: (d.started_at as string) ?? null,
      progress_current: d.progress_current != null ? Number(d.progress_current) : null,
      progress_total: d.progress_total != null ? Number(d.progress_total) : null,
      current_action: (d.current_action as string) ?? null,
      error_message: (d.error_message as string) ?? null,
      log_enabled: Boolean(d.log_enabled),
    }
  })
}

export async function startTask(payload: Payload, taskId: string): Promise<void> {
  const id = parseInt(taskId, 10)
  if (Number.isNaN(id)) return
  await (payload.update as (opts: Record<string, unknown>) => Promise<unknown>)({
    collection: 'tasks',
    id,
    data: { requested_action: 'start' },
    disableHooks: true,
  })
}

export async function stopTask(payload: Payload, taskId: string): Promise<void> {
  const id = parseInt(taskId, 10)
  if (Number.isNaN(id)) return
  await (payload.update as (opts: Record<string, unknown>) => Promise<unknown>)({
    collection: 'tasks',
    id,
    data: { requested_action: 'stop', status: 'stopping' },
    disableHooks: true,
  })
}

export async function getTaskLogs(payload: Payload, taskId: string): Promise<TaskLogRecord[]> {
  const id = parseInt(taskId, 10)
  if (Number.isNaN(id)) return []

  const result = await payload.find({
    collection: 'task-logs',
    where: { task: { equals: id } },
    limit: 100,
    sort: '-created_at',
    depth: 0,
  })

  return result.docs.map((doc) => {
    const d = doc as Record<string, unknown>
    return {
      id: String(d.id),
      task_id: taskId,
      created_at: (d.created_at as string) ?? '',
      level: (d.level as string) ?? 'info',
      message: (d.message as string) ?? '',
      payload: (d.payload as Record<string, unknown>) ?? null,
    }
  })
}
