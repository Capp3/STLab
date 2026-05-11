export function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';
    const message = statusCode >= 500 ? 'Internal server error' : err.message;
    if (statusCode >= 500) {
        console.error('[error]', err);
    }
    res.status(statusCode).json({
        error: { code, message, detail: statusCode < 500 ? err.message : undefined },
    });
}
export function notFound(_req, res) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
}
export function createError(message, statusCode, code) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.code = code ?? 'ERROR';
    return err;
}
