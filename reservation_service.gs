/**
 * Monopoly Chicken - Reservation Management Service
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the default code with this script.
 * 4. Update the CONFIG section below.
 * 5. Click "Deploy" > "New Deployment".
 * 6. Select "Web App".
 * 7. Set "Who has access" to "Anyone".
 * 8. Copy the Web App URL and paste it into script.js on your website.
 */

// --- CONFIGURATION ---
const CONFIG = {
  SHEET_NAME: 'Reservations',
  EMAIL_OWNER: 'tadjerouna.zoubir@gmail.com', // Restaurant owner email
  CAPACITY_PER_SLOT: 10, // Max reservations per date/time slot
  COLUMNS: [
    'Full Name',
    'Email Address',
    'Phone Number',
    'Number of Guests',
    'Reservation Date',
    'Reservation Time',
    'Special Requests',
    'Status',
    'Table Number',
    'Submission Timestamp'
  ]
};

/**
 * Handle POST requests from the website form
 */
function doPost(e) {
  try {
    const data = e.parameter;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow(CONFIG.COLUMNS);
      sheet.setFrozenRows(1);
    }

    const name = data.name;
    const email = data.email;
    const phone = data.phone;
    const guests = data.guests;
    const date = data.date;
    const time = data.time;
    const requests = data.requests || '';
    const timestamp = new Date();

    // 1. Check Capacity & Duplicates
    const existingReservations = sheet.getDataRange().getValues();
    let countInSlot = 0;
    let isDuplicate = false;

    for (let i = 1; i < existingReservations.length; i++) {
      const rowDate = formatDate(new Date(existingReservations[i][4]));
      const rowTime = existingReservations[i][5];
      const rowEmail = existingReservations[i][1];

      if (rowDate === date && rowTime === time) {
        countInSlot++;
        if (rowEmail === email) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (isDuplicate) {
      return response({ status: 'error', message: 'Duplicate reservation detected.' });
    }

    if (countInSlot >= CONFIG.CAPACITY_PER_SLOT) {
      return response({ status: 'full', message: 'Capacity full for this time slot.' });
    }

    // 2. Add New Row
    const newRow = [
      name,
      email,
      phone,
      guests,
      date,
      time,
      requests,
      'Pending', // Default Status
      '',        // Table Number (to be assigned by manager)
      timestamp
    ];
    sheet.appendRow(newRow);

    // 3. Sort by Date and Time
    // Date is col 5 (index 4), Time is col 6 (index 5)
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    range.sort([
      { column: 5, ascending: true },
      { column: 6, ascending: true }
    ]);

    // 4. Send Email Notification
    sendEmailNotification(name, email, guests, date, time, requests);

    return response({ status: 'success' });

  } catch (error) {
    return response({ status: 'error', message: error.toString() });
  }
}

/**
 * Helper to send email notification to owner
 */
function sendEmailNotification(name, email, guests, date, time, requests) {
  const subject = `New Reservation: ${name} - ${date} @ ${time}`;
  const body = `
    New reservation received for Monopoly Chicken:
    
    Full Name: ${name}
    Email: ${email}
    Guests: ${guests}
    Date: ${date}
    Time: ${time}
    Special Requests: ${requests}
    
    Please log in to your Google Sheet to manage this booking.
  `;
  
  GmailApp.sendEmail(CONFIG.EMAIL_OWNER, subject, body);
}

/**
 * Formats date to YYYY-MM-DD for comparison
 */
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

/**
 * Helper to return JSON response
 */
function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
