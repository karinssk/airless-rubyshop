# Omise Payment Integration Guide

This guide explains how Omise payment is implemented in this project, covering both backend and frontend.

## 1. Project Structure

- **Backend** (`backend/`): Node.js/Express server handling Omise API calls using the `omise` Node.js library.
- **Frontend** (`frontend/`): Next.js application using `Omise.js` for scanning credit cards and Fetch API to communicate with the backend.

## 2. Configuration

### Backend
The backend uses `dotenv` to load environment variables.
File: `backend/server.js`

```javascript
/* backend/.env (Required) */
OMISE_PUBLIC_KEY=pkey_...
OMISE_SECRET_KEY=skey_...
```

### Frontend
The frontend requires the Public Key to be exposed for `Omise.js`.
File: `frontend/.env.local`

```properties
NEXT_PUBLIC_OMISE_PUBLIC_KEY=pkey_...
```

## 3. Implementation Details

### A. Credit Card Payment
**Flow:** Frontend captures card details -> Frontend generates Token (via Omise.js) -> Frontend sends Token to Backend -> Backend creates Charge.

1.  **Frontend (`PaymentControl.tsx`):**
    -   Loads `Omise.js` in `useEffect`.
    -   Captures card details (name, number, expiry, CVV).
    -   Calls `window.Omise.createToken('card', cardData, callback)`.
    -   On success, receives a `token.id` (e.g., `tokn_...`).
    -   Sends this token to `POST /checkout/credit-card`.

2.  **Backend (`server.js`):**
    -   Endpoint: `/checkout/credit-card`
    -   Receives `token`, `amount`, `email`, `name`.
    -   Uses `omiseClient.charges.create()` with `card: token`.

### B. PromptPay
**Flow:** Frontend requests payment -> Backend creates Source -> Backend creates Charge -> Frontend displays QR Code -> Polling for success.

1.  **Backend (`server.js`):**
    -   Endpoint: `/checkout/promptpay`
    -   Creates a Source: `omiseClient.sources.create({ type: 'promptpay', ... })`.
    -   Creates a Charge using that Source: `omiseClient.charges.create({ source: source.id, ... })`.
    -   Returns the Charge object containing `source.scannable_code` (QR Image).

2.  **Frontend (`PaymentControl.tsx`):**
    -   Calls `payWithPromptPay(amount)`.
    -   Displays the QR code from `charge.source.scannable_code.image.download_uri`.
    -   Polls `GET /check-status/:chargeId` every 3 seconds until status is `successful`.

### C. Mobile Banking (KPlus, Bualuang, etc.)
**Flow:** Frontend requests payment -> Backend creates Source -> Backend creates Charge -> Frontend redirects user to Bank App.

1.  **Backend (`server.js`):**
    -   Endpoint: `/checkout/mobile-banking`
    -   Creates a Source: `omiseClient.sources.create({ type: type, ... })` (e.g., `mobile_banking_kbank`).
    -   Creates a Charge using that Source.
    -   Returns the Charge object containing `authorize_uri`.

2.  **Frontend (`PaymentControl.tsx`):**
    -   Calls `payWithMobileBanking(amount, type)`.
    -   Redirects user to `charge.authorize_uri`.

## 4. API Reference

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/checkout/credit-card` | Charge via Credit Card | `{ email, name, amount, token }` |
| `POST` | `/checkout/promptpay` | Charge via PromptPay | `{ amount }` |
| `POST` | `/checkout/mobile-banking` | Charge via Mobile Banking | `{ amount, type }` |
| `GET` | `/check-status/:id` | Check Charge Status | N/A |

## 5. Usage Example (Frontend Code)

```typescript
// See frontend/lib/api.ts for full implementation
import { payWithCreditCard } from '../lib/api';

// Credit Card Example
const handlePay = async (token) => {
  const response = await payWithCreditCard({
    email: 'user@example.com',
    name: 'John Doe',
    amount: 1000,
    token: token // from Omise.createToken
  });
  console.log(response);
};
```
