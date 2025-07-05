/**
 * Lodge Shop Logger - Google Apps Script
 * 
 * This script handles multiple items with quantities and pricing, logs detailed data to a Google Sheet,
 * provides a list of existing users, and loads available items with prices from a separate sheet.
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project
 * 3. Replace the default code with this code
 * 4. Update the SHEET_ID and ITEMS_SHEET_ID constants below with your Google Sheet IDs
 * 5. Set up your items sheet with items and prices
 * 6. Set up your logging sheet with proper headers
 * 7. Save the project
 * 8. Deploy as a web app (Deploy > New Deployment)
 * 9. Set execute as "Me" and access to "Anyone"
 * 10. Copy the web app URL and paste it into the HTML file's SCRIPT_URL variable
 */

// *** IMPORTANT: Replace these with your actual Google Sheet IDs ***

// Main logging sheet - where user entries, user names and all items are recorded
const SHEET_ID = '1Ugzw97_bIJZnlpe7DlRE8mrdj0glGz0Hu3EJc0B2nWo';
const ITEMS_SHEET_ID = '1Ugzw97_bIJZnlpe7DlRE8mrdj0glGz0Hu3EJc0B2nWo';

// Name of the sheet tabs
const SHEET_NAME = 'Log';  // Main logging sheet tab name
const ITEMS_SHEET_NAME = 'Items';  // Items sheet tab name
const USERS_SHEET_NAME = 'Users'; //Users sheet tab

/**
 * ITEMS SHEET SETUP:
 * 
 * Create a Google Sheet for your items with the following structure:
 * 
 * Column A (Item Name) | Column B (Price)
 * Item Name            | Price
 * Coke                 | 2.50
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
    // Update stock levels after successful logging
    updateStockLevels(items);
    
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
    'yyyy-MM-dd HH:mm:ss'
  );
  
  // Fixed: Use the correct function and parameters
  const result = logItemsToSheet(name, items, 0, formattedTimestamp);
  
  if (result.success) {
    console.log('Successfully logged single item to sheet');
    return ContentService
      .createTextOutput('Success')
      .setMimeType(ContentService.MimeType.TEXT);
  } else {
    console.error('Failed to log single item to sheet:', result.error);
    return ContentService
      .createTextOutput('Error: ' + result.error)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Log items to the Google Sheet
 */
function logItemsToSheet(name, items, totalAmount, timestamp) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Create human-readable item details
    const itemDetails = items.map(item => 
      `${item.item} (Qty: ${item.quantity}${item.price ? ', $' + item.price.toFixed(2) + ' each' : ''})`
    ).join(', ');
    
    // Add the row to the sheet
    // Columns: Name, Items (JSON), Total Amount, Timestamp, Item Details
    sheet.appendRow([
      name,
      JSON.stringify(items),
      totalAmount,
      timestamp,
      itemDetails
    ]);
    
    console.log('Successfully added row to sheet');
    return { success: true };
    
  } catch (error) {
    console.error('Error logging to sheet:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Get existing users from the sheet
 */
function getExistingUsers() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(USERS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row and get unique names from column A
    const names = data.slice(1).map(row => row[0]).filter(name => name);
    const uniqueNames = [...new Set(names)].sort();
    
    console.log('Retrieved existing users:', uniqueNames);
    return uniqueNames;
    
  } catch (error) {
    console.error('Error getting existing users:', error);
    return [];
  }
}

/**
 * Get available items with prices from the items sheet
 */
function getAvailableItems() {
  try {
    const sheet = SpreadsheetApp.openById(ITEMS_SHEET_ID).getSheetByName(ITEMS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row and create items array
    const items = data.slice(1).map(row => ({
      name: row[0],
      price: parseFloat(row[1]) || 0,
      stock: parseInt(row[2]) || 0
    })).filter(item => item.name);
    
    console.log('Retrieved available items:', items);
    return items;
    
  } catch (error) {
    console.error('Error getting available items:', error);
    return [];
  }
}

function updateStockLevels(loggedItems) {
  try {
    const sheet = SpreadsheetApp.openById(ITEMS_SHEET_ID).getSheetByName(ITEMS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Create a map of item names to row indices (accounting for header row)
    const itemRowMap = new Map();
    for (let i = 1; i < data.length; i++) {
      itemRowMap.set(data[i][0], i + 1); // +1 because sheet rows are 1-indexed
    }
    
    // Update stock for each logged item
    for (const loggedItem of loggedItems) {
      const rowIndex = itemRowMap.get(loggedItem.item);
      if (rowIndex) {
        const currentStock = parseInt(data[rowIndex - 1][2]) || 0; // -1 because data array is 0-indexed
        const newStock = currentStock - loggedItem.quantity;
        
        // Update the stock in column C (column 3) - allows negative values
        sheet.getRange(rowIndex, 3).setValue(newStock);
        
        console.log(`Updated stock for ${loggedItem.item}: ${currentStock} -> ${newStock}`);
      }
    }
    
  } catch (error) {
    console.error('Error updating stock levels:', error);
  }
}


/**
 * Test function to verify sheet access and functionality
 */
function testLogEntry() {
  const testName = 'Test User';
  const testItems = [
    { item: 'Coke', quantity: 2, price: 2.50 },
    { item: 'Mars Bar', quantity: 1, price: 3.00 }
  ];
  const testTotal = 8.00;
  const testTimestamp = Utilities.formatDate(
    new Date(), 
    Session.getScriptTimeZone(), 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  const result = logItemsToSheet(testName, testItems, testTotal, testTimestamp);
  
  if (result.success) {
    console.log('Test entry successful!');
  } else {
    console.error('Test entry failed:', result.error);
  }
  
  return result;
}

/**
 * Test function to check if getExistingUsers works
 */
function testGetUsers() {
  const users = getExistingUsers();
  console.log('Existing users:', users);
  return users;
}

/**
 * Test function to check if getAvailableItems works
 */
function testGetItems() {
  const items = getAvailableItems();
  console.log('Available items:', items);
  return items;
}