import React from "react";
import Modal from "../../Modal";
import Image from "next/image";

interface GameStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameStepsModal: React.FC<GameStepsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-3xl font-semibold text-gray-1200 dark:text-gray-100 pb-4">
        To connect to Toontown Rewritten, follow the steps below!
      </div>
      <div className="grid grid-cols-2 gap-8">
        <Step
          title="1. Enable Companion App Support"
          image="/images/gameplay-menu.png"
        />
        <Step
          title="2. Click 'OK' on in-game popup and select a toon"
          image="/images/prompt.png"
        />
      </div>
    </Modal>
  );
};

const Step: React.FC<{ title: string; image: string }> = ({ title, image }) => (
  <div className="text-2xl">
    <h2 className="pb-2 ">{title}</h2>
    <Image
      src={image}
      alt={title}
      className="mx-auto"
      width={256}
      height={256}
    />
  </div>
);

export default GameStepsModal;
