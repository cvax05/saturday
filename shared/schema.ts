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
  avatarUrl: text("avatar_url"), // Single avatar URL for profile display
  bio: text("bio"), // User bio/description
  classYear: integer("class_year"), // Graduation year
  groupSizeMin: integer("group_size_min"), // Minimum group size preference
  groupSizeMax: integer("group_size_max"), // Maximum group size preference
  preferredAlcohol: text("preferred_alcohol"), // Alcohol preference (Beer, Wine, Cocktails, etc.)
  availability: text("availability"), // Availability (Weekends, Weekdays, Both)
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

// User photos table for multiple photos per user
export const userPhotos = pgTable("user_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Foreign key to users
  userFK: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }),
  // Index for performance
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
  isGroup: integer("is_group").default(0).notNull(), // 0 for false, 1 for true - boolean
  title: text("title"), // Optional title for group conversations
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Foreign key to schools
  schoolFK: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
  }),
  // Foreign key to user who created the conversation
  createdByFK: foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
  }),
  // Index for performance
  schoolIndex: index().on(table.schoolId),
}));

// Junction table for conversation participants with composite primary key
export const conversationParticipants = pgTable("conversation_participants", {
  conversationId: varchar("conversation_id").notNull(),
  userId: varchar("user_id").notNull(),
  lastReadAt: timestamp("last_read_at"), // Track when user last read messages
  joinedAt: timestamp("joined_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Composite primary key
  pk: {
    name: "conversation_participants_pkey",
    columns: [table.conversationId, table.userId],
  },
  // Foreign keys with cascade delete
  conversationFK: foreignKey({
    columns: [table.conversationId],
    foreignColumns: [conversations.id],
  }).onDelete("cascade"),
  userFK: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }).onDelete("cascade"),
  // Indexes for performance
  conversationIndex: index().on(table.conversationId),
  userIndex: index().on(table.userId),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull().$default(() => {
    // This is just for type checking - actual check is in DB
    throw new Error("Content must be between 1 and 4000 characters");
  }),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  // Legacy fields for backward compatibility
  senderEmail: text("sender_email"),
  recipientEmail: text("recipient_email"),
  isRead: integer("is_read").default(0), // Deprecated - use conversation_participants.last_read_at instead
}, (table) => ({
  // Foreign keys with cascade delete
  conversationFK: foreignKey({
    columns: [table.conversationId],
    foreignColumns: [conversations.id],
  }).onDelete("cascade"),
  senderFK: foreignKey({
    columns: [table.senderId],
    foreignColumns: [users.id],
  }).onDelete("cascade"),
  // Index for pagination and performance (conversation_id, created_at)
  conversationTimeIndex: index().on(table.conversationId, table.createdAt),
  // Additional indexes
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

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pregameId: varchar("pregame_id").notNull(),
  reviewerId: varchar("reviewer_id").notNull(), // User who wrote the review
  revieweeId: varchar("reviewee_id").notNull(), // User being reviewed
  rating: integer("rating").notNull(), // 1-5 stars
  message: text("message"), // Optional review message
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  // Foreign keys
  pregameFK: foreignKey({
    columns: [table.pregameId],
    foreignColumns: [pregames.id],
  }),
  reviewerFK: foreignKey({
    columns: [table.reviewerId],
    foreignColumns: [users.id],
  }),
  revieweeFK: foreignKey({
    columns: [table.revieweeId],
    foreignColumns: [users.id],
  }),
  // Indexes for performance
  pregameIndex: index().on(table.pregameId),
  reviewerIndex: index().on(table.reviewerId),
  revieweeIndex: index().on(table.revieweeId),
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

// User photos schemas
export const insertUserPhotoSchema = createInsertSchema(userPhotos).omit({
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
  avatarUrl: true,
  bio: true,
  classYear: true,
  groupSizeMin: true,
  groupSizeMax: true,
  preferredAlcohol: true,
  availability: true,
});

export const registerSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  school: true, // Keep for backward compatibility 
  displayName: true,
  bio: true,
  classYear: true,
  groupSizeMin: true,
  groupSizeMax: true,
  preferredAlcohol: true,
  availability: true,
}).extend({
  profileImage: z.string()
    .regex(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/, "Must be a valid image data URL")
    .max(2000000, "Profile image size too large (max 2MB)")
    .optional(),
  galleryImages: z.array(
    z.string()
      .regex(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/, "Must be a valid image data URL")
      .max(2000000, "Image size too large (max 2MB per image)")
  ).max(5, "Maximum 5 gallery images allowed").optional(),
  schoolSlug: z.string().min(1, "School selection is required"), // New field for school selection
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  classYear: z.number().int().min(2020).max(2030).optional(),
  groupSizeMin: z.number().int().min(1).max(100).optional(),
  groupSizeMax: z.number().int().min(1).max(100).optional(),
  preferredAlcohol: z.string().optional(),
  availability: z.string().optional(),
});

export const loginSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  schoolSlug: z.string().optional(), // For when user belongs to multiple schools
});

// Update user profile schema (all fields optional except those that should never change)
const dataUrlRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  groupSizeMin: z.number().int().min(1).max(50).optional(),
  groupSizeMax: z.number().int().min(1).max(50).optional(),
  preferredAlcohol: z.string().max(100).optional(),
  availability: z.string().max(100).optional(),
  profileImage: z.string().regex(dataUrlRegex, "Must be a valid image data URL").optional(),
  galleryImages: z.array(z.string().regex(dataUrlRegex, "Must be a valid image data URL")).max(5).optional(),
}).refine(data => {
  if (data.groupSizeMin !== undefined && data.groupSizeMax !== undefined) {
    return data.groupSizeMin <= data.groupSizeMax;
  }
  return true;
}, {
  message: "Minimum group size cannot be greater than maximum group size",
  path: ["groupSizeMin"],
});

// Conversation schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  schoolId: true, // Will be derived from JWT
  createdBy: true, // Will be derived from JWT
});

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  joinedAt: true,
  lastReadAt: true,
});

// Schema for creating new conversations with participants
export const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1, "At least one participant required"),
  title: z.string().max(200).optional(),
});

// Schema for sending messages
export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000, "Message too long (max 4000 characters)"),
});

// Schema for marking conversation as read
export const markReadSchema = z.object({
  lastReadAt: z.string().datetime().optional(), // ISO timestamp, defaults to now() if not provided
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

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  reviewerId: true, // Will be derived from JWT
}).extend({
  rating: z.number().int().min(1).max(5),
  message: z.string().max(500).optional(),
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
  profileImage?: string | null;
  galleryImages?: string[];
  profileImages?: string[] | null; // Deprecated: kept for backward compatibility
  school?: string | null;
  bio?: string | null;
  groupSizeMin?: number | null;
  groupSizeMax?: number | null;
  preferredAlcohol?: string | null;
  availability?: string | null;
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

export type InsertUserPhoto = z.infer<typeof insertUserPhotoSchema>;
export type UserPhoto = typeof userPhotos.$inferSelect;

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
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Messaging request/response types
export type CreateConversationRequest = z.infer<typeof createConversationSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type MarkReadRequest = z.infer<typeof markReadSchema>;

// Conversation with participants for API responses
export interface ConversationWithParticipants extends Conversation {
  participants: User[];
}

// Conversation list item with preview and unread count
export interface ConversationListItem extends Conversation {
  participants: Array<{
    id: string;
    username: string;
    displayName?: string | null;
    profileImage?: string | null;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
}

// Message with sender info
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string;
    displayName?: string | null;
    profileImage?: string | null;
  };
}
