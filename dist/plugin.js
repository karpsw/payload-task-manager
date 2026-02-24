import { setPluginOptions } from './options.js';
import { createTasksCollection } from './collections/Task.js';
import { TaskLogs } from './collections/TaskLog.js';
export function taskManagerPlugin(options = {}) {
    setPluginOptions(options);
    return (incomingConfig) => {
        const config = { ...incomingConfig };
        config.collections = [
            ...(config.collections || []),
            createTasksCollection(options.adminBeforeListComponent),
            TaskLogs,
        ];
        return config;
    };
}
