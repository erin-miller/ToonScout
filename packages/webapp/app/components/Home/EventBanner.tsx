import Banner from "@/app/components/Banner";

const carnivalEnums = {
  INACTIVE: "inactive", // Holiday not running
  RECHARGING: "recharging", // Holiday is running, but the parade isn't scheduled/running
  IN_TRANSIT: "in-transit", // Parade is scheduled but not running
  ACTIVE: "active", // Parade is running
};
interface EventBannerProps {
  isOpen: boolean;
  onClose: () => void;
  msg: string;
  timestamp: string;
  status: string;
}

const EventBanner: React.FC<EventBannerProps> = ({
  isOpen,
  onClose,
  msg,
  timestamp,
  status,
}) => {
  const localTime = new Date(parseInt(timestamp) * 1000).toLocaleTimeString(
    [],
    { hour: "numeric", minute: "2-digit", hour12: true }
  );

  if (status == carnivalEnums.RECHARGING) {
    msg = msg + ` come back at ${localTime} to find out the next location!`;
  }

  if (status == carnivalEnums.IN_TRANSIT) {
    msg = msg + ` starting at ${localTime}!`;
  }

  if (!isOpen) return null;
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
