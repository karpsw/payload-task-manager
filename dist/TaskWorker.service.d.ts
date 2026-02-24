/**
 * Task worker: scheduler and task execution using only Payload Local API.
 * All runtime updates use disableHooks: true.
 */
import type { Payload } from 'payload';
import type { ScheduleIntervalKey, TaskContext } from './types.js';
export type TaskDoc = {
    id: number;
    method_name: string;
    type: string;
    is_active: boolean;
    timeout_seconds?: number | null;
    next_run_at?: string | null;
    status?: string | null;
    requested_action?: string | null;
    run_options?: unknown;
    log_enabled?: boolean | null;
    log_level?: string | null;
    schedule_conditions?: Array<{
        intervals?: ScheduleIntervalKey[];
        period_minutes?: number;
        useCustomPeriod?: boolean;
        custom_times?: string;
    }> | null;
    finished_at?: string | null;
};
export declare class TaskWorkerService {
    private readonly payload;
    private schedulerInterval;
    private runningTasks;
    private handlers;
    constructor(payload: Payload, handlers: Record<string, (ctx: TaskContext) => Promise<void>>);
    start(): Promise<void>;
    stop(): Promise<void>;
    private initializeOnStart;
    private syncTasksFromRegistry;
    private schedulerTick;
    private runTask;
    private finalizeTask;
    private recalculateNextRun;
    private createTaskContext;
}
//# sourceMappingURL=TaskWorker.service.d.ts.map