"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";

const API_URL = backendBaseUrl;

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  bookingId?: string | null;
  defaultRoomTypeId?: string;
  defaultIndividualRoomId?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
};

type RoomType = {
  _id: string;
  name: { en: string; th: string } | string;
};

type IndividualRoom = {
  _id: string;
  roomNumber: string;
};

export default function BookingModal({
  isOpen,
  onClose,
  onSaved,
  bookingId,
  defaultRoomTypeId,
  defaultIndividualRoomId,
  defaultCheckIn,
  defaultCheckOut,
}: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [individuals, setIndividuals] = useState<IndividualRoom[]>([]);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomTypeId, setRoomTypeId] = useState(defaultRoomTypeId || "");
  const [individualRoomId, setIndividualRoomId] = useState(defaultIndividualRoomId || "");
  const [checkIn, setCheckIn] = useState(defaultCheckIn || "");
  const [checkOut, setCheckOut] = useState(defaultCheckOut || "");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [status, setStatus] = useState("confirmed");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [specialRequests, setSpecialRequests] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadRooms();
      if (bookingId) {
        loadBooking();
      } else {
        resetForm();
      }
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    if (roomTypeId) {
      loadIndividualRooms(roomTypeId);
    }
  }, [roomTypeId]);

  const loadRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Failed to load rooms:", error);
    }
  };

  const loadIndividualRooms = async (roomTypeIdParam: string) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomTypeIdParam}/individual-rooms`);
      const data = await res.json();
      setIndividuals(data.rooms || []);
    } catch (error) {
      console.error("Failed to load individual rooms:", error);
      setIndividuals([]);
    }
  };

  const loadBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json();
      const booking = data.booking;

      setGuestName(booking.guestName || "");
      setGuestEmail(booking.guestEmail || "");
      setGuestPhone(booking.guestPhone || "");
      setRoomTypeId(booking.roomTypeId?._id || booking.roomTypeId || "");
      setIndividualRoomId(booking.individualRoomId?._id || booking.individualRoomId || "");
      setCheckIn(booking.checkInDate?.split("T")[0] || "");
      setCheckOut(booking.checkOutDate?.split("T")[0] || "");
      setNumberOfGuests(booking.numberOfGuests || 1);
      setStatus(booking.status || "confirmed");
      setPaymentStatus(booking.paymentStatus || "unpaid");
      setSpecialRequests(booking.specialRequests || "");
    } catch (error) {
      console.error("Failed to load booking:", error);
      alert("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setRoomTypeId(defaultRoomTypeId || "");
    setIndividualRoomId(defaultIndividualRoomId || "");
    setCheckIn(defaultCheckIn || "");
    setCheckOut(defaultCheckOut || "");
    setNumberOfGuests(1);
    setStatus("confirmed");
    setPaymentStatus("unpaid");
    setSpecialRequests("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let payload: any = {
        guestName,
        guestEmail,
        guestPhone,
        roomTypeId: roomTypeId || null,
        individualRoomId: individualRoomId || null,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests,
        status,
        paymentStatus,
        specialRequests,
      };

      const url = bookingId ? `${API_URL}/bookings/${bookingId}` : `${API_URL}/bookings`;
      const method = bookingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(bookingId ? "Booking updated successfully!" : "Booking created successfully!");
        onSaved();
        onClose();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save booking");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  const getRoomName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {bookingId ? "Edit Booking" : "Create New Booking"}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-slate-600">Loading booking...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Guest Information */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Guest Information</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Guest Name *
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Number of Guests *
                    </label>
                    <input
                      type="number"
                      value={numberOfGuests}
                      onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Room & Dates */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Room & Dates</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Room Type *
                    </label>
                    <select
                      value={roomTypeId}
                      onChange={(e) => {
                        setRoomTypeId(e.target.value);
                        setIndividualRoomId("");
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Select room type</option>
                      {rooms.map((room) => (
                        <option key={room._id} value={room._id}>
                          {getRoomName(room.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Individual Room
                    </label>
                    <select
                      value={individualRoomId}
                      onChange={(e) => setIndividualRoomId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      disabled={!roomTypeId}
                    >
                      <option value="">Unallocated</option>
                      {individuals.map((room) => (
                        <option key={room._id} value={room._id}>
                          Room {room.roomNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Status</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Booking Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked-in">Checked-in</option>
                      <option value="checked-out">Checked-out</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No-show</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Special Requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : bookingId ? "Update Booking" : "Create Booking"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
