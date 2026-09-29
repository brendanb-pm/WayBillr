# Current ingestion flow

## Proven from supplied source

1. Build a Gmail query: `to:<configured inbox> is:unread has:attachment`.
2. Search at most 20 Gmail threads per execution.
3. Iterate each message in each returned thread, skipping messages that are not unread.
4. Iterate every message attachment.
5. Continue only for `image/*` attachments or `application/pdf`; other MIME types are ignored.
6. Save each qualifying attachment to the configured Drive folder.
7. Base64-encode the attachment and call Gemini 2.5 Flash `generateContent`.
8. Parse the returned JSON and derive a review status from signature presence, confidence, and issues.
9. Append one 24-value row to the active sheet.
10. Reply to the driver with captured details and, when applicable, review warnings.
11. Mark the message read, then mark the thread read.

## Processing granularity

The unit is one qualifying attachment:

```text
EMAIL THREAD -> MESSAGE -> QUALIFYING ATTACHMENT
  -> one Drive file -> one Gemini call -> one Sheet row -> one driver reply
```

Multiple attachments are not aggregated into a multi-page waybill.

## Error path

The qualifying-attachment work is wrapped in `try/catch`. Errors are logged with the Gmail message ID and error text, and an error row is appended. The source then continues through the attachment/message loops. Message and thread read-state changes occur after their respective loops.

## Not verified externally

No Gmail, Drive, Gemini, Sheets, email-reply, or trigger execution was performed in this baseline task.
