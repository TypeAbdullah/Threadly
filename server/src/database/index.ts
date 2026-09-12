import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client: MongoClient | null = null;
let db: Db | null = null;

export const getDb = async (): Promise<Db> => {
  if (db) return db;

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log(`[Database] Connecting to MongoDB at ${mongoUri}...`);
      client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      db = client.db(process.env.DB_NAME || "threadly");
      console.log("[Database] Connected successfully to external MongoDB.");
      await initIndexes(db);
      return db;
    } catch (err) {
      console.warn("[Database] Failed connecting to provided MONGODB_URI. Falling back to in-memory MongoDB...", err);
    }
  }

  // Automatic In-Memory fallback for effortless local development
  try {
    console.log("[Database] Starting embedded in-memory MongoDB server...");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("threadly");
    console.log(`[Database] In-memory MongoDB running at ${uri}`);
    await initIndexes(db);
    return db;
  } catch (err) {
    console.error("[Database] Failed to start in-memory MongoDB:", err);
    throw err;
  }
};

export const initIndexes = async (database: Db): Promise<void> => {
  try {
    console.log("[Database] Initializing collection indexes...");

    // sites
    await database.collection("sites").createIndex({ siteId: 1 }, { unique: true });
    await database.collection("sites").createIndex({ ownerId: 1 });

    // pages: siteId + pageId unique compound
    await database.collection("pages").createIndex({ siteId: 1, pageId: 1 }, { unique: true });

    // comments indexes
    await database.collection("comments").createIndex({ siteId: 1, pageId: 1, createdAt: -1 });
    await database.collection("comments").createIndex({ siteId: 1, pageId: 1, parentId: 1, createdAt: -1 });
    await database.collection("comments").createIndex({ userId: 1, createdAt: -1 });
    await database.collection("comments").createIndex({ moderationStatus: 1 });

    // reports: commentId + userId (prevent duplicate abuse)
    await database.collection("reports").createIndex({ commentId: 1, userId: 1 }, { unique: true });
    await database.collection("reports").createIndex({ commentId: 1, createdAt: -1 });

    // notifications: userId + read + createdAt
    await database.collection("notifications").createIndex({ userId: 1, read: 1, createdAt: -1 });

    // siteMembers: siteId + userId (unique)
    await database.collection("siteMembers").createIndex({ siteId: 1, userId: 1 }, { unique: true });

    // apiKeys
    await database.collection("apiKeys").createIndex({ siteId: 1 });

    console.log("[Database] Indexes created successfully.");
  } catch (err) {
    console.warn("[Database] Note on index creation:", err);
  }
};
