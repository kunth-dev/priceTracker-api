import { numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: uuid("user_id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const resetCodes = pgTable("reset_codes", {
  email: text("email").primaryKey(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
});

export const orders = pgTable("orders", {
  orderId: uuid("order_id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  price: numeric("price").notNull(),
  link: text("link").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});
