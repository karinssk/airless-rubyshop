const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { createUpload, uploadsDir } = require("../utils/storage");
const { normalizeBaseUrl } = require("../utils/helpers");

const router = express.Router();

const uploadVideo = createUpload({
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith("video/")) {
            cb(null, true);
            return;
        }
        cb(new Error("Only video uploads are allowed"));
    },
    limits: { fileSize: 300 * 1024 * 1024 },
});

const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

const runFfmpeg = (args) =>
    new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, args, {
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stderr = "";
        proc.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });
        proc.on("error", (error) => reject(error));
        proc.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`ffmpeg exited with code ${code}\n${stderr}`));
        });
    });

router.post("/", uploadVideo.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const inputPath = path.join(uploadsDir, req.file.filename);
    const hlsId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const hlsRoot = path.join(uploadsDir, "hls");
    const outputDir = path.join(hlsRoot, hlsId);
    const playlistPath = path.join(outputDir, "index.m3u8");
    const segmentPattern = path.join(outputDir, "segment-%03d.ts");
    const segmentTime = 1.5;

    try {
        await fs.promises.mkdir(outputDir, { recursive: true });

        const args = [
            "-y",
            "-i",
            inputPath,
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-c:v",
            "h264",
            "-profile:v",
            "main",
            "-preset",
            "veryfast",
            "-crf",
            "21",
            "-sc_threshold",
            "0",
            "-force_key_frames",
            `expr:gte(t,n_forced*${segmentTime})`,
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-ac",
            "2",
            "-hls_time",
            String(segmentTime),
            "-hls_playlist_type",
            "vod",
            "-hls_flags",
            "independent_segments",
            "-hls_segment_filename",
            segmentPattern,
            playlistPath,
        ];

        await runFfmpeg(args);

        await fs.promises.unlink(inputPath).catch(() => null);

        const baseUrl =
            normalizeBaseUrl(process.env.BACKEND_URL) ||
            `${req.protocol}://${req.get("host")}`;
        const relativePath = `/uploads/hls/${hlsId}/index.m3u8`;

        return res.status(201).json({
            path: relativePath,
            url: `${baseUrl}${relativePath}`,
            hlsId,
            segmentTime,
        });
    } catch (error) {
        console.error(error);
        if (error && error.code === "ENOENT") {
            return res
                .status(500)
                .json({ error: "ffmpeg is not installed on the server" });
        }
        await fs.promises.rm(outputDir, { recursive: true, force: true });
        await fs.promises.unlink(inputPath).catch(() => null);
        return res.status(500).json({ error: "Failed to process video" });
    }
});

module.exports = router;
