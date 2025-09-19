import Banner from "@/app/components/Banner";
import { useState } from "react";

const API_LINK = process.env.NEXT_PUBLIC_API_HTTP;

interface EventBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const EventBanner: React.FC<EventBannerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [msg, setMsg] = useState<string>("");

  const getCavalcade = async () => {
    try {
      const response = await fetch(API_LINK + "/utility/get-cavalcade", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        onClose();
        return;
      }
      const data = await response.json();
      if (data.status == null || data.status == "inactive") {
        onClose();
      }

      setMsg(data.message);
    } catch (error) {
      console.error("Failed to fetch cavalcade data:", error);
      onClose();
      return;
    }
  };

  if (isOpen && !msg) {
    getCavalcade();
  }

  return (
    <Banner
      isOpen={isOpen}
      onClose={onClose}
      msg={msg}
      className={`bg-blue-300`}
    />
  );
};

export default EventBanner;
