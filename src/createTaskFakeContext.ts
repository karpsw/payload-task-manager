import type { TaskContext } from './types.js'

/**
 * Fake TaskContext for testing/debugging tasks. Logs and progress go to console.
 */
export function createTaskFakeContext(): TaskContext {
  const controller = new AbortController()
  return {
    taskId: 'test',
    signal: controller.signal,
    update: async (data) => {
      console.log('[update]', JSON.stringify(data, null, 2))
    },
    log: async (level, message, payload) => {
      const prefix = `[${level}]`
      if (payload != null && Object.keys(payload).length > 0) {
        console.log(prefix, message, payload)
      } else {
        console.log(prefix, message)
      }
    },
    isStopRequested: async () => false,
  }
}
