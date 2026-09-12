# Domain Security & CORS

Threadly enforces strict domain-level origin security.

## Allowed Origins

Each Site configures `allowedOrigins` in its dashboard:
```json
{
  "allowedOrigins": [
    "https://mistscans.com",
    "https://reader.mistscans.com"
  ]
}
```

The Threadly backend inspects incoming `Origin` headers. Requests originating from unauthorized websites are blocked with `403 Forbidden` (`FORBIDDEN_ORIGIN`).
