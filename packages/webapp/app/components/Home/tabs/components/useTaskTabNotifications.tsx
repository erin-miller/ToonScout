import { getNotificationSettings, setNotificationSettings } from '@/app/utils/notificationUtils'
import { useState, useEffect } from 'react'

export function useTaskTabNotifications() {
  // Use utility to initialize all notification settings
  const initial = getNotificationSettings()
  const [notificationsEnabled, setNotificationsEnabled] = useState(initial.notificationsEnabled)
  const [toastEnabled, setToastEnabled] = useState(initial.toastEnabled)
  const [soundEnabled, setSoundEnabled] = useState(initial.soundEnabled)
  const [toastPersistent, setToastPersistent] = useState(initial.toastPersistent)
  const [soundRepeat, setSoundRepeat] = useState(initial.soundRepeat)
  const [soundRepeatInterval, setSoundRepeatInterval] = useState(initial.soundRepeatInterval)
  const [nativeNotifEnabled, setNativeNotifEnabled] = useState(initial.nativeNotifEnabled)

  useEffect(() => {
    setNotificationSettings({
      notificationsEnabled,
      toastEnabled,
      soundEnabled,
      toastPersistent,
      soundRepeat,
      soundRepeatInterval,
      nativeNotifEnabled
    })
  }, [
    notificationsEnabled,
    toastEnabled,
    soundEnabled,
    toastPersistent,
    soundRepeat,
    soundRepeatInterval,
    nativeNotifEnabled
  ])

  return {
    notificationsEnabled,
    setNotificationsEnabled,
    toastEnabled,
    setToastEnabled,
    soundEnabled,
    setSoundEnabled,
    toastPersistent,
    setToastPersistent,
    soundRepeat,
    setSoundRepeat,
    soundRepeatInterval,
    setSoundRepeatInterval,
    nativeNotifEnabled,
    setNativeNotifEnabled
  }
}
