interface SystemBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SystemBannerType: { [key: string]: string } = {
  INFO: "bg-blue-300",
  WARNING: "bg-orange-300",
  ERROR: "bg-red-300",
};

const SystemBanner: React.FC<SystemBannerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const enabled = process.env.NEXT_PUBLIC_SYSTEM_BANNER_ENABLED;
  if (enabled !== "true") return null;

  const type = process.env.NEXT_PUBLIC_SYSTEM_BANNER_TYPE;
  if (!type) return null;

  const msg = process.env.NEXT_PUBLIC_SYSTEM_BANNER_MSG;
  if (!msg) return null;
  return (
    <div
      className={`w-full h-full py-0.3 px-6 flex items-center justify-center ${SystemBannerType[type]} flex-wrap`}
    >
      <button
        onClick={onClose}
        className="text-xl text-red-700 hover:text-red-900 mr-2"
      >
        &times;
      </button>
      <h1 className="text-gray-1000 dark:text-gray-1200 py-0.3">
        <span className="text-xl font-semibold">{msg}</span>
      </h1>
    </div>
  );
};

export default SystemBanner;
