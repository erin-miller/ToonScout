import React, { useState } from "react";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "@/app/components/animations/AnimatedTab";
import { FaStar } from "react-icons/fa6";

// https://rendition.toontownrewritten.com/render/{dna}/portrait/256x256.webp
type SOSCard = {
  name: string;
  stars: number;
  ability: string;
  track: string | null;
  dna: string;
};

const SOS_TOONS = [
  {
    name: "Madam Chuckle",
    stars: 3,
    ability: "Heal",
    track: "Toon-Up",
    dna: "740705020000040004040415001515010400000000000000000000000000000000",
  },
  {
    name: "Daffy Don",
    stars: 4,
    ability: "Heal",
    track: "Toon-Up",
    dna: "740c000201010601068b1104000404010400000000000000000000000000000000",
  },
  {
    name: "Flippy",
    stars: 5,
    ability: "Heal",
    track: "Toon-Up",
    dna: "740101010103110311092011001111010400000000000000000000000000000000",
  },
  {
    name: "Clerk Will",
    stars: 3,
    ability: "Attack",
    track: "Trap",
    dna: "740f010201000b000b05000a000a0a010400000000000000000000000000000000",
  },
  {
    name: "Clerk Penny",
    stars: 4,
    ability: "Attack",
    track: "Trap",
    dna: "74120201000019001908050c000c0c010400000000000000000000000000000000",
  },
  {
    name: "Clerk Clara",
    stars: 5,
    ability: "Attack",
    track: "Trap",
    dna: "741101020001090109171502000202010400000000000000000000000000000000",
  },
  {
    name: "Stinky Ned",
    stars: 3,
    ability: "Luring",
    track: "Lure",
    dna: "7415000001000000008b0206000606010400000000000000000000000000000000",
  },
  {
    name: "Nancy Gas",
    stars: 4,
    ability: "Luring",
    track: "Lure",
    dna: "7412000001010101010e1b08000808010400000000000000000000000000000000",
  },
  {
    name: "Lil Oldman",
    stars: 5,
    ability: "Luring",
    track: "Lure",
    dna: "7411020101010501058b0915001515010400000000000000000000000000000000",
  },
  {
    name: "Barbara Seville",
    stars: 3,
    ability: "Attack",
    track: "Sound",
    dna: "7407020201011a011a0a1d17001717010400000000000000000000000000000000",
  },
  {
    name: "Sid Sonata",
    stars: 4,
    ability: "Attack",
    track: "Sound",
    dna: "7401010101000b000b8b0101000101010400000000000000000000000000000000",
  },
  {
    name: "Moe Zart",
    stars: 5,
    ability: "Attack",
    track: "Sound",
    dna: "7401000001000000008b010e000e0e010400000000000000000000000000000000",
  },
  {
    name: "Clumsy Ned",
    stars: 3,
    ability: "Attack",
    track: "Drop",
    dna: "740c020201010701078b0a0c000c0c010400000000000000000000000000000000",
  },
  {
    name: "Franz Neckvein",
    stars: 4,
    ability: "Attack",
    track: "Drop",
    dna: "740d000101000200028b0607000707010400000000000000000000000000000000",
  },
  {
    name: "Barnacle Bessie",
    stars: 5,
    ability: "Attack",
    track: "Drop",
    dna: "7414050200010c010c01190d000d0d010400000000000000000000000000000000",
  },
  {
    name: "Professor Guffaw",
    stars: 3,
    ability: "Restock",
    track: "Toon-Up",
    dna: "740005020000060006030704000404010400000000000000000000000000000000",
  },
  {
    name: "Clerk Ray",
    stars: 3,
    ability: "Restock",
    track: "Trap",
    dna: "740e010101010301038b070c000c0c010400000000000000000000000000000000",
  },
  {
    name: "Doctor Drift",
    stars: 3,
    ability: "Restock",
    track: "Lure",
    dna: "740902020001040104001b03000303010400000000000000000000000000000000",
  },
  {
    name: "Melody Wavers",
    stars: 3,
    ability: "Restock",
    track: "Sound",
    dna: "740e0201000103010308060e000e0e010400000000000000000000000000000000",
  },
  {
    name: "Baker Bridget",
    stars: 3,
    ability: "Restock",
    track: "Throw",
    dna: "740c00020000190019171504000404010400000000000000000000000000000000",
  },
  {
    name: "Sofie Squirt",
    stars: 3,
    ability: "Restock",
    track: "Squirt",
    dna: "7415020200001b001b1a150e000e0e010400000000000000000000000000000000",
  },
  {
    name: "Shelly Seaweed",
    stars: 3,
    ability: "Restock",
    track: "Drop",
    dna: "740c01010001030103191504000404010400000000000000000000000000000000",
  },
  {
    name: "Professor Pete",
    stars: 5,
    ability: "Restock",
    track: "All",
    dna: "7407010201000400048b0f12001212010400000000000000000000000000000000",
  },
  {
    name: "Soggy Bottom",
    stars: 3,
    ability: "Toons Hit",
    track: null,
    dna: "740b00010100080008050415001515010400000000000000000000000000000000",
  },
  {
    name: "Soggy Nell",
    stars: 4,
    ability: "Toons Hit",
    track: null,
    dna: "740301020001000100040c04000404010400000000000000000000000000000000",
  },
  {
    name: "Sticky Lou",
    stars: 5,
    ability: "Toons Hit",
    track: null,
    dna: "740c02000101080108050d04000404010400000000000000000000000000000000",
  },
  {
    name: "Flim Flam",
    stars: 3,
    ability: "Cogs Miss",
    track: null,
    dna: "740102020001170117070110001010010400000000000000000000000000000000",
  },
  {
    name: "Mr. Freeze",
    stars: 4,
    ability: "Cogs Miss",
    track: null,
    dna: "74000002010101010205070c000c0c010400000000000000000000000000000000",
  },
  {
    name: "Julius Wheezer",
    stars: 5,
    ability: "Cogs Miss",
    track: null,
    dna: "740c01010101010101050e12001212010400000000000000000000000000000000",
  },
  {
    name: "Rocky",
    stars: 5,
    ability: "Attack",
    track: "Throw",
    dna: "7406010101791b6c1b2c1b14001414010400000000000000000000000000000000",
  },
  {
    name: "Loopy Loopenloop",
    stars: 5,
    ability: "Attack",
    track: "Squirt",
    dna: "7412010201791b6c1b2c1b0e000e0e010400000000000000000000000000000000",
  },
  {
    name: "Lord Lowden Clear",
    stars: 5,
    ability: "Attack",
    track: null,
    dna: "7401010201791b6c1b2c1b02000202010400000000000000000000000000000000",
  },
];

const RewardsTab: React.FC<TabProps> = ({ toon }) => {
  const rewardTypes = ["SOS", "Unites", "Summons", "Pinkslips", "Remotes"];
  const [selectedReward, setSelectedReward] = useState(rewardTypes[0]);

  if (!toon.data.data.rewards) {
    return <div>No rewards available.</div>;
  }

  const renderSOS = () => {
    const sosCards = toon.data.data.rewards.sos;
    if (!sosCards) {
      return <div>No SOS cards available.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
        {Object.entries(sosCards).map(([card, count], index) => {
          const entry: SOSCard | undefined = SOS_TOONS.find(
            (sosToon) => sosToon.name === card
          );

          const title = entry ? formatTrack(entry) : "ERR";
          return (
            <div
              key={index}
              className="grid grid-rows-4 text-xl dark:text-blue-950 bg-gray-100 dark:bg-blue-400 border-2 border-gray-600 dark:border-blue-900 shadow-md p-2 rounded-lg"
              style={{ gridTemplateRows: "30px 30px 70px auto" }}
            >
              {/* sos type */}
              <div
                className={`font-minnie text-${entry?.track} ${
                  title.length > 10 ? "text-sm" : "text-lg"
                }`}
              >
                {entry ? formatTrack(entry) : <span>ERR</span>}
              </div>
              {/* sos name */}
              <div className="">{card}</div>
              {/* sos photo */}
              <div className="flex justify-center">
                {getRendition(
                  `https://rendition.toontownrewritten.com/render/${entry?.dna}/portrait/128x128.webp`
                )}
              </div>
              {/* sos count */}
              <div className="card-count">{count} Remaining</div>
              {/* star count */}
              <div className="flex flex-row justify-end mt-1">
                {Array.from({ length: entry?.stars || 0 }, (_, i) => (
                  <FaStar key={i} className="text-amber-900 w-4 h-4" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderUnites = () => {
    const unites = toon.data.data.rewards.unites;
    if (!unites) {
      return <div>No unites available.</div>;
    }

    const order = ["Gag-Up", "Toon-Up", "Jellybeans"];
    const orderedUnites = order.map((type) => ({
      type,
      variants: unites[type as keyof typeof unites] || null,
    }));
    const unorderedUnites = Object.keys(unites)
      .filter((type) => !order.includes(type))
      .map((type) => ({
        type,
        variants: unites[type as keyof typeof unites] || null,
      }));

    const allUnites = [...orderedUnites, ...unorderedUnites];

    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {allUnites.map(({ type, variants }) => (
          <div
            key={type}
            className="text-2xl dark:text-blue-950 bg-gray-100 dark:bg-blue-400 border-2 border-gray-600 dark:border-blue-900 shadow-md p-4 rounded-lg"
          >
            <div className="font-bold text-2xl mb-2">{type}</div>
            {variants && Object.entries(variants).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(variants)
                  .sort(([a], [b]) => a.localeCompare(b)) // sort variants alphabetically
                  .map(([variant, quantity], index) => (
                    <li key={index} className="flex justify-between space-x-2">
                      <span className="text-xl">{variant}</span>
                      <span className="text-xl">{quantity}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-gray-500 dark:text-blue-800">
                You have none of these unites!
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSummons = () => {};

  const renderPinkslips = () => {
    return <div>Hmm.. something went wrong!</div>;
  };

  const renderRemotes = () => {
    const remotes = toon.data.data.rewards.remotes;
    if (!remotes) {
      return <div>No remotes available.</div>;
    }

    return (
      <div>
        {Object.entries(remotes).map(([type, remoteData], outerIndex) => (
          <div
            key={outerIndex}
            className="text-2xl text-blue-900 dark:text-pink-300 font-minnie text-left"
          >
            {outerIndex === 0 && (
              <div className="font-bold mb-2">Damage Remotes</div>
            )}
            {outerIndex === 1 && (
              <div className="font-bold mb-2 mt-4">Healing Remotes</div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(remoteData).map(([rating, count], index) => (
                <div
                  key={index}
                  className={`grid md:grid-rows-2 text-xl dark:text-gray-100 bg-blue-400 border-2 border-blue-900 shadow-md p-2 rounded-lg`}
                  style={{ gridTemplateRows: "30px auto" }}
                >
                  {/* remote stars */}
                  <div className="flex flex-row justify-center mt-1">
                    {Array.from({ length: parseInt(rating) || 0 }, (_, i) => (
                      <div key={i} className="relative">
                        <FaStar
                          className="text-amber-700 hidden md:block md:w-7 md:h-7 absolute"
                          style={{
                            transform: `rotate(-15deg)`,
                            zIndex: 0,
                            left: -4,
                            bottom: -1,
                          }}
                        />
                        <FaStar
                          className="text-amber-400 md:w-6 md:h-6 relative"
                          style={{ transform: `rotate(-15deg)`, zIndex: 1 }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* remote image */}
                  <div className="flex items-center justify-center mt-2">
                    {type.startsWith("Damage") ? (
                      <img
                        src="/rewards/remotes.png"
                        className="w-16 md:w-24"
                      />
                    ) : (
                      <img
                        src="/rewards/remotesheal.png"
                        className="w-16 md:w-24"
                      />
                    )}
                  </div>
                  {/* remote count */}
                  <div className="flex justify-end items-end text-2xl lg:text-4xl 2xl:text-5xl">
                    <span className="absolute text-blue-950">{count}</span>
                    <span className="relative bottom-0.5 right-0.5 text-gray-100">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

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

  const renderRewardText = () => {
    const rewardData = getRewardData();
    if (!rewardData) {
      return "No rewards available.";
    }
    return selectedReward === "SOS" ? "SOS Cards" : selectedReward;
  };

  const formatTrack = (entry: SOSCard) => {
    if (!entry.track) {
      return entry.ability;
    }
    return entry.ability == "Restock"
      ? `${entry.ability} ${entry.track}`
      : entry.track;
  };

  const getRendition = (url: string) => {
    const proxyUrl = `${
      process.env.NEXT_PUBLIC_API_HTTP
    }/utility/get-rendition?url=${encodeURIComponent(url)}`;
    return <img src={proxyUrl} className="w-16 h-16" />;
  };

  return (
    <AnimatedTabContent>
      <div className="tab-reward-container">
        {/* reward select */}
        <div className="reward-container">
          {rewardTypes.map((type) => {
            const rewardData = getRewardData();
            const isLocked = !rewardData;
            const isPinkslip = type === "Pinkslips";
            const baseImage = `/images/ttr_t_gui_bat_rewardsMenu_tabButton_normal.png`;
            const secondaryImage = isLocked
              ? "/images/ttr_t_gui_bat_rewardsMenu_tabButton_locked.png"
              : `/rewards/${type.toLowerCase()}.png`;

            return (
              <button
                key={type}
                className="reward-btn"
                onClick={() => setSelectedReward(type)}
                disabled={isPinkslip}
              >
                {isLocked ? (
                  <>
                    <img src={secondaryImage} className="base-image" />
                  </>
                ) : (
                  <>
                    <img src={baseImage} className="base-image" />
                    <img src={secondaryImage} className="overlay-image" />
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
