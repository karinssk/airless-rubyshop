// scripts/export-mongo.js
// Export all collections to JSON files.
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:asggesfsdfewews552266955sopkjf@127.0.0.1:27017/room-reservation-services?authSource=admin";
const OUT_DIR = process.env.OUT_DIR || path.join(__dirname, "..", "mongo-export");

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const collections = await db.listCollections().toArray();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const col of collections) {
    const name = col.name;
    const docs = await db.collection(name).find({}).toArray();
    const file = path.join(OUT_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2));
    console.log(`Exported ${docs.length} docs -> ${file}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
