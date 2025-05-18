import React from "react";
import Modal from "../../Modal";
import Image from "next/image";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-3xl mb-2 minnie-title">Hi there!</h3>
      <div className="flex mt-4 items-center justify-center overflow-x-auto privacy-scrollbar">
        <div className="flex space-x-4">
          <Image
            src="/images/sunny.png"
            alt="Sunny"
            className="w-auto max-h-64 rounded-lg shadow-lg"
            width={256}
            height={256}
          />
          <Image
            src="/images/rainy.png"
            alt="Rainy"
            className="w-auto max-h-64 rounded-lg shadow-lg"
            width={256}
            height={256}
          />
          <Image
            src="/images/meerkataclysm.png"
            alt="Meerkataclysm"
            className="w-auto max-h-64 rounded-lg shadow-lg"
            width={256}
            height={256}
          />
          <Image
            src="/images/cloudy.png"
            alt="Cloudy"
            className="w-auto max-h-64 rounded-lg shadow-lg"
            width={256}
            height={256}
          />
        </div>
      </div>

      <div className="space-y-4 pt-8">
        <p>My name is Erin! I've been playing Toontown since 2008.</p>
        <p>
          ToonScout is my personal project originally created to teach myself
          how to build a full-stack application with a Discord bot.
        </p>
        <p>
          I really appreciate you taking the time to check the project out. If
          you ever see me in-game, please don't hesitate to say hello!
        </p>
        <div className="text-base text-gray-700">
          Special thanks to the following for advice, support, and/or
          contributions:
          <p>bnuy</p>
          <p>Cherie</p>
          <p>Aton (warmpoptart)</p>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;
