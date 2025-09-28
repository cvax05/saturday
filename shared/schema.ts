import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, foreignKey, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schools table for multi-tenant organization
export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  school: text("school"), // Keep for backward compatibility, but will be deprecated
  email: text("email").notNull().unique(),
  profileImages: text("profile_images").array(),
  displayName: text("display_name"), // Add display name for better user management
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Junction table for many-to-many relationship between users and schools
export const schoolMemberships = pgTable("school_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").default("member").notNull(), // member, admin, etc.
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate memberships
  uniqueSchoolUser: unique().on(table.schoolId, table.userId),
  // Foreign keys
  schoolFK: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
  }),
  userFK: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }),
  // Indexes for performance
  schoolIndex: index().on(table.schoolId),
  userIndex: index().on(table.userId),
}));

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  school: text("school").notNull(), // Keep for backward compatibility 
  schoolId: varchar("school_id"), // New foreign key reference
  description: text("description"),
  memberCount: integer("member_count").default(1),
  groupType: text("group_type"), // e.g., "Fraternity", "Sorority", "Club", "Organization"
  establishedYear: integer("established_year"),
  contactEmail: text("contact_email"),
  socialMedia: text("social_media"), // JSON string for multiple platforms
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Foreign key to schools
  schoolFK: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
  }),
  // Index for performance
  schoolIndex: index().on(table.schoolId),
}));

// Conversations table for better messaging organization
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  title: text("title"), // Optional title for group conversations
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Foreign key to schools
  schoolFK: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
  }),
  // Index for performance
  schoolIndex: index().on(table.schoolId),
}));

// Junction table for conversation participants
export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate participants
  uniqueConversationUser: unique().on(table.conversationId, table.userId),
  // Foreign keys
  conversationFK: foreignKey({
    columns: [table.conversationId],
    foreignColumns: [conversations.id],
  }),
  userFK: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }),
  // Indexes for performance
  conversationIndex: index().on(table.conversationId),
  userIndex: index().on(table.userId),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id"), // New way: link to conversations
  senderEmail: text("sender_email").notNull(), // Keep for backward compatibility
  recipientEmail: text("recipient_email").notNull(), // Keep for backward compatibility
  senderId: varchar("sender_id"), // New way: link to user IDs
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  isRead: integer("is_read").default(0).notNull(), // 0 for false, 1 for true
}, (table) => ({
  // Foreign keys
  conversationFK: foreignKey({
    columns: [table.conversationId],
    foreignColumns: [conversations.id],
  }),
  senderFK: foreignKey({
    columns: [table.senderId],
    foreignColumns: [users.id],
  }),
  // Indexes for performance
  conversationIndex: index().on(table.conversationId),
  senderIndex: index().on(table.senderId),
}));

export const pregames = pgTable("pregames", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id"), // Add school scoping
  creatorEmail: text("creator_email").notNull(), // Keep for backward compatibility
  participantEmail: text("participant_email").notNull(), // Keep for backward compatibility
  creatorId: varchar("creator_id"), // New way: link to user IDs
  participantId: varchar("participant_id"), // New way: link to user IDs
  date: text("date").notNull(), // Format: YYYY-MM-DD
  time: text("time").notNull(), // Format: HH:MM
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Foreign keys
  schoolFK: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
  }),
  creatorFK: foreignKey({
    columns: [table.creatorId],
    foreignColumns: [users.id],
  }),
  participantFK: foreignKey({
    columns: [table.participantId],
    foreignColumns: [users.id],
  }),
  // Indexes for performance
  schoolIndex: index().on(table.schoolId),
  creatorIndex: index().on(table.creatorId),
  participantIndex: index().on(table.participantId),
}));

// School schemas
export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolMembershipSchema = createInsertSchema(schoolMemberships).omit({
  id: true,
  createdAt: true,
});

// Updated user schemas for multi-tenant
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  school: true, // Keep for backward compatibility
  profileImages: true,
  displayName: true,
});

export const registerSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  school: true, // Keep for backward compatibility 
  profileImages: true,
  displayName: true,
}).extend({
  profileImages: z.array(
    z.string()
      .regex(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/, "Must be a valid image data URL")
      .max(2000000, "Image size too large (max 2MB per image)")
  ).max(5, "Maximum 5 images allowed").optional(),
  schoolSlug: z.string().min(1, "School selection is required"), // New field for school selection
});

export const loginSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  schoolSlug: z.string().optional(), // For when user belongs to multiple schools
});

// Conversation schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  schoolId: true, // Will be derived from JWT
});

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  joinedAt: true,
});

// Updated schemas for multi-tenant
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  schoolId: true, // Will be derived from JWT
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  senderEmail: true, // Remove senderEmail from client input - will be derived server-side
  senderId: true, // Will be derived from JWT
  conversationId: true, // Will be derived from route or created
});

export const insertPregameSchema = createInsertSchema(pregames).omit({
  id: true,
  createdAt: true,
  creatorEmail: true, // Remove creatorEmail from client input - will be derived server-side
  creatorId: true, // Will be derived from JWT
  schoolId: true, // Will be derived from JWT
});

// JWT payload type for type safety
export interface JWTPayload {
  user_id: string;
  school_id: string;
  school_slug: string;
  email: string;
  username: string;
  exp?: number;
}

// Auth response types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  profileImages?: string[] | null;
  school?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  schools: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
}

// Type exports
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;
export type InsertSchoolMembership = z.infer<typeof insertSchoolMembershipSchema>;
export type SchoolMembership = typeof schoolMemberships.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertPregame = z.infer<typeof insertPregameSchema>;
export type Pregame = typeof pregames.$inferSelect;
