"use client";
import React, { useEffect } from "react";
import "/styles/fonts.css";
import Home from "./components/Home/Home";
import { initWebSocket } from "./api/LocalWebSocket";
import { initScoutWebSocket, sendScoutData } from "./api/ScoutWebSocket";
import { useConnectionContext } from "./context/ConnectionContext";
import { useDiscordContext } from "./context/DiscordContext";
import { useToonContext } from "./context/ToonContext";
import { isMobile, isSafari } from "react-device-detect";
import Incompatible from "./components/Incompatible";
import { StoredToonData } from "./types";
import { useActivePortsContext } from "./context/ActivePortsContext";

const HomePage: React.FC = () => {
  const { setIsConnected } = useConnectionContext();
  const { activeIndex, toons, addToon } = useToonContext();
  const { addPort, removePort } = useActivePortsContext();
  const { userId } = useDiscordContext();

  const toon = toons[activeIndex] ?? null;

  useEffect(() => {
    initWebSocket(setIsConnected, addPort, removePort, addToon);
    initScoutWebSocket();

    const existingToons = localStorage.getItem("toonData");
    if (existingToons) {
      try {
        const data = JSON.parse(existingToons);
        data.forEach((toon: StoredToonData) => addToon(toon));
      } catch (error) {
        console.error("Error parsing existing toon data:", error);
        console.log("Resetting corrupt toon data...");
        localStorage.removeItem("toonData");
      }
    }

    if (toons.length > 0) {
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    if (userId && activeIndex !== undefined) {
      sendScoutData(userId, toons[activeIndex]?.data);
    }
  }, [toon?.data, activeIndex, userId]);

  return (
    <div className="page-container">
      {isMobile || isSafari ? <Incompatible /> : <Home />}
    </div>
  );
};

export default HomePage;
