import "dotenv/config";

import express from "express";
import db from "./DB/db.config.js";
import { errorHandler } from "./src/middleware/error-handler.js";
import mainRouter from "./src/api/main.routes.js";

const app = express();
const PORT = process.env.PORT || 3777;

// ── Middleware ────────────────────────────────────────────────────────────────

// CORS — allow all origins in development; tighten for production
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (req.method === "OPTIONS") return res.sendStatus(204);
	next();
});

// Limit JSON body to 50 MB to support photos and PDF documents
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", mainRouter);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Server startup ────────────────────────────────────────────────────────────
async function startServer() {
	try {
		// Verify DB is reachable before accepting traffic
		await db.execute("SELECT 1");
		console.log("✅ Database connection verified");

		app.listen(PORT, () => {
			console.log(`🚀 Server running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error.message);
		process.exit(1);
	}
}

startServer();
