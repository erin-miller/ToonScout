import React, { JSX, useState } from "react";
import Image from "next/image";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "@/app/components/animations/AnimatedTab";
import {
  renderSOS,
  renderUnites,
  renderSummons,
  renderPinkslips,
  renderRemotes,
} from "@/app/utils/rewardsUtils";
import { rewardImages } from "@/assets/rewards";
import { imageAssets } from "@/assets/images";
import { motion } from "framer-motion";
import { FaCaretDown } from "react-icons/fa6";

const RewardsTab: React.FC<TabProps> = ({ toon }) => {
  if (!toon.data.data.rewards) {
    return <div>No rewards available.</div>;
  }

  const rewardTypes = ["SOS", "Unites", "Summons", "Pinkslips", "Remotes"];
  const [selectedReward, setSelectedReward] = useState(rewardTypes[0]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  // sos card sorting
  const [selectedSort, setSelectedSort] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // flip states for SOS cards
  const sosCards = toon.data.data.rewards.sos || {};
  const [flipStates, setFlipStates] = useState<Record<string, boolean>>(
    Object.keys(sosCards).reduce((acc, card) => {
      acc[card] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleFlip = (card: string) => {
    setFlipStates((prev) => ({
      ...prev,
      [card]: !prev[card],
    }));
  };

  const renders: Record<string, () => JSX.Element> = {
    SOS: () => renderSOS(toon, selectedSort, flipStates, toggleFlip),
    Unites: () => renderUnites(toon),
    Summons: () => renderSummons(toon),
    Pinkslips: renderPinkslips,
    Remotes: () => renderRemotes(toon),
  };

  const extraRenders: Record<string, () => JSX.Element> = {
    SOS: () => renderSOSSort(),
    Unites: () => <div></div>,
    Summons: () => <div></div>,
    Pinkslips: () => <div></div>,
    Remotes: () => <div></div>,
  };

  const getRewardData = () => {
    switch (selectedReward) {
      case "SOS":
        return toon.data.data.rewards.sos;
      case "Unites":
        return toon.data.data.rewards.unites;
      case "Summons":
        return toon.data.data.rewards.summons;
      case "Pinkslips":
        return toon.data.data.rewards.pinkslips;
      case "Remotes":
        return [toon.data.data.rewards.remotes];
      default:
        return <div>No rewards available.</div>;
    }
  };

  const renderRewardText = () => {
    const rewardData = getRewardData();
    if (!rewardData) {
      return "No rewards available.";
    }
    return selectedReward === "SOS" ? "SOS Cards" : selectedReward;
  };

  const renderSOSSort = () => {
    const sortOptions = [
      "All",
      "Restock",
      "Toon-Up",
      "Trap",
      "Lure",
      "Sound",
      "Throw",
      "Squirt",
      "Drop",
      "Other",
    ];

    return (
      <div className="relative text-2xl text-pink-900 dark:text-gray-100 text-left">
        <button
          className="flex items-center justify-between rounded-md px-4 py-1.5 min-w-[10rem] 
          border-2 border-blue-600
          bg-blue-50 dark:bg-gray-900"
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          <span>{selectedSort}</span>
          <FaCaretDown className="ml-2 text-3xl" />
        </button>
        {dropdownOpen && (
          <motion.ul
            className="absolute z-10 min-w-[10rem] w-full top-0 left-0
            bg-blue-50 dark:bg-gray-900 border-2 border-blue-600 rounded-md shadow-lg right-0"
          >
            {sortOptions.map((option) => (
              <li
                key={option}
                className="cursor-pointer px-4 py-2 hover:text-pink-400"
                onClick={() => {
                  setSelectedSort(option);
                  setDropdownOpen(false);
                }}
              >
                {option}
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    );
  };

  return (
    <AnimatedTabContent>
      <div className="tab-reward-container">
        {/* reward select */}
        <div className="reward-container">
          {rewardTypes.map((type) => {
            const rewardData = getRewardData();
            const isLocked =
              !rewardData || Object.keys(rewardData).length === 0;
            const isPinkslip = type === "Pinkslips";
            const baseImageNormal = imageAssets.ttr_tab_normal;
            const baseImageHover = imageAssets.ttr_tab_hover;
            const baseImageClick = imageAssets.ttr_tab_click;
            const secondaryImage = isLocked
              ? imageAssets.ttr_tab_locked
              : rewardImages[type.toLowerCase() as keyof typeof rewardImages];

            const getButtonImage = () => {
              if (clickedButton === type) return baseImageClick;
              if (hoveredButton === type) return baseImageHover;
              return baseImageNormal;
            };

            return (
              <button
                key={type}
                className="reward-btn"
                onClick={() => {
                  setSelectedReward(type);
                }}
                onMouseEnter={() => setHoveredButton(type)}
                onMouseLeave={() => setHoveredButton(null)}
                onMouseDown={() => setClickedButton(type)}
                onMouseUp={() => setClickedButton(null)} // Reset clickedButton on mouse release
                disabled={isPinkslip || isLocked}
              >
                {isLocked ? (
                  <Image
                    src={secondaryImage}
                    className="base-image"
                    alt={type + " locked"}
                    width={112}
                    height={112}
                  />
                ) : (
                  <>
                    <Image
                      src={getButtonImage()}
                      className="base-image"
                      alt={type + " base"}
                      width={112}
                      height={112}
                    />
                    <Image
                      src={secondaryImage}
                      className="overlay-image"
                      alt={type + " overlay"}
                      width={84}
                      height={84}
                    />
                    {isPinkslip && (
                      <div className="text-2xl lg:text-4xl 2xl:text-5xl justify-end items-end">
                        <span className="absolute bottom-1.5 right-2.5 text-blue-950 ">
                          {toon.data.data.rewards.pinkslips}
                        </span>
                        <span className="absolute bottom-2 right-3 text-gray-100">
                          {toon.data.data.rewards.pinkslips}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* reward display */}
        <div className="w-full">
          <div className="reward-display">
            {/* header */}
            <div className="flex flex-row w-full justify-between">
              {/* reward name */}
              <div className="font-minnie text-left">{renderRewardText()}</div>
              {/* optional component for reward display */}
              <div>{extraRenders[selectedReward]()}</div>
            </div>
            {/* display */}
            <div>{renders[selectedReward]()}</div>
          </div>
        </div>
      </div>
    </AnimatedTabContent>
  );
};

export default RewardsTab;
