import { StoredToonData } from "@/app/types";
import { golf_trophies } from "@/data/golf_trophies";
import { race_trophies } from "@/data/race_trophies";

export const displaySuit = (toon: StoredToonData, type: string) => {
  if (!toon.data.data.cogsuits[type].hasDisguise) {
    return;
  }

  const getPromotion = () => {
    if (dept.level == 50) {
      return "Maxed!";
    } else if (dept.promotion.current >= dept.promotion.target) {
      return "Ready for promotion!";
    } else {
      return `${dept.promotion.current} / ${dept.promotion.target}`;
    }
  };

  let dept = toon.data.data.cogsuits[type];
  return (
    <div className="flex justify-center py-7 text-lg lg:text-xl xl:text-2xl w-full">
      <div className="w-full">
        <h1>{getSuitName(toon, type)}</h1>
      </div>
      <div className="w-full">
        <h2>Level {dept.level}</h2>
      </div>
      <div className="w-full">
        <h2>{getPromotion()}</h2>
      </div>
    </div>
  );
};

export const hasNoSuit = (toon: StoredToonData) => {
  const depts = ["s", "m", "l", "c"];
  let count = 0;
  for (const dept of depts) {
    if (toon.data.data.cogsuits[dept].hasDisguise) {
      count += 1;
    }
  }
  return count == 0 ? true : false;
};

export const findSuit = (toon: StoredToonData) => {
  const depts = ["s", "m", "l", "c"];
  for (const dept of depts) {
    if (toon.data.data.cogsuits[dept].hasDisguise) {
      return dept;
    }
  }
  return null;
};

export const getSuitName = (toon: StoredToonData, type: string) => {
  if (!toon.data.data.cogsuits[type].hasDisguise) {
    return;
  }
  let dept = toon.data.data.cogsuits[type];
  if (dept.version == 2) {
    return `${dept.suit.name} v2.0`;
  }
  return dept.suit.name;
};

export const sumFish = (toon: StoredToonData) => {
  const fish = [];
  for (const key in toon.data.data.fish.collection) {
    const album = toon.data.data.fish.collection[key].album;
    for (const type in album) {
      fish.push(album[type].name);
    }
  }
  return fish.length;
};

export const sumGolf = (toon: StoredToonData) => {
  let count = 0;
  for (const trophy of golf_trophies) {
    const earned =
      toon.data.data.golf.find((item) => item.name == trophy.description)
        ?.num || 0;
    for (const val of trophy.values) {
      if (earned >= val) {
        count += 1;
      }
    }
  }
  return count;
};

export const sumRace = (toon: StoredToonData) => {
  let count = 0;
  for (const trophy of race_trophies) {
    const earned =
      toon.data.data.racing.find((item) => item.name == trophy.description)
        ?.num || 0;
    for (const val of trophy.values) {
      if (earned >= val) {
        count += 1;
      }
    }
  }
  return count;
};

export const getGolfTrophies = (toon: StoredToonData) => {
  const count = sumGolf(toon);
  return count >= 10 ? Math.floor(count / 10) : 0;
};

export const getRaceTrophies = (toon: StoredToonData) => {
  const count = sumRace(toon);
  return count >= 10 ? Math.floor(count / 10) : 0;
};

export const sumFlowers = (toon: StoredToonData) => {
  let collection = toon.data.data.flowers.collection;
  let count = 0;
  for (const key in collection) {
    if (collection.hasOwnProperty(key)) {
      count += Object.keys(collection[key].album).length;
    }
  }
  return count;
};
