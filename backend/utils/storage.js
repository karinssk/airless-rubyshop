const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const createUpload = ({ fileFilter, limits } = {}) =>
    multer({
        storage: uploadStorage,
        fileFilter,
        limits,
    });

const upload = createUpload({
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith("image/")) {
            cb(null, true);
            return;
        }
        cb(new Error("Only image uploads are allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = {
    uploadsDir,
    upload,
    createUpload,
};
