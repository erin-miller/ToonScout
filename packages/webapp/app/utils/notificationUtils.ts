import { useEffect, useState } from 'react'

export function playNotificationSound(repeat: number, interval: number) {
  let played = 0
  const playAudio = () => {
    const audio = new Audio('/sounds/notify.mp3')
    audio.play().catch()
    played++
    if (played < repeat) {
      setTimeout(playAudio, interval * 1000)
    }
  }
  playAudio()
}

export function showNativeNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

export const NOTIFICATION_KEYS = {
  notificationsEnabled: 'tasksTabNotifications',
  toastEnabled: 'tasksTabToastEnabled',
  soundEnabled: 'tasksTabSoundEnabled',
  toastPersistent: 'tasksTabToastPersistent',
  soundRepeat: 'tasksTabSoundRepeat',
  soundRepeatInterval: 'tasksTabSoundRepeatInterval',
  nativeNotifEnabled: 'tasksTabNativeNotifEnabled'
}

export type NotificationSettings = {
  notificationsEnabled: boolean
  toastEnabled: boolean
  soundEnabled: boolean
  toastPersistent: boolean
  soundRepeat: number
  soundRepeatInterval: number
  nativeNotifEnabled: boolean
}

export const getNotificationSettings = (): NotificationSettings => ({
  notificationsEnabled:
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(NOTIFICATION_KEYS.notificationsEnabled) || 'false')
      : false,
  toastEnabled:
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(NOTIFICATION_KEYS.toastEnabled) || 'true') : true,
  soundEnabled:
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(NOTIFICATION_KEYS.soundEnabled) || 'true') : true,
  toastPersistent:
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(NOTIFICATION_KEYS.toastPersistent) || 'false')
      : false,
  soundRepeat:
    typeof window !== 'undefined' ? parseInt(localStorage.getItem(NOTIFICATION_KEYS.soundRepeat) || '1', 10) : 1,
  soundRepeatInterval:
    typeof window !== 'undefined'
      ? parseInt(localStorage.getItem(NOTIFICATION_KEYS.soundRepeatInterval) || '10', 10)
      : 10,
  nativeNotifEnabled:
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(NOTIFICATION_KEYS.nativeNotifEnabled) || 'false')
      : false
})

export const setNotificationSettings = (settings: Partial<NotificationSettings>) => {
  if (typeof window === 'undefined') return
  if (settings.notificationsEnabled !== undefined) {
    localStorage.setItem(NOTIFICATION_KEYS.notificationsEnabled, JSON.stringify(settings.notificationsEnabled))
  }
  if (settings.toastEnabled !== undefined) {
    localStorage.setItem(NOTIFICATION_KEYS.toastEnabled, JSON.stringify(settings.toastEnabled))
  }
  if (settings.soundEnabled !== undefined) {
    localStorage.setItem(NOTIFICATION_KEYS.soundEnabled, JSON.stringify(settings.soundEnabled))
  }
  if (settings.toastPersistent !== undefined) {
    localStorage.setItem(NOTIFICATION_KEYS.toastPersistent, JSON.stringify(settings.toastPersistent))
  }
  if (settings.soundRepeat !== undefined) {
    localStorage.setItem(NOTIFICATION_KEYS.soundRepeat, settings.soundRepeat.toString())
  }
  if (settings.soundRepeatInterval !== undefined) {
    localStorage.setItem(NOTIFICATION_KEYS.soundRepeatInterval, settings.soundRepeatInterval.toString())
  }
  if (settings.nativeNotifEnabled !== undefined) {
    localStorage.setItem(NOTIFICATION_KEYS.nativeNotifEnabled, JSON.stringify(settings.nativeNotifEnabled))
  }
}

// Polling workaround for instant settings sync
export function useNotificationSettingsPoll(intervalMs = 1000) {
  const [notifSettings, setNotifSettings] = useState(getNotificationSettings())
  useEffect(() => {
    let prev = JSON.stringify(notifSettings)
    const interval = setInterval(() => {
      const next = getNotificationSettings()
      const nextStr = JSON.stringify(next)
      if (nextStr !== prev) {
        setNotifSettings(next)
        prev = nextStr
      }
    }, intervalMs)
    return () => clearInterval(interval)
  }, [])
  return notifSettings
}
