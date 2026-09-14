# SEO optimizer

## Flow

`/tools/seo-optimizer` → `POST /api/ai/seo` → server validation → verified session/anonymous identity → database reservation → configured AI provider → output validation (one repair attempt) → atomic success count and usage log → structured UI/export.

The legacy `/api/ai` route forwards `tool: seo-optimizer` to the same handler. The old Markdown prompt and browser-only quota are no longer used for SEO.

## Deployment

1. Run `npm run db:seo` against the target database before deploying application code. This creates only the three new SEO tables/indexes; it does not reset existing tables.
2. Run `prisma generate` (also runs during the existing postinstall).
3. Deploy the app. Existing users must sign in again once to obtain the opaque SEO session. Login/registration now create this session after credential verification; logout revokes it.

SEO intentionally does not grant authenticated usage based only on the legacy `user_token` user ID cookie. This change does not migrate authentication for unrelated tools/pages.

Anonymous trial: two successful generations per browser identity. The database stores only a hash of the random HTTP-only visitor cookie. Clearing cookies/new browsers can obtain another anonymous trial; this is a trial mechanism, not proof of a unique human. For stronger abuse controls use a trusted ingress rate limiter and verified accounts; do not trust arbitrary forwarded IP headers.

At most one active request per identity, 3 anonymous / 6 authenticated attempts per minute. Reservations expire after 150 seconds to recover from crashed workers. AI processing has a 100-second overall timeout and one output-repair attempt. Failures release the reservation without increasing successful usage. An older worker cannot finish a newer worker's reservation.

`SeoRun` logs model, provider, duration, token counts and outcome, without storing prompts, product content or API keys. Pending logs may remain after a worker crash. Monetary cost is not inferred from token counts because model/provider pricing is configurable.

## Content and platform targets

Both platforms produce five distinct titles, 3–8 description sections and ten distinct hashtags. Input limits are shared by browser/server. The validator checks structure, normalized Unicode length, duplicates, common generic hashtags, unexpected scripts and several unsupported claim phrases. It cannot prove factual accuracy or semantic relevance; sellers must review generated copy.

- Shopee: a conservative editorial target of 120 characters, not a statement of the current platform-wide hard limit.
- TikTok Shop: an editorial target of fewer than 80 characters, following [TikTok's product name optimization guidance](https://seller-vn.tiktok.com/university/essay?knowledge_id=2890936842258178&lang=en).
- [Shopee listing guidance](https://help.shopee.vn/portal/4/article/77246) calls for accurate and consistent product information.

The app has no live keyword/trend feed and makes no ranking guarantees. Hashtags are suggestions, not verified trending terms.

Official OpenAI uses [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Compatible gateways/Ollama use JSON mode, falling back to prompt-only JSON if `response_format` is explicitly unsupported. All providers undergo the same application validation.

## Verification

- `npm run test:seo`: contract, language/claim checks, repair, quota policy and export tests with fake completions.
- `npm run test:seo:db`: real database concurrency, failure accounting, quota and telemetry checks. Creates isolated test rows and removes only those rows. Does not call AI.
- `npx tsc --noEmit --incremental false` and ESLint on changed SEO files.
- `npx next build --webpack` succeeds on this Windows environment; the default Turbopack build encounters an OS process-spawn error in CSS handling.

Live Ollama checks exposed malformed/low-quality outputs; these now fail validation without consuming a successful trial. Model quality remains dependent on the configured model.
