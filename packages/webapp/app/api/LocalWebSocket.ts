import { StoredToonData } from "../types";

const DEFAULT_PORTS = [1547, 1548, 1549, 1550, 1551, 1552, 1553, 1554];
const REQ_INTERVAL = 5000;

let contReqInterval: NodeJS.Timeout | null = null;

let sockets: { [port: number]: WebSocket | null } = {};
let active: number[] = [];

let setIsConnected: (isConnected: boolean) => void;
let addActivePort: (port: number) => void;
let removeActivePort: (port: number) => void;
let addToon: (data: any) => void;

export const initWebSocket = (
  setIsConnectedFn: (isConnected: boolean) => void,
  addActivePortFn: (port: number) => void,
  removeActivePortFn: (port: number) => void,
  addToonFn: (data: any) => void
) => {
  setIsConnected = setIsConnectedFn;
  addActivePort = addActivePortFn;
  removeActivePort = removeActivePortFn;
  addToon = addToonFn;

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
      return;
    }

    const socket = new WebSocket(`ws://localhost:${port}`);
    sockets[port] = socket;

    socket.addEventListener("open", () => {
      let token = sessionStorage.getItem("ttauth-state");
      if (token === null) {
        token = initAuthToken();
        sessionStorage.setItem("ttauth-state", token);
      }
      socket.send(JSON.stringify({ authorization: token, name: "ToonScout" }));
      socket.send(JSON.stringify({ request: "all" }));
      startContinuousRequests();
    });

    socket.addEventListener("message", (event) => {
      addPort(port);
      updateConnectionStatus();

      const toon = JSON.parse(event.data);
      if (toon.event === "all") {
        const timestamp = Date.now();
        const localToon = { data: toon, timestamp, port, locked: false };
        const data = localStorage.getItem("toonData");
        let curr = data ? JSON.parse(data) : [];
        if (!curr || curr.length <= 0) {
          curr = [localToon];
        } else {
          // check if this toon exists in the storage
          const toonIndex = curr.findIndex(
            (stored: StoredToonData) =>
              stored.data.data.toon.id == toon.data.toon.id
          );

          if (toonIndex !== -1) {
            // exists
            localToon.locked = curr[toonIndex].locked;
          }

          // remove same ports from other toons in the data
          const portIndex = curr.findIndex(
            (stored: StoredToonData) =>
              stored.port === port &&
              stored.data.data.toon.id != toon.data.toon.id
          );

          if (portIndex !== -1) {
            // there is another toon with the port
            curr[portIndex].port = null;
            addToon(curr[portIndex]);
          }
        }
        addToon(localToon);
      }
    });

    socket.addEventListener("error", (error) => {
      cleanupWebSocket(port);
    });

    socket.addEventListener("close", () => {
      cleanupWebSocket(port);
      updateConnectionStatus();
      if (active.length === 0) {
        stopContinuousRequests();
      }
    });
  });
};

function cleanupWebSocket(port: number) {
  removePort(port);
  const socket = sockets[port];
  if (socket) {
    socket.removeEventListener("open", () => {});
    socket.removeEventListener("message", () => {});
    socket.removeEventListener("error", () => {});
    socket.removeEventListener("close", () => {});
    sockets[port] = null;
  }
}

function startContinuousRequests() {
  if (contReqInterval) return;

  contReqInterval = setInterval(() => {
    // Send requests for each socket
    Object.values(sockets).forEach((socket) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ request: "all" }));
      }
    });
  }, REQ_INTERVAL);
}

function stopContinuousRequests() {
  if (contReqInterval) {
    clearInterval(contReqInterval);
    contReqInterval = null;
  }
}

function updateConnectionStatus() {
  setIsConnected(active.length > 0);
}

function addPort(port: number) {
  if (!active.includes(port)) {
    active.push(port);
  }
  addActivePort(port);
}

function removePort(port: number) {
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
