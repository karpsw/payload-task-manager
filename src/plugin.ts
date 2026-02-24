import type { Config } from 'payload'
import { setPluginOptions } from './options.js'
import type { TaskManagerPluginOptions } from './options.js'
import { createTasksCollection } from './collections/Task.js'
import { TaskLogs } from './collections/TaskLog.js'

export function taskManagerPlugin(options: TaskManagerPluginOptions = {}) {
  setPluginOptions(options as TaskManagerPluginOptions)
  return (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }
    config.collections = [
      ...(config.collections || []),
      createTasksCollection(options.adminBeforeListComponent),
      TaskLogs,
    ]
    return config
  }
}

export type { TaskManagerPluginOptions } from './options.js'
