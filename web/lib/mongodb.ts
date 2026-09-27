import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI");

const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };
const client = globalForMongo.mongoClient ?? new MongoClient(uri);
if (process.env.NODE_ENV !== "production") globalForMongo.mongoClient = client;

let dbPromise: Promise<Db> | undefined;
export function getDb() {
  dbPromise ??= client.connect().then(() => client.db(process.env.MONGODB_DB));
  return dbPromise;
}
