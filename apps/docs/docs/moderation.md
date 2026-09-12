# Moderation Pipeline

Threadly features automated multi-stage moderation designed to safeguard discussions while minimizing friction for legitimate commenters.

## Moderation Flow

```
Comment Submitted
       │
       ▼
   Validation (length, syntax)
       │
       ▼
   Rate Limiter (per-IP / user sliding window)
       │
       ▼
   Duplicate Detection (submitting identical string within 60s)
       │
       ▼
   Spam & Link Heuristics
       │
       ▼
   Profanity & Hate Filtering
       │
       ▼
   Pluggable ModerationProvider (Rule-based / AI provider)
       │
       ▼
   Decision: Approved / Pending / Hidden / Rejected
```

## Site-Level Member Bans & Mutes

Site administrators can moderate users on a per-site basis:
- **Ban**: Prevents user from posting comments or replies on that site.
- **Mute**: Silences the user's future submissions.
- **Shadow-Ban**: User's comments appear visible only to themselves.

Crucially, **a ban on Site A does NOT affect the user's standing on Site B**.
