import {
	createConversationService,
	getRecentConversationRows,
	getSessionsService,
	getSessionMessagesService,
	deleteSessionService,
	clearAllConversationsService,
} from "../service/chat.service.js";

// POST /api/chat/conversations  { question, sessionId, isThinkMode, files }
// Responds instantly with both user message and AI generated answer (supports Photos & PDFs)
async function createConversationController(req, res, next) {
	try {
		const { question, sessionId, isThinkMode, files } = req.body ?? {};

		const data = await createConversationService({
			question: question || "",
			sessionId,
			files: Array.isArray(files) ? files : [],
			isThinkMode: Boolean(isThinkMode),
		});

		return res.status(200).json({
			success: true,
			message: "Message processed successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

// GET /api/chat/sessions
async function getSessionsController(req, res, next) {
	try {
		const sessions = await getSessionsService();
		return res.status(200).json({
			success: true,
			data: sessions,
		});
	} catch (error) {
		next(error);
	}
}

// GET /api/chat/sessions/:sessionId/messages
async function getSessionMessagesController(req, res, next) {
	try {
		const { sessionId } = req.params;
		const messages = await getSessionMessagesService(sessionId);
		return res.status(200).json({
			success: true,
			data: messages,
		});
	} catch (error) {
		next(error);
	}
}

// DELETE /api/chat/sessions/:sessionId
async function deleteSessionController(req, res, next) {
	try {
		const { sessionId } = req.params;
		const result = await deleteSessionService(sessionId);
		return res.status(200).json({
			success: true,
			message: result.message,
		});
	} catch (error) {
		next(error);
	}
}

// GET /api/chat/conversations?limit=10
async function getConversationsController(req, res, next) {
	try {
		const rawLimit = req.query.limit;
		const limit = rawLimit
			? Math.min(Math.max(Number.parseInt(rawLimit, 10) || 10, 1), 500)
			: 10;

		const result = await getRecentConversationRows(limit);

		return res.status(200).json({
			success: true,
			message: "Conversations fetched successfully.",
			count: result.length,
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

// DELETE /api/chat/conversations
async function clearConversationsController(req, res, next) {
	try {
		const result = await clearAllConversationsService();
		return res.status(200).json({
			success: true,
			message: result.message,
		});
	} catch (error) {
		next(error);
	}
}

export {
	createConversationController,
	getSessionsController,
	getSessionMessagesController,
	deleteSessionController,
	getConversationsController,
	clearConversationsController,
};
