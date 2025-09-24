import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  school: text("school"),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  school: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
