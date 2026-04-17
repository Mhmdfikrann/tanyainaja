import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";

declare global {
  var __tanyainajaPool: mysql.Pool | undefined;
}

const pool =
  global.__tanyainajaPool ??
  mysql.createPool({
    uri: env.databaseUrl,
    connectionLimit: 10,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__tanyainajaPool = pool;
}

export const db = drizzle(pool);
