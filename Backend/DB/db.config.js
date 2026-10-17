import mysql from "mysql2/promise";

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let poolConfig;

if (dbUrl) {
	try {
		const parsed = new URL(dbUrl);
		const isRemote = parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1";
		const sslRequired = process.env.DB_SSL === "false" ? false : isRemote;

		poolConfig = {
			host: parsed.hostname,
			port: Number(parsed.port) || 3306,
			user: decodeURIComponent(parsed.username || "root"),
			password: decodeURIComponent(parsed.password || ""),
			database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "defaultdb",
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
		};
	} catch {
		// Fallback to direct URI if URL parsing fails
		poolConfig = {
			uri: dbUrl,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			ssl: { rejectUnauthorized: false },
		};
	}
} else {
	const isRemote =
		process.env.DB_HOST &&
		process.env.DB_HOST !== "localhost" &&
		process.env.DB_HOST !== "127.0.0.1";
	const sslRequired =
		process.env.DB_SSL === "true" ||
		process.env.DB_SSL === "1" ||
		(process.env.NODE_ENV === "production" && isRemote);

	poolConfig = {
		host: process.env.DB_HOST || "127.0.0.1",
		port: Number(process.env.DB_PORT) || 3306,
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "",
		database: process.env.DB_NAME || "gpt_clone",
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0,
		...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
	};
}

const db = mysql.createPool(poolConfig);

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
