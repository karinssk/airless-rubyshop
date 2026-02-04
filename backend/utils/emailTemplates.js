const DEFAULT_STATIC_INFO = {
    hotelName: "RUBYSHOP Hotel",
    hotelAddress: "",
    hotelPhone: "",
    hotelEmail: "info@fastforwardssl.com",
    checkInInfo: "Check-in time: 2:00 PM",
    checkOutInfo: "Check-out time: 12:00 PM (noon)",
};

const confirmationEditorData = {
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

const cancellationEditorData = {
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

const pendingEditorData = {
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

const bookingConfirmationHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .booking-number {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .booking-number .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .booking-number .number {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-top: 5px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        .detail-value {
            color: #111827;
            font-weight: 600;
        }
        .price-breakdown {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        .total-row {
            border-top: 2px solid #e5e7eb;
            margin-top: 10px;
            padding-top: 10px;
            font-size: 18px;
            font-weight: bold;
        }
        .total-row .amount {
            color: #2563eb;
        }
        .info-box {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            border-radius: 0 0 10px 10px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1> Booking Confirmed!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for choosing {{hotelName}}</p>
    </div>

    <div class="content">
        <p>Dear {{guestName}},</p>

        <p>We're delighted to confirm your reservation at {{hotelName}}. Your booking details are below:</p>

        <div class="booking-number">
            <div class="label">Booking Number</div>
            <div class="number">{{bookingNumber}}</div>
        </div>

        <h2 style="color: #111827; margin-top: 30px;">Room Details</h2>
        <div class="detail-row">
            <span class="detail-label">Room Type</span>
            <span class="detail-value">{{roomName}}</span>
        </div>
        {{roomNumberBlock}}
        <div class="detail-row">
            <span class="detail-label">Number of Guests</span>
            <span class="detail-value">{{guestCount}} {{guestLabel}}</span>
        </div>

        <h2 style="color: #111827; margin-top: 30px;">Stay Details</h2>
        <div class="detail-row">
            <span class="detail-label">Check-in</span>
            <span class="detail-value">{{checkInDate}}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Check-out</span>
            <span class="detail-value">{{checkOutDate}}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Length of Stay</span>
            <span class="detail-value">{{nights}} {{nightLabel}}</span>
        </div>

        <h2 style="color: #111827; margin-top: 30px;">Price Breakdown</h2>
        <div class="price-breakdown">
            <div class="price-row">
                <span>Room price × {{nights}} {{nightLabel}}</span>
                <span>฿{{roomPrice}}</span>
            </div>
            {{discountBlock}}
            <div class="price-row total-row">
                <span>Total</span>
                <span class="amount">฿{{totalPrice}}</span>
            </div>
        </div>

        {{specialRequestsBlock}}

        <div class="info-box">
            <strong>📍 Check-in Information:</strong><br>
            • {{checkInInfo}}<br>
            • {{checkOutInfo}}<br>
            • Please present your booking number upon arrival<br>
            • Early check-in and late check-out may be available upon request
        </div>

        <div style="text-align: center;">
            <a href="{{bookingUrl}}" class="button">
                View Booking Details
            </a>
        </div>

        <p style="margin-top: 30px;">If you have any questions or need to modify your reservation, please don't hesitate to contact us.</p>

        <p style="margin-top: 20px;">We look forward to welcoming you!</p>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Best regards,<br>
            <strong>{{hotelName}} Team</strong>
        </p>
    </div>

    <div class="footer">
        <p style="margin: 0 0 10px 0;">{{hotelName}}</p>
        <p style="margin: 0; font-size: 12px;">
            {{hotelAddress}}<br>
            {{hotelPhone}}<br>
            {{hotelEmail}}
        </p>
    </div>
</body>
</html>
`;

const bookingCancellationHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #dc2626;
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .booking-number {
            background: #fee2e2;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            border-radius: 0 0 10px 10px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Booking Cancelled</h1>
    </div>

    <div class="content">
        <p>Dear {{guestName}},</p>

        <p>This email confirms that your booking has been cancelled.</p>

        <div class="booking-number">
            <strong>Booking Number: {{bookingNumber}}</strong>
        </div>

        <p><strong>Room:</strong> {{roomName}}<br>
        <strong>Check-in:</strong> {{checkInDate}}<br>
        <strong>Check-out:</strong> {{checkOutDate}}</p>

        {{cancellationReasonBlock}}

        <p>If you did not request this cancellation or have any questions, please contact us immediately.</p>

        <p>We hope to serve you in the future.</p>

        <p>Best regards,<br>
        {{hotelName}} Team</p>
    </div>

    <div class="footer">
        <p style="margin: 0;">{{hotelName}}</p>
        <p style="margin: 0; font-size: 12px;">
            {{hotelAddress}}<br>
            {{hotelPhone}}<br>
            {{hotelEmail}}
        </p>
    </div>
</body>
</html>
`;

const getDefaultEmailTemplate = (type) => {
    if (type === "booking_confirmation") {
        return {
            subject: "Booking Confirmation - {{bookingNumber}} - {{hotelName}}",
            html: bookingConfirmationHtml,
            staticInfo: { ...DEFAULT_STATIC_INFO },
            editorData: { ...confirmationEditorData },
        };
    }
    if (type === "booking_cancellation") {
        return {
            subject: "Booking Cancelled - {{bookingNumber}} - {{hotelName}}",
            html: bookingCancellationHtml,
            staticInfo: { ...DEFAULT_STATIC_INFO },
            editorData: { ...cancellationEditorData },
        };
    }
    if (type === "booking_payment_pending") {
        return {
            subject: "Payment Pending - {{bookingNumber}} - {{hotelName}}",
            html: bookingConfirmationHtml,
            staticInfo: { ...DEFAULT_STATIC_INFO },
            editorData: { ...pendingEditorData },
        };
    }
    return null;
};

const renderTemplate = (html, data) => {
    if (!html) return "";
    return html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => {
        const value = data[key];
        if (value === undefined || value === null) return "";
        return String(value);
    });
};

module.exports = {
    DEFAULT_STATIC_INFO,
    getDefaultEmailTemplate,
    renderTemplate,
};
