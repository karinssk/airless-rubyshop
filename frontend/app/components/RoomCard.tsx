"use client";

import Link from "next/link";
import { backendBaseUrl } from "@/lib/urls";

type RoomCardProps = {
  room: {
    id: string;
    name: string;
    slug: string;
    coverImage?: string;
    pricePerNight: number;
    pricePerMonth: number;
    maxGuests: number;
    size?: string;
    availablebooking?: number;
  };
  checkIn?: string;
  checkOut?: string;
  locale: string;
};

export default function RoomCard({
  room,
  checkIn,
  checkOut,
  locale,
}: RoomCardProps) {
  const resolveImageUrl = (path: string) => {
    if (!path) return "/placeholder-room.jpg";
    if (path.startsWith("http")) return path;
    return `${backendBaseUrl}${path}`;
  };

  const buildRoomUrl = () => {
    const baseUrl = `/${locale}/booking/${room.slug}`;
    if (checkIn && checkOut) {
      return `${baseUrl}?checkIn=${checkIn}&checkOut=${checkOut}`;
    }
    return baseUrl;
  };

  return (
    <Link href={buildRoomUrl()}>
      <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-red-300 hover:shadow-xl">
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-slate-100">
          <img
            src={resolveImageUrl(room.coverImage || "")}
            alt={room.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {room.availablebooking !== undefined && (
            <div className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-md">
              {room.availablebooking > 0 ? (
                <span className="text-green-600">
                  {room.availablebooking} available
                </span>
              ) : (
                <span className="text-red-600">Fully booked</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-red-600">
            {room.name}
          </h3>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Max {room.maxGuests} guests
            </span>
            {room.size && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                {room.size}
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-end justify-between border-t border-slate-100 pt-4">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                ฿{room.pricePerNight.toLocaleString()}
                <span className="text-sm font-normal text-slate-500">/night</span>
              </div>
              {room.pricePerMonth > 0 && (
                <div className="text-sm text-slate-500">
                  ฿{room.pricePerMonth.toLocaleString()}/month
                </div>
              )}
            </div>
            <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
