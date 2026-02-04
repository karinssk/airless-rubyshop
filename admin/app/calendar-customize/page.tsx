'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, type View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource?: any;
    color?: string;
    calendarId?: string;
    calendarSummary?: string;
};

// Helper to map Google Event to BigCalendar Event
const mapToCalendarEvent = (googleEvent: any) => {
    return {
        id: googleEvent.id,
        title: googleEvent.summary || 'No Title',
        start: new Date(googleEvent.start.dateTime || googleEvent.start.date),
        end: new Date(googleEvent.end.dateTime || googleEvent.end.date),
        allDay: !googleEvent.start.dateTime,
        resource: googleEvent,
    };
};

// --- READ-ONLY POPOVER (Existing) ---
const EventDetailPopover = ({
    event,
    position,
    onClose,
    onDelete,
    onEdit
}: {
    event: CalendarEvent;
    position: { x: number, y: number } | null;
    onClose: () => void;
    onDelete: (id: string, calendarId: string) => void;
    onEdit: (event: CalendarEvent) => void;
}) => {
    if (!event || !position) return null;

    const gEvent = event.resource;
    const dateStr = moment(event.start).format('dddd, D MMMM');
    const timeStr = event.allDay ? '' : `${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}`;
    const calendarName = event.calendarSummary || event.calendarId;

    let left = position.x;
    let top = position.y;

    if (typeof window !== 'undefined') {
        if (left > window.innerWidth - 450) left = left - 460;
        if (top > window.innerHeight - 400) top = window.innerHeight - 420;
    }

    return (
        <div className="fixed inset-0 z-50" onClick={onClose} style={{ backgroundColor: 'transparent' }}>
            <div
                className="absolute bg-white text-gray-800 rounded-xl shadow-2xl w-[448px] overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-100"
                style={{ top: top, left: left }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="flex justify-end items-center px-2 py-2">
                    <div className="flex gap-1">
                        <button onClick={() => onEdit(event)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 tooltip" title="Edit event">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onClick={() => onDelete(event.id, event.calendarId || "")} className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Delete event">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 ml-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-[50px_1fr] pb-8 pr-6">
                    {/* Row 1: Title */}
                    <div className="flex justify-center pt-1">
                        <div className="w-4 h-4 mt-1.5 rounded shadow-sm" style={{ backgroundColor: event.color || '#3b82f6' }}></div>
                    </div>
                    <div>
                        <h2 className="text-[22px] font-normal leading-snug text-gray-800">{event.title}</h2>
                        <div className="text-sm text-gray-600 mt-1">
                            {dateStr} {timeStr && <span>⋅ {timeStr}</span>}
                        </div>
                    </div>

                    {/* Row 2: Location */}
                    {gEvent.location && (
                        <>
                            <div className="flex justify-center pt-3">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                            <div className="text-sm text-gray-600 pt-3 leading-tight">{gEvent.location}</div>
                        </>
                    )}

                    {/* Row 3: Description */}
                    {gEvent.description && (
                        <>
                            <div className="flex justify-center pt-3">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                            </div>
                            <div className="text-sm text-gray-600 pt-3 leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: gEvent.description }} />
                            </div>
                        </>
                    )}

                    {/* Row 4: Organize */}
                    <div className="flex justify-center pt-3">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div className="text-xs text-gray-500 pt-3.5">
                        <p>Calendar: {calendarName}</p>
                        <p>{gEvent.organizer?.email}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Custom Time Select Component to mimic Google's scroll behavior
const CustomTimeSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const listRef = React.useRef<HTMLDivElement>(null);

    // Toggle dropdown
    const toggle = () => setIsOpen(!isOpen);

    // Scroll to selected option when opened
    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedIndex = options.indexOf(value);
            if (selectedIndex !== -1) {
                const itemHeight = 28; // approx heigh of option
                // Center it or put it at bottom? User asked for "current time to bottom" behavior or similar
                // Google usually puts it in middle. User image shows it near bottom.
                // Let's try to center it for best UX, or scroll it into view.

                const scrollOffset = selectedIndex * itemHeight - (200 / 2) + (itemHeight / 2);
                listRef.current.scrollTop = scrollOffset;
            }
        }
    }, [isOpen, value, options]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(event.target as Node) && !(event.target as Element).closest('.time-select-trigger')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block w-24">
            <div
                className="time-select-trigger text-sm bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 cursor-pointer border border-transparent focus:border-blue-500"
                onClick={toggle}
            >
                {moment(`2000-01-01T${value}`).format('h:mm a')}
            </div>
            {isOpen && (
                <div
                    ref={listRef}
                    className="absolute z-50 mt-1 w-32 bg-white shadow-lg rounded-md border border-gray-200 max-h-[200px] overflow-y-auto custom-scrollbar left-0"
                >
                    {options.map(t => (
                        <div
                            key={t}
                            className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 ${t === value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                            onClick={() => { onChange(t); setIsOpen(false); }}
                        >
                            {moment(`2000-01-01T${t}`).format('h:mm a')}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- NEW CREATION POPOVER ---
const CreateEventPopover = ({
    slot,
    calendars,
    position,
    onClose,
    onSave
}: {
    slot: { start: Date, end: Date } | null;
    calendars: any[];
    position: { x: number, y: number } | null;
    onClose: () => void;
    onSave: (data: { title: string, calendarId: string, start: Date, end: Date, allDay: boolean, location: string, description: string }) => void;
}) => {
    const [title, setTitle] = useState('');
    const [selectedCalendarId, setSelectedCalendarId] = useState(calendars[0]?.id || 'primary');

    // Detailed fields
    const [allDay, setAllDay] = useState(true);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (slot) {
            setStartDate(slot.start);

            const slotStartMoment = moment(slot.start);
            const slotEndMoment = moment(slot.end);

            // Check if single-day all-day selection (exactly 24h from midnight to midnight)
            if (slotEndMoment.diff(slotStartMoment, 'days') === 1 &&
                slotStartMoment.hour() === 0 && slotStartMoment.minute() === 0 &&
                slotEndMoment.hour() === 0 && slotEndMoment.minute() === 0) {
                // This is a single-day all-day slot selection (e.g., Jan 19 00:00 to Jan 20 00:00)
                setEndDate(slot.start); // Display as single day
                setAllDay(true);
            } else {
                // It's either a timed slot or a multi-day all-day slot.
                // For display, we want the inclusive end date.
                const inclusiveEnd = moment(slot.end).subtract(1, 'minute').toDate();
                setEndDate(inclusiveEnd);
                setAllDay(true); // Default to all day for month view clicks
            }

            const now = new Date();
            const nextHour = new Date(now.setMinutes(0, 0, 0) + 3600000);
            setStartTime(moment(nextHour).format('HH:mm'));
            setEndTime(moment(nextHour).add(1, 'hour').format('HH:mm'));
        }
    }, [slot]);

    // Handle Closing logic
    const handleClose = () => {
        onClose();
    };

    // Positioning Logic
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number, left: number } | null>(null);

    // Initial position from props
    useEffect(() => {
        if (position) {
            setCoords({ top: position.y, left: position.x });
        }
    }, [position]);

    // Adjust position when content changes (e.g. allDay toggle) or on mount
    React.useLayoutEffect(() => {
        if (popoverRef.current && coords) {
            const rect = popoverRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newTop = coords.top;
            let newLeft = coords.left;

            // Horizontal Adjustment
            if (newLeft + rect.width > viewportWidth - 20) {
                newLeft = viewportWidth - rect.width - 20;
            }
            if (newLeft < 20) newLeft = 20;

            // Vertical Adjustment
            if (newTop + rect.height > viewportHeight - 20) {
                newTop = viewportHeight - rect.height - 20;
            }
            if (newTop < 20) newTop = 20;

            // Only update if significantly different to avoid loops (though useLayoutEffect should be safe)
            if (Math.abs(newTop - coords.top) > 5 || Math.abs(newLeft - coords.left) > 5) {
                setCoords({ top: newTop, left: newLeft });
            }
        }
    }, [allDay, coords]); // Re-run when size-affecting state changes

    if (!slot || !position) return null;

    // Use computed coords if available, else prop position (will get corrected instantly)
    const finalLeft = coords ? coords.left : position.x;
    const finalTop = coords ? coords.top : position.y;

    const handleSave = () => {
        let finalStart = moment(startDate);
        let finalEnd = moment(endDate);

        if (!allDay) {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            finalStart.hour(sh).minute(sm);
            finalEnd.hour(eh).minute(em);

            if (finalEnd.isBefore(finalStart)) {
                finalEnd.add(1, 'day');
            }
        } else {
            finalStart.startOf('day');
            finalEnd.endOf('day');
        }

        onSave({
            title,
            calendarId: selectedCalendarId,
            start: finalStart.toDate(),
            end: finalEnd.toDate(),
            allDay: allDay,
            location,
            description
        });
    };

    const displayStart = moment(startDate);
    const displayEnd = moment(endDate);

    const generateTimeOptions = () => {
        const times = [];
        for (let i = 0; i < 24 * 4; i++) {
            const h = Math.floor(i / 4);
            const m = (i % 4) * 15;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            times.push(timeStr);
        }
        return times;
    };
    const timeOptions = generateTimeOptions();

    return (
        <div className="fixed inset-0 z-50" onClick={onClose} style={{ backgroundColor: 'transparent' }}>
            <div
                ref={popoverRef}
                className="absolute bg-white rounded-lg shadow-2xl w-[448px] overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-100 border border-gray-100"
                style={{ top: finalTop, left: finalLeft }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Draggable handle area) */}
                <div className="bg-slate-100/50 px-4 py-2 flex justify-between items-center cursor-move handle">
                    <div className="h-1.5 w-10 bg-slate-300 rounded-full mx-auto"></div>
                    <button onClick={handleClose} className="text-gray-500 hover:bg-gray-200 rounded-full p-1 -mr-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 pt-2 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Title Input */}
                    <input
                        autoFocus
                        type="text"
                        placeholder="Add title"
                        className="text-2xl text-gray-800 placeholder-gray-400 border-b-2 border-gray-200 focus:border-blue-500 w-full outline-none pb-1 transition-colors"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />

                    {/* Date/Time Section */}
                    <div className="flex items-start gap-4 mt-5">
                        <svg className="w-5 h-5 text-gray-500 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <div className="flex-grow">
                            <div className="space-y-3">
                                {/* Row 1: Start Date - [Start Time] - End Date - [End Time] */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="date"
                                        className="text-sm border-none bg-gray-50 rounded px-2 py-1 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-100"
                                        style={{ backgroundColor: '#f1f3f4' }} // Light gray background like screenshot
                                        value={displayStart.format('YYYY-MM-DD')}
                                        onChange={(e) => setStartDate(new Date(e.target.value))}
                                    />

                                    {!allDay && (
                                        <CustomTimeSelect
                                            value={startTime}
                                            onChange={setStartTime}
                                            options={timeOptions}
                                        />
                                    )}

                                    <span className="text-gray-400">–</span>

                                    <input
                                        type="date"
                                        className="text-sm border-none bg-gray-50 rounded px-2 py-1 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-100"
                                        style={{ backgroundColor: '#f1f3f4' }}
                                        value={displayEnd.format('YYYY-MM-DD')}
                                        onChange={(e) => setEndDate(new Date(e.target.value))}
                                    />

                                    {!allDay && (
                                        <CustomTimeSelect
                                            value={endTime}
                                            onChange={setEndTime}
                                            options={timeOptions}
                                        />
                                    )}
                                </div>

                                {/* Row 2: All day checkbox & timezone */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-blue-600 focus:ring-0 w-4 h-4 border-gray-300"
                                            checked={allDay}
                                            onChange={(e) => setAllDay(e.target.checked)}
                                        />
                                        All day
                                    </label>
                                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">Time zone</span>

                                    {allDay && (
                                        <button
                                            className="inline-block ml-3 px-2 py-0.5 rounded border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                                            onClick={() => setAllDay(false)}
                                        >
                                            Add time
                                        </button>
                                    )}
                                </div>

                                {/* Row 3: Repeat */}
                                <div>
                                    <select className="text-sm text-gray-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:font-medium">
                                        <option>Does not repeat</option>
                                        <option>Daily</option>
                                        <option>Weekly on {displayStart.format('dddd')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Location */}
                    <div className="flex items-center gap-4 mt-4 relative group">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <input
                            type="text"
                            placeholder="Add location"
                            className="w-full text-sm text-gray-700 placeholder-gray-500 bg-gray-50 border-none rounded px-3 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-colors"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Add Description */}
                    <div className="flex items-start gap-4 mt-4">
                        <svg className="w-5 h-5 text-gray-500 mt-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                        <textarea
                            rows={3}
                            placeholder="Add description"
                            className="w-full text-sm text-gray-700 placeholder-gray-500 bg-gray-50 border-none rounded px-3 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-colors resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Calendar Selection */}
                    <div className="flex items-center gap-4 mt-4">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <div className="flex-grow">
                            <select
                                className="w-full text-sm text-gray-700 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                                value={selectedCalendarId}
                                onChange={(e) => setSelectedCalendarId(e.target.value)}
                            >
                                {calendars.map(cal => (
                                    <option key={cal.id} value={cal.id}>
                                        {cal.summary} ({cal.id === 'primary' ? 'Me' : 'Branch'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: calendars.find(c => c.id === selectedCalendarId)?.backgroundColor || '#ccc' }}
                        ></div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2 mt-8 pt-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded">More options</button>
                        <button
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- EDIT EVENT MODAL ---
const EditEventModal = ({
    event,
    calendars,
    onClose,
    onSave
}: {
    event: CalendarEvent;
    calendars: any[];
    onClose: () => void;
    onSave: (id: string, data: { title: string, calendarId: string, start: Date, end: Date, allDay: boolean, location: string, description: string }) => void;
}) => {
    const [title, setTitle] = useState(event.title || '');
    const [selectedCalendarId, setSelectedCalendarId] = useState(event.calendarId || calendars[0]?.id || 'primary');

    // Initialize state from existing event
    const [allDay, setAllDay] = useState(event.allDay);
    const [startDate, setStartDate] = useState(new Date(event.start));
    const [endDate, setEndDate] = useState(new Date(event.end)); // Note: Google/BigCal end dates might be exclusive/inclusive. 
    // If it was All Day, BigCal event.end is usually +1 day (exclusive).
    // If we want to show distinct dates (e.g. Jan 19 - Jan 19), we might need to subtract 1 day if it's all day and ends at midnight.
    // However, our Create logic sets explicit dates.
    // Let's rely on the formatted date inputs.

    const [location, setLocation] = useState(event.resource?.location || '');
    const [description, setDescription] = useState(event.resource?.description || '');

    // Time state
    const [startTime, setStartTime] = useState(moment(event.start).format('HH:mm'));
    const [endTime, setEndTime] = useState(moment(event.end).format('HH:mm'));

    // Fix Initial Date for Display if All Day
    useEffect(() => {
        if (event.allDay) {
            // If it's all day, event.end is usually midnight of the NEXT day.
            // We want to show the inclusive end date.
            const s = moment(event.start);
            const e = moment(event.end);
            if (e.diff(s, 'days') >= 1 && e.hours() === 0 && e.minutes() === 0) {
                setEndDate(moment(event.end).subtract(1, 'minute').toDate());
            }
        }
    }, [event]);

    const handleSave = () => {
        let finalStart = moment(startDate);
        let finalEnd = moment(endDate);

        if (!allDay) {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            finalStart.hour(sh).minute(sm);
            finalEnd.hour(eh).minute(em);

            if (finalEnd.isBefore(finalStart)) {
                finalEnd.add(1, 'day');
            }
        } else {
            finalStart.startOf('day');
            finalEnd.endOf('day');
        }

        onSave(event.id, {
            title,
            calendarId: selectedCalendarId,
            start: finalStart.toDate(),
            end: finalEnd.toDate(),
            allDay,
            location,
            description
        });
    };

    const displayStart = moment(startDate);
    const displayEnd = moment(endDate); // Helper for rendering

    const generateTimeOptions = () => {
        const times = [];
        for (let i = 0; i < 24 * 4; i++) {
            const h = Math.floor(i / 4);
            const m = (i % 4) * 15;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            times.push(timeStr);
        }
        return times;
    };
    const timeOptions = generateTimeOptions();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-2xl w-[500px] overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-100 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                    <h3 className="font-medium text-gray-700">Edit event</h3>
                    <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 rounded-full p-1 -mr-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 pt-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Title Input */}
                    <input
                        autoFocus
                        type="text"
                        placeholder="Add title"
                        className="text-2xl text-gray-800 placeholder-gray-400 border-b-2 border-gray-200 focus:border-blue-500 w-full outline-none pb-1 transition-colors"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />

                    {/* Date/Time Section */}
                    <div className="flex items-start gap-4 mt-5">
                        <svg className="w-5 h-5 text-gray-500 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <div className="flex-grow">
                            <div className="space-y-3">
                                {/* Row 1: Start Date - [Start Time] - End Date - [End Time] */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="date"
                                        className="text-sm border-none bg-gray-50 rounded px-2 py-1 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-100"
                                        style={{ backgroundColor: '#f1f3f4' }}
                                        value={displayStart.format('YYYY-MM-DD')}
                                        onChange={(e) => setStartDate(new Date(e.target.value))}
                                    />

                                    {!allDay && (
                                        <CustomTimeSelect
                                            value={startTime}
                                            onChange={setStartTime}
                                            options={timeOptions}
                                        />
                                    )}

                                    <span className="text-gray-400">–</span>

                                    <input
                                        type="date"
                                        className="text-sm border-none bg-gray-50 rounded px-2 py-1 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-100"
                                        style={{ backgroundColor: '#f1f3f4' }}
                                        value={displayEnd.format('YYYY-MM-DD')}
                                        onChange={(e) => setEndDate(new Date(e.target.value))}
                                    />

                                    {!allDay && (
                                        <CustomTimeSelect
                                            value={endTime}
                                            onChange={setEndTime}
                                            options={timeOptions}
                                        />
                                    )}
                                </div>

                                {/* Row 2: All day checkbox & timezone */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-blue-600 focus:ring-0 w-4 h-4 border-gray-300"
                                            checked={allDay}
                                            onChange={(e) => setAllDay(e.target.checked)}
                                        />
                                        All day
                                    </label>
                                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">Time zone</span>

                                    {allDay && (
                                        <button
                                            className="inline-block ml-3 px-2 py-0.5 rounded border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                                            onClick={() => setAllDay(false)}
                                        >
                                            Add time
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Location */}
                    <div className="flex items-center gap-4 mt-4 relative group">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <input
                            type="text"
                            placeholder="Add location"
                            className="w-full text-sm text-gray-700 placeholder-gray-500 bg-gray-50 border-none rounded px-3 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-colors"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Add Description */}
                    <div className="flex items-start gap-4 mt-4">
                        <svg className="w-5 h-5 text-gray-500 mt-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                        <textarea
                            rows={3}
                            placeholder="Add description"
                            className="w-full text-sm text-gray-700 placeholder-gray-500 bg-gray-50 border-none rounded px-3 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-colors resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Calendar Selection */}
                    <div className="flex items-center gap-4 mt-4">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <div className="flex-grow">
                            <select
                                className="w-full text-sm text-gray-700 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                                value={selectedCalendarId}
                                onChange={(e) => setSelectedCalendarId(e.target.value)}
                            >
                                {calendars.map(cal => (
                                    <option key={cal.id} value={cal.id}>
                                        {cal.summary} ({cal.id === 'primary' ? 'Me' : 'Branch'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: calendars.find(c => c.id === selectedCalendarId)?.backgroundColor || '#ccc' }}
                        ></div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2 mt-8 pt-2">
                        <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarCustomizePage = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendars, setCalendars] = useState<any[]>([]);
    const [visibleCalendarIds, setVisibleCalendarIds] = useState<Set<string>>(new Set());
    const [view, setView] = useState<View>("week");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // States for Popovers
    const [selectedEvent, setSelectedEvent] = useState<{ event: CalendarEvent, position: { x: number, y: number } } | null>(null);
    const [creationSlot, setCreationSlot] = useState<{ start: Date, end: Date, position: { x: number, y: number } } | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-airless-spray.rubyshop.co.th/';
            const res = await fetch(`${backendUrl}/api/calendar/events`);

            if (!res.ok) throw new Error('Failed to fetch events');

            const data = await res.json();

            const rawEvents = data.items || [];
            const rawCalendars = data.calendars || [];

            const mappedEvents = rawEvents.map((e: any) => {
                const mapped = mapToCalendarEvent(e) as CalendarEvent;
                return {
                    ...mapped,
                    color: e.color,
                    calendarId: e.calendarId,
                    calendarSummary: rawCalendars.find((c: any) => c.id === e.calendarId)?.summary
                };
            });

            setEvents(mappedEvents);
            setCalendars(rawCalendars);
            setVisibleCalendarIds(new Set(rawCalendars.map((c: any) => c.id)));

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleCalendar = (id: string) => {
        const newSet = new Set(visibleCalendarIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setVisibleCalendarIds(newSet);
    };

    const handleDeleteEvent = async (eventId: string, calendarId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-airless-spray.rubyshop.co.th/';
            const res = await fetch(`${backendUrl}/api/calendar/events/${eventId}?calendarId=${encodeURIComponent(calendarId)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete event');
            fetchEvents();
            setSelectedEvent(null);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEditEventClick = (event: CalendarEvent) => {
        setEditingEvent(event);
        setSelectedEvent(null); // Close the detail popover
    };

    const handleUpdateEvent = async (id: string, data: any) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-airless-spray.rubyshop.co.th/';

            // Map flat data back to Google Resource structure
            const resource: any = {
                summary: data.title,
                location: data.location,
                description: data.description,
            };

            if (data.allDay) {
                resource.start = { date: moment(data.start).format('YYYY-MM-DD') };
                // Google Calendar API exclusive end date for all-day events
                // If we want Jan 19 to Jan 19, we send start=19, end=20.
                // Our 'data.end' from EditModal is inclusive end of day (e.g. Jan 19 23:59:59).
                // So adding 1 day to start date isn't enough if it spans multiple days.
                // We should use data.end. 
                // data.end is likely set to endOf('day').
                resource.end = { date: moment(data.end).add(1, 'second').format('YYYY-MM-DD') };
            } else {
                resource.start = { dateTime: data.start.toISOString() };
                resource.end = { dateTime: data.end.toISOString() };
            }

            const res = await fetch(`${backendUrl}/api/calendar/events/${id}?calendarId=${encodeURIComponent(data.calendarId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resource)
            });
            if (!res.ok) throw new Error('Failed to update event');

            fetchEvents();
            setEditingEvent(null);
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Triggered when selecting or dragging a slot
    const handleSelectSlot = (slotInfo: { start: Date, end: Date, box?: { x: number, y: number } }) => {
        // BigCalendar 'selectable' prop handles the drag-to-select logic
        // slotInfo.start and slotInfo.end will be the range.
        // We use mouse coordinates to position the popover roughly.
        // Since we don't have the event object here, we estimate position or center it.
        // box property exists if we can access it, but standard signature might vary. 
        // We'll trust a simple heuristic or default to center/mouse if possible.

        // For simplicity, let's use a centered position or last known mouse position if accessible,
        // but react-big-calendar doesn't pass mouse event here comfortably.
        // We'll position it near the center of the screen or standard offset.

        // BETTER: Use a fixed position or try to grab clientX/Y from a global tracker if really needed.
        // But for now, let's center it or put it in a predictable spot.
        // Actually, let's use a "last click" tracker or just default to 200, 200 if we can't find it.

        // WORKAROUND: We can use a ref or state to track querySelector for the slot, but that's complex.
        // Let's just put it in the center-ish for now, or use a cached mouse position.

        setCreationSlot({
            start: slotInfo.start,
            end: slotInfo.end,
            position: { x: window.innerWidth / 2 - 224, y: window.innerHeight / 3 } // Center-ish
        });

        // Clear selected event if any
        setSelectedEvent(null);
    };

    const handleCreateEvent = async (data: { title: string, calendarId: string, start: Date, end: Date, allDay: boolean, location: string, description: string }) => {
        if (!data.title || !creationSlot) return;

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-airless-spray.rubyshop.co.th/';
            const newEvent = {
                summary: data.title,
                start: data.allDay
                    ? { date: moment(data.start).format('YYYY-MM-DD') }
                    : { dateTime: data.start.toISOString() },
                end: data.allDay
                    ? { date: moment(data.end).add(1, 'day').format('YYYY-MM-DD') } // Google all-day end is exclusive
                    : { dateTime: data.end.toISOString() },
                location: data.location,
                description: data.description
            };

            const res = await fetch(`${backendUrl}/api/calendar/events?calendarId=${encodeURIComponent(data.calendarId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            });

            if (!res.ok) throw new Error('Failed to create event');

            fetchEvents();
            setCreationSlot(null); // Close popover
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleSelectEvent = (event: CalendarEvent, e: React.SyntheticEvent) => {
        // Prevent creation popover from showing
        setCreationSlot(null);

        const mouseEvent = e as unknown as React.MouseEvent;
        setSelectedEvent({
            event,
            position: { x: mouseEvent.clientX, y: mouseEvent.clientY }
        });
    }

        const visibleEvents = events.filter((event) =>
            event.calendarId ? visibleCalendarIds.has(event.calendarId) : false
        );

    return (
        <div className="container mx-auto h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Custom Google Calendar</h1>
            </div>

            {loading && <div className="p-8 text-center">Loading calendar...</div>}
            {error && <div className="p-8 text-center text-red-500">Error: {error}</div>}

            {!loading && !error && (
                <div className="flex flex-row h-[calc(100vh-150px)] gap-4">
                    <div className="w-64 flex-shrink-0 bg-white p-4 rounded-xl border border-slate-200">
                        <h3 className="font-medium text-gray-700 mb-3">My Calendars</h3>
                        <div className="space-y-2">
                            {calendars.map(cal => (
                                <div key={cal.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={visibleCalendarIds.has(cal.id)}
                                        onChange={() => toggleCalendar(cal.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.backgroundColor }}></span>
                                    <span className="text-sm text-gray-700 truncate" title={cal.summary}>{cal.summary}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow bg-white p-4 shadow-sm rounded-xl border border-slate-200">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {(["month", "week", "day"] as View[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setView(mode)}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${view === mode
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 bg-white text-slate-600"
                                        }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                        <Calendar
                            localizer={localizer}
                            events={visibleEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            views={["month", "week", "day"]}
                            view={view}
                            onView={(next) => setView(next)}
                            selectable
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            eventPropGetter={(event: any) => ({
                                style: { backgroundColor: event.color || '#3b82f6' }
                            })}
                        />
                    </div>
                </div>
            )}

            {selectedEvent && (
                <EventDetailPopover
                    event={selectedEvent.event}
                    position={selectedEvent.position}
                    onClose={() => setSelectedEvent(null)}
                    onDelete={handleDeleteEvent}
                    onEdit={handleEditEventClick}
                />
            )}

            {creationSlot && (
                <CreateEventPopover
                    slot={creationSlot}
                    calendars={calendars}
                    position={creationSlot.position}
                    onClose={() => setCreationSlot(null)}
                    onSave={handleCreateEvent}
                />
            )}

            {/* Edit Modal */}
            {editingEvent && (
                <EditEventModal
                    event={editingEvent}
                    calendars={calendars}
                    onClose={() => setEditingEvent(null)}
                    onSave={handleUpdateEvent}
                />
            )}
        </div>
    );
};

export default CalendarCustomizePage;
