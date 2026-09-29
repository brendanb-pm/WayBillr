# Current architecture

## Proven from supplied source

The current implementation is a single Google Apps Script file, `apps-script/src/Code.gs`, using Google-hosted services directly:

- Gmail is searched for unread messages addressed to the configured inbox that have attachments.
- Google Drive stores each qualifying attachment before extraction.
- Gemini 2.5 Flash is called with `generateContent` through `UrlFetchApp`.
- Google Sheets receives one appended ledger row per qualifying attachment.
- Gmail replies to the source message with parsed details and any review warning.

The current processing chain is:

```text
Gmail thread -> message -> qualifying attachment -> Drive file
                                      -> Gemini extraction -> Sheets row -> driver reply
```

The source processes attachments independently. It does not aggregate several attachment images into one logical waybill.

## Declared/commented in source

`processHourlyWaybills` has a comment stating that it runs hourly via an Apps Script time-driven trigger.

## Not verified externally

The deployed trigger schedule, active spreadsheet, sheet contents, Drive folder, Gmail account, permissions, and live Gemini configuration were not supplied or exercised. No production Google service was mutated during this baseline capture.

## Future design possibility

The next story may address multi-photo/batch ingestion of approximately 30 photos. That is explicitly outside this baseline.
