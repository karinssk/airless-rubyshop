/**
 * Migration Script: Convert existing pages to multi-language format
 *
 * This script migrates existing Page documents from single-language format
 * to multi-language format with Thai and English support.
 *
 * Usage:
 *   node scripts/migrate-pages-to-multilang.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Page schema (old format for reference)
const pageSchema = new mongoose.Schema({
  title: mongoose.Schema.Types.Mixed,
  slug: String,
  status: String,
  seo: mongoose.Schema.Types.Mixed,
  theme: Object,
  layout: mongoose.Schema.Types.Mixed,
}, { timestamps: true, versionKey: false });

const Page = mongoose.model("Page", pageSchema);

async function migratePage(page) {
  const updates = {};
  let needsUpdate = false;

  // Migrate title
  if (typeof page.title === 'string') {
    updates.title = {
      th: page.title,
      en: "" // Empty English title, admin can fill it later
    };
    needsUpdate = true;
    console.log(`  - Migrating title: "${page.title}"`);
  }

  // Migrate SEO
  if (page.seo) {
    if (typeof page.seo.title === 'string') {
      updates['seo.title'] = {
        th: page.seo.title || "",
        en: ""
      };
      needsUpdate = true;
    }
    if (typeof page.seo.description === 'string') {
      updates['seo.description'] = {
        th: page.seo.description || "",
        en: ""
      };
      needsUpdate = true;
    }
  }

  // Migrate layout
  if (Array.isArray(page.layout)) {
    updates.layout = {
      th: page.layout,
      en: [] // Empty English layout, admin can create it later
    };
    needsUpdate = true;
    console.log(`  - Migrating layout: ${page.layout.length} blocks`);
  }

  if (needsUpdate) {
    await Page.updateOne({ _id: page._id }, { $set: updates });
    console.log(`✓ Migrated page: ${page.slug}`);
    return true;
  }

  console.log(`  - Already migrated: ${page.slug}`);
  return false;
}

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    console.log("Fetching pages...");
    const pages = await Page.find({});
    console.log(`Found ${pages.length} pages\n`);

    if (pages.length === 0) {
      console.log("No pages to migrate.");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const page of pages) {
      console.log(`\nProcessing: ${page.slug}`);
      const wasMigrated = await migratePage(page);
      if (wasMigrated) {
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Migration Complete!");
    console.log("=".repeat(50));
    console.log(`✓ Migrated: ${migratedCount} pages`);
    console.log(`- Skipped: ${skippedCount} pages (already migrated)`);
    console.log(`Total: ${pages.length} pages`);
    console.log("\nNext steps:");
    console.log("1. Open admin panel and edit each page");
    console.log("2. Add English translations for title, SEO, and content");
    console.log("3. Save each page to finalize the migration");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
  }
}

// Run migration
main();
