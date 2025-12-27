"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

const API_LINK = process.env.NEXT_PUBLIC_API_HTTP;

type EventContextType = {
  isEventBannerOpen: boolean;
  eventMsg: string;
  eventTimestamp: string;
  eventStatus: string;
  donations: number;
  closeEventBanner: () => void;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isEventBannerOpen, setIsEventBannerOpen] = useState(false);
  const [eventMsg, setEventMsg] = useState("");
  const [eventTimestamp, setEventTimestamp] = useState("");
  const [eventStatus, setEventStatus] = useState("inactive");
  const [donations, setDonations] = useState(0);

  useEffect(() => {
    const checkEventStatus = () => {
      fetch(API_LINK + "/utility/get-cavalcade", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            return false;
          }
          return response.json();
        })
        .then((data) => {
          if (data.status && data.status !== "inactive") {
            setIsEventBannerOpen(true);
            setEventMsg(data.message);
            setEventTimestamp(data.timestamp);
            setEventStatus(data.status);
          }
        })
        .catch((error) => {
          console.error("Error checking event status:", error);
        });

      if (eventStatus !== "inactive") {
        fetch("https://toontownrewritten.com/api/riggydonations")
          .then((response) => {
            if (!response.ok) {
              return false;
            }
            return response.json();
          })
          .then((data) => {
            setDonations(data.tokensDonated);
          });
      }
    };

    checkEventStatus();
    const interval = setInterval(checkEventStatus, 15000);

    return () => clearInterval(interval);
  }, [eventStatus]);

  const closeEventBanner = () => {
    setIsEventBannerOpen(false);
  };

  return (
    <EventContext.Provider
      value={{
        isEventBannerOpen,
        eventMsg,
        eventTimestamp,
        eventStatus,
        donations,
        closeEventBanner,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
};
