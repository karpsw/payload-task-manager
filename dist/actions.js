export async function getTasksState(payload) {
    const result = await payload.find({
        collection: 'tasks',
        where: { is_active: { equals: true } },
        limit: 1000,
        pagination: false,
        sort: 'id',
        depth: 0,
    });
    return result.docs.map((doc) => {
        const d = doc;
        return {
            id: String(d.id),
            name: d.name ?? '',
            status: d.status ?? 'idle',
            type: d.type ?? 'periodic',
            next_run_at: d.next_run_at ?? null,
            started_at: d.started_at ?? null,
            progress_current: d.progress_current != null ? Number(d.progress_current) : null,
            progress_total: d.progress_total != null ? Number(d.progress_total) : null,
            current_action: d.current_action ?? null,
            error_message: d.error_message ?? null,
            log_enabled: Boolean(d.log_enabled),
        };
    });
}
export async function startTask(payload, taskId) {
    const id = parseInt(taskId, 10);
    if (Number.isNaN(id))
        return;
    await payload.update({
        collection: 'tasks',
        id,
        data: { requested_action: 'start' },
        disableHooks: true,
    });
}
export async function stopTask(payload, taskId) {
    const id = parseInt(taskId, 10);
    if (Number.isNaN(id))
        return;
    await payload.update({
        collection: 'tasks',
        id,
        data: { requested_action: 'stop', status: 'stopping' },
        disableHooks: true,
    });
}
export async function getTaskLogs(payload, taskId) {
    const id = parseInt(taskId, 10);
    if (Number.isNaN(id))
        return [];
    const result = await payload.find({
        collection: 'task-logs',
        where: { task: { equals: id } },
        limit: 100,
        sort: '-created_at',
        depth: 0,
    });
    return result.docs.map((doc) => {
        const d = doc;
        return {
            id: String(d.id),
            task_id: taskId,
            created_at: d.created_at ?? '',
            level: d.level ?? 'info',
            message: d.message ?? '',
            payload: d.payload ?? null,
        };
    });
}
