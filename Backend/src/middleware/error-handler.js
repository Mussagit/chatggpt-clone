export const errorHandler = (err, req, res, next) => {
	const status = err.status || 500;

	// Log server errors (5xx) with full stack; client errors (4xx) just the message
	if (status >= 500) {
		console.error(`[${new Date().toISOString()}] ❌ ${req.method} ${req.originalUrl}`, err);
	} else {
		console.warn(`[${new Date().toISOString()}] ⚠️  ${req.method} ${req.originalUrl} — ${err.message}`);
	}

	return res.status(status).json({
		success: false,
		message: err.message || "Something went wrong. Please try again later.",
	});
};
