import "dotenv/config";
import { loadCommands } from "./util/discord.js";
import { handleWebSocketConnection } from "./util/websocket.js";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import corsMiddleware from "./middlewares/cors.js";
import interactionRouter from "./routes/interactions.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4000;

// middlewares
app.use(corsMiddleware);
app.use(express.json());

// load commands
app.commands = new Map();
loadCommands(app);

// routes
app.use("/interactions", interactionRouter);

// server connections
wss.on("connection", handleWebSocketConnection);

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit();
});
