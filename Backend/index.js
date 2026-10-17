import "dotenv/config";

import express from "express";
import db, { initDb } from "./DB/db.config.js";
import { errorHandler } from "./src/middleware/error-handler.js";
import mainRouter from "./src/api/main.routes.js";

const app = express();
const PORT = process.env.PORT || 3777;

// ── Middleware ────────────────────────────────────────────────────────────────

// CORS — supports localhost, Vercel deployments, or custom origins
app.use((req, res, next) => {
	const origin = req.headers.origin;
	const configuredOrigins = process.env.CORS_ORIGIN
		? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
		: ["*"];

	if (configuredOrigins.includes("*")) {
		res.setHeader("Access-Control-Allow-Origin", origin || "*");
	} else if (origin && configuredOrigins.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
	}

	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, Accept, X-Requested-With"
	);
	res.setHeader("Access-Control-Allow-Credentials", "true");

	if (req.method === "OPTIONS") return res.sendStatus(204);
	next();
});

// Limit JSON body to 50 MB to support photos and PDF documents
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Health & Status Endpoints (Crucial for Render deployments) ────────────────
app.get("/health", (req, res) => {
	res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
	res.status(200).json({ message: "ChatGPT Clone Backend API is running." });
});

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

		// Ensure tables exist
		await initDb();
		console.log("✅ Database tables verified/initialized");

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error.message);
		process.exit(1);
	}
}

startServer();
