const { google } = require('googleapis');
const googleConfig = require('../config/google');

let authClient = null;

async function getAuthClient() {
    if (authClient) return authClient;

    if (googleConfig.serviceAccount) {
        console.log('Initializing Google Service Account for Sheets...');
        const pk = googleConfig.serviceAccount.private_key;

        const jwtClient = new google.auth.JWT({
            email: googleConfig.serviceAccount.client_email,
            key: pk,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        try {
            await jwtClient.authorize();
            console.log('Service Account authorized for Sheets.');
            authClient = jwtClient;
        } catch (error) {
            console.error('Failed to authorize Service Account for Sheets:', error);
            throw error;
        }
    } else {
        throw new Error('Google Service Account not configured for Sheets.');
    }

    return authClient;
}

const getSpreadsheet = async (spreadsheetId) => {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const res = await sheets.spreadsheets.get({
            spreadsheetId
        });
        return res.data;
    } catch (error) {
        console.error(`Error fetching spreadsheet ${spreadsheetId}:`, error);
        throw error;
    }
};

const getValues = async (spreadsheetId, range) => {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return res.data.values || [];
    } catch (error) {
        console.error(`Error fetching values for ${spreadsheetId} range ${range}:`, error);
        throw error;
    }
};

const updateValues = async (spreadsheetId, range, values) => {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const res = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values
            }
        });
        return res.data;
    } catch (error) {
        console.error(`Error updating values for ${spreadsheetId} range ${range}:`, error);
        throw error;
    }
};

const appendValues = async (spreadsheetId, range, values) => {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values
            }
        });
        return res.data;
    } catch (error) {
        console.error(`Error appending values for ${spreadsheetId} range ${range}:`, error);
        throw error;
    }
};

module.exports = {
    getSpreadsheet,
    getValues,
    updateValues,
    appendValues
};
