import { useState } from "react";
import { useToonContext } from "@/app/context/ToonContext";
import AnimatedTabContent from "../animations/AnimatedTab";
import { FaCog } from "react-icons/fa";
import ToonSettingsModal from "./modals/ToonSettingsModal";
import { StoredToonData } from "@/app/types";
import { MAX_TOONS } from "@/app/context/ToonContext";
import Image from "next/image";

const ToonSelect = () => {
  const { toons, activeIndex, setActiveIndex } = useToonContext();
  const [isOpen, setOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedToon, setSelectedToon] = useState<StoredToonData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const curr = toons[activeIndex];

  const getImage = (dna: string) => {
    const flippy =
      "https://rendition.toontownrewritten.com/render/740101000103110311000011000011010400000000000000000000000000000000/portrait/512x512.png";
    return dna
      ? `https://rendition.toontownrewritten.com/render/${dna}/portrait/512x512.png`
      : flippy;
  };

  const handleDropdown = () => {
    setOpen(!isOpen);
  };

  const handleToonSelect = (index: number) => () => {
    setActiveIndex(index);
    setOpen(false);
  };

  const getRemaining = () => {
    if (toons.length < MAX_TOONS) {
      return `Add up to ${MAX_TOONS - toons.length} more toons!`;
    } else {
      return `The oldest unlocked toon will be replaced by the next new toon.`;
    }
  };

  const openModal = (toon: StoredToonData, index: number) => {
    setModalOpen(true);
    setSelectedToon(toon);
    setSelectedIndex(index);
  };

  return (
    <div className="relative flex items-center text-gray-900 dark:text-gray-100 z-50">
      <button
        className="border-2 h-12 w-12 border-pink-700 bg-pink-100 dark:bg-pink-900 rounded-full shadow-lg hover:shadow-lg scale-up overflow-hidden"
        onClick={handleDropdown}
      >
        <Image
          src={getImage(curr?.data.data.toon.style)}
          alt="Toon Portrait"
          width={48}
          height={48}
        />
      </button>
      {isOpen && (
        <AnimatedTabContent>
          <div className="absolute -left-[52px] top-7 w-52 bg-white dark:bg-gray-900 border border-gray-700 dark:border-pink-900 shadow-xl overflow-hidden">
            {toons.map((toon, index) => (
              <button
                key={index}
                className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-1000 cursor-pointer w-full"
                onClick={handleToonSelect(index)}
              >
                <Image
                  src={getImage(toon.data.data.toon.style)}
                  alt="Toon Portrait"
                  className="hidden lg:block w-10 h-10 rounded-full border-2 border-pink-300 bg-pink-100 dark:bg-pink-900"
                  width={40}
                  height={40}
                />
                <span className="text-sm md:text-md text-left">
                  {toon.data.data.toon.name}
                </span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(toon, index);
                  }}
                  className="ml-auto text-gray-500 dark:text-gray-300"
                  title="Lock toons to prevent them from being replaced."
                >
                  <FaCog className="text-blue-700 hover:text-blue-700 text-xl" />
                </div>
              </button>
            ))}
            <div className="hidden lg:block items-center text-center justify-center w-full p-2">
              {getRemaining()}
            </div>
          </div>
        </AnimatedTabContent>
      )}
      {isModalOpen && (
        <ToonSettingsModal
          toon={selectedToon}
          index={selectedIndex}
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ToonSelect;
