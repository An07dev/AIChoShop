# AI Nhân Bản Chống Spam

The existing `/tools/title-spinner` URL and product name are preserved. This tool creates content variants and compares text; it does not promise to bypass platform spam detection.

## Workflow

Choose Shopee/TikTok, title/description/both, 5/10 variants, and search/benefit/concise/mixed direction. A source title identifies the product in every mode. Description/both requires a source description. Required phrases (up to 12) and optional factual USP guide generation.

`POST /api/ai/title-spinner` validates a bounded JSON request, reads the existing global AI provider settings, requests structured data, validates each result and repairs only failed slots once if necessary. Accepted slots are never rewritten by repair. It does not import SEO modules or use SEO sessions, usage quotas, or database logs. Access remains open as the old title-spinner page had its VIP check disabled. The misleading VIP badge/catalog flag is removed. No usage counter is introduced.

The legacy `/api/ai` title-spinner dispatch delegates to the same standalone handler with the new input contract. Other tool prompts are unchanged.

## Validation and limits

- Titles: 10–120 characters for Shopee / 10–79 for TikTok, editorial targets rather than platform approval guarantees.
- Descriptions: 30–1800 characters.
- Exact duplicates and exact copies of the source are rejected, independently for titles and descriptions.
- Required phrases are checked in every title, or every description for description-only mode.
- Numeric values from the relevant source are retained; new numeric values and several unsupported claim phrases are rejected. Sellers should put brands/model names in the required phrases field to lock them.
- This is not a full factual or policy checker. Semantic correctness, nuanced claims and paraphrased benefits still require seller review.
- Similarity is Jaccard overlap of normalized word sets, ignoring punctuation, case and word order. A score >=80% generates a warning, not rejection. For both mode, the higher title/description score is shown. Shared required product words may naturally create high scores. These are not scores from any marketplace.

Partial batches return HTTP 200 with `partial: true`, a specific warning and only validated variants. Stable zero-based `slot` values preserve numbering and writing direction across gaps. Missing-keyword warnings identify the slot, field and exact missing phrases. The UI retains selected slots when gaps are filled and offers a resume button using the original input snapshot. Sending `existing` with no `replaceIndex` fills only the missing slots; every supplied item and slot is validated again. If no variants pass, the API still returns an error. A failed individual replacement leaves the previous snapshot untouched.

Regenerating one variant uses the input snapshot associated with the result, retains selection and other variants, and rejects reproducing any existing title/description. Failed requests preserve the previous result. Selected items can be copied or exported to Excel with source content, angle and similarity warnings.

## Checks

- `npm run test:spinner`: validation, generation/repair, replacement, similarity and selected export tests.
- `node scripts/test-spinner-api.cjs`: real SDK and route against a fake localhost provider, covering all three modes with ten variants, malformed/oversized requests, origin checks, provider errors and format fallback. No real AI credentials/database are used. Includes targeted repair, partial success and resuming gaps.
- ESLint scoped to spinner files and TypeScript checking.

No database migration is needed. AI availability and output quality depend on the configured provider. Ollama must be reachable from the web server, not merely from the seller's browser.

## Live verification of incremental repair

A local request against the configured provider retained four valid titles and reported the third slot copied the original. The live result returned HTTP 200 with `partial: true`, rather than discarding the valid titles. Provider quality can still leave gaps after a repair; this does not relax keyword or factual checks.

A live resume request also preserved all four accepted titles; the remaining slot still duplicated an existing title and was correctly left unfilled. The model is not guaranteed to finish all requested variants. Automated provider tests confirmed a valid resumed slot completes the batch without changing retained content.
