# lodge-honour-shop
A lodge honour shop system
# Lodge Shop Logger

A simple web application for logging items taken from a lodge shop using an honor system. Users can enter their name (or select from previous users) and log what they've taken, with all data stored in a Google Sheet.

## Features

- 📝 Simple form interface for logging items
- 👥 Dropdown list of previous users for quick selection
- 📱 Mobile-friendly responsive design
- ☁️ Data stored in Google Sheets
- ✅ Real-time success/error feedback
- 🔄 Automatic user list updates

## Live Demo

[View the live application](https://joshua-kluth.github.io/lodge-honour-shop/)

## Setup Instructions

### 1. Fork/Clone this Repository

1. Fork this repository or download the files
2. If hosting on GitHub Pages, make sure the HTML file is named `index.html`

### 2. Set up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Replace the default code with the code from `google-apps-script.js`
4. Update the `SHEET_ID` constant with your Google Sheet ID
5. Save and deploy as a web app:
   - Click Deploy → New Deployment
   - Choose "Web app" as type
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click Deploy and copy the web app URL

### 3. Configure the HTML File

1. Open `index.html`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your web app URL from step 2
3. Save the file

### 4. Set up Google Sheet

1. Create a Google Sheet
2. Add headers in row 1: `Name`, `Item`, `Timestamp`
3. Note the Sheet ID from the URL for step 2 above

### 5. Deploy to GitHub Pages (Optional)

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)
4. Your site will be available at `https://yourusername.github.io/repository-name/`

## File Structure

```
lodge-shop-logger/
├── index.html              # Main web application
├── google-apps-script.js   # Google Apps Script code
└── README.md              # This file
```

## How It Works

1. **User Interface**: Clean, responsive form where users can enter their name or select from previous users
2. **Data Collection**: Form collects name, item selected, and automatic timestamp
3. **Google Apps Script**: Handles POST requests and writes data to Google Sheets
4. **User List**: Automatically fetches and displays previous users for easy selection

## Customization

### Adding/Removing Items

Edit the `itemSelect` dropdown options in `index.html`:

```html
<option value="New Item">New Item</option>
```

### Styling

Modify the CSS section in `index.html` to match your lodge's branding.

### Sheet Configuration

If your Google Sheet has different column names or order, update the Apps Script accordingly.

## Troubleshooting

### Common Issues

1. **"Error logging item"**: Check that your Google Apps Script URL is correct
2. **"Sheet not found"**: Verify the SHEET_ID and SHEET_NAME in your Apps Script
3. **Users not loading**: Ensure your Google Sheet has data and the Apps Script is deployed correctly

### Debug Mode

Check the browser console (F12) for detailed error messages.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## Support

If you encounter any issues, please create an issue in this repository with:
- Description of the problem
- Browser and device information
- Any error messages from the console