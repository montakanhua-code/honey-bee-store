/**
 * Honey Bee - Google Apps Script Web App
 * คอลัมน์ A-F: Timestamp, customerName, contact, items, total, note
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("ไม่พบข้อมูล POST");
    }

    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // สร้างหัวตารางให้อัตโนมัติเมื่อชีตยังว่าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "customerName",
        "contact",
        "items",
        "total",
        "note"
      ]);
    }

    sheet.appendRow([
      new Date(),
      data.customerName || "",
      data.contact || "",
      data.items || "",
      Number(data.total) || 0,
      data.note || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
