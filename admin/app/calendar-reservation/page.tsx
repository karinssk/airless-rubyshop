"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";
import Link from "next/link";
import BookingModal from "./components/BookingModal";
import BookingTooltip from "./components/BookingTooltip";

const API_URL = backendBaseUrl;

type IndividualRoom = {
  _id: string;
  roomNumber: string;
  floor?: string;
  status: string;
};

type RoomType = {
  _id: string;
  name: { en: string; th: string } | string;
  individuals: IndividualRoom[];
};

type Category = {
  _id: string;
  name: { en: string; th: string } | string;
};

type GroupedRoom = {
  category: Category;
  rooms: RoomType[];
};

type Booking = {
  _id: string;
  bookingNumber: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  roomTypeId: any;
  individualRoomId: any;
};

export default function CalendarReservationPage() {
  const [groupedRooms, setGroupedRooms] = useState<GroupedRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [modalDefaults, setModalDefaults] = useState<{
    roomTypeId?: string;
    individualRoomId?: string;
    checkIn?: string;
    checkOut?: string;
  }>({});

  // Tooltip state
  const [hoveredBooking, setHoveredBooking] = useState<Booking | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Calculate week range (7 days starting from currentDate)
  const getWeekDates = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentDate);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = weekDates[0].toISOString().split("T")[0];
      const endDate = new Date(weekDates[6]);
      endDate.setDate(endDate.getDate() + 1); // Include end date
      const endDateStr = endDate.toISOString().split("T")[0];

      const res = await fetch(
        `${API_URL}/api/calendar/reservation-data?startDate=${startDate}&endDate=${endDateStr}`
      );
      const data = await res.json();

      setGroupedRooms(data.groupedRooms || []);
      setBookings(data.bookings || []);

      // Expand all categories by default
      const expanded: Record<string, boolean> = {};
      data.groupedRooms?.forEach((group: GroupedRoom) => {
        expanded[group.category._id] = true;
      });
      setExpandedCategories(expanded);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleAllCategories = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    groupedRooms.forEach((group) => {
      newState[group.category._id] = expand;
    });
    setExpandedCategories(newState);
  };

  const getRoomName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  const getCategoryName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  // Get bookings for a specific individual room and date
  const getBookingsForCell = (individualRoomId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.filter((booking) => {
      if (!booking.individualRoomId || booking.individualRoomId._id !== individualRoomId) {
        return false;
      }
      const checkIn = new Date(booking.checkInDate).toISOString().split("T")[0];
      const checkOut = new Date(booking.checkOutDate).toISOString().split("T")[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  // Calculate booking block position and width
  const calculateBookingStyle = (booking: Booking, individualRoomId: string) => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    // Find start position in current week
    const startIndex = weekDates.findIndex(
      (date) => date.toISOString().split("T")[0] === checkIn.toISOString().split("T")[0]
    );

    const endIndex = weekDates.findIndex(
      (date) => date.toISOString().split("T")[0] === checkOut.toISOString().split("T")[0]
    );

    // Calculate actual positions
    const left = startIndex >= 0 ? startIndex : 0;
    const visibleCheckOut = endIndex >= 0 ? endIndex : 7;
    const width = visibleCheckOut - left;

    return { left, width };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-orange-500 text-white";
      case "checked-in":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-blue-500 text-white";
      case "checked-out":
        return "bg-gray-400 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Handle click on empty cell to create booking
  const handleCellClick = (roomTypeId: string, individualRoomId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split("T")[0];

    setModalDefaults({
      roomTypeId,
      individualRoomId,
      checkIn: dateStr,
      checkOut: nextDayStr,
    });
    setSelectedBookingId(null);
    setShowBookingModal(true);
  };

  // Handle click on booking block to edit
  const handleBookingClick = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBookingId(booking._id);
    setModalDefaults({});
    setShowBookingModal(true);
  };

  // Handle hover on booking block
  const handleBookingHover = (booking: Booking | null, e?: React.MouseEvent) => {
    if (booking && e) {
      setHoveredBooking(booking);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredBooking(null);
    }
  };

  // Handle modal close and refresh
  const handleModalClose = () => {
    setShowBookingModal(false);
    setSelectedBookingId(null);
    setModalDefaults({});
  };

  const handleBookingSaved = () => {
    loadCalendarData();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-3 sm:px-6 py-3 sm:py-4 shadow-sm shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Calendar Reservation</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const today = new Date();
                const checkIn = today.toISOString().split("T")[0];
                const nextDay = new Date(today);
                nextDay.setDate(nextDay.getDate() + 1);
                const checkOut = nextDay.toISOString().split("T")[0];
                setModalDefaults({ checkIn, checkOut });
                setSelectedBookingId(null);
                setShowBookingModal(true);
              }}
              className="flex-1 sm:flex-initial text-center rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
              type="button"
            >
              + Create
            </button>
            
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => navigateWeek(-1)}
              className="rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <span className="hidden sm:inline">◀◀ Week</span>
              <span className="sm:hidden">◀◀</span>
            </button>
            <button
              onClick={() => navigateDay(-1)}
              className="rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <span className="hidden sm:inline">◀ Day</span>
              <span className="sm:hidden">◀</span>
            </button>
            <button
              onClick={goToToday}
              className="rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:bg-blue-50 whitespace-nowrap"
            >
              Today
            </button>
            <span className="px-2 sm:px-3 text-[10px] sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <button
              onClick={() => navigateDay(1)}
              className="rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Day ▶</span>
              <span className="sm:hidden">▶</span>
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Week ▶▶</span>
              <span className="sm:hidden">▶▶</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAllCategories(true)}
              className="flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Show All
            </button>
            <button
              onClick={() => toggleAllCategories(false)}
              className="flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hide All
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto pb-20 sm:pb-0">
        <div className="inline-block min-w-full">
          {/* Date Header */}
          <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-white">
            <div className="w-32 sm:w-48 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-2 sm:p-3">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">Rooms</span>
            </div>
            {weekDates.map((date, idx) => (
              <div
                key={idx}
                className="w-24 sm:w-36 flex-shrink-0 border-r border-slate-200 p-1 sm:p-2 text-center"
              >
                <div className="text-[10px] sm:text-xs font-semibold text-slate-700">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {date.getDate()}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500">
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </div>
              </div>
            ))}
          </div>

          {/* Room Rows */}
          {groupedRooms.map((group) => (
            <div key={group.category._id}>
              {/* Category Header */}
              <div
                className="sticky top-[60px] sm:top-[73px] z-10 flex cursor-pointer border-b border-slate-200 bg-slate-100 hover:bg-slate-200 shadow-sm"
                onClick={() => toggleCategory(group.category._id)}
              >
                <div className="w-32 sm:w-48 flex-shrink-0 border-r border-slate-200 p-2 sm:p-3 bg-slate-100">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm">
                      {expandedCategories[group.category._id] ? "▼" : "▶"}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {getCategoryName(group.category.name).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 bg-slate-100"></div>
              </div>

              {/* Individual Rooms */}
              {expandedCategories[group.category._id] &&
                group.rooms.map((room) =>
                  room.individuals.map((individual) => (
                    <div
                      key={individual._id}
                      className="flex border-b border-slate-200 bg-white hover:bg-slate-50"
                    >
                      {/* Room Name */}
                      <div className="w-32 sm:w-48 flex-shrink-0 border-r border-slate-200 p-2 sm:p-3">
                        <div className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                          {getRoomName(room.name)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-500">
                          Room {individual.roomNumber}
                        </div>
                      </div>

                      {/* Date Cells */}
                      <div className="relative flex flex-1">
                        {weekDates.map((date, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleCellClick(room._id, individual._id, date)}
                            className="relative w-24 sm:w-36 flex-shrink-0 border-r border-slate-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors"
                            style={{ minHeight: "50px" }}
                            title="Click to create booking"
                          >
                            {/* Empty cell - clickable for booking */}
                          </div>
                        ))}

                        {/* Booking Blocks (absolute positioned) */}
                        {bookings
                          .filter(
                            (b) =>
                              b.individualRoomId &&
                              b.individualRoomId._id === individual._id
                          )
                          .map((booking) => {
                            const style = calculateBookingStyle(booking, individual._id);
                            if (style.width <= 0) return null;

                            // Mobile: 96px (w-24), Desktop: 144px (w-36)
                            const cellWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 96 : 144;

                            return (
                              <div
                                key={booking._id}
                                onClick={(e) => handleBookingClick(booking, e)}
                                onMouseEnter={(e) => handleBookingHover(booking, e)}
                                onMouseLeave={() => handleBookingHover(null)}
                                className={`absolute top-1 rounded px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity ${getStatusColor(
                                  booking.status
                                )} truncate`}
                                style={{
                                  left: `${style.left * cellWidth}px`,
                                  width: `${style.width * cellWidth - 8}px`,
                                  minHeight: "35px",
                                }}
                                title="Click to edit booking"
                              >
                                {booking.guestName}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))
                )}

              {/* Unallocated Row for this room type */}
              {expandedCategories[group.category._id] &&
                group.rooms.map((room) => {
                  const unallocatedBookings = bookings.filter(
                    (b) =>
                      b.roomTypeId &&
                      b.roomTypeId._id === room._id &&
                      !b.individualRoomId
                  );

                  if (unallocatedBookings.length === 0) return null;

                  return (
                    <div
                      key={`unallocated-${room._id}`}
                      className="flex border-b border-slate-200 bg-blue-50"
                    >
                      <div className="w-32 sm:w-48 flex-shrink-0 border-r border-slate-200 p-2 sm:p-3">
                        <div className="text-xs sm:text-sm font-semibold italic text-blue-700">
                          Unallocated
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-500 truncate">
                          {getRoomName(room.name)}
                        </div>
                      </div>

                      <div className="relative flex flex-1">
                        {weekDates.map((date, idx) => (
                          <div
                            key={idx}
                            className="relative w-24 sm:w-36 flex-shrink-0 border-r border-slate-200 p-1"
                            style={{ minHeight: "50px" }}
                          />
                        ))}

                        {unallocatedBookings.map((booking) => {
                          const style = calculateBookingStyle(booking, "");
                          if (style.width <= 0) return null;

                          // Mobile: 96px (w-24), Desktop: 144px (w-36)
                          const cellWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 96 : 144;

                          return (
                            <div
                              key={booking._id}
                              onClick={(e) => handleBookingClick(booking, e)}
                              onMouseEnter={(e) => handleBookingHover(booking, e)}
                              onMouseLeave={() => handleBookingHover(null)}
                              className="absolute top-1 rounded bg-blue-600 px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity truncate"
                              style={{
                                left: `${style.left * cellWidth}px`,
                                width: `${style.width * cellWidth - 8}px`,
                                minHeight: "35px",
                              }}
                              title="Click to edit booking"
                            >
                              {booking.guestName}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={handleModalClose}
        onSaved={handleBookingSaved}
        bookingId={selectedBookingId}
        defaultRoomTypeId={modalDefaults.roomTypeId}
        defaultIndividualRoomId={modalDefaults.individualRoomId}
        defaultCheckIn={modalDefaults.checkIn}
        defaultCheckOut={modalDefaults.checkOut}
      />

      {/* Booking Tooltip */}
      {hoveredBooking && (
        <BookingTooltip booking={hoveredBooking} position={tooltipPosition} />
      )}
    </div>
  );
}
