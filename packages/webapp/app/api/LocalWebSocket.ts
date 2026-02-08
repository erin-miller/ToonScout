import { StoredToonData } from "../types";
import { fetchSillyMeter } from "../utils/sillyMeter";

const DEFAULT_PORTS = [1547, 1548, 1549, 1550, 1551, 1552, 1553, 1554];
const REQ_INTERVAL = 5000;

let debugFlag = process.env.DEBUG_FLAG

let contReqInterval: NodeJS.Timeout | null = null;

let sockets: { [port: number]: WebSocket | null } = {};
let active: number[] = [];

let setIsConnected: (isConnected: boolean) => void;
let addActivePort: (port: number) => void;
let removeActivePort: (port: number) => void;
let addToon: (data: any) => void;

function debug(port: number | "global", message: string) {
  if (debugFlag == "true") {
    console.log(`==DEBUG== [${port}]: ${message}`);
  }
}

export const initWebSocket = (
  setIsConnectedFn: (isConnected: boolean) => void,
  addActivePortFn: (port: number) => void,
  removeActivePortFn: (port: number) => void,
  addToonFn: (data: any) => void,
) => {
  debug("global", "initWebSocket");

  setIsConnected = setIsConnectedFn;
  addActivePort = addActivePortFn;
  removeActivePort = removeActivePortFn;
  addToon = addToonFn;

  // Pre-fetch sillymeter data so it's cached before toon data arrives
  fetchSillyMeter();
  
  connectWebSocket();
};

const connectWebSocket = () => {
  DEFAULT_PORTS.forEach((port) => {
    const curr = sockets[port];

    if (
      curr &&
      curr.readyState !== WebSocket.CLOSED &&
      curr.readyState !== WebSocket.CLOSING
    ) {
      debug(port, "socket already active, skipping");
      return;
    }

    debug(port, "creating websocket");
    const socket = new WebSocket(`ws://localhost:${port}`);
    sockets[port] = socket;

    socket.addEventListener("open", () => {
      debug(port, "socket open");

      let token = sessionStorage.getItem("ttauth-state");
      if (token === null) {
        token = initAuthToken();
        sessionStorage.setItem("ttauth-state", token);
        debug(port, "generated new auth token");
      }

      socket.send(JSON.stringify({ authorization: token, name: "ToonScout" }));
      debug(port, "authorized");

      socket.send(JSON.stringify({ request: "all" }));
      debug(port, "sent initial request");

      startContinuousRequests();
    });

    socket.addEventListener("message", async (event) => {
      debug(port, "message received");
      addPort(port);
      updateConnectionStatus();

      const toon = JSON.parse(event.data);

      if (toon.event === "all") {
        debug(port, "processing toon data");
        const timestamp = Date.now();
        const sillyMeter = await fetchSillyMeter();
        const overjoyed = sillyMeter?.isOverjoyedActive ?? false;
        const localToon = { data: toon, timestamp, port, locked: false, overjoyed };
        const data = localStorage.getItem("toonData");
        let curr = data ? JSON.parse(data) : [];

        if (!curr || curr.length === 0) {
          debug(port, "no existing toons, inserting");
          curr = [localToon];
        } else {
          const toonIndex = curr.findIndex(
            (stored: StoredToonData) =>
              stored.data.data.toon.id == toon.data.toon.id,
          );

          if (toonIndex !== -1) {
            debug(port, "toon already exists, preserving lock state");
            localToon.locked = curr[toonIndex].locked;
          }

          const portIndex = curr.findIndex(
            (stored: StoredToonData) =>
              stored.port === port &&
              stored.data.data.toon.id != toon.data.toon.id,
          );

          if (portIndex !== -1) {
            debug(port, "port reassigned from another toon");
            curr[portIndex].port = null;
            addToon(curr[portIndex]);
          }
        }
        addToon(localToon);
      }
    });

    socket.addEventListener("error", (error) => {
      debug(port, `socket error: ${String(error)}`);
      cleanupWebSocket(port);
    });

    socket.addEventListener("close", () => {
      debug(port, "socket closed");
      cleanupWebSocket(port);
      updateConnectionStatus();
      if (active.length === 0) {
        debug("global", "no active ports, stopping continuous requests");
        stopContinuousRequests();
      }
    });
  });
};

function cleanupWebSocket(port: number) {
  debug(port, "cleanup");
  removePort(port);
  const socket = sockets[port];
  if (socket) {
    sockets[port] = null;
  }
  updateConnectionStatus();
}

function startContinuousRequests() {
  if (contReqInterval) {
    debug("global", "continuous requests already running");
    return;
  }

  debug("global", "starting continuous requests");

  contReqInterval = setInterval(() => {
    Object.entries(sockets).forEach(([p, socket]) => {
      const port = Number(p);

      if (socket && socket.readyState === WebSocket.OPEN) {
        debug(port, "sending periodic request");
        socket.send(JSON.stringify({ request: "all" }));
      } else {
        debug(port, `skipping request (state=${socket?.readyState})`);
      }
    });
  }, REQ_INTERVAL);
}

function stopContinuousRequests() {
  if (!contReqInterval) {
    debug("global", "continuous requests not running");
    return;
  }

  debug("global", "stopping continuous requests");
  clearInterval(contReqInterval);
  contReqInterval = null;
}

function updateConnectionStatus() {
  debug("global", `connection status: ${active.length > 0}`);
  setIsConnected(active.length > 0);
}

function addPort(port: number) {
  if (!active.includes(port)) {
    debug(port, "port marked active");
    active.push(port);
  }
  addActivePort(port);
}

function removePort(port: number) {
  debug(port, "port removed");
  active = active.filter((p) => p !== port);
  removeActivePort(port);
}

function initAuthToken() {
  const length = 16;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length })
    .map(() => characters[Math.floor(Math.random() * characters.length)])
    .join("");
}
