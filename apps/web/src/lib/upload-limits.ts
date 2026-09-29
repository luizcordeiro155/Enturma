// Leaves room for multipart headers below the Vercel Function request limit.
export const MAX_WEB_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_WEB_REQUEST_BYTES = MAX_WEB_UPLOAD_BYTES + 64 * 1024;
