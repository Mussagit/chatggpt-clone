import mysql from "mysql2/promise";

// Detect if SSL should be enabled (required for most cloud MySQL providers like TiDB, Aiven, Railway)
const isSslEnabled =
	process.env.DB_SSL === "true" ||
	process.env.DB_SSL === "1" ||
	(process.env.NODE_ENV === "production" &&
		process.env.DB_HOST &&
		process.env.DB_HOST !== "localhost" &&
		process.env.DB_HOST !== "127.0.0.1");

const sslOption = isSslEnabled ? { rejectUnauthorized: false } : undefined;

let poolConfig;

if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
	poolConfig = {
		uri: process.env.DATABASE_URL || process.env.MYSQL_URL,
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0,
		...(sslOption ? { ssl: sslOption } : {}),
	};
} else {
	poolConfig = {
		host: process.env.DB_HOST || "127.0.0.1",
		port: Number(process.env.DB_PORT) || 3306,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0,
		...(sslOption ? { ssl: sslOption } : {}),
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
