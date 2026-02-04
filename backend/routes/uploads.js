const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { upload, uploadsDir } = require("../utils/storage");

router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    try {
        const inputPath = path.join(uploadsDir, req.file.filename);
        const baseName = path.parse(req.file.filename).name;
        const outputFile = `${baseName}.webp`;
        const thumbFile = `${baseName}_thumb.webp`;
        const outputPath = path.join(uploadsDir, outputFile);
        const thumbPath = path.join(uploadsDir, thumbFile);

        // If input matches output (e.g. .webp upload), rename input to temp first
        let sourcePath = inputPath;
        if (inputPath === outputPath) {
            const tempName = `temp-${req.file.filename}`;
            const tempPath = path.join(uploadsDir, tempName);
            await fs.promises.rename(inputPath, tempPath);
            sourcePath = tempPath;
        }

        await sharp(sourcePath).webp({ quality: 80 }).toFile(outputPath);
        await sharp(sourcePath)
            .resize({ width: 320 })
            .webp({ quality: 70 })
            .toFile(thumbPath);

        // Clean up source file (which is either the original upload or the temp renamed file)
        // If we renamed, we are deleting the temp file. If NOT renamed, we are deleting the original non-webp input.
        // Note: If input was NOT webp, inputPath != outputPath. We write outputPath. We delete inputPath.
        // If input WAS webp, sourcePath is temp. We write outputPath (original name). We delete sourcePath (temp).
        if (sourcePath !== outputPath) {
            await fs.promises.unlink(sourcePath);
        }


        const backendUrl = process.env.BACKEND_URL || "http://localhost:4022";

        res.status(201).json({
            path: `/uploads/${outputFile}`,
            thumbPath: `/uploads/${thumbFile}`,
            url: `${backendUrl}/uploads/${outputFile}`,
            thumbUrl: `${backendUrl}/uploads/${thumbFile}`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to process image" });
    }
});

router.get("/list", async (_req, res) => {
    try {
        const files = await fs.promises.readdir(uploadsDir);
        const backendUrl = process.env.BACKEND_URL;
        const items = await Promise.all(
            files
                .filter((filename) => !filename.endsWith("_thumb.webp"))
                .map(async (filename) => {
                    const filePath = path.join(uploadsDir, filename);
                    const stats = await fs.promises.stat(filePath);
                    const thumbFile = filename.replace(/\.webp$/i, "_thumb.webp");
                    const thumbPath = path.join(uploadsDir, thumbFile);
                    const thumbExists = fs.existsSync(thumbPath);
                    return {
                        filename,
                        path: `/uploads/${filename}`,
                        thumbPath: thumbExists ? `/uploads/${thumbFile}` : null,
                        url: `${backendUrl}/uploads/${filename}`,
                        thumbUrl: thumbExists
                            ? `${backendUrl}/uploads/${thumbFile}`
                            : null,
                        size: stats.size,
                        updatedAt: stats.mtime.toISOString(),
                    };
                })
        );
        res.json({ files: items });
    } catch (error) {
        res.status(500).json({ error: "Failed to read uploads" });
    }
});

router.delete("/:name", async (req, res) => {
    const filename = path.basename(req.params.name || "");
    if (!filename) {
        return res.status(400).json({ error: "Invalid filename" });
    }
    const filePath = path.join(uploadsDir, filename);
    try {
        await fs.promises.unlink(filePath);
        const thumbFile = filename.replace(/\.webp$/i, "_thumb.webp");
        const thumbPath = path.join(uploadsDir, thumbFile);
        if (fs.existsSync(thumbPath)) {
            await fs.promises.unlink(thumbPath);
        }
        res.json({ ok: true });
    } catch (error) {
        res.status(404).json({ error: "File not found" });
    }
});

module.exports = router;
