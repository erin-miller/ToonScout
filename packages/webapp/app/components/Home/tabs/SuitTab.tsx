import React, { useEffect, useState } from "react";
import { TabProps } from "./components/TabComponent";
import { findSuit, getSuitName, hasNoSuit } from "./components/utils";
import AnimatedTabContent from "@/app/components/animations/AnimatedTab";
import Image from "next/image";
const API_LINK = process.env.NEXT_PUBLIC_API_HTTP;

interface PromotionPath {
  path: Array<string>;
  total: number;
}

const deptChars = {
  sellbot: "s",
  cashbot: "m",
  lawbot: "l",
  bossbot: "c",
};

const SuitTab: React.FC<TabProps> = ({ toon }) => {
  if (hasNoSuit(toon)) {
    return null;
  }

  const first = findSuit(toon);
  const [dept, setDept] = useState(first || "s");
  const [promo, setPromo] = useState<PromotionPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [suit, setSuit] = useState(toon.data.data.cogsuits[dept]);

  useEffect(() => {
    const avail = Object.keys(toon.data.data.cogsuits);
    const currAvail = avail.includes(dept);

    if (!currAvail || !toon.data.data.cogsuits[dept]?.hasDisguise) {
      const firstAvail = avail.find(
        (department) => toon.data.data.cogsuits[department]?.hasDisguise
      );
      if (firstAvail) {
        setDept(firstAvail);
      }
    }

    const currentSuit = toon.data.data.cogsuits[dept];
    setSuit(currentSuit);

    const getPromo = async () => {
      const response = await fetch(API_LINK + "/utility/get-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ toonData: toon.data, dept }),
      });

      if (!response.ok) {
        return "Error loading promo data. Please try again later.";
      }

      const data = await response.json();
      setPromo(data);
      setLoading(false);
    };

    if (toon.data.data.cogsuits[dept]?.hasDisguise) {
      getPromo();
    }
  }, [toon, dept]);

  const sortPath = () => {
    if (!promo || !suit || suit.promotion?.current >= suit.promotion?.target)
      return [];
    const counts = promo.path.reduce((acc, activity) => {
      acc[activity] = (acc[activity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([activity, count]) => ({
      activity,
      count,
    }));
  };

  const getPromo = () => {
    const path = sortPath();

    return path.map((entry, index) => (
      <div key={index} className="promo-item">
        <div className="promo-count">{entry.count} </div>
        <div className="promo-activity">{entry.activity}</div>
      </div>
    ));
  };

  const formatProgress = () => {
    if (!suit) return "Loading...";
    if (suit.level === 50) {
      return "Maxed!";
    } else if (suit.promotion?.current >= suit.promotion?.target) {
      return "Ready!";
    } else {
      return `${suit.promotion?.current || 0} / ${suit.promotion?.target || 0}`;
    }
  };

  function formatPromo() {
    if (suit?.level === 50) {
      return <div className="promo-activity">Maxed!</div>;
    } else if (suit?.promotion?.current >= suit?.promotion?.target) {
      return <div className="promo-activity">Ready for promotion!</div>;
    } else if (promo) {
      return getPromo();
    } else {
      return <div>Loading...</div>;
    }
  }

  function formatRemaining() {
    const remainingNeeded = suit?.promotion?.target - suit?.promotion?.current;
    if (promo && remainingNeeded < promo.total && remainingNeeded > 0) {
      return <div>Remaining Needed: {remainingNeeded}</div>;
    }
    return null;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AnimatedTabContent>
      <div className="tab-suit-container">
        <div className="dept-container">
          <button
            onClick={() => setDept(deptChars.sellbot)}
            className="suit-btn"
            aria-selected={dept === deptChars.sellbot}
            disabled={!toon.data.data.cogsuits[deptChars.sellbot]?.hasDisguise}
          >
            <Image
              src="/images/emblem_sell.png"
              className="dept-photo"
              alt="Sellbot"
              width={96}
              height={96}
            />
          </button>
          <button
            onClick={() => setDept(deptChars.cashbot)}
            className="suit-btn"
            aria-selected={dept === deptChars.cashbot}
            disabled={!toon.data.data.cogsuits[deptChars.cashbot]?.hasDisguise}
          >
            <Image
              src="/images/emblem_cash.png"
              className="dept-photo"
              alt="Cashbot"
              width={96}
              height={96}
            />
          </button>
          <button
            onClick={() => setDept(deptChars.lawbot)}
            className="suit-btn"
            aria-selected={dept === deptChars.lawbot}
            disabled={!toon.data.data.cogsuits[deptChars.lawbot]?.hasDisguise}
          >
            <Image
              src="/images/emblem_law.png"
              className="dept-photo"
              alt="Lawbot"
              width={96}
              height={96}
            />
          </button>
          <button
            onClick={() => setDept(deptChars.bossbot)}
            className="suit-btn"
            aria-selected={dept === deptChars.bossbot}
            disabled={!toon.data.data.cogsuits[deptChars.bossbot]?.hasDisguise}
          >
            <Image
              src="/images/emblem_boss.png"
              className="dept-photo"
              alt="Bossbot"
              width={96}
              height={96}
            />
          </button>
        </div>
        <div className="suit-container">
          <div className="suit-overview">
            <div className="w-1/2  text-left">{getSuitName(toon, dept)}</div>
            <div className="w-1/5  text-left text-nowrap">
              {suit ? `Level ${suit.level}` : "No suit available"}
            </div>
            <div className="w-1/3  text-right">{formatProgress()}</div>
          </div>
          <div className="promo-rec">
            <div className="font-minnie sm:text-3xl 2xl:text-4xl pb-5 pt-1 text-blue-900 dark:text-blue-500">
              Recommended Activities
            </div>
            <div className="flex-1 flex-grow pb-4 md:pb-0">{formatPromo()}</div>
            <div className="footer pb-2 text-md sm:text-xl lg:text-2xl text-center">
              <div>
                {suit?.promotion?.current < suit?.promotion?.target &&
                  `Estimated Total: ${promo?.total}`}
              </div>
              <div>{formatRemaining()}</div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedTabContent>
  );
};

export default SuitTab;
