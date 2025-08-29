import React, { useEffect, useState } from "react";
import Modal from "../../Modal";
import { StoredToonData } from "@/app/types";
import { useToonContext } from "@/app/context/ToonContext";
import {
  FaLock,
  FaUnlock,
  FaCog,
  FaTrash,
  FaBellSlash,
  FaBell,
} from "react-icons/fa";
import FishSettingsItem from "./SettingsItems/FishSettingsItem";
import GardenSettingsItem from "./SettingsItems/GardenSettingsItem";
import NotificationSettingsItem from "./SettingsItems/NotificationSettingsItem";
import { getNotificationSettings } from "@/app/utils/invasionUtils";

type SettingsModalProps = {
  toon: StoredToonData | null;
  index: number | null;
  isOpen: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  toon,
  index,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !toon || index == null) return null;
  const { toons, addToon, deleteToon } = useToonContext();

  // notifs
  const initialSettings = getNotificationSettings();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    initialSettings.notificationsEnabled
  );

  const toggleLock = (index: number) => {
    const toon = toons[index];
    toon.locked = !toon.locked;
    addToon(toon);
  };

  const getLockedStatus = (index: number) => {
    return toons[index]?.locked ?? false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="px-2 items-start justify-start text-left">
        <h3 className="text-3xl font-bold text-gray-900">
          {toon.data.data.toon.name}
        </h3>
        <div className="flex flex-col items-start gap-2 mb-4">
          {/* individual settings */}
          {/* lock */}
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 text-xl"
              onClick={() => toggleLock(index)}
            >
              {getLockedStatus(index) ? (
                <FaUnlock className="text-green-500 text-2xl" />
              ) : (
                <FaLock className="text-red-500 text-2xl" />
              )}
            </button>
            <span>
              Currently {getLockedStatus(index) ? "Unlocked" : "Locked"}
            </span>
          </div>

          {/* global settings */}
          <div className="grid md:grid-cols-2 md:space-x-6 mt-5">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 ">
                Tab Settings
              </h3>

              <FishSettingsItem />
              <GardenSettingsItem />
            </div>

            <div>
              <div className="flex flex-row gap-3">
                <h3 className="text-3xl font-bold text-gray-900">
                  Notifications
                </h3>
                {/* toggle */}
                <div className="flex">
                  <button
                    className="text-2xl focus:outline-none"
                    title={
                      notificationsEnabled
                        ? "Disable Notifications"
                        : "Enable Notifications"
                    }
                    onClick={() => setNotificationsEnabled((prev) => !prev)}
                  >
                    {notificationsEnabled ? (
                      <FaBell className="text-orange-500 dark:text-yellow-400" />
                    ) : (
                      <FaBellSlash className="text-gray-900 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <NotificationSettingsItem />
            </div>
          </div>
        </div>

        {/* deletion */}
        <div className="flex items-center justify-center text-red-800">
          <button
            className="flex items-center gap-2 text-xl bg-red-200 p-2 rounded hover:bg-red-300"
            onClick={() => {
              onClose();
              deleteToon(toon);
            }}
          >
            <FaTrash className="text-red-800" />
            <span>Delete Toon</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
