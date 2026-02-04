"use client";

import { useState, useEffect } from "react";

type DateRangePickerProps = {
  checkIn: Date;
  checkOut: Date;
  onCheckInChange: (date: Date) => void;
  onCheckOutChange: (date: Date) => void;
  className?: string;
};

export default function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  className = "",
}: DateRangePickerProps) {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getTodayString = () => {
    return formatDateForInput(new Date());
  };

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckIn = new Date(e.target.value);
    onCheckInChange(newCheckIn);

    // If new check-in is after current check-out, adjust check-out
    if (newCheckIn >= checkOut) {
      const newCheckOut = new Date(newCheckIn);
      newCheckOut.setDate(newCheckOut.getDate() + 1);
      onCheckOutChange(newCheckOut);
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckOut = new Date(e.target.value);
    onCheckOutChange(newCheckOut);
  };

  const calculateNights = () => {
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Check-in */}
        <div>
          <label
            htmlFor="checkIn"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Check-in
          </label>
          <input
            type="date"
            id="checkIn"
            value={formatDateForInput(checkIn)}
            onChange={handleCheckInChange}
            min={getTodayString()}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>

        {/* Check-out */}
        <div>
          <label
            htmlFor="checkOut"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Check-out
          </label>
          <input
            type="date"
            id="checkOut"
            value={formatDateForInput(checkOut)}
            onChange={handleCheckOutChange}
            min={formatDateForInput(
              new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)
            )}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>

      {/* Nights display */}
      <div className="text-center text-sm text-slate-600">
        {calculateNights()} {calculateNights() === 1 ? "night" : "nights"}
      </div>
    </div>
  );
}
