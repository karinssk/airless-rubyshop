// scripts/import-mongo.js
// Import JSON files into collections. Clears existing collections first.
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:asggesfsdfewews552266955sopkjf@127.0.0.1:27017/room-reservation-services?authSource=admin";
const IN_DIR = process.env.IN_DIR || path.join(__dirname, "..", "mongo-export");

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const files = fs.readdirSync(IN_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const name = path.basename(file, ".json");
    const raw = fs.readFileSync(path.join(IN_DIR, file), "utf8");
    const docs = JSON.parse(raw);

    const col = db.collection(name);
    await col.deleteMany({});
    if (docs.length) {
      await col.insertMany(docs);
    }
    console.log(`Imported ${docs.length} docs -> ${name}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
