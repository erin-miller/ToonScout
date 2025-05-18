import React from "react";
import Toast from "./Toast";
import Image from "next/image";

interface InvasionToastProps {
  show: boolean;
  onClose: () => void;
  message: string;
  cogIcon?: string; // URL to cog icon
  persistent?: boolean;
  duration?: number;
}

const InvasionToast: React.FC<InvasionToastProps> = ({
  show,
  onClose,
  message,
  cogIcon,
  persistent = false,
  duration = 4000,
}) => {
  return (
    <Toast
      show={show}
      onClose={onClose}
      message={message}
      persistent={persistent}
      duration={duration}
    >
      {cogIcon && (
        <Image
          src={cogIcon}
          alt="Cog Icon"
          width={40}
          height={40}
          className="rounded-full bg-white mr-2"
        />
      )}
    </Toast>
  );
};

export default InvasionToast;
