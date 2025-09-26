import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  school: text("school"),
  email: text("email").notNull().unique(),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  school: text("school").notNull(),
  description: text("description"),
  memberCount: integer("member_count").default(1),
  groupType: text("group_type"), // e.g., "Fraternity", "Sorority", "Club", "Organization"
  establishedYear: integer("established_year"),
  contactEmail: text("contact_email"),
  socialMedia: text("social_media"), // JSON string for multiple platforms
  profileImage: text("profile_image"),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderEmail: text("sender_email").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  isRead: integer("is_read").default(0).notNull(), // 0 for false, 1 for true
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  school: true,
});

export const registerSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  school: true,
});

export const loginSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  senderEmail: true, // Remove senderEmail from client input - will be derived server-side
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
