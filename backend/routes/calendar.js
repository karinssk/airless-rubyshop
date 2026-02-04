const express = require('express');
const router = express.Router();
const calendarClient = require('../utils/googleCalendarClient');
const Room = require('../models/Room');
const IndividualRoom = require('../models/IndividualRoom');
const Booking = require('../models/Booking');
const RoomCategory = require('../models/RoomCategory');

module.exports = (io) => {
    // GET /api/calendar/reservation-data - Get calendar view data for reservations
    router.get('/reservation-data', async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: "startDate and endDate are required" });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            // Fetch all room types with their categories
            const rooms = await Room.find({ status: "published" })
                .populate("categoryId")
                .sort({ categoryId: 1, name: 1 })
                .lean();

            // Fetch all individual rooms
            const individualRooms = await IndividualRoom.find({ status: { $ne: "inactive" } })
                .sort({ roomNumber: 1 })
                .lean();

            // Group individual rooms by room type
            const roomsWithIndividuals = rooms.map((room) => ({
                ...room,
                individuals: individualRooms.filter(
                    (ind) => ind.roomTypeId.toString() === room._id.toString()
                ),
            }));

            // Fetch bookings that overlap with the date range
            const bookings = await Booking.find({
                $or: [
                    {
                        checkInDate: { $lte: end },
                        checkOutDate: { $gte: start },
                    },
                ],
                status: { $nin: ["cancelled"] },
            })
                .populate("roomTypeId")
                .populate("individualRoomId")
                .sort({ checkInDate: 1 })
                .lean();

            // Group by category for the UI
            const categories = await RoomCategory.find().lean();
            const groupedRooms = categories.map((category) => ({
                category,
                rooms: roomsWithIndividuals.filter(
                    (room) =>
                        room.categoryId && room.categoryId._id.toString() === category._id.toString()
                ),
            }));

            // Add uncategorized rooms
            const uncategorizedRooms = roomsWithIndividuals.filter((room) => !room.categoryId);
            if (uncategorizedRooms.length > 0) {
                groupedRooms.push({
                    category: { _id: "uncategorized", name: { en: "Other", th: "อื่นๆ" } },
                    rooms: uncategorizedRooms,
                });
            }

            res.json({
                groupedRooms,
                bookings,
                dateRange: { start, end },
            });
        } catch (error) {
            console.error("Error fetching calendar data:", error);
            res.status(500).json({ error: "Failed to fetch calendar data" });
        }
    });

    // GET /api/calendar/unallocated - Get unallocated bookings
    router.get('/unallocated', async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: "startDate and endDate are required" });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            const unallocatedBookings = await Booking.find({
                individualRoomId: null,
                checkInDate: { $lte: end },
                checkOutDate: { $gte: start },
                status: { $nin: ["cancelled", "no-show"] },
            })
                .populate("roomTypeId")
                .sort({ checkInDate: 1 })
                .lean();

            res.json({ bookings: unallocatedBookings });
        } catch (error) {
            console.error("Error fetching unallocated bookings:", error);
            res.status(500).json({ error: "Failed to fetch unallocated bookings" });
        }
    });

    // GET /api/calendar/events
    // GET /api/calendar/events - List events from all accessible calendars
    router.get('/events', async (req, res) => {
        try {
            // 1. Get List of all calendars the service account has access to
            const calendars = await calendarClient.listCalendars();

            // 2. Fetch events for each calendar in parallel
            // We use a broader time range check, defaulting to "now" if not specified.
            const timeMin = req.query.timeMin || new Date().toISOString();

            const eventsPromises = calendars.map(cal =>
                calendarClient.listEvents(cal.id, {
                    timeMin,
                    maxResults: 2500, // Fetch plenty per calendar
                    singleEvents: true,
                })
            );

            const eventsResults = await Promise.all(eventsPromises);

            // 3. Combine all events into a single list
            const allEvents = eventsResults.flatMap(result => {
                // result.items is the array of events
                // Attach calendarId AND the background color from the calendar list if possible
                const calInfo = calendars.find(c => c.id === result.calendarId);
                const color = calInfo ? calInfo.backgroundColor : null;

                return (result.items || []).map(event => ({
                    ...event,
                    calendarId: result.calendarId,
                    color: color
                }));
            });

            res.json({
                calendars: calendars.map(c => ({
                    id: c.id,
                    summary: c.summary,
                    backgroundColor: c.backgroundColor,
                    foregroundColor: c.foregroundColor
                })),
                items: allEvents
            });
        } catch (error) {
            console.error('Failed to fetch aggregated events:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // POST /api/calendar/events
    router.post('/events', async (req, res) => {
        try {
            const calendarId = req.query.calendarId || 'primary'; // Support targeting specific calendar
            const result = await calendarClient.insertEvent(req.body, calendarId);
            if (io) io.emit('calendar-updated', 'created');
            res.status(201).json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });


    router.put('/events/:id', async (req, res) => {
        try {
            const calendarId = req.query.calendarId || 'primary';
            const result = await calendarClient.updateEvent(req.params.id, req.body, calendarId);
            if (io) io.emit('calendar-updated', 'updated');
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.delete('/events/:id', async (req, res) => {
        try {
            const calendarId = req.query.calendarId || 'primary';
            await calendarClient.deleteEvent(req.params.id, calendarId);
            if (io) io.emit('calendar-updated', 'deleted');
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/calendar/webhook
    router.post('/webhook', (req, res) => {
        console.log('Received Google Calendar Webhook:', req.headers);
        // Trigger sync on clients
        if (io) io.emit('calendar-updated', 'webhook-change');

        // Important: Google expects a 200 OK immediately
        res.status(200).send('OK');
    });

    return router;
};
