# REST API Reference

The Threadly REST API is generic, JSON-based, and mounted at `/api/v1`.

## Comments Endpoints

### List Comments
`GET /api/v1/sites/:siteId/comments`

Query Parameters:
- `pageId`: string (optional)
- `pageUrl`: string (optional)
- `cursor`: string (base64 cursor)
- `limit`: number (default: 20, max: 50)
- `sort`: `best` | `newest` | `oldest`

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "siteId": "mist-scans",
        "pageId": "lookism-500",
        "author": {
          "id": "u_1",
          "username": "kimchi",
          "displayName": "Aged Kimchi",
          "avatarUrl": "https://...",
          "avatarDecoration": "crimson-flame"
        },
        "content": "Awesome chapter!",
        "status": "visible",
        "moderationStatus": "approved",
        "edited": false,
        "replyCount": 2,
        "createdAt": "2026-09-12T10:00:00.000Z",
        "replies": []
      }
    ],
    "nextCursor": "ey...",
    "hasMore": true
  }
}
```

### Create Comment or Reply
`POST /api/v1/sites/:siteId/comments`

Headers:
- `Authorization`: Bearer session token (or Better Auth cookie)

Payload:
```json
{
  "pageId": "lookism-500",
  "content": "This is my comment",
  "parentId": null
}
```

### Edit Comment
`PATCH /api/v1/comments/:commentId`

### Delete Comment (Soft Delete)
`DELETE /api/v1/comments/:commentId`

### Report Comment
`POST /api/v1/comments/:commentId/reports`
Payload:
```json
{
  "reason": "Spam",
  "details": "Unsolicited promotional links"
}
```
