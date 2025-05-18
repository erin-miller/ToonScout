import React, { useEffect } from "react";
import Image from "next/image";
import AnimatedTabContent from "@/app/components/animations/AnimatedTab";
import { TabProps } from "./components/TabComponent";
const API_LINK = process.env.NEXT_PUBLIC_API_HTTP;

interface FlowerResponse {
  name: string;
  combo: string[];
}

const GardenTab: React.FC<TabProps> = ({ toon }) => {
  const toonData = toon.data.data;
  const [shovel, setShovel] = React.useState("Bronze Shovel");
  const [can, setCan] = React.useState("Bronze Can");
  const [combo, setCombo] = React.useState(1);
  const [currExp, setCurrExp] = React.useState(0);
  const [maxExp, setMaxExp] = React.useState(0);
  const [daysToGo, setDaysToGo] = React.useState(0);
  const [plantable, setPlantable] = React.useState<FlowerResponse[]>([]);
  const [progress, setProgress] = React.useState<FlowerResponse[]>([]);
  const [missing, setMissing] = React.useState<FlowerResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [flowerType, setFlowerType] = React.useState(() => {
    return parseInt(localStorage.getItem("flowerType") || "1", 10);
  });

  // listen if settings are changed in localstorage
  window.addEventListener("flowerChange", (event) => {
    const storedFlowerType = parseInt(
      localStorage.getItem("flowerType") || "1"
    );
    if (storedFlowerType !== flowerType) {
      setFlowerType(storedFlowerType);
    }
  });

  useEffect(() => {
    const getGarden = async () => {
      const response = await fetch(API_LINK + "/utility/get-garden", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ toonData: toon.data }),
      });
      if (!response.ok) {
        return "Error loading garden data. Please try again later.";
      }
      const data = await response.json();
      //   { maxCombo, upgrade, plantable, progress, missing }
      setShovel(toonData.flowers.shovel.name);
      setCan(toonData.flowers.wateringCan.name);
      setCombo(data.maxCombo);
      setCurrExp(toonData.flowers.shovel.curSkill);
      setMaxExp(toonData.flowers.shovel.maxSkill);
      setDaysToGo(data.upgrade);
      setPlantable(data.plantable);
      setProgress(formatResponse(data.progress));
      setMissing(formatResponse(data.missing));
      setIsLoading(false);
    };

    getGarden();
  }, [toon?.data]);

  const getDaysToGo = () => {
    if (daysToGo === null) {
      return "Maxed!";
    } else {
      return daysToGo + " days until upgrade!";
    }
  };

  const formatResponse = (response: Object) => {
    return Object.entries(response).map(([name, combo]) => ({
      name,
      combo,
    }));
  };

  const removeDupes = (arr: FlowerResponse[]) => {
    return arr.filter(
      (flower) =>
        !progress.some((progFlower) => progFlower.name === flower.name)
    );
  };

  const renderFlowers = (flowers: FlowerResponse[], borderColor: string) => {
    return flowers.map((flower: FlowerResponse, index: number) => {
      const { name, combo: flowerCombo } = flower;
      return (
        <div
          key={index}
          className={`flex items-center justify-start w-full overflow-hidden rounded-lg shadow-lg border-4 border-${borderColor}`}
        >
          <div className="flex w-full h-full bg-violet-50 dark:bg-gray-1000 shadow-sm p-2">
            <Image
              src={`/flowers/${name}.png`}
              alt={name}
              width={64}
              height={64}
              className={`object-contain rounded-full border-4 border-${borderColor}`}
            />
            {/* right side of image */}
            <div className="flex flex-col items-start justify-start w-full h-full ml-2">
              <div className="text-lg dark:text-white">{name}</div>
              <div className="flex flex-row w-full gap-0.5">
                {flowerCombo.map((combo: string, index: number) => {
                  return (
                    <Image
                      src={`/flowers/jellybeans/${combo}.svg`}
                      alt={combo.slice(0, 1).toUpperCase()}
                      width={24}
                      height={24}
                      className="object-contain"
                      key={index}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <AnimatedTabContent>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-xl font-bold">Loading...</div>
        </div>
      ) : (
        <>
          {/* header */}
          <div className="flex flex-col h-full px-1">
            <div className="flex text-xl md:text-2xl xl:text-3xl pb-2 justify-between">
              <div className="flex items-center h-full">
                {combo} bean flowers
              </div>
              <div className="flex items-center h-full">{getDaysToGo()}</div>
              <div className="flex items-center h-full">{shovel}</div>
            </div>
          </div>
          {/* progress bar, inherited from ExpContainer */}
          <div className="flex w-full items-center justify-center mb-2">
            <div
              className={`flex relative w-full bg-orange-300 border-2 border-amber-600 rounded-lg items-center justify-center text-xl lg:text-md 2xl:text-xl`}
            >
              {/* Background overlay */}
              <div
                className="absolute inset-0 z-0 h-full bg-orange-700 opacity-20"
                style={{
                  width: `${(currExp / maxExp) * 100}%`,
                }}
              ></div>

              {/* progress */}
              <div className={`relative z-10 text-amber-950 text-2xl`}>
                {currExp} / {maxExp}
              </div>
            </div>
          </div>
          {/* flowers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2">
            {renderFlowers(progress, "amber-500")}
            {flowerType >= 2 &&
              renderFlowers(removeDupes(plantable), "pink-500")}
            {flowerType === 3 && renderFlowers(missing, "gray-600")}
          </div>
        </>
      )}
    </AnimatedTabContent>
  );
};

export default GardenTab;
