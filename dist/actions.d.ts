import type { Payload } from 'payload';
import type { TaskLogRecord, TaskSSEData } from './types.js';
export declare function getTasksState(payload: Payload): Promise<TaskSSEData[]>;
export declare function startTask(payload: Payload, taskId: string): Promise<void>;
export declare function stopTask(payload: Payload, taskId: string): Promise<void>;
export declare function getTaskLogs(payload: Payload, taskId: string): Promise<TaskLogRecord[]>;
//# sourceMappingURL=actions.d.ts.map