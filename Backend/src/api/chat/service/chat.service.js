import db from "../../../../DB/db.config.js";
import { GoogleGenAI } from "@google/genai";

const MAX_QUESTION_LENGTH = 10000;

const PRIMARY_MODEL = process.env.GEMINI_MODEL_NAME || "gemini-3.7-flash";
const FALLBACK_MODELS = [
	"gemini-3.5-flash-lite",
	"gemini-3.1-flash-lite",
	"gemini-3.1-pro-preview",
];

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isUnavailable = (error) =>
	error?.status === 503 || error?.status === 404 || error?.status === 429;

// Helper to parse content if stored as JSON with files
const formatRowContent = (row) => {
	try {
		if (row.content && row.content.startsWith("{") && row.content.endsWith("}")) {
			const parsed = JSON.parse(row.content);
			if (parsed && (parsed.text !== undefined || parsed.files !== undefined)) {
				return {
					...row,
					content: parsed.text || "",
					files: parsed.files || [],
				};
			}
		}
	} catch {
		// Not JSON, return regular row
	}
	return {
		...row,
		files: [],
	};
};

// ── Sessions & Conversation Helpers ──────────────────────────────────────────

export const getSessionsService = async () => {
	const [rows] = await db.execute(
		`SELECT s.id, s.title, s.created_at, s.updated_at,
		 (SELECT COUNT(*) FROM conversations c WHERE c.session_id = s.id) as message_count
		 FROM sessions s
		 ORDER BY s.updated_at DESC
		 LIMIT 50`
	);
	return rows;
};

export const getSessionMessagesService = async (sessionId) => {
	if (!sessionId) return [];
	const [rows] = await db.execute(
		`SELECT id, session_id, role, content, created_at
		 FROM conversations
		 WHERE session_id = ?
		 ORDER BY id ASC`,
		[sessionId]
	);
	return rows.map(formatRowContent);
};

export const deleteSessionService = async (sessionId) => {
	if (!sessionId) throw new Error("Session ID is required.");
	await db.execute("DELETE FROM conversations WHERE session_id = ?", [sessionId]);
	await db.execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
	return { success: true, message: "Session deleted." };
};

export const getRecentConversationRows = async (limit = 20) => {
	const safeLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 20, 500));
	const [rows] = await db.execute(
		`SELECT id, session_id, role, content, created_at
		 FROM conversations
		 ORDER BY id DESC
		 LIMIT ${safeLimit}`
	);
	return rows.reverse().map(formatRowContent);
};

// ── Gemini Multimodal Fast AI Generation (Supports Text, Images, and PDFs) ───

const generateAssistantAnswer = async ({ historyRows, question, files = [], isThinkMode = false }) => {
	const historyContents = historyRows.slice(-8).map((row) => ({
		role: row.role === "assistant" ? "model" : "user",
		parts: [{ text: row.content || "Attached file" }],
	}));

	const userParts = [];

	// Add Multimodal Files (Photos and PDFs)
	if (files && Array.isArray(files) && files.length > 0) {
		for (const f of files) {
			if (f.data && f.mimeType) {
				const cleanBase64 = f.data.replace(/^data:[^;]+;base64,/, "");
				userParts.push({
					inlineData: {
						mimeType: f.mimeType,
						data: cleanBase64,
					},
				});
			}
		}
	}

	// Add text part
	const promptText = question?.trim() || (files.length > 0 ? "Please carefully analyze and explain the attached photo/PDF." : "");
	if (promptText) {
		userParts.push({ text: promptText });
	}

	const contents = [
		...historyContents,
		{
			role: "user",
			parts: userParts,
		},
	];

	const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];

	for (let i = 0; i < modelsToTry.length; i++) {
		const model = modelsToTry[i];
		const isLastModel = i === modelsToTry.length - 1;

		try {
			const result = await geminiClient.models.generateContent({
				model,
				contents,
			});

			const text = result?.text;
			const totalTokens = result?.usageMetadata?.totalTokenCount ?? 0;

			if (!text) throw new Error("AI returned an empty response. Please try again.");

			return { text, totalTokens };
		} catch (error) {
			if (isUnavailable(error) && !isLastModel) {
				console.warn(`⚠️ Model ${model} status ${error.status}. Falling back...`);
				await sleep(300);
				continue;
			}
			throw error;
		}
	}

	const err = new Error("The AI service is temporarily unavailable. Please try again.");
	err.status = 503;
	throw err;
};

// ── Main Chat Service ─────────────────────────────────────────────────────────

export async function createConversationService({ question = "", sessionId = null, files = [], isThinkMode = false }) {
	const trimmedQuestion = typeof question === "string" ? question.trim() : "";

	if (!trimmedQuestion && (!files || files.length === 0)) {
		const error = new Error("Please provide a question or attach a photo/PDF.");
		error.status = 400;
		throw error;
	}

	if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
		const error = new Error(`Question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters.`);
		error.status = 400;
		throw error;
	}

	// 1. Resolve or create Session
	let activeSessionId = sessionId;
	let sessionTitle = "New Chat";

	if (!activeSessionId) {
		activeSessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		if (trimmedQuestion) {
			sessionTitle = trimmedQuestion.length > 36
				? `${trimmedQuestion.substring(0, 36).trim()}...`
				: trimmedQuestion;
		} else if (files.length > 0) {
			sessionTitle = `File: ${files[0].name.substring(0, 30)}`;
		}

		await db.execute(
			"INSERT INTO sessions (id, title) VALUES (?, ?)",
			[activeSessionId, sessionTitle]
		);
	} else {
		await db.execute(
			"UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			[activeSessionId]
		);
	}

	// 2. Fetch conversation history for this session
	const historyRows = await getSessionMessagesService(activeSessionId);

	// 3. Save user message to database (store text + files metadata)
	const rawUserContent = files.length > 0
		? JSON.stringify({ text: trimmedQuestion, files })
		: trimmedQuestion;

	const [userInsertResult] = await db.execute(
		"INSERT INTO conversations (session_id, content, role) VALUES (?, ?, 'user')",
		[activeSessionId, rawUserContent]
	);

	const userMessage = {
		id: userInsertResult.insertId,
		sessionId: activeSessionId,
		role: "user",
		content: trimmedQuestion,
		files: files || [],
		tokenCount: 0,
		createdAt: new Date().toISOString(),
	};

	// 4. Fast Direct Multimodal AI generation
	let assistantMessage;
	try {
		const { text, totalTokens } = await generateAssistantAnswer({
			historyRows,
			question: trimmedQuestion,
			files,
			isThinkMode,
		});

		const [assistantInsertResult] = await db.execute(
			"INSERT INTO conversations (session_id, role, content, token_count) VALUES (?, 'assistant', ?, ?)",
			[activeSessionId, text, totalTokens]
		);

		assistantMessage = {
			id: assistantInsertResult.insertId,
			sessionId: activeSessionId,
			role: "assistant",
			content: text,
			files: [],
			tokenCount: totalTokens,
			createdAt: new Date().toISOString(),
		};
	} catch (error) {
		console.error("❌ Multimodal AI Generation Error:", error.message);
		const fallbackText = `Sorry, I couldn't generate a response. ${error.message}`;

		const [errInsertResult] = await db.execute(
			"INSERT INTO conversations (session_id, role, content, token_count) VALUES (?, 'assistant', ?, 0)",
			[activeSessionId, fallbackText]
		);

		assistantMessage = {
			id: errInsertResult.insertId,
			sessionId: activeSessionId,
			role: "assistant",
			content: fallbackText,
			files: [],
			tokenCount: 0,
			createdAt: new Date().toISOString(),
		};
	}

	return {
		sessionId: activeSessionId,
		sessionTitle,
		userMessage,
		assistantMessage,
	};
}

export async function clearAllConversationsService() {
	await db.execute("DELETE FROM conversations");
	await db.execute("DELETE FROM sessions");
	return { success: true, message: "All conversations and sessions have been cleared." };
}
