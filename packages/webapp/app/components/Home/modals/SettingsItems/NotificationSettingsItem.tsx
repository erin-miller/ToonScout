import React, { useEffect, useState } from "react";
import SettingsItem from "./SettingsItem";
import {
  getNotificationSettings,
  setNotificationSettings,
} from "@/app/utils/notificationUtils";

const NotificationSettingsItem: React.FC = () => {
  // Notification settings state
  const initialSettings = getNotificationSettings();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    initialSettings.notificationsEnabled
  );
  const [toastEnabled, setToastEnabled] = useState(
    initialSettings.toastEnabled
  );
  const [soundEnabled, setSoundEnabled] = useState(
    initialSettings.soundEnabled
  );
  const [toastPersistent, setToastPersistent] = useState(
    initialSettings.toastPersistent
  );
  const [soundRepeat, setSoundRepeat] = useState(initialSettings.soundRepeat);
  const [soundRepeatInterval, setSoundRepeatInterval] = useState(
    initialSettings.soundRepeatInterval
  );
  const [nativeNotifEnabled, setNativeNotifEnabled] = useState(
    initialSettings.nativeNotifEnabled
  );

  useEffect(() => {
    setNotificationSettings({
      notificationsEnabled,
      toastEnabled,
      soundEnabled,
      toastPersistent,
      soundRepeat,
      soundRepeatInterval,
      nativeNotifEnabled,
    });
  }, [
    notificationsEnabled,
    toastEnabled,
    soundEnabled,
    toastPersistent,
    soundRepeat,
    soundRepeatInterval,
    nativeNotifEnabled,
  ]);

  // Request browser notification permission if enabled
  useEffect(() => {
    if (
      nativeNotifEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [nativeNotifEnabled]);

  return (
    <SettingsItem label="">
      <div className="flex flex-col gap-1 text-lg">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="popupEnabled"
            checked={toastEnabled}
            onChange={(e) => setToastEnabled(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label
            className="cursor-pointer hover:text-blue-600"
            htmlFor="popupEnabled"
          >
            Popup
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="soundEnabled"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label
            className="cursor-pointer hover:text-blue-600"
            htmlFor="soundEnabled"
          >
            Sound
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="toastPersistent"
            checked={toastPersistent}
            onChange={(e) => setToastPersistent(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label
            className="cursor-pointer hover:text-blue-600"
            htmlFor="toastPersistent"
          >
            Popup requires manual dismiss (X)
          </label>
        </div>

        <label>
          Sound:
          <select
            value={soundRepeat}
            onChange={(e) => setSoundRepeat(Number(e.target.value))}
            className="ml-2 px-1 rounded bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
          >
            <option value={1}>Once</option>
            <option value={3}>Repeat 3 times</option>
            <option value={5}>Repeat 5 times</option>
            <option value={-1}>Repeat every X seconds</option>
          </select>
          {soundRepeat === -1 && (
            <p>
              X:
              <input
                type="number"
                min={2}
                max={60}
                value={soundRepeatInterval}
                onChange={(e) => setSoundRepeatInterval(Number(e.target.value))}
                className="ml-2 px-1 rounded bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
              />
            </p>
          )}
        </label>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="nativeNotifEnabled"
            checked={nativeNotifEnabled}
            onChange={(e) => setNativeNotifEnabled(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label
            className="cursor-pointer hover:text-blue-600"
            htmlFor="nativeNotifEnabled"
          >
            Enable browser notifications
          </label>
        </div>
      </div>
    </SettingsItem>
  );
};

export default NotificationSettingsItem;
