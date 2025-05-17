interface GagExperience {
  current: number;
  next: number;
}

interface Gag {
  gag: {
    level: number;
    name: string;
  };
  organic: any;
  experience: GagExperience;
}

interface Toon {
  id: string;
  name: string;
  species: string;
  headColor: string;
  style: string;
}

interface Location {
  zone: string;
  neighborhood: string;
  district: string;
  instanceId: number;
}

interface TaskProgress {
  text: string;
  current: number;
  target: number;
}

export interface Task {
  objective: {
    text: string;
    where: string;
    progress: TaskProgress;
  };
  from: {
    name: string;
    building: string;
    zone: string;
    neighborhood: string;
  };
  to: {
    name: string;
    building: string;
    zone: string;
    neighborhood: string;
  };
  reward: string;
  deletable: boolean;
}

interface FishAlbumEntry {
  name: string;
  weight: number;
}

export interface FishRarity {
  name: string;
  probability: number;
  location: string;
  buckets: {
    confBuckets: number;
    confTime: number;
    avgBuckets: number;
    avgTime: number;
  };
}

interface Fish {
  rod: {
    id: number;
    name: string;
  };
  collection: Record<
    number,
    {
      name: string;
      album: FishAlbumEntry[];
    }
  >;
}

interface Flower {
  shovel: {
    id: number;
    name: string;
    curSkill: number;
    maxSkill: number;
  };
  wateringCan: {
    id: number;
    name: string;
    curSkill: number;
    maxSkill: number;
  };
  collection: Record<
    number,
    {
      name: string;
      album: string[];
    }
  >;
}

interface Cogsuit {
  department: string;
  hasDisguise: boolean;
  suit: {
    id: string;
    name: string;
  };
  version: number;
  level: number;
  promotion: {
    current: number;
    target: number;
  };
}

interface Golf {
  name: string;
  num: number;
}

interface Racing {
  name: string;
  num: number;
}

interface Rewards {
  sos: null | Record<string, number>;
  unites: null | {
    "Toon-Up": Record<string, number>;
    "Gag-Up": Record<string, number>;
    Jellybeans: Record<string, number>;
  };
  summons: null | Record<
    string,
    {
      name: string;
      single: boolean;
      building: boolean;
      invasion: boolean;
    }
  >;
  pinkslips: number;
  remotes: null | {
    "Damage Remote": Record<string, number>;
    "Toon-Up Remote": Record<string, number>;
  };
}

export interface ToonData {
  event: string;
  data: {
    toon: Toon;
    laff: {
      current: number;
      max: number;
    };
    location: Location;
    gags: {
      [key: string]: Gag | null;
    };
    tasks: Task[];
    invasion: any;
    fish: Fish;
    flowers: Flower;
    cogsuits: Record<string, Cogsuit>;
    golf: Golf[];
    racing: Racing[];
    rewards: Rewards;
    beans: {
      jar: {
        current: number;
        max: number;
      };
      bank: {
        current: number;
        max: number;
      };
    };
    cattlelog: {
      series: number;
      issue: number;
    };
  };
}

export interface StoredToonData {
  data: ToonData;
  timestamp: number;
  port: number;
  locked: boolean;
}
