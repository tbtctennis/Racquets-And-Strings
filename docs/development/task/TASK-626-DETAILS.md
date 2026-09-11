# TASK-626-DETAILS

|                |                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-626                                                                                                                        |
| **Title**      | Strip EXIF GPS from court photos on upload                                                                                      |
| **TLDR**       | Beta ships stripping, not disclosure. Once coordinates are not stored there is nothing to put in the privacy policy about them. |
| **Status**     | completed                                                                                                                      |
| **Tags**       | API, Firebase, Auth                                                                                                             |
| **Sprint**     | DC06 Spiderman                                                                                                                  |
| **Legacy ids** | VISION §10.4                                                                                                                    |
| **Blocked by** | None                                                                                                                            |

## Detail

**After.** Beta ships stripping, not disclosure. Once coordinates are not stored there is nothing to put in the privacy policy about them.

**Acceptance.** Uploaded court photos have GPS EXIF removed. A test proves the stored file has no GPS.

**Planning source.** `docs/planning/VISION.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M1

## Execute

When **execute sprint spiderman** reaches this item:

1. Set **Status** to `inprogress`. Add a Comments row (date, who, started).
2. Read **Read first**, then the current code those files name. If docs and code disagree, record it in Comments and follow the ruling / current code deliberately.
3. Implement only this item. Do not widen scope.
4. Prove it with the smallest tests that cover the acceptance line, then `npm run verify` before `completed`.
5. **If something fails that this item did not already describe:** open the next free `BUG-n`, set Related task to this id, comment both files, add the bug to `bug/README.md` and the tracker. Leave this item `blocked` if it cannot continue.
6. On success: **Status** `completed`, Comments row, update `docs/development/sprint/tracking/SPIDERMAN-TRACKER.md`.
7. Do not deploy staging or production.

### Read first

- `../../../AGENTS.md`
- `docs/development/sprint/EXECUTE.md`
- `docs/planning/VISION.md`
- `docs/planning/decisions/DECISIONS-2026-08-29.md`
- `docs/planning/specs/2026-08-31-vision-gaps-design.md`
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who                    | Note |
| ---------- | ---------------------- | ---- |
| 2026-09-11 | Anuj Raja · Grok Build | Started. Strip GPS IFD (and XMP GPS) from court photo bytes on upload; do not write `exif_gps_*` into `photos_meta`. |
| 2026-09-11 | Anuj Raja · Grok Build | Upload path strips GPS before Storage write. `tests/unit/stripGpsExif.test.mjs` proves stored JPEG bytes have no GPS via `exifr.gps()`. Typecheck + lint green. Left `inprogress` for coordinator verify/tracker. |
