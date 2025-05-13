import "dotenv/config";
import { loadCommands } from "./utils.js";

const app = {
  commands: new Map(),
};

loadCommands(app);

console.log("Bot is running...");
