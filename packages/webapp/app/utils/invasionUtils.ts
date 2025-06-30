import { useState, useEffect } from "react";
import { cogImages } from "@/assets/cog_images";
import type { StaticImageData } from "next/image";

const cogsData = require("@/data/cogs.json");

// Helper to sanitize cog names
export function sanitizeCogName(name: string) {
  return name.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
}

// Advanced: Find relevant invasions for user's tasks using cog dictionary
export function getRelevantInvasionsForTasks(
  tasks: import("@/app/types").Task[],
  invasions: { cog: string; [key: string]: any }[]
) {
  // Filter out completed tasks
  const incompleteTasks = tasks.filter((task) => {
    // Check if the task has progress tracking
    if (
      task.objective?.progress &&
      typeof task.objective.progress.current === "number" &&
      typeof task.objective.progress.target === "number"
    ) {
      // Only include tasks that aren't complete
      return task.objective.progress.current < task.objective.progress.target;
    }
    // If there's no progress tracking, include the task by default
    return true;
  });

  return invasions.filter((invasion) => {
    const invasionNorm = normalize(invasion.cog);
    // Try to resolve invasion cog to canonical name
    const invasionKey = cogNameMap[invasionNorm] || invasionNorm;
    return incompleteTasks.some((task) => {
      const objText = task.objective.text || "";
      // Check if any cog variant is in the task text
      return Object.keys(cogNameMap).some((variant) => {
        return (
          cogNameMap[variant] === invasionKey &&
          normalize(objText).includes(variant)
        );
      });
    });
  });
}

// Utility: Normalize a string for matching

function normalize(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 &]/g, "")
    .trim();
}

// Utility: Get all possible names/aliases/plurals for each cog
function getCogNameVariants(cog: any) {
  const names = [cog.name];
  if (cog.fullname) names.push(cog.fullname);
  // Add plural forms (simple heuristic)
  names.forEach((n) => {
    // edge case of Movers & Shakers instead of just Mover & Shakers
    if (n.startsWith("Mover")) n = n.replace("Mover", "Movers");
    // edge case of ...Man -> ...Men
    if (n.startsWith("Yes")) n = n.replace("man", "men");
    if (!n.endsWith("s")) names.push(n + "s");
  });
  return names.map(normalize);
}

// Build a map of all cog name variants to canonical cog name
export const cogNameMap: Record<string, string> = {};
for (const cog of cogsData) {
  for (const variant of getCogNameVariants(cog)) {
    cogNameMap[variant] = cog.name;
  }
}

// Helper: Get image path for a cog name
export function getCogImage(cogName: string): StaticImageData | undefined {
  const norm = normalize(cogName);
  const canonical = cogNameMap[norm] || norm;
  const cog = cogsData.find(
    (c: any) => c.name === canonical || c.fullname === canonical
  );
  if (!cog || !cog.image) return undefined;
  const match = cog.image.match(/cog_images\/(.*)\.webp$/);
  const key = match ? match[1] : undefined;
  return key ? cogImages[key as keyof typeof cogImages] : undefined;
}

// Invasion Notification Helpers

export const NOTIFICATION_KEYS = {
  notificationsEnabled: "tasksTabNotifications",
  toastEnabled: "tasksTabToastEnabled",
  soundEnabled: "tasksTabSoundEnabled",
  toastPersistent: "tasksTabToastPersistent",
  soundRepeat: "tasksTabSoundRepeat",
  soundRepeatInterval: "tasksTabSoundRepeatInterval",
  nativeNotifEnabled: "tasksTabNativeNotifEnabled",
};

export type NotificationSettings = {
  notificationsEnabled: boolean;
  toastEnabled: boolean;
  soundEnabled: boolean;
  toastPersistent: boolean;
  soundRepeat: number;
  soundRepeatInterval: number;
  nativeNotifEnabled: boolean;
};

export const getNotificationSettings = (): NotificationSettings => ({
  notificationsEnabled:
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem(NOTIFICATION_KEYS.notificationsEnabled) ||
            "false"
        )
      : false,
  toastEnabled:
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem(NOTIFICATION_KEYS.toastEnabled) || "true"
        )
      : true,
  soundEnabled:
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem(NOTIFICATION_KEYS.soundEnabled) || "true"
        )
      : true,
  toastPersistent:
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem(NOTIFICATION_KEYS.toastPersistent) || "false"
        )
      : false,
  soundRepeat:
    typeof window !== "undefined"
      ? parseInt(localStorage.getItem(NOTIFICATION_KEYS.soundRepeat) || "1", 10)
      : 1,
  soundRepeatInterval:
    typeof window !== "undefined"
      ? parseInt(
          localStorage.getItem(NOTIFICATION_KEYS.soundRepeatInterval) || "10",
          10
        )
      : 10,
  nativeNotifEnabled:
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem(NOTIFICATION_KEYS.nativeNotifEnabled) || "false"
        )
      : false,
});

export const setNotificationSettings = (
  settings: Partial<NotificationSettings>
) => {
  if (typeof window === "undefined") return;
  if (settings.notificationsEnabled !== undefined)
    localStorage.setItem(
      NOTIFICATION_KEYS.notificationsEnabled,
      JSON.stringify(settings.notificationsEnabled)
    );
  if (settings.toastEnabled !== undefined)
    localStorage.setItem(
      NOTIFICATION_KEYS.toastEnabled,
      JSON.stringify(settings.toastEnabled)
    );
  if (settings.soundEnabled !== undefined)
    localStorage.setItem(
      NOTIFICATION_KEYS.soundEnabled,
      JSON.stringify(settings.soundEnabled)
    );
  if (settings.toastPersistent !== undefined)
    localStorage.setItem(
      NOTIFICATION_KEYS.toastPersistent,
      JSON.stringify(settings.toastPersistent)
    );
  if (settings.soundRepeat !== undefined)
    localStorage.setItem(
      NOTIFICATION_KEYS.soundRepeat,
      settings.soundRepeat.toString()
    );
  if (settings.soundRepeatInterval !== undefined)
    localStorage.setItem(
      NOTIFICATION_KEYS.soundRepeatInterval,
      settings.soundRepeatInterval.toString()
    );
  if (settings.nativeNotifEnabled !== undefined)
    localStorage.setItem(
      NOTIFICATION_KEYS.nativeNotifEnabled,
      JSON.stringify(settings.nativeNotifEnabled)
    );
};

// Polling workaround for instant settings sync
export function useNotificationSettingsPoll(intervalMs = 1000) {
  const [notifSettings, setNotifSettings] = useState(getNotificationSettings());
  useEffect(() => {
    let prev = JSON.stringify(notifSettings);
    const interval = setInterval(() => {
      const next = getNotificationSettings();
      const nextStr = JSON.stringify(next);
      if (nextStr !== prev) {
        setNotifSettings(next);
        prev = nextStr;
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, []);
  return notifSettings;
}
