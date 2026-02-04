const calendarClient = require('./googleCalendarClient');

/**
 * Create a calendar event for a booking
 * @param {Object} booking - The booking document
 * @param {Object} roomType - The room type document
 * @param {string} calendarId - Target calendar ID
 * @returns {Promise<string>} - Calendar event ID
 */
async function createBookingEvent(booking, roomType, calendarId = 'primary') {
    try {
        const roomName = typeof roomType.name === 'string'
            ? roomType.name
            : roomType.name?.en || roomType.name?.th || 'Room';

        const individualRoomInfo = booking.individualRoomId?.roomNumber
            ? ` - Room ${booking.individualRoomId.roomNumber}`
            : '';

        const event = {
            summary: `${roomName}${individualRoomInfo} - ${booking.guestName}`,
            description: `
Booking #: ${booking.bookingNumber}
Guest: ${booking.guestName}
Email: ${booking.guestEmail}
Phone: ${booking.guestPhone}
Guests: ${booking.numberOfGuests}
Room: ${roomName}${individualRoomInfo}
Price: ${booking.totalPrice} THB
Status: ${booking.status}
${booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : ''}
            `.trim(),
            start: {
                date: booking.checkInDate.toISOString().split('T')[0], // YYYY-MM-DD
                timeZone: 'Asia/Bangkok',
            },
            end: {
                date: booking.checkOutDate.toISOString().split('T')[0], // YYYY-MM-DD
                timeZone: 'Asia/Bangkok',
            },
            colorId: getColorForStatus(booking.status),
        };

        const result = await calendarClient.insertEvent(event, calendarId);
        return result.id;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
    }
}

/**
 * Update a calendar event for a booking
 * @param {string} eventId - Calendar event ID
 * @param {Object} booking - The booking document
 * @param {Object} roomType - The room type document
 * @param {string} calendarId - Target calendar ID
 * @returns {Promise<void>}
 */
async function updateBookingEvent(eventId, booking, roomType, calendarId = 'primary') {
    try {
        const roomName = typeof roomType.name === 'string'
            ? roomType.name
            : roomType.name?.en || roomType.name?.th || 'Room';

        const individualRoomInfo = booking.individualRoomId?.roomNumber
            ? ` - Room ${booking.individualRoomId.roomNumber}`
            : '';

        const event = {
            summary: `${roomName}${individualRoomInfo} - ${booking.guestName}`,
            description: `
Booking #: ${booking.bookingNumber}
Guest: ${booking.guestName}
Email: ${booking.guestEmail}
Phone: ${booking.guestPhone}
Guests: ${booking.numberOfGuests}
Room: ${roomName}${individualRoomInfo}
Price: ${booking.totalPrice} THB
Status: ${booking.status}
${booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : ''}
            `.trim(),
            start: {
                date: booking.checkInDate.toISOString().split('T')[0],
                timeZone: 'Asia/Bangkok',
            },
            end: {
                date: booking.checkOutDate.toISOString().split('T')[0],
                timeZone: 'Asia/Bangkok',
            },
            colorId: getColorForStatus(booking.status),
        };

        await calendarClient.updateEvent(eventId, event, calendarId);
    } catch (error) {
        console.error('Error updating calendar event:', error);
        throw error;
    }
}

/**
 * Delete a calendar event for a booking
 * @param {string} eventId - Calendar event ID
 * @param {string} calendarId - Target calendar ID
 * @returns {Promise<void>}
 */
async function deleteBookingEvent(eventId, calendarId = 'primary') {
    try {
        await calendarClient.deleteEvent(eventId, calendarId);
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        // Don't throw - allow booking deletion even if calendar delete fails
    }
}

/**
 * Get Google Calendar color ID based on booking status
 * @param {string} status - Booking status
 * @returns {string} - Color ID
 */
function getColorForStatus(status) {
    const colorMap = {
        pending: '5',      // Yellow
        confirmed: '9',    // Blue
        'checked-in': '10', // Green
        'checked-out': '8', // Gray
        cancelled: '11',    // Red
        'no-show': '11',    // Red
    };
    return colorMap[status] || '1'; // Default color
}

module.exports = {
    createBookingEvent,
    updateBookingEvent,
    deleteBookingEvent,
    getColorForStatus,
};
