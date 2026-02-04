"use client";

type PriceBreakdownProps = {
  roomPrice: number;
  discount: number;
  totalPrice: number;
  nights: number;
  promoCode?: string;
};

export default function PriceBreakdown({
  roomPrice,
  discount,
  totalPrice,
  nights,
  promoCode,
}: PriceBreakdownProps) {
  const safeRoomPrice = Number.isFinite(roomPrice) ? roomPrice : 0;
  const safeDiscount = Number.isFinite(discount) ? discount : 0;
  const safeTotal = Number.isFinite(totalPrice) ? totalPrice : 0;
  const safeNights = Number.isFinite(nights) ? nights : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Price Breakdown</h3>

      <div className="space-y-3">
        {/* Room price */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">
            Room price × {safeNights} {safeNights === 1 ? "night" : "nights"}
          </span>
          <span className="font-semibold text-slate-900">
            ฿{safeRoomPrice.toLocaleString()}
          </span>
        </div>

        {/* Discount */}
        {safeDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              Discount {promoCode && `(${promoCode})`}
            </span>
            <span className="font-semibold text-green-600">
              -฿{safeDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-bold text-slate-900">Total</span>
            <span className="text-2xl font-bold text-red-600">
              ฿{safeTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
