"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";

type StaticInfo = {
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  checkInInfo: string;
  checkOutInfo: string;
};

type BookingConfirmationEditor = {
  headerTitle: string;
  headerSubtitle: string;
  greetingLine: string;
  introLine: string;
  bookingNumberLabel: string;
  roomDetailsTitle: string;
  roomTypeLabel: string;
  roomNumberLabel: string;
  guestCountLabel: string;
  stayDetailsTitle: string;
  checkInLabel: string;
  checkOutLabel: string;
  lengthOfStayLabel: string;
  priceDetailsTitle: string;
  roomPriceLabel: string;
  discountLabel: string;
  totalLabel: string;
  specialRequestsTitle: string;
  checkInInfoTitle: string;
  checkInInfoLines: string;
  buttonLabel: string;
  closingLine1: string;
  closingLine2: string;
  signatureLine: string;
  footerLine1: string;
  footerLine2: string;
};

type BookingCancellationEditor = {
  headerTitle: string;
  greetingLine: string;
  introLine: string;
  bookingNumberLabel: string;
  roomLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  cancellationReasonLabel: string;
  closingLine1: string;
  closingLine2: string;
  signatureLine: string;
  footerLine1: string;
  footerLine2: string;
};

type EmailTemplate = {
  type: string;
  subject: string;
  html: string;
  staticInfo: StaticInfo;
  editorData: BookingConfirmationEditor | BookingCancellationEditor | null;
};

const templateOptions = [
  { value: "booking_confirmation", label: "Booking Confirmation" },
  { value: "booking_cancellation", label: "Booking Cancellation" },
  { value: "booking_payment_pending", label: "Payment Pending" },
];

const emptyTemplate: EmailTemplate = {
  type: "booking_confirmation",
  subject: "",
  html: "",
  staticInfo: {
    hotelName: "",
    hotelAddress: "",
    hotelPhone: "",
    hotelEmail: "",
    checkInInfo: "",
    checkOutInfo: "",
  },
  editorData: null,
};

const defaultConfirmationEditor: BookingConfirmationEditor = {
  headerTitle: "Booking Confirmed!",
  headerSubtitle: "Thank you for choosing {{hotelName}}",
  greetingLine: "Dear {{guestName}},",
  introLine: "We're delighted to confirm your reservation at {{hotelName}}. Your booking details are below:",
  bookingNumberLabel: "Booking Number",
  roomDetailsTitle: "Room Details",
  roomTypeLabel: "Room Type",
  roomNumberLabel: "Room Number",
  guestCountLabel: "Number of Guests",
  stayDetailsTitle: "Stay Details",
  checkInLabel: "Check-in",
  checkOutLabel: "Check-out",
  lengthOfStayLabel: "Length of Stay",
  priceDetailsTitle: "Price Breakdown",
  roomPriceLabel: "Room price",
  discountLabel: "Discount",
  totalLabel: "Total",
  specialRequestsTitle: "Special Requests:",
  checkInInfoTitle: "Check-in Information:",
  checkInInfoLines: "• {{checkInInfo}}\n• {{checkOutInfo}}\n• Please present your booking number upon arrival\n• Early check-in and late check-out may be available upon request",
  buttonLabel: "View Booking Details",
  closingLine1: "If you have any questions or need to modify your reservation, please don't hesitate to contact us.",
  closingLine2: "We look forward to welcoming you!",
  signatureLine: "{{hotelName}} Team",
  footerLine1: "{{hotelAddress}}",
  footerLine2: "{{hotelPhone}} | {{hotelEmail}}",
};

const defaultCancellationEditor: BookingCancellationEditor = {
  headerTitle: "Booking Cancelled",
  greetingLine: "Dear {{guestName}},",
  introLine: "This email confirms that your booking has been cancelled.",
  bookingNumberLabel: "Booking Number",
  roomLabel: "Room",
  checkInLabel: "Check-in",
  checkOutLabel: "Check-out",
  cancellationReasonLabel: "Cancellation Reason",
  closingLine1: "If you did not request this cancellation or have any questions, please contact us immediately.",
  closingLine2: "We hope to serve you in the future.",
  signatureLine: "{{hotelName}} Team",
  footerLine1: "{{hotelAddress}}",
  footerLine2: "{{hotelPhone}} | {{hotelEmail}}",
};

const defaultPendingEditor: BookingConfirmationEditor = {
  headerTitle: "Payment Pending",
  headerSubtitle: "We've received your booking at {{hotelName}}",
  greetingLine: "Dear {{guestName}},",
  introLine: "Please complete payment to confirm your reservation. Your booking details are below:",
  bookingNumberLabel: "Booking Number",
  roomDetailsTitle: "Room Details",
  roomTypeLabel: "Room Type",
  roomNumberLabel: "Room Number",
  guestCountLabel: "Number of Guests",
  stayDetailsTitle: "Stay Details",
  checkInLabel: "Check-in",
  checkOutLabel: "Check-out",
  lengthOfStayLabel: "Length of Stay",
  priceDetailsTitle: "Price Summary",
  roomPriceLabel: "Room price",
  discountLabel: "Discount",
  totalLabel: "Total",
  specialRequestsTitle: "Special Requests:",
  checkInInfoTitle: "Check-in Information:",
  checkInInfoLines: "• {{checkInInfo}}\n• {{checkOutInfo}}\n• Please present your booking number upon arrival\n• Early check-in and late check-out may be available upon request",
  buttonLabel: "View Payment Details",
  closingLine1: "If you already completed payment, please ignore this message or contact us.",
  closingLine2: "We look forward to welcoming you!",
  signatureLine: "{{hotelName}} Team",
  footerLine1: "{{hotelAddress}}",
  footerLine2: "{{hotelPhone}} | {{hotelEmail}}",
};

const inputClassName = "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const textareaClassName = "min-h-[80px] w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function FormInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClassName}
      placeholder={placeholder}
    />
  );
}

function FormTextarea({ value, onChange, placeholder, rows }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={textareaClassName}
      style={rows ? { minHeight: `${rows * 24}px` } : undefined}
      placeholder={placeholder}
    />
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-slate-50">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
        <span>{title}</span>
        <span className="text-slate-400 transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2">
        {children}
      </div>
    </details>
  );
}

function escapeHtml(value: string) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatText(value: string) {
  return escapeHtml(value || "").replace(/\n/g, "<br>");
}

function buildConfirmationHtml(editorData: BookingConfirmationEditor) {
  const infoLines = formatText(editorData.checkInInfoLines || "");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .booking-number { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .booking-number .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
    .booking-number .number { font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 5px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-weight: 500; }
    .detail-value { color: #111827; font-weight: 600; }
    .price-breakdown { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .price-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row { border-top: 2px solid #e5e7eb; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: bold; }
    .total-row .amount { color: #2563eb; }
    .info-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${formatText(editorData.headerTitle)}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${formatText(editorData.headerSubtitle)}</p>
  </div>
  <div class="content">
    <p>${formatText(editorData.greetingLine)}</p>
    <p>${formatText(editorData.introLine)}</p>
    <div class="booking-number">
      <div class="label">${formatText(editorData.bookingNumberLabel)}</div>
      <div class="number">{{bookingNumber}}</div>
    </div>
    <h2 style="color: #111827; margin-top: 30px;">${formatText(editorData.roomDetailsTitle)}</h2>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.roomTypeLabel)}</span>
      <span class="detail-value">{{roomName}}</span>
    </div>
    {{roomNumberBlock}}
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.guestCountLabel)}</span>
      <span class="detail-value">{{guestCount}} {{guestLabel}}</span>
    </div>
    <h2 style="color: #111827; margin-top: 30px;">${formatText(editorData.stayDetailsTitle)}</h2>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.checkInLabel)}</span>
      <span class="detail-value">{{checkInDate}}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.checkOutLabel)}</span>
      <span class="detail-value">{{checkOutDate}}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.lengthOfStayLabel)}</span>
      <span class="detail-value">{{nights}} {{nightLabel}}</span>
    </div>
    <h2 style="color: #111827; margin-top: 30px;">${formatText(editorData.priceDetailsTitle)}</h2>
    <div class="price-breakdown">
      <div class="price-row">
        <span>${formatText(editorData.roomPriceLabel)} × {{nights}} {{nightLabel}}</span>
        <span>฿{{roomPrice}}</span>
      </div>
      {{discountBlock}}
      <div class="price-row total-row">
        <span>${formatText(editorData.totalLabel)}</span>
        <span class="amount">฿{{totalPrice}}</span>
      </div>
    </div>
    {{specialRequestsBlock}}
    <div class="info-box">
      <strong>${formatText(editorData.checkInInfoTitle)}</strong><br>
      ${infoLines}
    </div>
    <div style="text-align: center;">
      <a href="{{bookingUrl}}" class="button">${formatText(editorData.buttonLabel)}</a>
    </div>
    <p style="margin-top: 30px;">${formatText(editorData.closingLine1)}</p>
    <p style="margin-top: 20px;">${formatText(editorData.closingLine2)}</p>
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>${formatText(editorData.signatureLine)}</strong>
    </p>
  </div>
  <div class="footer">
    <p style="margin: 0 0 10px 0;">{{hotelName}}</p>
    <p style="margin: 0; font-size: 12px;">
      ${formatText(editorData.footerLine1)}<br>
      ${formatText(editorData.footerLine2)}
    </p>
  </div>
</body>
</html>`;
}

function buildCancellationHtml(editorData: BookingCancellationEditor) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .booking-number { background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${formatText(editorData.headerTitle)}</h1>
  </div>
  <div class="content">
    <p>${formatText(editorData.greetingLine)}</p>
    <p>${formatText(editorData.introLine)}</p>
    <div class="booking-number">
      <strong>${formatText(editorData.bookingNumberLabel)}: {{bookingNumber}}</strong>
    </div>
    <p><strong>${formatText(editorData.roomLabel)}:</strong> {{roomName}}<br>
    <strong>${formatText(editorData.checkInLabel)}:</strong> {{checkInDate}}<br>
    <strong>${formatText(editorData.checkOutLabel)}:</strong> {{checkOutDate}}</p>
    {{cancellationReasonBlock}}
    <p>${formatText(editorData.closingLine1)}</p>
    <p>${formatText(editorData.closingLine2)}</p>
    <p>Best regards,<br>${formatText(editorData.signatureLine)}</p>
  </div>
  <div class="footer">
    <p style="margin: 0;">{{hotelName}}</p>
    <p style="margin: 0; font-size: 12px;">
      ${formatText(editorData.footerLine1)}<br>
      ${formatText(editorData.footerLine2)}
    </p>
  </div>
</body>
</html>`;
}

export default function EmailTemplatesPage() {
  const [selectedType, setSelectedType] = useState("booking_confirmation");
  const [template, setTemplate] = useState<EmailTemplate>(emptyTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadTemplate = useCallback(async (type: string) => {
    if (!backendBaseUrl) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendBaseUrl}/email-templates/${type}`, {
        headers: getAdminAuthHeaders(),
      });
      const data = await response.json();
      if (data.template) {
        const editorData =
          data.template.editorData ||
          (type === "booking_cancellation"
            ? defaultCancellationEditor
            : type === "booking_payment_pending"
              ? defaultPendingEditor
              : defaultConfirmationEditor);
        setTemplate({ ...data.template, editorData });
      }
    } catch (error) {
      console.error("Failed to load email template:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate(selectedType);
  }, [selectedType, loadTemplate]);

  const updateStaticInfo = useCallback((field: keyof StaticInfo, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      staticInfo: { ...prev.staticInfo, [field]: value },
    }));
  }, []);

  const updateEditorField = useCallback(<T extends BookingConfirmationEditor | BookingCancellationEditor>(field: keyof T, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      editorData: { ...prev.editorData, [field]: value } as T,
    }));
  }, []);

  const derivedHtml = useMemo(() => {
    if (!template.editorData) return template.html || "";
    if (selectedType === "booking_cancellation") {
      return buildCancellationHtml(template.editorData as BookingCancellationEditor);
    }
    return buildConfirmationHtml(template.editorData as BookingConfirmationEditor);
  }, [selectedType, template.editorData, template.html]);

  const saveTemplate = async () => {
    if (!backendBaseUrl) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${backendBaseUrl}/email-templates/${selectedType}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAdminAuthHeaders(),
          },
          body: JSON.stringify({
            subject: template.subject,
            html: derivedHtml,
            staticInfo: template.staticInfo,
            editorData: template.editorData,
          }),
        }
      );
      if (response.ok) {
        setMessage("Saved");
        setTimeout(() => setMessage(null), 1500);
      } else {
        setMessage("Save failed");
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      console.error("Failed to save email template:", error);
      setMessage("Save failed");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const confirmationData = template.editorData as BookingConfirmationEditor;
  const cancellationData = template.editorData as BookingCancellationEditor;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50"
              type="button"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
              <p className="mt-1 text-sm text-slate-600">
                Customize subjects, HTML, and hotel info used in booking emails.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-sm font-medium text-emerald-600">{message}</span>}
            <button
              onClick={saveTemplate}
              disabled={saving || loading}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              type="button"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            {/* Template Type & Subject */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Template Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {templateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject
                  </label>
                  <FormInput
                    value={template.subject}
                    onChange={(v) => setTemplate((prev) => ({ ...prev, subject: v }))}
                    placeholder="Booking Confirmation - {{bookingNumber}}"
                  />
                </div>
              </div>
            </div>

            {/* Hotel Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Hotel Info</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput value={template.staticInfo?.hotelName || ""} onChange={(v) => updateStaticInfo("hotelName", v)} placeholder="Hotel name" />
                <FormInput value={template.staticInfo?.hotelPhone || ""} onChange={(v) => updateStaticInfo("hotelPhone", v)} placeholder="Phone" />
                <FormInput value={template.staticInfo?.hotelEmail || ""} onChange={(v) => updateStaticInfo("hotelEmail", v)} placeholder="Email" />
                <FormInput value={template.staticInfo?.hotelAddress || ""} onChange={(v) => updateStaticInfo("hotelAddress", v)} placeholder="Address" />
                <FormInput value={template.staticInfo?.checkInInfo || ""} onChange={(v) => updateStaticInfo("checkInInfo", v)} placeholder="Check-in info" />
                <FormInput value={template.staticInfo?.checkOutInfo || ""} onChange={(v) => updateStaticInfo("checkOutInfo", v)} placeholder="Check-out info" />
              </div>
            </div>

            {/* Email Content */}
            {selectedType === "booking_cancellation" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">Email Content</h2>
                <div className="space-y-4">
                  <FormInput value={cancellationData?.headerTitle || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("headerTitle", v)} placeholder="Header title" />
                  <FormInput value={cancellationData?.greetingLine || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("greetingLine", v)} placeholder="Greeting line" />
                  <FormTextarea value={cancellationData?.introLine || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("introLine", v)} placeholder="Intro line" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput value={cancellationData?.bookingNumberLabel || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("bookingNumberLabel", v)} placeholder="Booking number label" />
                    <FormInput value={cancellationData?.roomLabel || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("roomLabel", v)} placeholder="Room label" />
                    <FormInput value={cancellationData?.checkInLabel || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("checkInLabel", v)} placeholder="Check-in label" />
                    <FormInput value={cancellationData?.checkOutLabel || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("checkOutLabel", v)} placeholder="Check-out label" />
                    <FormInput value={cancellationData?.cancellationReasonLabel || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("cancellationReasonLabel", v)} placeholder="Cancellation reason label" />
                  </div>
                  <FormTextarea value={cancellationData?.closingLine1 || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("closingLine1", v)} placeholder="Closing line 1" />
                  <FormTextarea value={cancellationData?.closingLine2 || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("closingLine2", v)} placeholder="Closing line 2" rows={3} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormInput value={cancellationData?.signatureLine || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("signatureLine", v)} placeholder="Signature line" />
                    <FormInput value={cancellationData?.footerLine1 || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("footerLine1", v)} placeholder="Footer line 1" />
                    <FormInput value={cancellationData?.footerLine2 || ""} onChange={(v) => updateEditorField<BookingCancellationEditor>("footerLine2", v)} placeholder="Footer line 2" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">Email Content</h2>
                <div className="space-y-4">
                  <FormInput value={confirmationData?.headerTitle || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("headerTitle", v)} placeholder="Header title" />
                  <FormInput value={confirmationData?.headerSubtitle || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("headerSubtitle", v)} placeholder="Header subtitle" />
                  <FormInput value={confirmationData?.greetingLine || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("greetingLine", v)} placeholder="Greeting line" />
                  <FormTextarea value={confirmationData?.introLine || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("introLine", v)} placeholder="Intro line" />

                  <CollapsibleSection title="Booking Details Labels">
                    <FormInput value={confirmationData?.bookingNumberLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("bookingNumberLabel", v)} placeholder="Booking number label" />
                    <FormInput value={confirmationData?.roomDetailsTitle || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("roomDetailsTitle", v)} placeholder="Room details title" />
                    <FormInput value={confirmationData?.roomTypeLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("roomTypeLabel", v)} placeholder="Room type label" />
                    <FormInput value={confirmationData?.roomNumberLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("roomNumberLabel", v)} placeholder="Room number label" />
                    <FormInput value={confirmationData?.guestCountLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("guestCountLabel", v)} placeholder="Guest count label" />
                    <FormInput value={confirmationData?.stayDetailsTitle || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("stayDetailsTitle", v)} placeholder="Stay details title" />
                    <FormInput value={confirmationData?.checkInLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("checkInLabel", v)} placeholder="Check-in label" />
                    <FormInput value={confirmationData?.checkOutLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("checkOutLabel", v)} placeholder="Check-out label" />
                    <FormInput value={confirmationData?.lengthOfStayLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("lengthOfStayLabel", v)} placeholder="Length of stay label" />
                  </CollapsibleSection>

                  <CollapsibleSection title="Price & Footer Settings">
                    <FormInput value={confirmationData?.priceDetailsTitle || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("priceDetailsTitle", v)} placeholder="Price details title" />
                    <FormInput value={confirmationData?.roomPriceLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("roomPriceLabel", v)} placeholder="Room price label" />
                    <FormInput value={confirmationData?.discountLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("discountLabel", v)} placeholder="Discount label" />
                    <FormInput value={confirmationData?.totalLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("totalLabel", v)} placeholder="Total label" />
                    <FormInput value={confirmationData?.specialRequestsTitle || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("specialRequestsTitle", v)} placeholder="Special requests title" />
                    <FormInput value={confirmationData?.checkInInfoTitle || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("checkInInfoTitle", v)} placeholder="Check-in info title" />
                  </CollapsibleSection>

                  <div className="space-y-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Check-in Instructions & Footer
                    </label>
                    <FormTextarea value={confirmationData?.checkInInfoLines || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("checkInInfoLines", v)} placeholder="Check-in info lines (bullets)" rows={4} />
                    <FormInput value={confirmationData?.buttonLabel || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("buttonLabel", v)} placeholder="Button label" />
                    <FormTextarea value={confirmationData?.closingLine1 || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("closingLine1", v)} placeholder="Closing line 1" />
                    <FormTextarea value={confirmationData?.closingLine2 || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("closingLine2", v)} placeholder="Closing line 2" rows={3} />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormInput value={confirmationData?.signatureLine || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("signatureLine", v)} placeholder="Signature line" />
                      <FormInput value={confirmationData?.footerLine1 || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("footerLine1", v)} placeholder="Footer line 1" />
                      <FormInput value={confirmationData?.footerLine2 || ""} onChange={(v) => updateEditorField<BookingConfirmationEditor>("footerLine2", v)} placeholder="Footer line 2" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
              </div>
              <div className="h-[600px] overflow-auto">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-slate-400">Loading...</div>
                ) : (
                  <iframe
                    srcDoc={derivedHtml}
                    className="h-full w-full border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
