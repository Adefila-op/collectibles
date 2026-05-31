import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

interface DBSchema {
  users: any[];
  sessions: any[];
  holdings: any[];
  offers: any[];
  swaps: any[];
  artworks: any[];
}

const defaultDB: DBSchema = {
  users: [],
  sessions: [],
  holdings: [],
  offers: [],
  swaps: [],
  artworks: [],
};

async function readDB(): Promise<DBSchema> {
  try {
    const data = await kv.get("artchain_db");
    return (data as DBSchema) || defaultDB;
  } catch (error) {
    console.error("Error reading DB from KV:", error);
    return defaultDB;
  }
}

async function writeDB(db: DBSchema): Promise<void> {
  try {
    await kv.set("artchain_db", db);
  } catch (error) {
    console.error("Error writing DB to KV:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const { table: getTable, filter: getFilter } = req.query;
      const db = await readDB();
      
      if (getTable && typeof getTable === "string") {
        let result = db[getTable as keyof DBSchema] || [];
        
        if (getFilter) {
          const filterObj = JSON.parse(getFilter as string);
          result = result.filter((item: any) =>
            Object.entries(filterObj).every(([key, value]) => item[key] === value)
          );
        }
        
        return res.status(200).json(result);
      }
      
      return res.status(200).json(db);
    }

    if (req.method === "POST") {
      const { action, table, data, filter } = req.body || {};
      const db = await readDB();

      if (!table || !(table in db)) {
        return res.status(400).json({ error: "Invalid table" });
      }

      const t = db[table as keyof DBSchema];

      if (action === "create") {
        const newItem = { id: crypto.randomUUID(), ...data };
        t.push(newItem);
        await writeDB(db);
        return res.status(201).json(newItem);
      }

      if (action === "read") {
        let result = t;
        if (filter) {
          result = t.filter((item: any) =>
            Object.entries(filter).every(([key, value]) => item[key] === value)
          );
        }
        return res.status(200).json(result);
      }

      if (action === "update") {
        const index = t.findIndex((item: any) => item.id === data.id);
        if (index >= 0) {
          t[index] = { ...t[index], ...data };
          await writeDB(db);
          return res.status(200).json(t[index]);
        }
        return res.status(404).json({ error: "Not found" });
      }

      if (action === "delete") {
        const index = t.findIndex((item: any) => item.id === data.id);
        if (index >= 0) {
          const deleted = t.splice(index, 1)[0];
          await writeDB(db);
          return res.status(200).json(deleted);
        }
        return res.status(404).json({ error: "Not found" });
      }
    }

    return res.status(400).json({ error: "Invalid request" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
