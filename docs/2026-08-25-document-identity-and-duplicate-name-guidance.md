---
title: 'Document identity and duplicate-name guidance'
type: 'decision-record'
created: '2026-08-25'
status: 'implemented'
---

# Document identity and duplicate-name guidance

## Conversation record

### Initial question

The user reported that selecting a Document on `/documents` and navigating to
`/documents/expense-policy` crashed the React detail page with:

```text
TypeError: Cannot read properties of undefined (reading 'find')
```

The user also asked what happens when two or three Documents have the same
plaintext display name, and whether UUIDs would resolve the ambiguity.

### Diagnosis and answer

The process on port 8080 was an ad-hoc Node mock whose collection handler used
`startsWith("/api/v1/documents")`. It therefore returned a collection envelope
for the detail request `/api/v1/documents/expense-policy`. The frontend trusted
the HTTP 200 body as `DocumentDetails`; `versions` was undefined, so
`versions.find(...)` threw during rendering.

The real WAS already uses UUID primary keys and exact collection/detail routes.
The frontend also uses `document.id` for React keys and links; the display name
is only a human-facing label. The schema intentionally keeps
`normalized_name` non-unique, so any number of same-name Documents may coexist
without overwriting, merging, or sharing Version histories.

The agreed recommendation was:

1. Keep UUIDs as opaque technical identity and route keys.
2. Continue allowing duplicate display names.
3. Warn during new Document registration when an exact normalized-name match
   already exists.
4. Direct the user to add a Version when the upload is a revision of an
   existing Document, without blocking creation of a genuinely separate
   Document.
5. Show a stable short UUID label beside each display name so duplicate rows
   remain distinguishable.

### User decision

The user accepted the recommendation and asked for it to be implemented. The
user also requested that the conversation be saved under `docs`; this file is
that durable record.

## Implemented contract

### Duplicate-name lookup

The authenticated WAS endpoint is:

```http
GET /api/v1/documents/name-matches?name={proposed display name}
```

It returns a bounded sample plus the full match count:

```json
{
  "normalizedName": "보안 정책",
  "total": 2,
  "documents": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "보안 정책",
      "activeVersion": 2,
      "latestVersion": 2,
      "latestStatus": "ACTIVE",
      "updatedAt": "2026-08-25T00:00:00Z"
    }
  ]
}
```

Matching uses the server's `DocumentName` normalization: outer whitespace is
trimmed, internal whitespace is collapsed for comparison, and letters are
lowercased. The lookup uses the existing non-unique `normalized_name` index.
It does not create a uniqueness constraint and does not change registration
semantics.

### Registration guidance

The new Document form checks a valid proposed name after a 350 ms debounce.
When matches exist, it tells the user that separate creation remains allowed
and links each returned match directly to its “new Version” route. A lookup
failure is visible but non-blocking.

### List disambiguation

Every Document row continues to link by its complete UUID. Beneath the display
name, the list now renders the first eight UUID characters as `ID xxxxxxxx`,
with the complete UUID in the element title. The short value is a display aid
only; all routing, API access, storage relations, and React keys continue using
the complete UUID.

### Defensive detail response validation

The earlier crash fix remains in place: the browser API client validates that a
detail response contains `id`, `name`, and a `versions` array. A malformed 200
response becomes the visible `INVALID_RESPONSE` API error instead of a React
render exception.

## Behavioral consequences

- Two, three, or more same-name Documents remain independent records.
- Each has its own UUID, Version sequence, processing runs, active Version, and
  search/source provenance.
- A new registration with a matching name is not automatically merged.
- Adding a Version still requires the selected existing Document UUID.
- UUIDs solve identity and route collisions; the short UUID label and warning
  solve the human ambiguity.
- UUIDs are identifiers, not an authorization or encryption boundary.

## Code map

- [`src/api/client.ts`](../src/api/client.ts) — response validation and name-match request.
- [`src/pages/UploadPage.tsx`](../src/pages/UploadPage.tsx) — debounced duplicate guidance.
- [`src/pages/DocumentsPage.tsx`](../src/pages/DocumentsPage.tsx) — UUID-derived secondary label.
- [`src/documents/identity.ts`](../src/documents/identity.ts) — short display-label helper.
- [`syncbase-was/internal/modules/documents/service.go`](../../syncbase-was/internal/modules/documents/service.go) — normalization and bounded guidance policy.
- [`syncbase-was/internal/adapters/postgres/store.go`](../../syncbase-was/internal/adapters/postgres/store.go) — indexed exact-name lookup and total count.
- [`syncbase-was/internal/transport/webapp/api.go`](../../syncbase-was/internal/transport/webapp/api.go) — authenticated JSON contract.

## Verification

- `npm run check`: production build passed; 4 test files and 14 tests passed.
- Frontend API client regression passed, including response validation and the
  encoded name-match request, plus malformed name-match response rejection.
- Duplicate list identity regression passed with two equal display names,
  distinct UUID routes, and distinct short-ID labels.
- New Document guidance regression passed with normalized whitespace, match
  count, non-blocking copy, and the selected Document's new-Version route. A
  failed lookup remains visible and does not prevent registration.
- The WAS API regression confirms anonymous name-match requests are rejected
  with the session-expired contract.
- Browser verification passed: both duplicate rows and both warning links were
  present in the accessibility snapshot, the name-match request returned 200,
  and the browser console contained zero errors.
- Go 1.26.6 `gofmt` completed for all changed Go files.
- `go test ./internal/modules/documents ./internal/transport/webapp
  ./internal/adapters/postgres` passed.
- PostgreSQL integration assertion is included and runs when
  `SYNCBASE_TEST_DB_URL` is available; otherwise that existing test suite skips
  database-backed cases.
