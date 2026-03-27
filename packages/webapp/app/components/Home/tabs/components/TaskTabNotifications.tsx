import React, { useState, useEffect } from 'react'
import { FaBell, FaBellSlash, FaCog } from 'react-icons/fa'
import NotificationSettingsModal from '../../modals/NotificationSettingsModal'
import { useTaskTabNotifications } from './useTaskTabNotifications'

const TaskTabNotifications: React.FC = () => {
  const {
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
  } = useTaskTabNotifications()
  const [showSettings, setShowSettings] = useState(false)
  const tooltip = 'Receive invasion alerts for matching tasks if enabled.'

  useEffect(() => {
    if (nativeNotifEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [nativeNotifEnabled])

  return (
    <>
      <div className="flex justify-end items-center mb-2 relative z-20">
        <div className="relative px-2 group">
          <span className="border-4 border-pink-900 dark:border-pink-100 rounded-full w-6 h-6 flex items-center justify-center text-base">
            ?
          </span>
          <div className="hidden group-hover:block absolute text-base bg-white border border-gray-700 text-gray-900 p-2 transform -translate-x-[90%] ml-2 w-64 text-center">
            {tooltip}
          </div>
        </div>
        <button
          className="text-2xl p-2 focus:outline-none"
          title={notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
          onClick={() => {
            setNotificationsEnabled(prev => !prev)
          }}
        >
          {notificationsEnabled ? (
            <FaBell className="text-orange-500 dark:text-yellow-400" />
          ) : (
            <FaBellSlash className="text-gray-900 dark:text-gray-400" />
          )}
        </button>
        <button
          className="text-2xl p-2 focus:outline-none"
          title="Notification Settings"
          onClick={() => setShowSettings(true)}
        >
          <FaCog />
        </button>
      </div>
      <NotificationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        toastEnabled={toastEnabled}
        setToastEnabled={setToastEnabled}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        toastPersistent={toastPersistent}
        setToastPersistent={setToastPersistent}
        soundRepeat={soundRepeat}
        setSoundRepeat={setSoundRepeat}
        soundRepeatInterval={soundRepeatInterval}
        setSoundRepeatInterval={setSoundRepeatInterval}
        nativeNotifEnabled={nativeNotifEnabled}
        setNativeNotifEnabled={setNativeNotifEnabled}
      />
    </>
  )
}

export default TaskTabNotifications
