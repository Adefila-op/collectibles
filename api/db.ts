import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as fs from "fs";
import * as path from "path";

const DB_PATH = "/tmp/artchain_db.json";

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

function readDB(): DBSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading DB:", error);
  }
  return defaultDB;
}

function writeDB(db: DBSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Error writing DB:", error);
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const db = readDB();
  const { action, table, data, filter } = req.body;

  try {
    if (req.method === "GET") {
      const { table: getTable, filter: getFilter } = req.query;
      const db = readDB();
      
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
      if (!table || !(table in db)) {
        return res.status(400).json({ error: "Invalid table" });
      }

      const t = db[table as keyof DBSchema];

      if (action === "create") {
        const newItem = { id: crypto.randomUUID(), ...data };
        t.push(newItem);
        writeDB(db);
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
          writeDB(db);
          return res.status(200).json(t[index]);
        }
        return res.status(404).json({ error: "Not found" });
      }

      if (action === "delete") {
        const index = t.findIndex((item: any) => item.id === data.id);
        if (index >= 0) {
          const deleted = t.splice(index, 1)[0];
          writeDB(db);
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
