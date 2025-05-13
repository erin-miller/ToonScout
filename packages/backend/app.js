import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import corsMiddleware from "./middlewares/cors.js";
import interactionsRouter from "./routes/interactions.js";
import tokenRouter from "./routes/token.js";
import utilityRouter from "./routes/utility.js";
import botRouter from "./routes/bot.js";
import scoutRouter from "./routes/scout.js";
import { handleWebSocketConnection } from "./websocket.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/interactions", interactionsRouter);
app.use("/token", tokenRouter);
app.use("/utility", utilityRouter);
app.use("/bot", botRouter);
app.use("/scout", scoutRouter);

wss.on("connection", handleWebSocketConnection);

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit();
});
