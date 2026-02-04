"use client";

type Booking = {
  _id: string;
  bookingNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  paymentStatus?: string;
  totalPrice?: number;
  numberOfGuests?: number;
};

type BookingTooltipProps = {
  booking: Booking;
  position: { x: number; y: number };
};

export default function BookingTooltip({ booking, position }: BookingTooltipProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateNights = () => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      confirmed: "bg-orange-100 text-orange-700",
      "checked-in": "bg-green-100 text-green-700",
      pending: "bg-blue-100 text-blue-700",
      "checked-out": "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return badges[status] || "bg-slate-100 text-slate-700";
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      refunded: "bg-red-100 text-red-700",
    };
    return badges[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <div
      className="pointer-events-none fixed z-50 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
        marginTop: "-10px",
      }}
    >
      {/* Booking Number */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600">{booking.bookingNumber}</span>
        <div className="flex gap-1">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(booking.status)}`}>
            {booking.status}
          </span>
          {booking.paymentStatus && (
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${getPaymentBadge(booking.paymentStatus)}`}>
              {booking.paymentStatus}
            </span>
          )}
        </div>
      </div>

      {/* Guest Name */}
      <div className="mb-3">
        <h3 className="text-base font-bold text-slate-900">{booking.guestName}</h3>
        {booking.guestEmail && (
          <p className="text-xs text-slate-600">{booking.guestEmail}</p>
        )}
        {booking.guestPhone && (
          <p className="text-xs text-slate-600">{booking.guestPhone}</p>
        )}
      </div>

      {/* Dates */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-600">
            <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-600">
            <strong>Check-out:</strong> {formatDate(booking.checkOutDate)}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          {calculateNights()} {calculateNights() === 1 ? "night" : "nights"}
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-1 border-t border-slate-100 pt-3">
        {booking.numberOfGuests && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? "s" : ""}</span>
          </div>
        )}
        {booking.totalPrice && (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>฿{booking.totalPrice.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Tooltip Arrow */}
      <div
        className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white"
        style={{ bottom: "-6px" }}
      />
    </div>
  );
}
