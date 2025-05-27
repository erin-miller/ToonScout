import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import corsMiddleware from "./middlewares/cors.js";
import tokenRouter from "./routes/token.js";
import utilityRouter from "./routes/utility.js";
import scoutRouter from "./routes/scout.js";
import rateLimit from "express-rate-limit";

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1); // Trust first proxy (for rate limiting)

//Basic rate limiting middleware (e.g., 1000 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use(apiLimiter);

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
