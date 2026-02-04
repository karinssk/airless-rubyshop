const mongoose = require("mongoose");
const Menu = require("../models/Menu");

// Default English translations for common menu items
const defaultTranslations = {
  // Main navigation
  "หน้าแรก": "Home",
  "บริการ": "Services",
  "บริการทั้งหมด": "All Services",
  "สินค้า": "Products",
  "ติดต่อเรา": "Contact Us",
  "เกี่ยวกับเรา": "About",
  "บทความ": "Articles",

  // Services
  "ล้างแอร์": "AC Cleaning",
  "ล้างแอร์สำนักงาน": "Office AC Cleaning",
  "ติดตั้งแอร์": "AC Installation",
  "ติดตั้งระบบแอร์": "AC System Installation",
  "ซ่อมแอร์": "AC Repair",
  "ซ่อมและตรวจเช็ค": "Repair & Inspection",
  "สัญญาบำรุงรักษา": "AMC",
  "สัญญาบำรุงรักษารายปี": "Annual Maintenance Contract",

  // CTA
  "นัดหมาย": "Book Appointment",
  "จองคิว": "Book Now",

  // Contact
  "โทร": "Call",
  "อีเมล": "Email",
  "ที่อยู่": "Address"
};

// Convert string to multi-language object
function toMultiLang(value) {
  if (!value) return { th: "", en: "" };
  if (typeof value === "object" && value.th !== undefined) {
    // Already multi-language
    return value;
  }

  // Check if it's Thai text
  const isThai = /[\u0E00-\u0E7F]/.test(value);

  if (isThai) {
    // Thai text - try to find translation
    const enTranslation = defaultTranslations[value] || "";
    return { th: value, en: enTranslation };
  } else {
    // English text - assume empty Thai
    return { th: "", en: value };
  }
}

// Recursively convert menu items
function convertMenuItem(item) {
  return {
    ...item,
    label: toMultiLang(item.label),
    children: item.children ? item.children.map(convertMenuItem) : undefined
  };
}

async function migrateMenu() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/air-con-services");
    console.log("✓ Connected to MongoDB");

    // Find main menu
    const menu = await Menu.findOne({ name: "main" });

    if (!menu) {
      console.log("✗ No menu found");
      process.exit(1);
    }

    console.log(`\n📋 Found menu with ${menu.items?.length || 0} items\n`);

    // Convert items
    const convertedItems = menu.items.map(convertMenuItem);

    // Convert CTA
    let convertedCta = menu.cta;
    if (menu.cta) {
      convertedCta = {
        label: toMultiLang(menu.cta.label),
        href: menu.cta.href
      };
    }

    // Convert contact bar items
    let convertedContactBar = menu.contactBar;
    if (menu.contactBar && menu.contactBar.items) {
      convertedContactBar = {
        ...menu.contactBar,
        items: menu.contactBar.items.map(item => ({
          ...item,
          text: toMultiLang(item.text)
        }))
      };
    }

    // Update menu
    await Menu.findOneAndUpdate(
      { name: "main" },
      {
        $set: {
          items: convertedItems,
          cta: convertedCta,
          contactBar: convertedContactBar
        }
      }
    );

    console.log("✓ Menu migrated successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - ${convertedItems.length} main menu items converted`);
    console.log(`   - ${convertedCta ? "CTA" : "No CTA"} converted`);
    console.log(`   - ${convertedContactBar?.items?.length || 0} contact bar items converted\n`);

    console.log("🎯 Next steps:");
    console.log("   1. Visit http://localhost:4020/th/ to see Thai version");
    console.log("   2. Visit http://localhost:4020/en/ to see English version");
    console.log("   3. Edit menu at http://localhost:4021/menu");
    console.log("   4. Add missing English translations manually\n");

    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateMenu();
