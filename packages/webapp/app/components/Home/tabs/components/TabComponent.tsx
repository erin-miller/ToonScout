import {
  InfoTab,
  FishTab,
  SuitTab,
  GagsTab,
  TasksTab,
  ActivityTab,
  InvasionsTab,
  GardenTab,
  RewardsTab,
} from "./TabList";
import "/styles/tabs.css";
import { useState } from "react";
import { useToonContext } from "@/app/context/ToonContext";
import { StoredToonData } from "@/app/types";
import { hasNoSuit } from "./utils";
import { FaAngleRight, FaAngleLeft } from "react-icons/fa";
import { BsPiggyBankFill } from "react-icons/bs";
import { PiTipJarFill } from "react-icons/pi";
import Image from "next/image";

export interface TabProps {
  toon: StoredToonData;
  setSelectedTab?: React.Dispatch<React.SetStateAction<TabComponent>>;
}

export type TabComponent = {
  title: string;
  component: React.FC<{ toon: StoredToonData }>;
  disabled?: boolean;
  tooltip?: string;
};

const TabContainer = () => {
  const { activeIndex, toons } = useToonContext();
  const MAX_TABS = 4;

  const toon = toons[activeIndex];

  if (!toon) {
    return "No toon data found. Please try refreshing the page.";
  }

  const TabList: TabComponent[] = [
    {
      title: "Overview",
      component: (props) => (
        <InfoTab {...props} setSelectedTab={setSelectedTab} />
      ),
    },
    {
      title: "Fishing",
      component: FishTab,
      tooltip:
        "Percentages and buckets are estimates and should not be taken literally. Toontown Rewritten has not disclosed their actual fishing odds.",
    },
    {
      title: "Suits",
      component: SuitTab,
      disabled: hasNoSuit(toon),
      tooltip:
        "Promotion recommendations are weighted by merit return and time. The time is determined by the average group find time at peak hours and length of the facility.",
    },
    { title: "Gags", component: GagsTab },
    {
      title: "Tasks",
      component: TasksTab,
      disabled: toons[activeIndex].data.data.tasks.length <= 0,
    },
    { title: "Activities", component: ActivityTab },
    {
      title: "Invasions",
      component: InvasionsTab,
      tooltip: "Displays currently active invasions.",
    },
    {
      title: "Garden",
      component: GardenTab,
      tooltip:
        "Golden border flowers will progress your experience and allow you to grow higher bean combinations.",
    },
    {
      title: "Rewards",
      component: RewardsTab,
      disabled: !toon.data.data.rewards,
    },
  ];

  const [selectedTab, setSelectedTab] = useState<TabComponent>(TabList[0]); // Default to "Overview"
  const [pose, setPose] = useState<string>("waving");
  const [currPage, setCurrPage] = useState(0);
  const totalPages = Math.ceil(TabList.length / MAX_TABS);
  const visibleTabs = TabList.slice(
    currPage * MAX_TABS,
    (currPage + 1) * MAX_TABS
  );

  // change pages if the toon has no suits so that the tab is disabled properly
  if (selectedTab.title == "Suits" && hasNoSuit(toon)) {
    setSelectedTab(TabList[1]);
  }

  const poses = [
    "head",
    "portrait-sleep",
    "portrait-delighted",
    "portrait-surprise",
    "portrait-thinking",
    "portrait-birthday",
    "portrait-fall",
    "portrait-grin",
    "cake-topper",
    "crying",
    "waving",
  ];

  const getImage = () => {
    const dna = toon.data.data.toon.style;
    return `https://rendition.toontownrewritten.com/render/${dna}/${pose}/1024x1024.png`;
  };

  const handleTabChange = (tab: TabComponent) => {
    setSelectedTab(tab);
  };

  const handleImageClick = () => {
    const curr = poses.indexOf(pose);
    const next = (curr + 1) % poses.length;
    setPose(poses[next]);
  };

  const handleNextPage = () => {
    setCurrPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div>
      {/* list of tabs */}
      <div>
        {/* full tab list for larger screens */}
        <div className="tab-container hidden lg:flex">
          {TabList.map((tab) => (
            <button
              key={tab.title}
              className="tab-btn"
              aria-selected={selectedTab.title === tab.title}
              onClick={() => handleTabChange(tab)}
              disabled={tab.disabled}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* paginated tab list for smaller screens */}
        <div className="tab-container flex lg:hidden">
          <button
            className="rounded-lg tab-btn"
            onClick={handlePrevPage}
            disabled={currPage == 0}
          >
            <FaAngleLeft />
          </button>

          {visibleTabs.map((tab) => (
            <button
              key={tab.title}
              className="tab-btn"
              aria-selected={selectedTab.title === tab.title}
              onClick={() => handleTabChange(tab)}
              disabled={tab.disabled}
            >
              {tab.title}
            </button>
          ))}

          <button
            className="rounded-lg tab-btn"
            onClick={handleNextPage}
            disabled={currPage === totalPages - 1}
          >
            <FaAngleRight />
          </button>
        </div>
      </div>

      {/* tab display */}
      {selectedTab && (
        <div className="info-container relative">
          <div className="left-info-container">
            <div>
              <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl bg-pink-900 text-gray-100 dark:text-white dark:bg-pink-900 rounded-lg py-1 break-words overflow-hidden">
                {toon.data.data.toon.name}
              </p>
              <p className="text-lg md:text-xl lg:text-2xl pt-1">
                {toon.data.data.laff.current} / {toon.data.data.laff.max} laff
              </p>
              <p className="text-md md:text-xl lg:text-2xl">
                {toon.data.data.location.zone},{" "}
                {toon.data.data.location.district}
              </p>
            </div>
            <div className="toon-photo">
              <Image
                src={getImage()}
                alt={`${toon.data.data.toon.name} in pose ${pose}`}
                width={512}
                height={512}
                className="w-512 h-512"
                onClick={handleImageClick}
              />
            </div>
            <div className="flex flex-row items-center justify-center space-x-6">
              <div className="flex items-center space-x-1">
                <PiTipJarFill className="text-2xl text-pink-800" />
                <span className="text-lg">
                  {toon.data.data.beans.jar.current}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <BsPiggyBankFill className="text-2xl text-pink-800" />
                <span className="text-lg">
                  {toon.data.data.beans.bank.current}
                </span>
              </div>
            </div>
            <div className="text-lg">
              Cattlelog Series {toon.data.data.cattlelog.series} #
              {toon.data.data.cattlelog.issue}
            </div>
          </div>

          <div className="right-info-container">
            <selectedTab.component toon={toon} />
          </div>

          {selectedTab.tooltip && (
            <div className="hidden md:block absolute group bottom-0 right-0 px-2 bg-pink-700 dark:bg-blue-900 rounded-tl-xl border-t-4 border-l-4 border-pink-500 dark:border-blue-600">
              <span className="relative text-2xl text-white">?</span>
              <div className="absolute hidden group-hover:block bg-white border border-gray-700 text-gray-900 p-2 left-0 bottom-full transform -translate-x-[90%] w-64">
                {selectedTab.tooltip}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabContainer;
