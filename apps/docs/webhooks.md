# Webhooks Architecture

Threadly prepares your application for automated event streaming to Discord bots, Slack channels, or custom moderation pipelines.

## Event Types
- `comment.created`
- `comment.flagged`
- `comment.deleted`
- `report.submitted`
- `user.banned`

Payloads include standard HMAC signatures via `X-Threadly-Signature` for verification.
