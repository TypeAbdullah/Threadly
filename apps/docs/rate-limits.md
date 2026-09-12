# Rate Limits

Threadly protects against bot spam and abuse with multi-tiered rate limiting:

| Action | Limit | Window |
| :--- | :--- | :--- |
| Comment Creation | 10 requests | 60 seconds |
| Replies | 15 requests | 60 seconds |
| Reports | 5 requests | 60 seconds |
| Global API Requests | 120 requests | 60 seconds |

Exceeding limits returns HTTP `429 Too Many Requests` with a `Retry-After` header.
