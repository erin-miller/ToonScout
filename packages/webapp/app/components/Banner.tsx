interface BannerProps {
  isOpen: boolean;
  onClose: () => void;
  msg?: string;
  className?: string;
  enableBtn?: boolean;
}

const Banner: React.FC<BannerProps> = ({
  isOpen,
  onClose,
  msg = "",
  className = "",
  enableBtn = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`w-full h-full py-0.3 px-6 flex items-center justify-center flex-wrap ${className}`}
    >
      {enableBtn && (
        <button
          onClick={onClose}
          className="text-xl text-red-700 hover:text-red-900 mr-2"
        >
          &times;
        </button>
      )}
      <h1 className="text-gray-1000 dark:text-gray-1200 py-0.3">
        <span className="text-xl font-semibold">{msg}</span>
      </h1>
    </div>
  );
};

export default Banner;
