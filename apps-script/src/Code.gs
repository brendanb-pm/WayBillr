
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const WAYBILL_INBOX_EMAIL = "waybills@examplecompany.com";
const DRIVE_FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID";

/**
 * Runs hourly via Apps Script Time-Driven Trigger.
 */
function processHourlyWaybills() {
  const query = `to:${WAYBILL_INBOX_EMAIL} is:unread has:attachment`;
  const threads = GmailApp.search(query, 0, 20);
  if (threads.length === 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet();
  const driveFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  for (const thread of threads) {
    const messages = thread.getMessages();

    for (const message of messages) {
      if (!message.isUnread()) continue;

      const sender = message.getFrom();
      const attachments = message.getAttachments();

      for (const attachment of attachments) {
        const mimeType = attachment.getContentType();
        if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
          continue;
        }

        try {
          // 1. Save attachment to Drive
          const savedFile = driveFolder.createFile(attachment);
          const fileUrl = savedFile.getUrl();

          // 2. Parse waybill with validation flags
          const base64Data = Utilities.base64Encode(attachment.getBytes());
          const parsed = extractWaybillDataWithValidation(base64Data, mimeType);

          // 3. Determine row status
          const hasIssues = !parsed.signature_present || parsed.confidence === "LOW" || parsed.issues.length > 0;
          const processingStatus = hasIssues ? "Action Required: Review" : "Pending Billing";

          // 4. Log to Google Sheet
          const submissionTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
          sheet.appendRow([
            submissionTime,
            sender,
            parsed.date || "",
            "Email Ingestion",
            fileUrl,
            processingStatus,
            parsed.waybill_number || "N/A",
            parsed.date || "",
            parsed.carrier || "",
            parsed.payment_type || "",
            parsed.shipper_name || "",
            parsed.shipper_address || "",
            parsed.ship_to_name || "",
            parsed.ship_to_address || "",
            parsed.pieces || "",
            parsed.description || "",
            parsed.driver_code || "",
            parsed.weight || "",
            parsed.base_amount || "",
            parsed.fsc || "",
            parsed.gst || "",
            parsed.total_amount || "",
            parsed.signature_present ? "Yes" : "No",
            parsed.issues.length > 0 ? parsed.issues.join("; ") : "Clean extraction"
          ]);

          // 5. Send confirmation / alert email back to driver
          sendDriverNotice(message, parsed, fileUrl, hasIssues);

        } catch (err) {
          Logger.log(`Error processing message ${message.getId()}: ${err.toString()}`);
          sheet.appendRow([
            new Date(),
            sender,
            "",
            "Email Ingestion",
            "",
            "Error: " + err.toString(),
            "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
          ]);
        }
      }

      message.markRead();
    }
    thread.markRead();
  }
}

/**
 * Extracts data and evaluates extraction confidence and missing signatures.
 */
function extractWaybillDataWithValidation(base64Data, mimeType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `Analyze this shipping waybill image. Extract all data fields and perform a quality check.

  Flag:
  1. If shipper signature or receiver signature is missing or blank.
  2. If handwriting/image quality makes key fields (Waybill #, Shipper, Ship To, Total) ambiguous or unreadable.
  3. Provide an array of specific string descriptions for any 'issues' found (e.g., "Missing receiver signature", "Unclear total amount", "Waybill number cut off").

  Return STRICT JSON matching:
  {
    "waybill_number": string,
    "date": string,
    "carrier": string,
    "payment_type": "Prepaid" | "Collect" | "None",
    "shipper_name": string,
    "shipper_address": string,
    "ship_to_name": string,
    "ship_to_address": string,
    "pieces": string or number,
    "description": string,
    "driver_code": string,
    "weight": string or number,
    "base_amount": string,
    "fsc": string,
    "gst": string,
    "total_amount": string,
    "signature_present": boolean,
    "confidence": "HIGH" | "LOW",
    "issues": string[]
  }`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ]
    }],
    generationConfig: {
      response_mime_type: "application/json"
    }
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const parsedResponse = JSON.parse(res.getContentText());
  const jsonText = parsedResponse.candidates[0].content.parts[0].text;
  return JSON.parse(jsonText);
}

/**
 * Sends dynamic confirmation or high-visibility warning email.
 */
function sendDriverNotice(message, data, fileUrl, hasIssues) {
  let subjectPrefix = hasIssues ? "⚠️ ACTION REQUIRED: Waybill Ingestion Issue" : "✅ Waybill Received & Processed";

  let issueBlock = "";
  if (hasIssues) {
    issueBlock = `
************************************************************
ACTION REQUIRED:
One or more issues were detected with your submission:
${data.issues.map(item => `• ${item}`).join("\n")}
${!data.signature_present ? "• SIGNATURE MISSING: Neither shipper nor receiver signature was identified." : ""}
${data.confidence === "LOW" ? "• LOW IMAGE CLARITY: Portions of this waybill could not be reliably verified." : ""}

Please review the captured data below. If corrections or a clearer photo are required, reply to this email immediately.
************************************************************
`;
  }

  const replyBody =
`${hasIssues ? "There is an issue with the waybill you submitted." : "Your waybill has been parsed and queued for billing."}
${issueBlock}
--- Captured Waybill Details ---
• Waybill #: ${data.waybill_number || "Not detected"}
• Date: ${data.date || "Not detected"}
• Shipper: ${data.shipper_name || "N/A"} (${data.shipper_address || "No address"})
• Ship To: ${data.ship_to_name || "N/A"} (${data.ship_to_address || "No address"})
• Items: ${data.pieces || 0} x ${data.description || "N/A"}
• Driver Code: ${data.driver_code || "N/A"}
• Signature Detected: ${data.signature_present ? "Yes" : "NO"}
• Confidence Score: ${data.confidence}
• Archive Copy: ${fileUrl}

Reply directly to this email if any details are incorrect.`;

  message.reply(replyBody);
}
