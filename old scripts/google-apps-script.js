/**
 * Lodge Shop Logger - Google Apps Script (Enhanced Version)
 * 
 * This script receives POST requests from the HTML form, logs data to a Google Sheet,
 * and provides a list of existing users for the dropdown functionality.
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project
 * 3. Replace the default code with this code
 * 4. Update the SHEET_ID constant below with your Google Sheet ID
 * 5. Save the project
 * 6. Deploy as a web app (Deploy > New Deployment)
 * 7. Set execute as "Me" and access to "Anyone"
 * 8. Copy the web app URL and paste it into the HTML file's SCRIPT_URL variable
 */

// *** IMPORTANT: Replace this with your actual Google Sheet ID ***
// You can find this in your Google Sheet URL: 
// https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// Name of the sheet tab (usually "Sheet1" by default)
const SHEET_NAME = 'Sheet1';

/**
 * Main function that handles POST requests from the HTML form
 * This function is automatically called when someone submits the form
 */
function doPost(e) {
  try {
    // Log the incoming request for debugging
    console.log('Received POST request');
    console.log('Parameters:', e.parameter);
    
    // Check what action is being requested
    const action = e.parameter.action || 'logItem';
    
    if (action === 'logItem') {
      return handleLogItem(e);
    } else {
      return ContentService
        .createTextOutput('Error: Unknown action')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput('Error: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Handle GET requests - used for fetching existing users
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getUsers') {
      // Return list of existing users
      const users = getExistingUsers();
      return ContentService
        .createTextOutput(JSON.stringify(users))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // Default response for testing
      return ContentService
        .createTextOutput('Lodge Shop Logger is running! Use POST requests to log items.')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput('Error: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Handle logging an item to the sheet
 */
function handleLogItem(e) {
  // Extract data from the POST request
  const name = e.parameter.name;
  const item = e.parameter.item;
  const timestamp = e.parameter.timestamp;
  
  // Validate that we received all required data
  if (!name || !item || !timestamp) {
    console.error('Missing required parameters');
    return ContentService
      .createTextOutput('Error: Missing required data')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  // Convert the ISO timestamp to a more readable format
  const date = new Date(timestamp);
  const formattedTimestamp = Utilities.formatDate(
    date, 
    Session.getScriptTimeZone(), 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  // Log the data to the Google Sheet
  const result = logToSheet(name, item, formattedTimestamp);
  
  if (result.success) {
    console.log('Successfully logged to sheet');
    return ContentService
      .createTextOutput('Success')
      .setMimeType(ContentService.MimeType.TEXT);
  } else {
    console.error('Failed to log to sheet:', result.error);
    return ContentService
      .createTextOutput('Error: ' + result.error)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Function to add a new row to the Google Sheet
 * 
 * @param {string} name - Person's name
 * @param {string} item - Item taken
 * @param {string} timestamp - Formatted timestamp
 * @return {Object} Result object with success status and error message if applicable
 */
function logToSheet(name, item, timestamp) {
  try {
    // Open the Google Sheet by ID
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Check if sheet exists
    if (!sheet) {
      throw new Error(`Sheet named "${SHEET_NAME}" not found`);
    }
    
    // Prepare the row data
    // Order should match your sheet headers: Name, Item, Timestamp
    const rowData = [name, item, timestamp];
    
    // Add the new row to the sheet
    sheet.appendRow(rowData);
    
    console.log(`Successfully added row: ${name}, ${item}, ${timestamp}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error writing to sheet:', error);
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Get a list of unique users who have previously logged items
 * This is used to populate the dropdown in the HTML form
 * 
 * @return {Array} Array of unique user names, sorted alphabetically
 */
function getExistingUsers() {
  try {
    // Open the Google Sheet by ID
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Check if sheet exists
    if (!sheet) {
      console.error(`Sheet named "${SHEET_NAME}" not found`);
      return [];
    }
    
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    
    // If there's no data or only headers, return empty array
    if (!data || data.length <= 1) {
      return [];
    }
    
    // Extract names from the first column (skipping header row)
    // Assuming the first column contains names
    const names = data.slice(1).map(row => row[0]).filter(name => name && name.toString().trim());
    
    // Get unique names and sort them alphabetically
    const uniqueNames = [...new Set(names.map(name => name.toString().trim()))];
    uniqueNames.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    console.log(`Found ${uniqueNames.length} unique users:`, uniqueNames);
    
    return uniqueNames;
    
  } catch (error) {
    console.error('Error getting existing users:', error);
    return [];
  }
}

/**
 * Optional: Test function to verify the script works
 * You can run this function manually in the Apps Script editor to test
 */
function testLogEntry() {
  const testName = 'Test User';
  const testItem = 'Test Item';
  const testTimestamp = Utilities.formatDate(
    new Date(), 
    Session.getScriptTimeZone(), 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  const result = logToSheet(testName, testItem, testTimestamp);
  
  if (result.success) {
    console.log('Test entry successful!');
  } else {
    console.error('Test entry failed:', result.error);
  }
}

/**
 * Test function to check if getExistingUsers works
 */
function testGetUsers() {
  const users = getExistingUsers();
  console.log('Existing users:', users);
  return users;
}