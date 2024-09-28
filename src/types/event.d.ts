export type EventData = {
  name: 'create-token'
  message?: string
  progress?: number
  data?: any
  type?: 'error' | 'info' | 'success'
}

export type SendEvent = (eventData: Omit<EventData, 'name'>) => void