"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";
import Link from "next/link";

const API_URL = backendBaseUrl;

type BookingDetail = {
  id: string;
  bookingNumber: string;
  roomType: {
    id: string;
    name: any;
    coverImage?: string;
  };
  individualRoom?: {
    id: string;
    roomNumber: string;
    floor: number;
    building: string;
  } | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  roomPrice: number;
  promoCode?: {
    code: string;
    name: any;
    discountType: string;
    discountValue: number;
  } | null;
  discount: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  specialRequests?: string;
  internalNotes?: string;
  calendarEventId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");

  useEffect(() => {
    loadBooking();
  }, [params.id]);

  const loadBooking = async () => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/bookings/${params.id}`, {
        headers: getAdminAuthHeaders(),
      });
      if (!res.ok) {
        alert("Booking not found");
        router.push("/bookings");
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
      setEditStatus(data.booking.status);
      setEditPaymentStatus(data.booking.paymentStatus);
      setEditInternalNotes(data.booking.internalNotes || "");
    } catch (error) {
      console.error("Failed to load booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!booking) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/bookings/${booking.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPaymentStatus,
          internalNotes: editInternalNotes,
        }),
      });

      if (res.ok) {
        await loadBooking();
        setEditing(false);
        alert("Booking updated successfully");
      } else {
        alert("Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const res = await fetch(`${API_URL}/bookings/${booking.id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      });

      if (res.ok) {
        alert("Booking deleted successfully");
        router.push("/bookings");
      } else {
        alert("Failed to delete booking");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking");
    }
  };

  const getRoomName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading booking...
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Booking not found</p>
          <Link
            href="/bookings"
            className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/bookings"
            className="mb-2 inline-block text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to bookings
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Booking {booking.bookingNumber}
          </h1>
          <p className="text-sm text-slate-500">
            Created {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Edit Status
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Guest Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Guest Information
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Name
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {booking.guestName}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Email
                </div>
                <div className="text-base text-slate-900">
                  <a
                    href={`mailto:${booking.guestEmail}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {booking.guestEmail}
                  </a>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Phone
                </div>
                <div className="text-base text-slate-900">
                  <a
                    href={`tel:${booking.guestPhone}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {booking.guestPhone}
                  </a>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Number of Guests
                </div>
                <div className="text-base text-slate-900">
                  {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Room Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Room Information
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Room Type
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {getRoomName(booking.roomType.name)}
                </div>
              </div>
              {booking.individualRoom && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Physical Room
                  </div>
                  <div className="text-base text-slate-900">
                    Room {booking.individualRoom.roomNumber} - Floor{" "}
                    {booking.individualRoom.floor}
                    {booking.individualRoom.building &&
                      ` (${booking.individualRoom.building})`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Stay Dates
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Check-in
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {formatDate(booking.checkInDate)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Check-out
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {formatDate(booking.checkOutDate)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Duration
                </div>
                <div className="text-base text-slate-900">
                  {booking.nights} night{booking.nights > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-bold text-slate-900">
                Special Requests
              </h2>
              <p className="text-sm text-slate-700">{booking.specialRequests}</p>
            </div>
          )}

          {/* Internal Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-2 text-lg font-bold text-slate-900">
              Internal Notes
            </h2>
            {editing ? (
              <textarea
                value={editInternalNotes}
                onChange={(e) => setEditInternalNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                rows={4}
                placeholder="Add internal notes for staff..."
              />
            ) : (
              <p className="text-sm text-slate-700">
                {booking.internalNotes || "No internal notes"}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Status</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Booking Status
                </div>
                {editing ? (
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>
                ) : (
                  <div className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {booking.status}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Payment Status
                </div>
                {editing ? (
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                ) : (
                  <div className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    {booking.paymentStatus}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Pricing</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Room price</span>
                <span className="font-semibold text-slate-900">
                  ฿{booking.roomPrice.toLocaleString()}
                </span>
              </div>
              {booking.promoCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Promo ({booking.promoCode.code})
                  </span>
                  <span className="font-semibold text-green-600">
                    -฿{booking.discount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">
                    ฿{booking.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          {booking.calendarEventId && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="mb-2 text-sm font-bold text-blue-900">
                📅 Calendar Event
              </h2>
              <p className="text-xs text-blue-700">
                This booking is synced with Google Calendar
              </p>
            </div>
          )}

          {/* Cancellation Info */}
          {booking.cancelledAt && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="mb-2 text-sm font-bold text-red-900">
                Cancelled
              </h2>
              <p className="text-xs text-red-700">
                {formatDateTime(booking.cancelledAt)}
              </p>
              {booking.cancellationReason && (
                <p className="mt-2 text-xs text-red-700">
                  Reason: {booking.cancellationReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
