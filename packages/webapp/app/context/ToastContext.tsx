import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import Toast from '@/app/components/Toast'
import { useInvasionNotifications } from '../components/Home/tabs/components/useInvasionNotifications'
import { useRewardNotifications } from '../components/Home/tabs/components/useRewardNotifications'
import { NotificationSettings } from '../utils/notificationUtils'

interface ToastContextType {
  triggerToast: (message: string, options?: { children?: React.ReactNode }) => void
}

const ToastContext = createContext<ToastContextType>({
  triggerToast: () => undefined
})

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [customContent, setCustomContent] = useState<React.ReactNode>(undefined)

  const triggerToast = useCallback((msg: string, options?: { children?: React.ReactNode }) => {
    setMessage(msg)
    setCustomContent(options?.children)
    setShow(true)
  }, [])

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      {children}
      <Toast message={message} show={show} onClose={() => setShow(false)}>
        {customContent}
      </Toast>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

export function NotificationToastWrapper({
  notifSettings,
  children
}: {
  notifSettings: NotificationSettings
  children: ReactNode
}) {
  const { toast: invToast } = useInvasionNotifications(notifSettings)
  const { toast: rewToast } = useRewardNotifications(notifSettings)
  return (
    <>
      {children}
      {invToast}
      {rewToast}
    </>
  )
}
