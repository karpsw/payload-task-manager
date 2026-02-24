# payload-task-manager

Background task manager for **Payload CMS 3+**: collections (Tasks, Task Logs), worker process, SSE updates, Server Actions. Handlers and task logic stay in your app; the plugin provides scheduling, admin UI, and runtime.

## Install

From GitHub:

```bash
pnpm add github:karpsw/payload-task-manager
```

For local development (no commit needed):

```bash
pnpm add file:../../../payload_plugins/pl-task-manager
```

Adjust the path relative to your app root.

## Setup

1. **Register the plugin** in `payload.config.ts` with your handlers and optional settings:

```ts
import { taskManagerPlugin } from 'payload-task-manager'
import { getHandlers } from './jobs/handlers' // your app

export default buildConfig({
  plugins: [
    taskManagerPlugin({
      handlers: getHandlers(), // or inline: { myTask: (ctx) => ... }
      timezoneOffsetHours: 3,       // default 3 (UTC+3)
      schedulerIntervalMs: 20_000,
      maxConcurrentTasks: 2,
      defaultTaskTimeoutSeconds: 30,
      ssePollIntervalMs: 5_000,
      firstRunDelayMinutes: 3,
    }),
  ],
  // ...
})
```

2. **Run the worker** as a separate process (e.g. in `package.json`):

```json
"job": "cross-env NODE_ENV=development NODE_OPTIONS=--no-deprecation pnpm exec tsx src/scripts/runner.ts"
```

Example `src/scripts/runner.ts`:

```ts
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TaskWorkerService } from 'payload-task-manager'
import { getHandlers } from '@/jobs/handlers'

async function main() {
  const payload = await getPayload({ config })
  const handlers = await getHandlers()
  const worker = new TaskWorkerService(payload, handlers)
  await worker.start()
  process.on('SIGTERM', () => worker.stop().then(() => process.exit(0)))
  process.on('SIGINT', () => worker.stop().then(() => process.exit(0)))
}
main().catch((e) => { console.error(e); process.exit(1) })
```

3. **Server Actions & SSE** in your app: call `getTasksState`, `startTask`, `stopTask`, `getTaskLogs` from `payload-task-manager` (with `getPayload({ config })`), and expose an SSE route that polls `getTasksState` at `ssePollIntervalMs`.

4. **Admin**: Open the Tasks collection, set schedule (periodic with intervals and/or custom times), activate tasks; they will run when the worker is running.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `handlers` | optional in config | `Record<string, (ctx: TaskContext) => Promise<void>>` — task key → handler (runner passes handlers to worker) |
| `timezoneOffsetHours` | `3` | Timezone for schedule (e.g. 3 = UTC+3) |
| `schedulerIntervalMs` | `20000` | Scheduler tick interval |
| `maxConcurrentTasks` | `2` | Max tasks running at once |
| `defaultTaskTimeoutSeconds` | `30` | Task timeout |
| `ssePollIntervalMs` | `5000` | SSE poll interval |
| `firstRunDelayMinutes` | `3` | Delay for first next_run_at |
| `scheduleStepMinutes` | `3` | Step for period-based schedule |
| `scheduleHorizonDays` | `7` | Horizon for next run calculation |
| `minPeriodMinutes` | `3` | Min period for periodic tasks |
| `adminBeforeListComponent` | — | Admin path for beforeList (e.g. `/components/Admin/TasksListHeader#TasksListHeader`) |

## Schedule conditions

- **Intervals**: mon-fri, sat-sun, working-hours, morning-evening, night (same as before).
- **Period (minutes)**: when “Фиксированное время” is off, use period_minutes as before.
- **Custom times**: turn on “Фиксированное время” and enter 24h times comma-separated (e.g. `23:15, 3:41`). Next run is the next occurrence of one of these times that falls within the selected intervals (e.g. sat-sun + 3:41 → next Saturday or Sunday at 3:41 in the configured timezone).

## Debug

Use `createTaskFakeContext()` from `payload-task-manager` and run a single handler (e.g. `pnpm job:test myTask`) without the worker.

## Types

- `TaskContext` — passed to each handler (taskId, signal, runOptions, update, log, isStopRequested).
- `TaskProgress` — shape for `ctx.update({ progress_current, progress_total, current_action })`.
- `TaskSSEData`, `TaskLogRecord` — for UI/SSE and logs.

## License

MIT
