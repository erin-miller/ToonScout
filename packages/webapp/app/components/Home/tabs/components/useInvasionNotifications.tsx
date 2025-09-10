"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useInvasionContext } from "@/app/context/InvasionContext";
import { useToonContext } from "@/app/context/ToonContext";
import {
  getRelevantInvasionsForTasks,
  sanitizeCogName,
  getCogImage,
} from "@/app/utils/invasionUtils";
import InvasionToast from "@/app/components/InvasionToast";
import type { StaticImageData } from "next/image";
import {
  playNotificationSound,
  showNativeNotification,
} from "@/app/utils/notificationUtils";

export function useInvasionNotifications({
  notificationsEnabled,
  toastEnabled,
  soundEnabled,
  toastPersistent,
  soundRepeat,
  soundRepeatInterval,
  nativeNotifEnabled,
}: {
  notificationsEnabled: boolean;
  toastEnabled: boolean;
  soundEnabled: boolean;
  toastPersistent: boolean;
  soundRepeat: number;
  soundRepeatInterval: number;
  nativeNotifEnabled: boolean;
}) {
  const { invasions } = useInvasionContext();
  const { toons, activeIndex } = useToonContext();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [cogIcon, setCogIcon] = useState<StaticImageData | undefined>(
    undefined,
  );
  const prevRelevantKeys = useRef<string[]>([]);
  const [dismissedCogs, setDismissedCogs] = useState<string[]>([]);
  const [activeCogs, setActiveCogs] = useState<string[]>([]);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: clear sound interval
  const clearSoundInterval = useCallback(() => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  }, []);

  // Centralized notification logic
  const handleNotification = useCallback(
    (
      msg: string,
      cogs: string[],
      options: {
        playSound?: boolean;
        repeat?: number;
        interval?: number;
        showToast?: boolean;
        nativeNotif?: boolean;
      },
    ) => {
      if (options.showToast) {
        setToastMsg(msg);
        setCogIcon(cogs.length === 1 ? getCogImage(cogs[0]) : undefined);
        setShowToast(true);
      }
      if (options.playSound && options.repeat && options.repeat > 0) {
        playNotificationSound(options.repeat, options.interval || 1);
      }
      if (options.nativeNotif) {
        showNativeNotification("ToonScout Invasion Alert", msg);
      }
    },
    [],
  );

  // Listen for custom invasion notification events (works across all tabs)
  useEffect(() => {
    const handleInvasionNotification = (event: CustomEvent) => {
      if (!notificationsEnabled) return;
      const {
        message,
        invasions: eventInvasions,
        showToast,
        playSound,
      } = event.detail;
      let cogs: string[] = [];
      if (Array.isArray(eventInvasions) && eventInvasions.length > 0) {
        cogs = eventInvasions.map((i: any) => sanitizeCogName(i.cog));
      }
      handleNotification(message, cogs, {
        showToast,
        playSound,
        repeat: soundRepeat,
        interval: soundRepeatInterval,
        nativeNotif: nativeNotifEnabled,
      });
    };
    window.addEventListener(
      "invasionNotification",
      handleInvasionNotification as EventListener,
    );
    return () =>
      window.removeEventListener(
        "invasionNotification",
        handleInvasionNotification as EventListener,
      );
  }, [
    notificationsEnabled,
    handleNotification,
    soundRepeat,
    soundRepeatInterval,
    nativeNotifEnabled,
  ]);

  // Effect: handle relevant invasions and notifications
  useEffect(() => {
    if (!notificationsEnabled || !toons[activeIndex]) {
      clearSoundInterval();
      return;
    }
    const tasks = toons[activeIndex].data.data.tasks;
    const relevant = getRelevantInvasionsForTasks(tasks, invasions);
    const relevantKeys = relevant.map(
      (i) => `${sanitizeCogName(i.cog)}|${i.district}`,
    );
    setActiveCogs(relevant.map((i) => sanitizeCogName(i.cog)));
    // Find new relevant invasions (not previously active or dismissed)
    const newKeys = relevantKeys.filter(
      (key) =>
        !prevRelevantKeys.current.includes(key) &&
        !dismissedCogs.includes(key.split("|")[0]),
    );
    const newCogDistricts = newKeys.map((key) => {
      const [cog, district] = key.split("|");
      return `${cog} in ${district}`;
    });
    // Sound repeat every X seconds while invasion is present
    if (soundEnabled && soundRepeat === -1 && relevantKeys.length > 0) {
      if (!soundIntervalRef.current) {
        soundIntervalRef.current = setInterval(() => {
          playNotificationSound(1, 1);
        }, soundRepeatInterval * 1000);
        playNotificationSound(1, 1);
      }
    } else {
      clearSoundInterval();
    }
    if (newKeys.length > 0) {
      handleNotification(
        `Relevant invasion: ${newCogDistricts.join(", ")}`,
        newKeys.map((key) => key.split("|")[0]),
        {
          showToast: toastEnabled,
          playSound: soundEnabled && soundRepeat !== -1,
          repeat: soundRepeat,
          interval: soundRepeatInterval,
          nativeNotif: nativeNotifEnabled,
        },
      );
    }
    // If a relevant invasion is no longer present, clear toast and sound
    const goneKeys = prevRelevantKeys.current.filter(
      (key) => !relevantKeys.includes(key),
    );
    if (goneKeys.length > 0 || relevantKeys.length === 0) {
      setShowToast(false);
      clearSoundInterval();
      setDismissedCogs((prev) =>
        prev.filter(
          (cog) => !goneKeys.some((key) => key.startsWith(cog + "|")),
        ),
      );
    }
    prevRelevantKeys.current = relevantKeys;
  }, [
    invasions,
    toons,
    activeIndex,
    notificationsEnabled,
    toastEnabled,
    soundEnabled,
    soundRepeat,
    soundRepeatInterval,
    nativeNotifEnabled,
    toastPersistent,
    // intentionally omitting dismissedCogs, clearSoundInterval, handleNotification
  ]);

  // Manual dismiss handler for toast
  const handleToastDismiss = useCallback(() => {
    setShowToast(false);
    setDismissedCogs((prev) => Array.from(new Set([...prev, ...activeCogs])));
    clearSoundInterval();
  }, [activeCogs, clearSoundInterval]);

  const toast = (
    <InvasionToast
      message={toastMsg}
      show={showToast}
      onClose={handleToastDismiss}
      persistent={toastPersistent || true}
      cogIcon={cogIcon}
    />
  );
  return { toast };
}
