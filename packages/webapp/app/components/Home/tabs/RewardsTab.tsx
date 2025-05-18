import React, { useState } from "react";
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

const RewardsTab: React.FC<TabProps> = ({ toon }) => {
  const rewardTypes = ["SOS", "Unites", "Summons", "Pinkslips", "Remotes"];
  const [selectedReward, setSelectedReward] = useState(rewardTypes[0]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  if (!toon.data.data.rewards) {
    return <div>No rewards available.</div>;
  }

  const renders: Record<string, () => JSX.Element> = {
    SOS: () => renderSOS(toon),
    Unites: () => renderUnites(toon),
    Summons: () => renderSummons(toon),
    Pinkslips: renderPinkslips,
    Remotes: () => renderRemotes(toon),
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
        return null;
    }
  };

  const renderRewardText = () => {
    const rewardData = getRewardData();
    if (!rewardData) {
      return "No rewards available.";
    }
    return selectedReward === "SOS" ? "SOS Cards" : selectedReward;
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
            const baseImageNormal = `/images/ttr_t_gui_bat_rewardsMenu_tabButton_normal.png`;
            const baseImageHover = `/images/ttr_t_gui_bat_rewardsMenu_tabButton_hover.png`;
            const baseImageClick = `/images/ttr_t_gui_bat_rewardsMenu_tabButton_click.png`;
            const secondaryImage = isLocked
              ? "/images/ttr_t_gui_bat_rewardsMenu_tabButton_locked.png"
              : `/rewards/${type.toLowerCase()}.png`;

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
            <div className="text-left text-4xl font-minnie w-full">
              {renderRewardText()}
            </div>
            <div>{renders[selectedReward]()}</div>
          </div>
        </div>
      </div>
    </AnimatedTabContent>
  );
};

export default RewardsTab;
