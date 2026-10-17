import "dotenv/config";

import express from "express";
import cors from "cors";
import compression from "compression";
import db, { initDb, checkDbHealth } from "./DB/db.config.js";
import { errorHandler } from "./src/middleware/error-handler.js";
import mainRouter from "./src/api/main.routes.js";

const app = express();
const PORT = process.env.PORT || 3777;

// ── Production Security & Proxy Configuration ─────────────────────────────────
app.disable("x-powered-by");
app.set("trust proxy", 1); // Enable secure proxy trust for Render / Cloudflare / Vercel

// ── Global Middleware ─────────────────────────────────────────────────────────

// Gzip/deflate compression for fast responses on mobile and low-bandwidth connections
app.use(compression());

// High-performance CORS configuration for all devices & browsers
const corsOriginConfig = process.env.CORS_ORIGIN
	? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
	: true; // true reflects request origin dynamically for any device/domain

app.use(
	cors({
		origin: corsOriginConfig,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"Accept",
			"X-Requested-With",
			"Origin",
		],
		maxAge: 86400, // Cache preflight requests for 24h to minimize mobile latency
	})
);

// Standard security headers
app.use((req, res, next) => {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");
	next();
});

// JSON & URL-encoded payload parsers (50MB to support mobile camera images & documents)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Health & Diagnostics Endpoints ────────────────────────────────────────────

// Root status endpoint
app.get("/", (req, res) => {
	res.status(200).json({
		name: "ChatGPT Clone Backend API",
		status: "online",
		version: "1.0.0",
		devicesSupported: "Desktop, Tablet, Mobile (iOS / Android)",
		docs: "/health",
	});
});

// Health check endpoint (Used by Render uptime probes & monitoring)
app.get(["/health", "/api/health"], async (req, res) => {
	const dbHealth = await checkDbHealth();
	const isHealthy = dbHealth.ok;

	res.status(isHealthy ? 200 : 503).json({
		status: isHealthy ? "healthy" : "degraded",
		timestamp: new Date().toISOString(),
		uptimeSeconds: Math.floor(process.uptime()),
		database: dbHealth.status,
		memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
	});
});

// ── Application Routes ────────────────────────────────────────────────────────
app.use("/api", mainRouter);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Server Startup & Graceful Lifecycle ───────────────────────────────────────
let server;

async function startServer() {
	try {
		// Verify DB connection
		await db.execute("SELECT 1");
		console.log("✅ Database connection verified");

		// Auto-initialize tables
		await initDb();
		console.log("✅ Database tables verified/initialized");

		// Listen on 0.0.0.0 to accept traffic from all devices and network interfaces
		server = app.listen(PORT, "0.0.0.0", () => {
			console.log(`🚀 Professional API running on http://0.0.0.0:${PORT}`);
			console.log(`📱 Ready to serve Desktop, Tablet & Mobile devices`);
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error.message);
		process.exit(1);
	}
}

// Graceful shutdown handling for zero-downtime deploys on Render
const shutdown = async (signal) => {
	console.log(`🛑 Received ${signal}. Shutting down server gracefully...`);
	if (server) {
		server.close(async () => {
			try {
				await db.end();
				console.log("📦 Database connection pool closed.");
			} catch (e) {
				console.error("Error closing DB pool:", e.message);
			}
			console.log("👋 Server process terminated cleanly.");
			process.exit(0);
		});
	} else {
		process.exit(0);
	}
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
