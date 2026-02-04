require('dotenv').config();
const fs = require('fs');
const path = require('path');

let serviceAccount = null;
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const envVal = process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim();
    if (envVal.startsWith('{')) {
        try {
            serviceAccount = JSON.parse(envVal);
        } catch (e) {
            console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON as JSON:', e.message);
        }
    } else {
        // Assume it's a file path
        // Try to resolve relative to CWD, or check if it exists directly or in parent
        let filePath = path.resolve(process.cwd(), envVal);
        if (!fs.existsSync(filePath)) {
            // Try one level up (since we run from backend/, file might be in root)
            filePath = path.resolve(process.cwd(), '..', envVal);
        }

        if (fs.existsSync(filePath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                console.log(`Loaded Google Service Account from ${filePath}`);
            } catch (e) {
                console.error(`Failed to parse service account file at ${filePath}:`, e.message);
            }
        } else {
            console.warn(`Could not find Service Account JSON file at: ${envVal}`);
        }
    }
}

module.exports = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    serviceAccount,
};
