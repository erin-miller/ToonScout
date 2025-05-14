import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import corsMiddleware from "./middlewares/cors.js";
import tokenRouter from "./routes/token.js";
import utilityRouter from "./routes/utility.js";
import scoutRouter from "./routes/scout.js";

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/token", tokenRouter);
app.use("/utility", utilityRouter);
app.use("/scout", scoutRouter);

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit();
});
