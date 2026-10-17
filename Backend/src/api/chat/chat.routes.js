import express from "express";
import {
	createConversationController,
	getConversationsController,
	clearConversationsController,
	getSessionsController,
	getSessionMessagesController,
	deleteSessionController,
} from "./controller/chat.controller.js";

const chatRouter = express.Router();

// ── Session Routes ────────────────────────────────────────────────────────────
// GET /api/chat/sessions
chatRouter.get("/sessions", getSessionsController);

// GET /api/chat/sessions/:sessionId/messages
chatRouter.get("/sessions/:sessionId/messages", getSessionMessagesController);

// DELETE /api/chat/sessions/:sessionId
chatRouter.delete("/sessions/:sessionId", deleteSessionController);

// ── Conversation Routes ───────────────────────────────────────────────────────
// POST /api/chat/conversations  { "question": "...", "sessionId": "...", "isThinkMode": false }
chatRouter.post("/conversations", createConversationController);

// GET /api/chat/conversations?limit=100
chatRouter.get("/conversations", getConversationsController);

// DELETE /api/chat/conversations
chatRouter.delete("/conversations", clearConversationsController);

export default chatRouter;
