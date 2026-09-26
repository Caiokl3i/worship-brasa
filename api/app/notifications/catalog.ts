export const NOTIFICATION_TYPES = [
  'schedule_added',
  'schedule_removed',
  'schedule_changed',
  'schedule_cancelled',
  'reminder_5d',
  'reminder_1d',
  'reminder_2h',
  'join_requested',
  'join_approved',
  'join_rejected',
  'notice',
  'chat_ministry',
  'chat_schedule',
  'birthday',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const REMINDER_TYPES = ['reminder_5d', 'reminder_1d', 'reminder_2h'] as const

export type ReminderType = (typeof REMINDER_TYPES)[number]

export function isReminder(type: NotificationType): type is ReminderType {
  return (REMINDER_TYPES as readonly string[]).includes(type)
}

type PreferenceDefault = {
  inApp: boolean
  email: boolean
  label: string
  group: 'escala' | 'ministerio'
}

export const NOTIFICATION_DEFAULTS: Record<NotificationType, PreferenceDefault> = {
  schedule_added: { inApp: true, email: true, label: 'Adicionado a uma escala', group: 'escala' },
  schedule_removed: { inApp: true, email: true, label: 'Removido de uma escala', group: 'escala' },
  schedule_changed: { inApp: true, email: true, label: 'Escala alterada', group: 'escala' },
  schedule_cancelled: { inApp: true, email: true, label: 'Escala cancelada', group: 'escala' },
  reminder_5d: { inApp: true, email: true, label: 'Lembrete de 5 dias', group: 'escala' },
  reminder_1d: { inApp: true, email: true, label: 'Lembrete de 1 dia', group: 'escala' },
  reminder_2h: { inApp: true, email: true, label: 'Lembrete de 2 horas', group: 'escala' },
  join_requested: { inApp: true, email: true, label: 'Pedido de entrada', group: 'ministerio' },
  join_approved: { inApp: true, email: true, label: 'Entrada aprovada', group: 'ministerio' },
  join_rejected: { inApp: true, email: true, label: 'Entrada rejeitada', group: 'ministerio' },
  notice: { inApp: false, email: false, label: 'Aviso do ministério', group: 'ministerio' },
  chat_ministry: {
    inApp: false,
    email: false,
    label: 'Mensagem no chat do ministério',
    group: 'ministerio',
  },
  chat_schedule: {
    inApp: false,
    email: false,
    label: 'Mensagem no chat da escala',
    group: 'ministerio',
  },
  birthday: {
    inApp: true,
    email: false,
    label: 'Aniversariantes do dia',
    group: 'ministerio',
  },
}

export const REMINDER_BODIES: Record<ReminderType, string> = {
  reminder_5d: '5 dias antes',
  reminder_1d: '1 dia antes',
  reminder_2h: '2 horas antes',
}
