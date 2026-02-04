"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { Toast, ConfirmDelete } from "@/utils/sweetAlert";

const API_URL = backendBaseUrl;

type RoomCategory = {
  id: string;
  name: { th: string; en: string } | string;
  slug: string;
};

type RoomSummary = {
  id: string;
  name: { th: string; en: string } | string;
  slug: string;
  status: string;
  pricePerNight: number;
  pricePerMonth: number;
  coverImage?: string;
  gallery?: string[];
  maxGuests: number;
  totalRooms: number;
  category?: { id: string; name: any; slug: string } | null;
};

export default function RoomsList() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    try {
      const [roomRes, categoryRes] = await Promise.all([
        fetch(`${API_URL}/rooms`),
        fetch(`${API_URL}/room-categories`),
      ]);
      const roomData = await roomRes.json();
      const categoryData = await categoryRes.json();
      setRooms(roomData.rooms || []);
      setCategories(categoryData.categories || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await ConfirmDelete.fire({
      text: "This will permanently delete the room and all its data.",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/rooms/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setRooms(rooms.filter((room) => room.id !== id));
          Toast.fire({
            icon: "success",
            title: "Room deleted successfully",
          });
        } else {
          Toast.fire({
            icon: "error",
            title: "Failed to delete room",
          });
        }
      } catch (error) {
        console.error("Error deleting room:", error);
        Toast.fire({
          icon: "error",
          title: "Failed to delete room",
        });
      }
    }
  };

  const getName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  const getCategoryName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  const filteredRooms = rooms.filter((room) => {
    const roomName = getName(room.name).toLowerCase();
    const matchesSearch =
      roomName.includes(search.toLowerCase()) ||
      room.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || room.category?.slug === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Rooms</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage room types and availability
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link
            href="/rooms/categories"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Categories
          </Link>
          <Link
            href="/rooms/new"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
          >
            Add Room
          </Link>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center">
        <input
          placeholder="Search rooms..."
          className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 md:flex-1"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-blue-500"
          value={filterCategory}
          onChange={(event) => setFilterCategory(event.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {getCategoryName(category.name)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">
            {search || filterCategory !== "all"
              ? "No rooms match your filters"
              : "No rooms yet"}
          </p>
          <Link
            href="/rooms/new"
            className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Create your first room
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {/* Images - Show cover + gallery (max 3 total) */}
                <div className="flex gap-2 shrink-0">
                  {(() => {
                    const images = [];
                    if (room.coverImage) images.push(room.coverImage);
                    if (room.gallery) images.push(...room.gallery);
                    return images.slice(0, 3).map((img, idx) => (
                      <img
                        key={idx}
                        src={resolveUploadUrl(img)}
                        alt={`${getName(room.name)} ${idx + 1}`}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ));
                  })()}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="mb-2 flex flex-col sm:flex-row items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                        {getName(room.name)}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 truncate max-w-[120px]">
                          {room.slug}
                        </span>
                        {room.category && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                            {getCategoryName(room.category.name)}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 ${room.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {room.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-slate-900">
                        ฿{room.pricePerNight.toLocaleString()}/night
                      </div>
                      {room.pricePerMonth > 0 && (
                        <div className="text-xs text-slate-500">
                          ฿{room.pricePerMonth.toLocaleString()}/month
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-3 flex gap-3 sm:gap-4 text-xs text-slate-600">
                    <span>Max {room.maxGuests} guests</span>
                    <span>{room.totalRooms} rooms</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/rooms/${room.id}`}
                      className="text-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/rooms/${room.id}/individual-rooms`}
                      className="text-center rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                    >
                      Manage Physical Rooms
                    </Link>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
