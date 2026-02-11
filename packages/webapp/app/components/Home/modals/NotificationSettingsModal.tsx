import React from 'react'
import Modal from '../../Modal'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  toastEnabled: boolean
  setToastEnabled: (v: boolean) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  toastPersistent: boolean
  setToastPersistent: (v: boolean) => void
  soundRepeat: number
  setSoundRepeat: (v: number) => void
  soundRepeatInterval: number
  setSoundRepeatInterval: (v: number) => void
  nativeNotifEnabled: boolean
  setNativeNotifEnabled: (v: boolean) => void
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
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
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-3xl font-bold mb-4">Notification Settings</div>
      <div className="flex flex-col gap-4 text-lg">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="popupEnabled"
            checked={toastEnabled}
            onChange={e => setToastEnabled(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label className="cursor-pointer hover:text-blue-600" htmlFor="popupEnabled">
            Popup
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="soundEnabled"
            checked={soundEnabled}
            onChange={e => setSoundEnabled(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label className="cursor-pointer hover:text-blue-600" htmlFor="soundEnabled">
            Sound
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="toastPersistent"
            checked={toastPersistent}
            onChange={e => setToastPersistent(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label className="cursor-pointer hover:text-blue-600" htmlFor="toastPersistent">
            Popup requires manual dismiss (X)
          </label>
        </div>
        <label>
          Sound:
          <select
            value={soundRepeat}
            onChange={e => setSoundRepeat(Number(e.target.value))}
            className="ml-2 px-1 rounded bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
          >
            <option value={1}>Once</option>
            <option value={3}>Repeat 3 times</option>
            <option value={5}>Repeat 5 times</option>
            <option value={-1}>Repeat every X seconds while invasion is present</option>
          </select>
          {soundRepeat === -1 && (
            <>
              , every
              <input
                type="number"
                min={2}
                max={60}
                value={soundRepeatInterval}
                onChange={e => setSoundRepeatInterval(Number(e.target.value))}
                className="ml-2 w-12 px-1 rounded"
              />
              seconds while invasion is present
            </>
          )}
        </label>
        <label>
          <input
            type="checkbox"
            checked={nativeNotifEnabled}
            onChange={e => setNativeNotifEnabled(e.target.checked)}
            className="mr-1"
          />
          Enable browser notifications
        </label>
      </div>
    </Modal>
  )
}

export default NotificationSettingsModal
