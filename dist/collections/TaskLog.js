export const TaskLogs = {
    slug: 'task-logs',
    admin: {
        useAsTitle: 'message',
        defaultColumns: ['created_at', 'level', 'message'],
        description: 'Логи последнего запуска задачи. При новом запуске старые удаляются.',
    },
    access: {
        read: () => true,
        create: () => false,
        update: () => false,
        delete: () => true,
    },
    fields: [
        {
            name: 'task',
            type: 'relationship',
            relationTo: 'tasks',
            required: true,
            label: 'Задача',
            admin: { readOnly: true },
        },
        {
            name: 'created_at',
            type: 'date',
            required: true,
            label: 'Время',
            admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
        {
            name: 'level',
            type: 'select',
            required: true,
            options: [
                { label: 'Info', value: 'info' },
                { label: 'Warn', value: 'warn' },
                { label: 'Error', value: 'error' },
                { label: 'Debug', value: 'debug' },
            ],
            label: 'Уровень',
        },
        {
            name: 'message',
            type: 'text',
            required: true,
            label: 'Сообщение',
        },
        {
            name: 'payload',
            type: 'json',
            label: 'Данные',
            admin: { description: 'Request, response и т.д.' },
        },
    ],
    timestamps: false,
};
