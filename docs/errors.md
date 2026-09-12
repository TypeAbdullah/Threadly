# Errors & Status Codes

Threadly uses conventional HTTP status codes and structured JSON error objects:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please slow down.",
    "status": 429
  }
}
```

## Standard Error Codes

| Code | Status | Description |
| :--- | :--- | :--- |
| `INVALID_CONFIG` | 400 | Missing or invalid parameters in request payload. |
| `CONTENT_REJECTED` | 400 | Submission violates community filters (spam/profanity). |
| `UNAUTHORIZED` | 401 | User must be logged in to comment. |
| `FORBIDDEN` | 403 | User is banned or muted on the site. |
| `FORBIDDEN_ORIGIN` | 403 | Host origin not present in site's allowedOrigins. |
| `NOT_FOUND` | 404 | Comment or site does not exist. |
| `RATE_LIMITED` | 429 | Action performed too frequently. |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error. |
