/**
 * Lodge Shop Logger - Google Apps Script (Enhanced Version with Pricing & Multiple Items)
 * 
 * This script handles multiple items with quantities and pricing, logs detailed data to a Google Sheet,
 * provides a list of existing users, and loads available items with prices from a separate sheet.
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project
 * 3. Replace the default code with this code
 * 4. Update the SHEET_ID and ITEMS_SHEET_ID constants below with your Google Sheet IDs
 * 5. Set up your items sheet with items and prices (see instructions below)
 * 6. Set up your logging sheet with proper headers (see instructions below)
 * 7. Save the project
 * 8. Deploy as a web app (Deploy > New Deployment)
 * 9. Set execute as "Me" and access to "Anyone"
 * 10. Copy the web app URL and paste it into the HTML file's SCRIPT_URL variable
 */

// *** IMPORTANT: Replace these with your actual Google Sheet IDs ***

// Main logging sheet - where user entries are recorded
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// Items sheet - where your available items with prices are stored
const ITEMS_SHEET_ID = 'YOUR_ITEMS_SHEET_ID_HERE';

// Name of the sheet tabs
const SHEET_NAME = 'Sheet1';  // Main logging sheet tab name
const ITEMS_SHEET_NAME = 'Sheet1';  // Items sheet tab name

/**
 * ITEMS SHEET SETUP:
 * 
 * Create a Google Sheet for your items with the following structure:
 * 
 * Column A (Item Name) | Column B (Price)
 * Item Name           | Price
 * Coke               | 2.50
 * Pepsi              | 2.50
 * Water              | 1.50
 * Mars Bar           | 3.00
 * Snickers           | 3.00
 * Kit Kat            | 3.00
 * Chips              | 4.00
 * Crackers           | 2.00
 * Nuts               | 5.00
 * Cookies            | 3.50
 * 
 * The script will read from Column A (item names) and Column B (prices), starting from row 2.
 */

/**
 * LOGGING SHEET SETUP:
 * 
 * Create headers in your logging sheet:
 * 
 * Column A: Name
 * Column B: Items (JSON string of items array)
 * Column C: Total Amount
 * Column D: Timestamp
 * Column E: Item Details (Human-readable summary)
 * 
 * The script will automatically create detailed logs with all this information.
 */

/**
 * Main function that handles POST requests from the HTML form
 */
function doPost(e) {
  try {
    console.log('Received POST request');
    console.log('Parameters:', e.parameter);
    
    const action = e.parameter.action || 'logItems';
    
    if (action === 'logItems') {
      return handleLogItems(e);
    } else if (action === 'logItem') {
      // Backward compatibility for single item logging
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
 * Handle GET requests - used for fetching existing users and available items
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getUsers') {
      const users = getExistingUsers();
      return ContentService
        .createTextOutput(JSON.stringify(users))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'getItems') {
      const items = getAvailableItems();
      return ContentService
        .createTextOutput(JSON.stringify(items))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
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
 * Handle logging multiple items to the sheet
 */
function handleLogItems(e) {
  const name = e.parameter.name;
  const itemsJson = e.parameter.items;
  const totalAmount = e.parameter.totalAmount;
  const timestamp = e.parameter.timestamp;
  
  // Validate required data
  if (!name || !itemsJson || !totalAmount || !timestamp) {
    console.error('Missing required parameters');
    return ContentService
      .createTextOutput('Error: Missing required data')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  // Parse the items JSON
  let items;
  try {
    items = JSON.parse(itemsJson);
  } catch (error) {
    console.error('Error parsing items JSON:', error);
    return ContentService
      .createTextOutput('Error: Invalid items data')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  // Convert timestamp
  const date = new Date(timestamp);
  const formattedTimestamp = Utilities.formatDate(
    date, 
    Session.getScriptTimeZone(), 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  // Log to sheet
  const result = logItemsToSheet(name, items, totalAmount, formattedTimestamp);
  
  if (result.success) {
    console.log('Successfully logged items to sheet');
    return ContentService
      .createTextOutput('Success')
      .setMimeType(ContentService.MimeType.TEXT);
  } else {
    console.error('Failed to log items to sheet:', result.error);
    return ContentService
      .createTextOutput('Error: ' + result.error)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Handle logging single item (backward compatibility)
 */
function handleLogItem(e) {
  const name = e.parameter.name;
  const item = e.parameter.item;
  const timestamp = e.parameter.timestamp;
  
  if (!name || !item || !timestamp) {
    console.error('Missing required parameters');
    return ContentService
      .createTextOutput('Error: Missing required data')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  // Convert single item to items array format
  const items = [{
    item: item,
    quantity: 1,
    price: 0 // No price for backward compatibility
  }];
  
  const date = new Date(timestamp);
  const formattedTimestamp = Utilities.formatDate(
    date, 
    Session.getScriptTimeZone(), 
    'yyyy--MM-dd HH:mm:ss'
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