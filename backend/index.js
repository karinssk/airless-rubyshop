const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const { Server } = require("socket.io");
const initSocket = require("./socket");
const seedAdminUsers = require("./utils/seed");
const { resolveBaseUrl } = require("./utils/helpers");

dotenv.config();

const FRONTEND_URL = resolveBaseUrl(
  "FRONTEND_PRODUCTION_URL",
  "FRONTEND_DEVELOPMENT_URL"
);
const ADMIN_URL = resolveBaseUrl(
  "ADMIN_PRODUCTION_URL",
  "ADMIN_DEVELOPMENT_URL"
);
const BACKEND_URL = resolveBaseUrl(
  "BACKEND_PRODUCTION_URL",
  "BACKEND_DEVELOPMENT_URL"
);

// Expose to other modules via process.env https://airless-spray.rubyshop.co.th/
process.env.FRONTEND_URL = FRONTEND_URL;
process.env.ADMIN_URL = ADMIN_URL;
process.env.BACKEND_URL = BACKEND_URL;
process.env.LINE_CLIENT_ID = process.env.LINE_CLIENT_ID;
process.env.LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET;
process.env.LINE_CALLBACK_URL = process.env.LINE_CALLBACK_URL;
const allowedOrigins = [
  FRONTEND_URL,
  ADMIN_URL,
  BACKEND_URL,
  "https://airless-spray.rubyshop.co.th",
  "https://admin-airless-spray.rubyshop.co.th",
  "https://api-airless-spray.rubyshop.co.th",
  "http://localhost:5001",
  "http://localhost:5002",
].filter(Boolean);

const fastForwardSslRegex = /^https?:\/\/([a-z0-9-]+)\.fastforwardssl\.com$/i;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin) || fastForwardSslRegex.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

const adminPresence = new Map();

app.use(cors(corsOptions));
app.use(express.json());

// Static Uploads
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/services"));
app.use("/", require("./routes/products"));
app.use("/", require("./routes/content"));
app.use("/admin", require("./routes/admin"));
app.use("/forms", require("./routes/forms"));
app.use("/pages", require("./routes/pages"));
app.use("/posts", require("./routes/posts"));
app.use("/uploads", require("./routes/uploads"));
app.use("/chat", require("./routes/chat")(io, adminPresence));
app.use("/api/calendar", require("./routes/calendar")(io));
app.use("/api", require("./routes/sheets"));
// New booking system routes
app.use("/", require("./routes/rooms"));
app.use("/", require("./routes/bookings"));
app.use("/", require("./routes/promoCodes"));
app.use("/", require("./routes/payments"));
app.use("/", require("./routes/emailTemplates"));
app.use("/", require("./routes/popupImage"));
app.use("/", require("./routes/stats"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState });
});

// Socket.IO
initSocket(io, adminPresence);

const port = process.env.PORT || 5003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    seedAdminUsers().catch((error) => {
      console.error("Failed to seed admin users", error);
    });
    server.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
