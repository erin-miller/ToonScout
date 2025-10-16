import React, { useState } from "react";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "../../animations/AnimatedTab";
import "/styles/tabs.css";
import ExpContainer from "./components/ExpContainer";
import Image from "next/image";
import { gagImages, GagTrack } from "@/assets/gags/index";
import { getGagTooltipData, GagTrackKey } from "@/app/utils/gagDamage";
import GagTooltip from "./components/GagTooltip";

const GagsTab: React.FC<TabProps> = ({ toon }) => {
  const [hoveredGag, setHoveredGag] = useState<string | null>(null);
  const tracks = Object.keys(toon.data.data.gags);

  const bgMap = {
    "Toon-Up": "bg-toon-up",
    Trap: "bg-trap",
    Lure: "bg-lure",
    Sound: "bg-sound",
    Throw: "bg-throw",
    Squirt: "bg-squirt",
    Drop: "bg-drop",
  };

  const textMap = {
    "Toon-Up": "text-toon-up",
    Trap: "text-trap",
    Lure: "text-lure",
    Sound: "text-sound",
    Throw: "text-throw",
    Squirt: "text-squirt",
    Drop: "text-drop",
  };

  return (
    <AnimatedTabContent>
      <div className="container mx-auto py-8">
        {tracks.map((track, index) => {
          const trackData = toon.data.data.gags[track];
          const trackBg = bgMap[track as keyof typeof bgMap];
          const trackText = textMap[track as keyof typeof textMap];

          const maxLevel = trackData?.gag.level || 0;

          return (
            <div
              key={track}
              className={`flex items-center ${trackBg} rounded-3xl py-2 space-x-1 shadow-lg relative overflow-visible inline-flex max-w-max pr-4 ${
                index === 0 ? "mt-4" : ""
              }`}
            >
              <div className="hidden sm:flex lg:hidden xl:flex flex-col px-2">
                <h3
                  className={`w-36 font-bold uppercase text-xl lg:text-lg xl:text-xl 2xl:text-2xl ${trackText} text-left`}
                >
                  <div className="text-black opacity-70 rounded-lg">
                    {track}
                  </div>
                </h3>

                <ExpContainer track={track} toonData={toon} />
              </div>
              <div className="grid grid-cols-7 gap-2 pl-2 sm:pl-0 lg:pl-2 xl:pl-0">
                {[...Array(7)].map((_, gagIndex) => {
                  const gagImage = gagImages[track.toLowerCase() as GagTrack]?.[gagIndex];
                  const isImageVisible = trackData && gagIndex + 1 <= maxLevel;
                  const gagLevel = gagIndex + 1;
                  const tooltipData = getGagTooltipData(track as GagTrackKey, gagLevel, maxLevel, trackData);
                  const isRightmostGag = gagIndex === 6 || gagIndex + 1 === maxLevel;
                  const gagKey = `${track}-${gagLevel}`;
                  const isHovered = hoveredGag === gagKey;

                  return (
                    <div
                      key={`${track}-${gagIndex}`}
                      className={`w-14 h-10 md:w-16 md:h-12 2xl:w-20 2xl:h-16 rounded-3xl flex items-center justify-center relative shadow-lg ${
                        isImageVisible ? "bg-gagblue" : ""
                      }`}
                      onMouseEnter={() => setHoveredGag(gagKey)}
                      onMouseLeave={() => setHoveredGag(null)}
                    >
                      {!isImageVisible && (
                        <div className="absolute inset-0 bg-black opacity-15 rounded-3xl pointer-events-none" />
                      )}

                      {isImageVisible && gagImage && (
                        <Image
                          src={gagImage}
                          alt={`${track} gag ${gagLevel}`}
                          width={48}
                          height={48}
                          className="w-8 xl:w-10 2xl:w-12 object-contain pointer-events-none"
                        />
                      )}

                      {isImageVisible && tooltipData?.isOrganic && (
                        <Image
                          src="/organic-gag.webp"
                          alt="Organic"
                          width={18}
                          height={18}
                          className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7 pointer-events-none"
                        />
                      )}

                      {isImageVisible && tooltipData && (
                        <GagTooltip
                          track={track}
                          gagLevel={gagLevel}
                          damageInfo={tooltipData.damageInfo}
                          baseDamageInfo={tooltipData.baseDamageInfo}
                          accuracyInfo={tooltipData.accuracyInfo}
                          isOrganic={tooltipData.isOrganic}
                          isHovered={isHovered}
                          isRightmost={isRightmostGag}
                        />
                      )}

                      {isImageVisible && (
                        <div
                          className={`absolute inset-0 border-2 border-solid rounded-3xl shadow-md pointer-events-none`}
                          style={{
                            borderColor: `rgba(0, 0, 0, 0.1)`,
                          }}
                        >
                          <div
                            className={`absolute inset-0 border-2 border-b-8 opacity-5 border-solid rounded-3xl pointer-events-none`}
                            style={{
                              borderColor: `white`,
                            }}
                          ></div>
                          <div
                            className={`absolute inset-0 border-4 border-t-8 opacity-5 border-solid rounded-3xl pointer-events-none`}
                            style={{
                              borderColor: `white`,
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div
                  className={`absolute inset-0 border-4 border-solid rounded-3xl pointer-events-none`}
                  style={{
                    borderColor: `rgba(0, 0, 0, 0.2)`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </AnimatedTabContent>
  );
};

export default GagsTab;
