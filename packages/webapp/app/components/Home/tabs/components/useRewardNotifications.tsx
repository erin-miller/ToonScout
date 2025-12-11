"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToonContext } from "@/app/context/ToonContext";
import { Rewards } from "@/app/types";
import {
  playNotificationSound,
  showNativeNotification,
} from "@/app/utils/notificationUtils";
import Toast from "@/app/components/Toast";
import { getRewardSums } from "@/app/utils/rewardsUtils";

interface RewardNotificationSettings {
  notificationsEnabled: boolean;
  toastEnabled: boolean;
  soundEnabled: boolean;
  toastPersistent: boolean;
  nativeNotifEnabled: boolean;
}

export function useRewardNotifications({
  notificationsEnabled,
  toastEnabled,
  soundEnabled,
  toastPersistent,
  nativeNotifEnabled,
}: RewardNotificationSettings) {
  const { toons, activeIndex } = useToonContext();
  const activeToon = toons[activeIndex];
  const prevRewards = useRef<Rewards | null>(
    activeToon?.data.data.rewards || null
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Centralized notification logic
  const handleNotification = useCallback(
    (
      msg: string,
      options: {
        playSound?: boolean;
        repeat?: number;
        interval?: number;
        showToast?: boolean;
        nativeNotif?: boolean;
      }
    ) => {
      if (options.showToast) {
        setToastMsg(msg);
        setShowToast(true);
      }
      if (options.playSound && options.repeat && options.repeat > 0) {
        playNotificationSound(options.repeat, options.interval || 1);
      }
      if (options.nativeNotif) {
        showNativeNotification("ToonScout Reward Alert", msg);
      }
    },
    []
  );

  // Listen for reward notification events
  useEffect(() => {
    const handleRewardNotification = (event: CustomEvent) => {
      if (!notificationsEnabled) return;
      const { message, showToast, playSound } = event.detail;
      handleNotification(message, {
        showToast,
        playSound,
        nativeNotif: nativeNotifEnabled,
      });
    };
    window.addEventListener(
      "rewardNotification",
      handleRewardNotification as EventListener
    );
    return () =>
      window.removeEventListener(
        "rewardNotification",
        handleRewardNotification as EventListener
      );
  }, [notificationsEnabled, handleNotification, nativeNotifEnabled]);

  useEffect(() => {
    if (!notificationsEnabled || !activeToon) return;

    const rewards = activeToon.data.data.rewards;

    const checkRewardChanges = async () => {
      if (prevRewards.current) {
        const prevSums = await getRewardSums(prevRewards.current);
        const currSums = await getRewardSums(rewards);

        if (prevSums.sumUnites !== currSums.sumUnites) {
          const newUnite = uniteDiff(prevRewards.current, rewards);
          if (newUnite && newUnite.currAmount > newUnite.prevAmount) {
            handleNotification(`You've earned a ${newUnite.unite} unite!`, {
              showToast: toastEnabled,
              playSound: soundEnabled,
              nativeNotif: nativeNotifEnabled,
            });
          }
        }
      }

      prevRewards.current = rewards;
    };

    checkRewardChanges();
  }, [
    toons,
    activeIndex,
    notificationsEnabled,
    toastEnabled,
    soundEnabled,
    nativeNotifEnabled,
    toastPersistent,
  ]);

  const uniteDiff = (prevBase: Rewards, currBase: Rewards) => {
    const curr = currBase.unites;
    const prev = prevBase.unites;

    for (const category in curr) {
      if (prev && !prev[category as keyof typeof prev]) continue; // skip new categories if needed
      for (const unite in curr[category as keyof typeof curr]) {
        const prevAmount = prev
          ? prev[category as keyof typeof prev][unite] || 0
          : 0;
        const currAmount = curr[category as keyof typeof curr][unite] || 0;
        if (prevAmount !== currAmount) {
          return { category, unite, prevAmount, currAmount };
        }
      }
    }
    return null; // no changes
  };

  const toast = (
    <Toast
      message={toastMsg}
      show={showToast}
      onClose={() => setShowToast(false)}
      persistent={toastPersistent || true}
    />
  );
  return { toast };
}
