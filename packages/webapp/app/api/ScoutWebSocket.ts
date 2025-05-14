const MAX_SCOUT_ATTEMPTS = 10;
const RECONNECT_DELAY = 10000;
const SCOUT_LINK =
  process.env.NEXT_PUBLIC_BOT_WSS || "wss://bot.scouttoon.info";
let scout: WebSocket | null = null;
let scoutAttempts = 0;

export const initScoutWebSocket = () => {
  const connectScoutWebSocket = () => {
    scout = new WebSocket(SCOUT_LINK);

    scout.onopen = () => {
      console.log("Scout WebSocket connection established");
      scoutAttempts = 0;
    };

    scout.onerror = (error) => {
      console.error("Scout WebSocket error:", error);
    };

    scout.onclose = () => {
      console.log("Scout WebSocket connection closed");
      handleScoutReconnection();
    };
  };

  const handleScoutReconnection = () => {
    if (scoutAttempts < MAX_SCOUT_ATTEMPTS) {
      scoutAttempts++;
      console.log(
        `Attempting to reconnect to Scout WebSocket in ${RECONNECT_DELAY} ms...`
      );
      setTimeout(connectScoutWebSocket, RECONNECT_DELAY);
    } else {
      console.log("Max reconnection attempts for Scout WebSocket reached.");
    }
  };

  connectScoutWebSocket();
};

export const sendScoutData = (userId: string, data: any) => {
  if (scout && scout.readyState === WebSocket.OPEN) {
    scout.send(JSON.stringify({ userId, data }));
  } else {
    console.error("Scout WebSocket connection is not open:", scout?.readyState);
  }
};
