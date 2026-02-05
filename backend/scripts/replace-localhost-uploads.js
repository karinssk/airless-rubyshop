const path = require("path");
const { MongoClient } = require("mongodb");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in backend/.env");
  process.exit(1);
}

const FROM = "http://localhost:5000/uploads/";
const TO = "/uploads/";
const DRY_RUN = process.env.DRY_RUN === "1";

const shouldReplace = (value) =>
  typeof value === "string" && value.includes(FROM);

const replaceInValue = (value) => {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const { value: replaced, changed: itemChanged } = replaceInValue(item);
      if (itemChanged) changed = true;
      return replaced;
    });
    return { value: next, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const next = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === "_id") {
        next[key] = val;
        continue;
      }
      const { value: replaced, changed: fieldChanged } = replaceInValue(val);
      if (fieldChanged) changed = true;
      next[key] = replaced;
    }
    return { value: next, changed };
  }

  if (shouldReplace(value)) {
    return { value: value.replaceAll(FROM, TO), changed: true };
  }

  return { value, changed: false };
};

const run = async () => {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const collections = await db.collections();

  let totalUpdated = 0;

  for (const collection of collections) {
    const name = collection.collectionName;
    const cursor = collection.find({});
    let updatedInCollection = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;
      const { value: replaced, changed } = replaceInValue(doc);
      if (!changed) continue;

      updatedInCollection += 1;
      totalUpdated += 1;

      if (!DRY_RUN) {
        const { _id, ...updateSet } = replaced;
        await collection.updateOne({ _id: doc._id }, { $set: updateSet });
      }
    }

    if (updatedInCollection > 0) {
      console.log(`✅ ${name}: updated ${updatedInCollection} documents`);
    }
  }

  console.log(
    DRY_RUN
      ? `ℹ️ Dry run complete. ${totalUpdated} documents would be updated.`
      : `✅ Update complete. ${totalUpdated} documents updated.`
  );

  await client.close();
};

run().catch((error) => {
  console.error("❌ Failed to replace localhost URLs:", error);
  process.exit(1);
});
