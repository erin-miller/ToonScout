import React from "react";
import { FaStar } from "react-icons/fa6";
import { HiMiniUser, HiBuildingOffice, HiUserGroup } from "react-icons/hi2";
import { getCogImage } from "@/app/utils/invasionUtils";
import { StoredToonData } from "../types";
import SOS_TOONS from "@/data/sos_toons.json";
import COGS from "@/data/cogs.json";

type SOSCard = {
  name: string;
  dna: string;
  track: string | null;
  ability: string | null;
  stars: number;
};

// Helper: Get the track name for SOS cards
export const formatTrack = (entry: any) => {
  if (entry.track == null) {
    return entry.ability;
  }
  return entry.ability === "Restock"
    ? `${entry.ability} ${entry.track}`
    : entry.track;
};

// Helper: Get the rendition image for SOS cards
export const getRendition = (url: string) => {
  const proxyUrl = `${
    process.env.NEXT_PUBLIC_API_HTTP
  }/utility/get-rendition?url=${encodeURIComponent(url)}`;
  return <img src={proxyUrl} className="w-16 h-16" />;
};

export const renderSOS = (toon: StoredToonData) => {
  const sosCards = toon.data.data.rewards.sos;
  if (!sosCards || Object.keys(sosCards).length === 0) {
    return <div>No SOS cards available!</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
      {Object.entries(sosCards).map(([card, count], index) => {
        const entry = SOS_TOONS.find((sosToon) => sosToon.name === card);
        const title =
          entry && (entry.track !== null || entry.ability !== null)
            ? formatTrack(entry)
            : "ERR";
        return (
          <div
            key={index}
            className="grid grid-rows-4 text-xl dark:text-blue-950 bg-gray-100 dark:bg-blue-400 border-2 border-gray-600 dark:border-blue-900 shadow-md p-2 rounded-lg"
            style={{ gridTemplateRows: "30px 30px 70px auto" }}
          >
            <div
              className={`font-minnie text-${entry?.track} ${
                title.length > 10 ? "text-sm" : "text-lg"
              }`}
            >
              {title}
            </div>
            <div className="">{card}</div>
            <div className="flex justify-center">
              {getRendition(
                `https://rendition.toontownrewritten.com/render/${entry?.dna}/portrait/128x128.webp`
              )}
            </div>
            <div className="card-count">{count} Remaining</div>
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

export const renderUnites = (toon: StoredToonData) => {
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
                .sort(([a], [b]) => a.localeCompare(b))
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

export const renderSummons = (toon: StoredToonData) => {
  const summons = toon.data.data.rewards.summons;
  if (!summons) {
    return <div>No summons available.</div>;
  }

  const placeHolderCog = "/cog_images/flunky.webp";

  let missingTotal = 0;

  Object.entries(summons).forEach(([_, { single, building, invasion }]) => {
    if (!single) missingTotal++;
    if (!building) missingTotal++;
    if (!invasion) missingTotal++;
  });

  const deptCardMap = {
    Bossbot: "bg-[#b1a49b] border-[#877b75]",
    Lawbot: "bg-[#A5B2C3] border-[#6a717a]",
    Cashbot: "bg-[#96a5a1] border-[#6a7673]",
    Sellbot: "bg-[#A4949F] border-[#74686e]",
  };

  // same as border colors
  const deptOwnedMap = {
    Bossbot: "text-[#877b75]",
    Lawbot: "text-[#6a717a]",
    Cashbot: "text-[#6a7673]",
    Sellbot: "text-[#74686e]",
  };

  return (
    <div>
      <div className="text-xl text-left mb-2">
        <p>You need {missingTotal} more CJs to max your book!</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {Object.entries(summons).map(
          ([key, { name, single, building, invasion }]) => {
            const cog = COGS.find(
              (c) => c.name === name || c.fullname === name
            );
            const mappedColor =
              deptCardMap[cog?.type as keyof typeof deptCardMap] ||
              "bg-gray-1000";

            return (
              <div
                key={key}
                className={`grid grid-cols-2 text-sm border-2 ${mappedColor} text-white shadow-md p-2 rounded items-center`}
              >
                {/* cog name and image */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-center text-sm truncate w-full">
                    {name}
                  </div>
                  <img
                    src={getCogImage(name) || placeHolderCog}
                    alt={name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                {/* summon stats */}
                <div className="flex flex-col items-center space-y-1">
                  <HiMiniUser
                    className={`w-6 h-6 ${
                      single
                        ? "text-gray-100"
                        : deptOwnedMap[cog?.type as keyof typeof deptOwnedMap]
                    }`}
                  />
                  <HiBuildingOffice
                    className={`w-6 h-6 ${
                      building
                        ? "text-gray-100"
                        : deptOwnedMap[cog?.type as keyof typeof deptOwnedMap]
                    }`}
                  />
                  <HiUserGroup
                    className={`w-6 h-6 ${
                      invasion
                        ? "text-gray-100"
                        : deptOwnedMap[cog?.type as keyof typeof deptOwnedMap]
                    }`}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export const renderPinkslips = () => {
  return <div>Hmm.. something went wrong!</div>;
};

export const renderRemotes = (toon: StoredToonData) => {
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
                <div className="flex items-center justify-center mt-2">
                  {type.startsWith("Damage") ? (
                    <img src="/rewards/remotes.png" className="w-16 md:w-24" />
                  ) : (
                    <img
                      src="/rewards/remotesheal.png"
                      className="w-16 md:w-24"
                    />
                  )}
                </div>
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
