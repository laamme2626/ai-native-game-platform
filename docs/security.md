# Security

## Implemented

- Passwords are hashed with bcrypt.
- Sessions are signed JWTs stored in HTTP-only cookies.
- Game publishing requires ownership.
- Job reads and execution require ownership.
- Generated game entries run in `<iframe sandbox="allow-scripts">`.
- The Agent generates constrained JSON and app-owned HTML, not arbitrary
  user-submitted JavaScript.

## MVP Limitations

- No CSRF token yet. SameSite=Lax helps, but production should add explicit
  CSRF protection for state-changing form/API routes.
- No rate limiting on auth or generation.
- No email verification.
- No moderation or abuse checks for prompts.
- Local public storage is not access-controlled.
- Cookie secret defaults to a development fallback if `SESSION_SECRET` is not
  set.

## Production Hardening

- Require strong `SESSION_SECRET`.
- Add CSRF tokens.
- Add auth and generation rate limits.
- Add prompt moderation.
- Move storage to MinIO/S3/OSS with least-privilege credentials.
- Add CSP headers for app pages.
- Add signed URLs or immutable public asset URLs depending on publishing rules.
