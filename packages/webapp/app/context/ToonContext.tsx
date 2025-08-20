"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StoredToonData } from "../types";

type ToonContextType = {
  toons: StoredToonData[];
  addToon: (newToon: StoredToonData) => void;
  deleteToon: (toon: StoredToonData) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
};

export const MAX_TOONS = 12;
const LOCAL_STORAGE_KEY = "toonData";
const ACTIVE_KEY = "activeIndex";

const ToonContext = createContext<ToonContextType | undefined>(undefined);

export const ToonProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // load from localStorage initially
  const [toons, setToons] = useState<StoredToonData[]>([]);
  const [activeIndex, setIndex] = useState<number>(0);

  // run once on the client-side after the initial render
  useEffect(() => {
    const storedIndex = localStorage.getItem(ACTIVE_KEY);
    if (storedIndex) {
      setIndex(parseInt(storedIndex, 10));
    }
  }, []);

  // sync `toons` to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toons));
  }, [toons]);

  const setActiveIndex = (index: number) => {
    setIndex(index);
    localStorage.setItem(ACTIVE_KEY, index.toString());
  };

  const addToon = (newToon: StoredToonData) => {
    const sanitized: StoredToonData = JSON.parse(
      sanitize(JSON.stringify(newToon))
    );

    setToons((prevToons) => {
      let newToons = [...prevToons];

      const existingIndex = newToons.findIndex(
        (toon) => toon?.data?.data.toon.id === sanitized?.data?.data.toon?.id
      );

      if (existingIndex !== -1) {
        // toon exists
        newToons[existingIndex] = sanitized;
      } else if (newToons.length < MAX_TOONS) {
        // toon doesnt exist; add to end
        newToons.push(sanitized);
      } else {
        // toon doesnt exist but we're at max capacity; replace the oldest unlocked toon
        newToons = newToons.sort((a, b) => a.timestamp - b.timestamp);
        const oldest = newToons.findIndex((toon) => !toon.locked);
        if (oldest !== -1) {
          newToons[oldest] = sanitized;
        } else {
          console.warn("All toons are locked. Cannot add a new toon.");
          return prevToons;
        }
      }

      return newToons;
    });
  };

  const deleteToon = (toon: StoredToonData) => {
    setToons((prevToons) => {
      const newToons = prevToons.filter(
        (t) => t?.data?.data.toon.id !== toon?.data?.data.toon.id
      );
      return newToons;
    });
  };

  // keep activeIndex within bounds when toons change
  useEffect(() => {
    if (activeIndex >= toons.length && toons.length > 0) {
      setActiveIndex(toons.length - 1);
    }
  }, [toons, activeIndex]);

  const value = useMemo(
    () => ({
      toons,
      addToon,
      deleteToon,
      activeIndex,
      setActiveIndex,
    }),
    [toons, activeIndex]
  );

  return <ToonContext.Provider value={value}>{children}</ToonContext.Provider>;
};

export const useToonContext = () => {
  const context = useContext(ToonContext);
  if (!context) {
    throw new Error("useToonContext must be used within a ToonProvider");
  }
  return context;
};

// sanitize JSON to remove invalid Unicode characters
const sanitize = (data: string) => {
  let obj = JSON.parse(data);
  let cleaned = JSON.stringify(obj);
  return cleaned.replace(/\\u[0-9a-fA-F]{4}/g, "");
};
