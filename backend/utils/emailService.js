const nodemailer = require('nodemailer');
const EmailTemplate = require("../models/EmailTemplate");
const { getDefaultEmailTemplate, renderTemplate } = require("./emailTemplates");

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Helper function to format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatCurrency = (value) => Number(value || 0).toLocaleString();

const getTemplate = async (type) => {
    const defaultTemplate = getDefaultEmailTemplate(type);
    if (!defaultTemplate) {
        throw new Error(`Unknown email template type: ${type}`);
    }
    let template = await EmailTemplate.findOne({ type }).lean();
    if (!template) {
        template = await EmailTemplate.create({
            type,
            subject: defaultTemplate.subject,
            html: defaultTemplate.html,
            staticInfo: defaultTemplate.staticInfo,
        });
    }
    return template;
};

const resolveFrontendUrl = () =>
    process.env.FRONTEND_PRODUCTION_URL ||
    process.env.FRONTEND_DEVELOPMENT_URL ||
    "";

// Send booking confirmation email
const sendBookingConfirmation = async (booking, room, individualRoom = null) => {
    try {
        const transporter = createTransporter();
        const template = await getTemplate("booking_confirmation");
        const editorData = template.editorData || {};

        // Calculate nights
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        // Extract room name (handle multi-language)
        const roomName = typeof room.name === 'string' ? room.name : room.name.en || room.name.th || 'Room';

        const frontendUrl = resolveFrontendUrl();
        const bookingUrl = frontendUrl
            ? `${frontendUrl}/en/my-booking?bookingNumber=${booking.bookingNumber}`
            : "";
        const roomNumberLabel = editorData.roomNumberLabel || "Room Number";
        const roomNumberBlock = individualRoom
            ? `<div class="detail-row">
            <span class="detail-label">${roomNumberLabel}</span>
            <span class="detail-value">${individualRoom.roomNumber}${individualRoom.floor ? ` (Floor ${individualRoom.floor})` : ''}</span>
        </div>`
            : "";
        const discountLabel = editorData.discountLabel || "Discount";
        const discountBlock = booking.discount > 0
            ? `<div class="price-row" style="color: #059669;">
                <span>${discountLabel}${booking.promoCode ? ` (${booking.promoCode})` : ''}</span>
                <span>-฿${formatCurrency(booking.discount)}</span>
            </div>`
            : "";
        const specialRequestsTitle = editorData.specialRequestsTitle || "Special Requests:";
        const specialRequestsBlock = booking.specialRequests
            ? `<div class="info-box">
            <strong>${specialRequestsTitle}</strong><br>
            ${booking.specialRequests}
        </div>`
            : "";

        const templateData = {
            guestName: booking.guestName,
            bookingNumber: booking.bookingNumber,
            roomName,
            guestCount: booking.numberOfGuests,
            guestLabel: booking.numberOfGuests === 1 ? "guest" : "guests",
            checkInDate: formatDate(booking.checkInDate),
            checkOutDate: formatDate(booking.checkOutDate),
            nights,
            nightLabel: nights === 1 ? "night" : "nights",
            roomPrice: formatCurrency(booking.roomPrice),
            discount: formatCurrency(booking.discount),
            totalPrice: formatCurrency(booking.totalPrice),
            bookingUrl,
            roomNumberBlock,
            discountBlock,
            specialRequestsBlock,
            promoCode: booking.promoCode || "",
            ...template.staticInfo,
        };

        const emailHtml = renderTemplate(template.html, templateData);
        const emailSubject = renderTemplate(template.subject, templateData);

        // Email options
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: booking.guestEmail,
            subject: emailSubject,
            html: emailHtml,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        return { success: false, error: error.message };
    }
};

// Send booking cancellation email
const sendBookingCancellation = async (booking, room, cancellationReason = '') => {
    try {
        const transporter = createTransporter();
        const template = await getTemplate("booking_cancellation");
        const editorData = template.editorData || {};

        const roomName = typeof room.name === 'string' ? room.name : room.name.en || room.name.th || 'Room';
        const cancellationReasonLabel = editorData.cancellationReasonLabel || "Cancellation Reason";
        const cancellationReasonBlock = cancellationReason
            ? `<p><strong>${cancellationReasonLabel}:</strong> ${cancellationReason}</p>`
            : "";

        const templateData = {
            guestName: booking.guestName,
            bookingNumber: booking.bookingNumber,
            roomName,
            checkInDate: formatDate(booking.checkInDate),
            checkOutDate: formatDate(booking.checkOutDate),
            cancellationReasonBlock,
            ...template.staticInfo,
        };

        const emailHtml = renderTemplate(template.html, templateData);
        const emailSubject = renderTemplate(template.subject, templateData);

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: booking.guestEmail,
            subject: emailSubject,
            html: emailHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Cancellation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        return { success: false, error: error.message };
    }
};

const sendBookingPaymentPending = async (booking, room, individualRoom = null) => {
    try {
        const transporter = createTransporter();
        const template = await getTemplate("booking_payment_pending");
        const editorData = template.editorData || {};

        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        const roomName = typeof room.name === 'string' ? room.name : room.name.en || room.name.th || 'Room';
        const frontendUrl = resolveFrontendUrl();
        const bookingUrl = frontendUrl
            ? `${frontendUrl}/en/my-booking?bookingNumber=${booking.bookingNumber}`
            : "";
        const roomNumberLabel = editorData.roomNumberLabel || "Room Number";
        const roomNumberBlock = individualRoom
            ? `<div class="detail-row">
            <span class="detail-label">${roomNumberLabel}</span>
            <span class="detail-value">${individualRoom.roomNumber}${individualRoom.floor ? ` (Floor ${individualRoom.floor})` : ''}</span>
        </div>`
            : "";
        const discountLabel = editorData.discountLabel || "Discount";
        const discountBlock = booking.discount > 0
            ? `<div class="price-row" style="color: #059669;">
                <span>${discountLabel}${booking.promoCode ? ` (${booking.promoCode})` : ''}</span>
                <span>-฿${formatCurrency(booking.discount)}</span>
            </div>`
            : "";
        const specialRequestsTitle = editorData.specialRequestsTitle || "Special Requests:";
        const specialRequestsBlock = booking.specialRequests
            ? `<div class="info-box">
            <strong>${specialRequestsTitle}</strong><br>
            ${booking.specialRequests}
        </div>`
            : "";

        const templateData = {
            guestName: booking.guestName,
            bookingNumber: booking.bookingNumber,
            roomName,
            guestCount: booking.numberOfGuests,
            guestLabel: booking.numberOfGuests === 1 ? "guest" : "guests",
            checkInDate: formatDate(booking.checkInDate),
            checkOutDate: formatDate(booking.checkOutDate),
            nights,
            nightLabel: nights === 1 ? "night" : "nights",
            roomPrice: formatCurrency(booking.roomPrice),
            discount: formatCurrency(booking.discount),
            totalPrice: formatCurrency(booking.totalPrice),
            bookingUrl,
            roomNumberBlock,
            discountBlock,
            specialRequestsBlock,
            promoCode: booking.promoCode || "",
            ...template.staticInfo,
        };

        const emailHtml = renderTemplate(template.html, templateData);
        const emailSubject = renderTemplate(template.subject, templateData);

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: booking.guestEmail,
            subject: emailSubject,
            html: emailHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Booking payment pending email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending payment pending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendBookingConfirmation,
    sendBookingCancellation,
    sendBookingPaymentPending,
};
