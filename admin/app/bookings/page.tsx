"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";
import Swal from "sweetalert2";

const API_URL = backendBaseUrl;

type BookingSummary = {
  id: string;
  bookingNumber: string;
  roomType: {
    id: string;
    name: any;
  };
  individualRoom?: {
    roomNumber: string;
    floor: number;
  } | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  "checked-in": "bg-green-100 text-green-700",
  "checked-out": "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  "no-show": "bg-red-100 text-red-700",
};

const paymentStatusColors: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  refunded: "bg-gray-100 text-gray-700",
};

export default function BookingsList() {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    try {
      const url = filterStatus === "all"
        ? `${API_URL}/bookings`
        : `${API_URL}/bookings?status=${filterStatus}`;
      const res = await fetch(url, { headers: getAdminAuthHeaders() });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId: string, bookingNumber: string) => {
    const result = await Swal.fire({
      title: "Delete Booking?",
      html: `Are you sure you want to delete booking <strong>${bookingNumber}</strong>?<br><br><span style="color: #dc2626; font-size: 14px;">⚠️ This action cannot be undone!</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
          method: "DELETE",
          headers: getAdminAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error("Failed to delete booking");
        }

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: `Booking ${bookingNumber} has been deleted`,
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });

        // Reload the bookings list
        loadData();
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: "Failed to delete the booking. Please try again.",
          confirmButtonColor: "#dc2626",
        });
      }
    }
  };

  const getRoomName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      booking.bookingNumber.toLowerCase().includes(searchLower) ||
      booking.guestName.toLowerCase().includes(searchLower) ||
      booking.guestEmail.toLowerCase().includes(searchLower) ||
      booking.guestPhone.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    checkedIn: bookings.filter((b) => b.status === "checked-in").length,
    upcoming: bookings.filter(
      (b) =>
        b.status === "confirmed" &&
        new Date(b.checkInDate) > new Date()
    ).length,
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage room reservations and guest bookings
          </p>
        </div>
        <Link
          href="/calendar-reservation"
          className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          📅 View Calendar
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[10px] sm:text-xs text-slate-500">Total Bookings</div>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-blue-200 bg-blue-50 p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-blue-900">
            {stats.confirmed}
          </div>
          <div className="text-[10px] sm:text-xs text-blue-600">Confirmed</div>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-green-200 bg-green-50 p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-green-900">
            {stats.checkedIn}
          </div>
          <div className="text-[10px] sm:text-xs text-green-600">Checked In</div>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-purple-200 bg-purple-50 p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-purple-900">
            {stats.upcoming}
          </div>
          <div className="text-[10px] sm:text-xs text-purple-600">Upcoming</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center">
        <input
          placeholder="Search by booking #, name, email..."
          className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 md:flex-1"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-blue-500"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked-in">Checked In</option>
          <option value="checked-out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No Show</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center text-xs sm:text-sm text-slate-500">
          Loading...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center">
          <p className="text-xs sm:text-sm text-slate-500">
            {search || filterStatus !== "all"
              ? "No bookings match your filters"
              : "No bookings yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {booking.bookingNumber}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${
                        statusColors[booking.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Guest Info */}
                <div className="mb-3 rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500 mb-1">GUEST</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {booking.guestName}
                  </div>
                  <div className="text-xs text-slate-600">{booking.guestEmail}</div>
                  <div className="text-xs text-slate-600">{booking.guestPhone}</div>
                </div>

                {/* Room Info */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-slate-500 mb-1">ROOM</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {getRoomName(booking.roomType.name)}
                  </div>
                  {booking.individualRoom && (
                    <div className="text-xs text-slate-600">
                      Room {booking.individualRoom.roomNumber} · Floor{" "}
                      {booking.individualRoom.floor}
                    </div>
                  )}
                  <div className="text-xs text-slate-600">
                    👥 {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? "s" : ""}
                  </div>
                </div>

                {/* Dates */}
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">CHECK-IN</div>
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(booking.checkInDate)}
                    </div>
                  </div>
                  <div className="text-slate-400">→</div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500">CHECK-OUT</div>
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(booking.checkOutDate)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  {booking.nights} night{booking.nights > 1 ? "s" : ""}
                </div>

                {/* Price & Payment */}
                <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">TOTAL PRICE</div>
                    <div className="text-lg font-bold text-slate-900">
                      ฿{booking.totalPrice.toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      paymentStatusColors[booking.paymentStatus] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {booking.paymentStatus}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="flex-1 text-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleDelete(booking.id, booking.bookingNumber)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    title="Delete booking"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Booking
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Dates
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {booking.bookingNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {booking.guestName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {booking.guestEmail}
                      </div>
                      <div className="text-xs text-slate-500">
                        {booking.guestPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {getRoomName(booking.roomType.name)}
                      </div>
                      {booking.individualRoom && (
                        <div className="text-xs text-slate-500">
                          Room {booking.individualRoom.roomNumber} (Floor{" "}
                          {booking.individualRoom.floor})
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        👥 {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900">
                        {formatDate(booking.checkInDate)}
                      </div>
                      <div className="text-xs text-slate-500">to</div>
                      <div className="text-slate-900">
                        {formatDate(booking.checkOutDate)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {booking.nights} night{booking.nights > 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-slate-900">
                        ฿{booking.totalPrice.toLocaleString()}
                      </div>
                      <div
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                          paymentStatusColors[booking.paymentStatus] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {booking.paymentStatus}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          statusColors[booking.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(booking.id, booking.bookingNumber)}
                          className="inline-block rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          title="Delete booking"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
