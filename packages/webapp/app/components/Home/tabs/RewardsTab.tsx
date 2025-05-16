import React, { useState } from "react";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "@/app/components/animations/AnimatedTab";

const RewardsTab: React.FC<TabProps> = ({ toon }) => {
  const rewardTypes = ["SOS", "Unites", "Summons", "Pinkslips", "Remotes"];
  const [selectedReward, setSelectedReward] = useState(rewardTypes[0]);

  const renderSOS = () => {};

  const renderUnites = () => {};

  const renderSummons = () => {};

  const renderPinkslips = () => {};

  const renderRemotes = () => {};

  const renders: Record<string, () => JSX.Element> = {
    SOS: renderSOS,
    Unites: renderUnites,
    Summons: renderSummons,
    Pinkslips: renderPinkslips,
    Remotes: renderRemotes,
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

  return (
    <AnimatedTabContent>
      <div className="tab-reward-container">
        {/* reward select */}
        <div className="reward-container">
          {rewardTypes.map((type) => {
            const rewardData = getRewardData();
            const isLocked = !rewardData;
            const baseImage = `/images/ttr_t_gui_bat_rewardsMenu_tabButton_normal.png`;
            const overlayImage = isLocked
              ? "/images/ttr_t_gui_bat_rewardsMenu_tabButton_locked.png"
              : `/rewards/${type.toLowerCase()}.png`;

            return (
              <div key={type} className="reward-btn">
                <img src={baseImage} className="base-image" />
                <img src={overlayImage} className="overlay-image" />
              </div>
            );
          })}
        </div>

        {/* reward display */}
        <div className="reward-display">{selectedReward}</div>
      </div>
    </AnimatedTabContent>
  );
};

export default RewardsTab;
