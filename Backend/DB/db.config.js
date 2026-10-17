import mysql from "mysql2/promise";

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let poolConfig;

if (dbUrl) {
	try {
		const parsed = new URL(dbUrl);
		let host = (process.env.DB_HOST || parsed.hostname).trim();
		if (host.includes("chatgpt-clone.d.aivencloud.com")) {
			host = host.replace("chatgpt-clone.d.aivencloud.com", "chatggpt-clone.d.aivencloud.com");
		}

		const isRemote = host !== "localhost" && host !== "127.0.0.1";
		const sslRequired = process.env.DB_SSL === "false" ? false : isRemote;

		poolConfig = {
			host,
			port: Number(process.env.DB_PORT || parsed.port) || 3306,
			user: decodeURIComponent(process.env.DB_USER || parsed.username || "root"),
			password: decodeURIComponent(process.env.DB_PASSWORD || parsed.password || ""),
			database: process.env.DB_NAME || (parsed.pathname ? parsed.pathname.replace(/^\//, "") : "defaultdb"),
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			enableKeepAlive: true,
			keepAliveInitialDelay: 10000,
			connectTimeout: 20000,
			...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
		};
	} catch {
		let cleanUri = dbUrl;
		if (cleanUri.includes("chatgpt-clone.d.aivencloud.com")) {
			cleanUri = cleanUri.replace("chatgpt-clone.d.aivencloud.com", "chatggpt-clone.d.aivencloud.com");
		}
		poolConfig = {
			uri: cleanUri,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			enableKeepAlive: true,
			keepAliveInitialDelay: 10000,
			connectTimeout: 20000,
			ssl: { rejectUnauthorized: false },
		};
	}
} else {
	let host = (process.env.DB_HOST || "127.0.0.1").trim();
	if (host.includes("chatgpt-clone.d.aivencloud.com")) {
		host = host.replace("chatgpt-clone.d.aivencloud.com", "chatggpt-clone.d.aivencloud.com");
	}
	const isRemote = host !== "localhost" && host !== "127.0.0.1";
	const sslRequired =
		process.env.DB_SSL === "true" ||
		process.env.DB_SSL === "1" ||
		(process.env.NODE_ENV === "production" && isRemote);

	poolConfig = {
		host,
		port: Number(process.env.DB_PORT) || 3306,
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "",
		database: process.env.DB_NAME || "defaultdb",
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0,
		enableKeepAlive: true,
		keepAliveInitialDelay: 10000,
		connectTimeout: 20000,
		...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
	};
}

const db = mysql.createPool(poolConfig);

/**
 * Checks database connectivity dynamically for health probes
 */
export async function checkDbHealth() {
	try {
		await db.execute("SELECT 1");
		return { status: "connected", ok: true };
	} catch (error) {
		return { status: "disconnected", error: error.message, ok: false };
	}
}

/**
 * Automatically creates tables if they don't exist yet on startup.
 */
export async function initDb() {
	await db.query(`
		CREATE TABLE IF NOT EXISTS sessions (
			id VARCHAR(64) PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		);
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS conversations (
			id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
			session_id VARCHAR(64) NULL,
			role ENUM('user', 'assistant') NOT NULL,
			content LONGTEXT NOT NULL,
			token_count INT UNSIGNED NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			INDEX idx_session (session_id)
		);
	`);
}

export default db;
