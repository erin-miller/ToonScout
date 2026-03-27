import React, { useEffect } from "react";
import AnimatedTabContent from "@/app/components/animations/AnimatedTab";

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed transition ease-in-out inset-0
      backdrop-blur-sm dark:text-gray-100
      flex justify-center items-center z-50"
      onClick={onClose}
    >
      <AnimatedTabContent>
        <div
          className="p-6 rounded-lg border-blue-700 border-4 relative text-xl max-w-4xl font-impress
          text-gray-800 bg-gray-100 dark:text-gray-100 dark:bg-gray-1100 overflow-y-auto site-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          <div className="max-h-[calc(90vh-3rem)]">{children}</div>
          {/* Close button in the top-right corner */}
          <button
            onClick={onClose}
            className="absolute top-2 right-1 text-2xl text-blue-700
            hover:text-blue-900 w-8 h-8 flex justify-center items-stretch"
          >
            &times;
          </button>
        </div>
      </AnimatedTabContent>
    </div>
  )
}

export default Modal
