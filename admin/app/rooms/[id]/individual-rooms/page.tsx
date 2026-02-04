"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type IndividualRoom = {
  id: string;
  roomNumber: string;
  floor: number;
  building: string;
  status: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
};

type RoomType = {
  id: string;
  name: any;
  totalRooms: number;
};

export default function IndividualRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const roomTypeId = params.id as string;

  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [individualRooms, setIndividualRooms] = useState<IndividualRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [building, setBuilding] = useState("");
  const [status, setStatus] = useState("available");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadData();
  }, [roomTypeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomTypeRes, individualRoomsRes] = await Promise.all([
        fetch(`${API_URL}/rooms/${roomTypeId}`),
        fetch(`${API_URL}/rooms/${roomTypeId}/individual-rooms`),
      ]);

      if (!roomTypeRes.ok) {
        router.push("/rooms");
        return;
      }

      const roomTypeData = await roomTypeRes.json();
      const individualRoomsData = await individualRoomsRes.json();

      setRoomType(roomTypeData.room);
      setIndividualRooms(individualRoomsData.individualRooms || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoomNumber("");
    setFloor(1);
    setBuilding("");
    setStatus("available");
    setNotes("");
    setIsActive(true);
    setEditingId(null);
  };

  const handleEdit = (room: IndividualRoom) => {
    setRoomNumber(room.roomNumber);
    setFloor(room.floor);
    setBuilding(room.building);
    setStatus(room.status);
    setNotes(room.notes);
    setIsActive(room.isActive);
    setEditingId(room.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      roomTypeId,
      roomNumber,
      floor,
      building,
      status,
      notes,
      isActive,
    };

    try {
      const url = editingId
        ? `${API_URL}/individual-rooms/${editingId}`
        : `${API_URL}/individual-rooms`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadData();
        setShowForm(false);
        resetForm();
        alert(
          editingId
            ? "Room updated successfully"
            : "Room created successfully"
        );
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save room");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Failed to save room");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const res = await fetch(`${API_URL}/individual-rooms/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadData();
        alert("Room deleted successfully");
      } else {
        alert("Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room");
    }
  };

  const getRoomName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-green-100 text-green-700",
      occupied: "bg-red-100 text-red-700",
      maintenance: "bg-yellow-100 text-yellow-700",
      cleaning: "bg-blue-100 text-blue-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!roomType) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => router.push("/rooms")}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to rooms
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          Individual Rooms - {getRoomName(roomType.name)}
        </h1>
        <p className="text-sm text-slate-500">
          Manage physical room units (101, 102, etc.) - Total capacity: {roomType.totalRooms}{" "}
          rooms
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-slate-900">
            {individualRooms.length}
          </div>
          <div className="text-xs text-slate-500">Total Created</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="text-2xl font-bold text-green-900">
            {individualRooms.filter((r) => r.status === "available").length}
          </div>
          <div className="text-xs text-green-600">Available</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-2xl font-bold text-red-900">
            {individualRooms.filter((r) => r.status === "occupied").length}
          </div>
          <div className="text-xs text-red-600">Occupied</div>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="text-2xl font-bold text-yellow-900">
            {individualRooms.filter((r) => r.status === "maintenance").length}
          </div>
          <div className="text-xs text-yellow-600">Maintenance</div>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Physical Room"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            {editingId ? "Edit Physical Room" : "Add Physical Room"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Room Number *
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="101"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Floor *
              </label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Building
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Main Building"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Internal Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                rows={2}
                placeholder="Special notes for staff..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Active (can be booked)
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingId ? "Update" : "Create"} Room
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {individualRooms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No physical rooms created yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Create your first physical room
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {individualRooms.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Room {room.roomNumber}
                  </h3>
                  <div className="mt-1 text-sm text-slate-500">
                    Floor {room.floor}
                    {room.building && ` • ${room.building}`}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                    room.status
                  )}`}
                >
                  {room.status}
                </span>
              </div>

              {room.notes && (
                <p className="mb-3 text-xs text-slate-600">{room.notes}</p>
              )}

              <div className="mb-3 flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    room.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {room.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {individualRooms.length < roomType.totalRooms && (
        <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
          💡 You have capacity for {roomType.totalRooms} rooms but only created{" "}
          {individualRooms.length}. Create {roomType.totalRooms - individualRooms.length}{" "}
          more to match your total capacity.
        </div>
      )}
    </div>
  );
}
