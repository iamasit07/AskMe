import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import app from "./app.js";
import { connectDatabase } from "./lib/prisma.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log("[SERVER] Starting server...");

  // Test database connection first
  const dbConnected = await connectDatabase();

  if (!dbConnected) {
    console.error(
      "[SERVER] WARNING: Server starting WITHOUT database connection!",
    );
    console.error("[SERVER] Check your DATABASE_URL in .env file");
    console.error("[SERVER] Make sure your IP is whitelisted in MongoDB Atlas");
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
  });
}

startServer();
