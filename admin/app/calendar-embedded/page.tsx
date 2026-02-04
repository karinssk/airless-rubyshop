import React from 'react';

const CalendarEmbeddedPage = () => {
    // List of Calendar IDs to display
    // 1. Primary Calendar (from env or default placeholder)
    // 2. Thai Holidays (standard public ID)
    // 3. Birthdays (standard public ID)
    const calendarIds = [
        'garinsookkalya@gmail.com', // User's Primary Calendar (Source of Truth)
        'addressbook#contacts@group.v.calendar.google.com', // Birthdays
        'th.th#holiday@group.v.calendar.google.com' // Thai Holidays
    ];

    // Remove duplicates and filter empty
    const uniqueIds = Array.from(new Set(calendarIds)).filter(Boolean);

    // Base URL
    let calendarSrc = `https://calendar.google.com/calendar/embed?ctz=Asia%2FBangkok`;

    // Append styling and preferences
    calendarSrc += '&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=1&showTz=0';

    // Append each calendar ID as a 'src' parameter
    // Also add a color for each if desired (color=%23[HEX])
    const colors = ['#039BE5', '#33B679', '#D50000', '#E67C73', '#F4511E'];

    uniqueIds.forEach((id, index) => {
        calendarSrc += `&src=${encodeURIComponent(id)}`;
        // cycle through colors
        calendarSrc += `&color=${encodeURIComponent(colors[index % colors.length])}`;
    });

    return (
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-slate-800">Google Calendar</h1>
                <div className="w-full h-full bg-white p-4 shadow-sm rounded-xl border border-slate-200">
                    <div className="relative w-full" style={{ paddingBottom: '75%', height: 0, overflow: 'hidden' }}>
                        <iframe
                            src={calendarSrc}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                            frameBorder="0"
                            scrolling="no"
                            title="Google Calendar Embedded"
                        ></iframe>
                    </div>
                    <div className="mt-4 text-center text-sm text-slate-500">
                        <p>Displaying {uniqueIds.length} calendars.</p>
                    </div>
                </div>
            </div>
    );
};

export default CalendarEmbeddedPage;
