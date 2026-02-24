import { getFirstRunDelayMinutes } from '../options.js';
import { calculateNextRunAt, validateScheduleConditions } from '../schedule.js';
export function createTasksCollection(adminBeforeListComponent) {
    const admin = {
        useAsTitle: 'name',
        defaultColumns: ['name', 'type', 'status', 'next_run_at', 'is_active'],
        description: 'Фоновые задачи. Воркер: pnpm job.',
    };
    if (adminBeforeListComponent) {
        admin.components = { beforeList: [adminBeforeListComponent] };
    }
    return {
        slug: 'tasks',
        admin,
        access: {
            read: () => true,
            create: () => false,
            update: () => true,
            delete: () => true,
        },
        fields: [
            {
                name: 'method_name',
                type: 'text',
                required: true,
                unique: true,
                label: 'Метод',
                admin: { description: 'Ключ из реестра задач', readOnly: true },
            },
            { name: 'name', type: 'text', label: 'Название' },
            {
                name: 'run_options',
                type: 'json',
                label: 'Параметры запуска',
                admin: { description: 'JSON-объект параметров для задачи' },
            },
            { name: 'run_options_describe', type: 'textarea', label: 'Описание параметров' },
            {
                name: 'type',
                type: 'select',
                required: true,
                defaultValue: 'periodic',
                options: [
                    { label: 'Периодическая', value: 'periodic' },
                    { label: 'Разовая', value: 'one-time' },
                ],
                label: 'Тип',
            },
            { name: 'is_active', type: 'checkbox', defaultValue: true, label: 'Включена' },
            {
                name: 'timeout_seconds',
                type: 'number',
                defaultValue: 30,
                min: 1,
                label: 'Таймаут (сек)',
                admin: { description: 'Таймаут выполнения задачи' },
            },
            {
                name: 'schedule_conditions',
                type: 'array',
                label: 'Условия расписания',
                admin: {
                    condition: (_, siblingData) => siblingData?.type === 'periodic',
                    description: 'Только для периодических. Несколько условий — OR (минимум из времён).',
                },
                fields: [
                    {
                        name: 'intervals',
                        type: 'select',
                        hasMany: true,
                        label: 'Интервалы',
                        options: [
                            { label: 'Пн–Пт', value: 'mon-fri' },
                            { label: 'Сб–Вс', value: 'sat-sun' },
                            { label: 'Рабочие часы (08:00–19:00)', value: 'working-hours' },
                            { label: 'Утро/вечер (05:00–08:00, 19:00–22:00)', value: 'morning-evening' },
                            { label: 'Ночь (22:00–05:00)', value: 'night' },
                        ],
                    },
                    {
                        name: 'useCustomPeriod',
                        type: 'checkbox',
                        defaultValue: false,
                        label: 'Фиксированное время',
                        admin: { description: 'Вместо периода — список времени (24h)' },
                    },
                    {
                        name: 'period_minutes',
                        type: 'number',
                        required: true,
                        min: 3,
                        label: 'Период (мин)',
                        admin: { condition: (_, siblingData) => !siblingData?.useCustomPeriod },
                    },
                    {
                        name: 'custom_times',
                        type: 'text',
                        label: 'Время (24h)',
                        admin: {
                            condition: (_, siblingData) => siblingData?.useCustomPeriod,
                            description: 'Часы:минуты через запятую, например 23:15, 3:41',
                        },
                    },
                ],
            },
            {
                name: 'next_run_at',
                type: 'date',
                label: 'Следующий запуск',
                admin: {
                    readOnly: true,
                    description: 'Вычисляется при сохранении (periodic) или после выполнения',
                    date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm:ss' },
                },
            },
            {
                name: 'status',
                type: 'select',
                required: true,
                defaultValue: 'idle',
                options: [
                    { label: 'Ожидание', value: 'idle' },
                    { label: 'Выполняется', value: 'running' },
                    { label: 'Остановка', value: 'stopping' },
                    { label: 'Завершена', value: 'done' },
                    { label: 'Ошибка', value: 'error' },
                ],
                label: 'Статус',
                admin: { readOnly: true },
            },
            {
                name: 'requested_action',
                type: 'select',
                required: false,
                label: 'Запрошенное действие',
                options: [
                    { label: 'Старт', value: 'start' },
                    { label: 'Стоп', value: 'stop' },
                ],
                admin: { readOnly: true, description: 'Команды из UI' },
            },
            {
                name: 'started_at',
                type: 'date',
                label: 'Начало последнего запуска',
                admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm:ss' } },
            },
            {
                name: 'finished_at',
                type: 'date',
                label: 'Конец последнего запуска',
                admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm:ss' } },
            },
            { name: 'progress_current', type: 'number', label: 'Прогресс (текущий)', admin: { readOnly: true } },
            { name: 'progress_total', type: 'number', label: 'Прогресс (всего)', admin: { readOnly: true } },
            { name: 'current_action', type: 'text', label: 'Текущее действие', admin: { readOnly: true } },
            { name: 'error_message', type: 'text', label: 'Сообщение об ошибке', admin: { readOnly: true } },
            { name: 'log_enabled', type: 'checkbox', defaultValue: false, label: 'Включить логи' },
            {
                name: 'log_level',
                type: 'select',
                defaultValue: 'info',
                options: [
                    { label: 'Info', value: 'info' },
                    { label: 'Debug', value: 'debug' },
                ],
                label: 'Уровень логов',
                admin: { condition: (_, siblingData) => siblingData?.log_enabled },
            },
            {
                name: 'log_requests',
                type: 'checkbox',
                defaultValue: false,
                label: 'Сохранять request/response',
                admin: { condition: (_, siblingData) => siblingData?.log_enabled },
            },
            {
                name: 'log_body',
                type: 'checkbox',
                defaultValue: false,
                label: 'Сохранять тела ответов',
                admin: { condition: (_, siblingData) => siblingData?.log_enabled },
            },
        ],
        hooks: {
            beforeChange: [
                ({ data, operation }) => {
                    const d = data;
                    if (!d)
                        return data;
                    if (d.type === 'one-time') {
                        d.next_run_at = null;
                        return data;
                    }
                    if (d.type === 'periodic' && Array.isArray(d.schedule_conditions) && d.schedule_conditions.length > 0) {
                        const firstRunDelay = getFirstRunDelayMinutes();
                        const startPoint = operation === 'create'
                            ? (() => {
                                const t = new Date();
                                t.setMinutes(t.getMinutes() + firstRunDelay);
                                return t;
                            })()
                            : d.finished_at
                                ? new Date(d.finished_at)
                                : (() => {
                                    const t = new Date();
                                    t.setMinutes(t.getMinutes() + firstRunDelay);
                                    return t;
                                })();
                        const conditions = d.schedule_conditions;
                        const next = calculateNextRunAt(startPoint, conditions);
                        d.next_run_at = next ? next.toISOString() : undefined;
                    }
                    return data;
                },
                ({ data }) => {
                    const d = data;
                    if (!d)
                        return data;
                    if (d.type === 'periodic' && (!d.schedule_conditions || d.schedule_conditions.length === 0)) {
                        throw new Error('Периодическая задача должна иметь хотя бы одно условие расписания');
                    }
                    if (d.type === 'periodic' && Array.isArray(d.schedule_conditions)) {
                        const result = validateScheduleConditions(d.schedule_conditions);
                        if (!result.valid) {
                            throw new Error(`Условие расписания #${result.conditionIndex + 1}: за 7 дней не найдено подходящее время`);
                        }
                    }
                    return data;
                },
            ],
            beforeDelete: [
                async ({ req, id }) => {
                    await req.payload.delete({
                        collection: 'task-logs',
                        where: { task: { equals: id } },
                        req,
                    });
                },
            ],
        },
    };
}
