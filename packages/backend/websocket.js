import { storeScoutToken } from "./db/scoutData/scoutService.js";

export function handleWebSocketConnection(ws) {
  ws.on("message", async (message) => {
    const { userId, data } = JSON.parse(message);
    if (!userId || !data) {
      ws.send(JSON.stringify({ error: "User ID and data are required." }));
      return;
    }

    if (data.event !== "all") {
      ws.send(
        JSON.stringify({ message: 'Event is not "all", skipping data entry.' }),
      );
      return;
    }

    try {
      await storeScoutToken(userId, JSON.stringify(data));
      ws.send(JSON.stringify({ message: "Data saved successfully." }));
    } catch (error) {
      console.error("Error saving data:", error);
      ws.send(JSON.stringify({ error: "Internal server error." }));
    }
  });
}
