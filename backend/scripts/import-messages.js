// Import frontend i18n JSON messages into MongoDB
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { MongoClient } = require("mongodb");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://admin:asggesfsdfewews552266955sopkjf@127.0.0.1:27017/room-reservation-services?authSource=admin";

const IN_DIR =
  process.env.IN_DIR ||
  path.join(__dirname, "..", "..", "frontend", "messages");

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection("messages");

  const files = fs.readdirSync(IN_DIR).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    console.log(`No .json files found in ${IN_DIR}`);
    await client.close();
    return;
  }

  for (const file of files) {
    const locale = path.basename(file, ".json");
    const raw = fs.readFileSync(path.join(IN_DIR, file), "utf8");
    const messages = JSON.parse(raw);

    await collection.updateOne(
      { locale },
      { $set: { locale, messages, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(`Upserted messages for locale: ${locale}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
