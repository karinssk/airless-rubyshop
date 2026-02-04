const { google } = require('googleapis');
const googleConfig = require('../config/google');

let authClient = null;

async function getAuthClient() {
    if (authClient) return authClient;

    if (googleConfig.serviceAccount) {
        console.log('Initializing Google Service Account Auth...');

        // Sanity check key
        // Sanity check key
        // console.log('Service Account Keys:', Object.keys(googleConfig.serviceAccount));
        const pk = googleConfig.serviceAccount.private_key;
        // console.log('Private Key Type:', typeof pk);
        // console.log('Private Key Length:', pk ? pk.length : 'N/A');

        if (!pk || !pk.includes('BEGIN PRIVATE KEY')) {
            console.error('CRITICAL: Private Key seems invalid or missing header');
        }



        const jwtClient = new google.auth.JWT({
            email: googleConfig.serviceAccount.client_email,
            key: pk,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        try {
            await jwtClient.authorize();
            console.log('Service Account authorized successfully.');
            authClient = jwtClient;
        } catch (error) {
            console.error('Failed to authorize Service Account:', error);
            throw error;
        }
    } else if (googleConfig.clientId && googleConfig.clientSecret && googleConfig.refreshToken) {
        console.log('Initializing OAuth2 Auth...');
        const oauth2Client = new google.auth.OAuth2(
            googleConfig.clientId,
            googleConfig.clientSecret,
            googleConfig.redirectUri
        );
        oauth2Client.setCredentials({ refresh_token: googleConfig.refreshToken });
        authClient = oauth2Client;
    } else {
        throw new Error('Google Calendar credentials not fully configured.');
    }

    return authClient;
}

const listCalendars = async () => {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    // Additional calendars to ensure subscription for
    const requiredCalendars = [
        googleConfig.calendarId || 'primary',
        'c5c8e2bf7265434cf0aa9e32f3ab03f318e6fe46e0d8b25c486d6a2e536ada24@group.calendar.google.com', // Branch 1
        '6ed1d755da1db49419541921ca234ce6cdc86538eb7b9b7251f6326eedadea94@group.calendar.google.com', // Branch 2
        '13c05f66b44276d4d1ac390d8b79c38c36aaf9f41ac3df31e1a4b6f98112aa53@group.calendar.google.com', // Branch 3
    ];

    try {
        let res = await calendar.calendarList.list();
        let items = res.data.items || [];

        let needsRefresh = false;

        for (const id of requiredCalendars) {
            if (id === 'primary') continue; // Skip implicit primary

            const isSubscribed = items.some(c => c.id === id);
            if (!isSubscribed) {
                console.log(`Service Account not subscribed to ${id}. Attempting to subscribe...`);
                try {
                    await calendar.calendarList.insert({
                        requestBody: { id: id }
                    });
                    needsRefresh = true;
                } catch (subError) {
                    console.error(`Failed to subscribe to ${id}:`, subError.message);
                }
            }
        }

        if (needsRefresh) {
            res = await calendar.calendarList.list();
            items = res.data.items || [];
        }

        return items;
    } catch (error) {
        console.error('Error listing calendars:', error);
        throw error;
    }
};

const listEvents = async (calendarId = 'primary', options = {}) => {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const defaults = {
        calendarId: calendarId,
        singleEvents: true,
        orderBy: 'startTime',
    };

    try {
        const res = await calendar.events.list({ ...defaults, ...options });
        return {
            ...res.data,
            calendarId: calendarId // Append ID for frontend tracking
        };
    } catch (error) {
        console.error(`Error listing events for ${calendarId}:`, error);
        // Don't throw here, just return empty to avoid breaking all calendars if one fails
        return { items: [] };
    }
};

const insertEvent = async (event, calendarId = 'primary') => {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const res = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
        });
        return res.data;
    } catch (error) {
        console.error('Error inserting event:', error);
        throw error;
    }
};

const updateEvent = async (eventId, event, calendarId = 'primary') => {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const res = await calendar.events.patch({
            calendarId: calendarId,
            eventId: eventId,
            resource: event
        });
        return res.data;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

const deleteEvent = async (eventId, calendarId = 'primary') => {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        await calendar.events.delete({
            calendarId: calendarId,
            eventId: eventId
        });
        return true;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

module.exports = {
    listCalendars,
    listEvents,
    insertEvent,
    updateEvent,
    deleteEvent
};
