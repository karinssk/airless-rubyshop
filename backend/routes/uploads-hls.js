const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { randomUUID } = require("crypto");
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
const ffprobePath = process.env.FFPROBE_PATH || "ffprobe";

const jobs = new Map();

const scheduleCleanup = (jobId) => {
    setTimeout(() => {
        jobs.delete(jobId);
    }, 1000 * 60 * 60);
};

const getDurationSeconds = (inputPath) =>
    new Promise((resolve, reject) => {
        const args = [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            inputPath,
        ];
        const proc = spawn(ffprobePath, args, {
            stdio: ["ignore", "pipe", "pipe"],
        });
        let output = "";
        let errorOutput = "";
        proc.stdout.on("data", (chunk) => {
            output += chunk.toString();
        });
        proc.stderr.on("data", (chunk) => {
            errorOutput += chunk.toString();
        });
        proc.on("error", (error) => reject(error));
        proc.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(errorOutput || "ffprobe failed"));
                return;
            }
            const value = parseFloat(String(output).trim());
            if (Number.isFinite(value)) {
                resolve(value);
                return;
            }
            reject(new Error("Unable to parse duration"));
        });
    });

const runFfmpeg = (args, onProgress) =>
    new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, args, {
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stdoutBuffer = "";
        let stderr = "";
        proc.stdout.on("data", (chunk) => {
            stdoutBuffer += chunk.toString();
            const lines = stdoutBuffer.split("\n");
            stdoutBuffer = lines.pop() || "";
            lines.forEach((line) => {
                const [key, value] = line.trim().split("=");
                if (!key || value === undefined) return;
                if (onProgress) {
                    onProgress({ key, value });
                }
            });
        });
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
    console.log("[hls] Upload request received", {
        contentLength: req.headers["content-length"],
        contentType: req.headers["content-type"],
    });
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const inputPath = path.join(uploadsDir, req.file.filename);
    const jobId = randomUUID();
    const hlsId = jobId;
    const hlsRoot = path.join(uploadsDir, "hls");
    const outputDir = path.join(hlsRoot, hlsId);
    const playlistPath = path.join(outputDir, "index.m3u8");
    const segmentPattern = path.join(outputDir, "segment-%03d.ts");
    const segmentTime = 1.5;
    const relativePath = `/uploads/hls/${hlsId}/index.m3u8`;
    const baseUrl =
        normalizeBaseUrl(process.env.BACKEND_URL) ||
        `${req.protocol}://${req.get("host")}`;

    try {
        console.log("[hls] Upload stored", {
            jobId,
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mime: req.file.mimetype,
        });
        await fs.promises.mkdir(outputDir, { recursive: true });
        jobs.set(jobId, {
            status: "processing",
            progress: 0,
            path: relativePath,
            url: `${baseUrl}${relativePath}`,
            hlsId,
            segmentTime,
            startedAt: new Date().toISOString(),
        });

        res.status(202).json({
            jobId,
            path: relativePath,
            url: `${baseUrl}${relativePath}`,
            hlsId,
            segmentTime,
        });

        let durationSeconds = null;
        try {
            durationSeconds = await getDurationSeconds(inputPath);
        } catch (error) {
            console.warn("[hls] Unable to read duration:", error.message);
        }

        console.log(
            `[hls] Started job ${jobId} (${req.file.originalname}) duration=${durationSeconds || "unknown"}s`
        );

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
            "-progress",
            "pipe:1",
            "-nostats",
            playlistPath,
        ];

        let lastLogged = 0;
        await runFfmpeg(args, ({ key, value }) => {
            if (key !== "out_time_ms") return;
            const outTimeMs = Number(value);
            if (!Number.isFinite(outTimeMs)) return;
            let percent = 0;
            if (durationSeconds) {
                percent = Math.min(
                    100,
                    Math.max(0, (outTimeMs / (durationSeconds * 1000)) * 100)
                );
            }
            const rounded = Math.round(percent);
            const job = jobs.get(jobId);
            if (job) {
                job.progress = rounded;
                jobs.set(jobId, job);
            }
            if (rounded >= lastLogged + 5) {
                lastLogged = rounded;
                console.log(`[hls] Job ${jobId} ${rounded}%`);
            }
        });

        await fs.promises.unlink(inputPath).catch(() => null);

        const job = jobs.get(jobId);
        if (job) {
            job.status = "done";
            job.progress = 100;
            job.completedAt = new Date().toISOString();
            jobs.set(jobId, job);
        }
        console.log(`[hls] Job ${jobId} completed`);
        scheduleCleanup(jobId);
    } catch (error) {
        console.error(error);
        if (error && error.code === "ENOENT") {
            const job = jobs.get(jobId);
            if (job) {
                job.status = "error";
                job.error = "ffmpeg is not installed on the server";
                jobs.set(jobId, job);
                scheduleCleanup(jobId);
            }
            return;
        }
        await fs.promises.rm(outputDir, { recursive: true, force: true });
        await fs.promises.unlink(inputPath).catch(() => null);
        const job = jobs.get(jobId);
        if (job) {
            job.status = "error";
            job.error = "Failed to process video";
            jobs.set(jobId, job);
            scheduleCleanup(jobId);
        }
    }
});

router.get("/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) {
        return res.status(404).json({ error: "Job not found" });
    }
    return res.json({
        jobId: req.params.jobId,
        status: job.status,
        progress: job.progress,
        path: job.path,
        url: job.url,
        error: job.error || null,
    });
});

module.exports = router;
