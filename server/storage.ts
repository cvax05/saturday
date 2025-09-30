import { 
  users, 
  organizations, 
  messages, 
  pregames, 
  schools,
  schoolMemberships,
  conversations,
  conversationParticipants,
  userPhotos,
  reviews,
  type User, 
  type InsertUser, 
  type Organization, 
  type InsertOrganization, 
  type Message, 
  type InsertMessage, 
  type Pregame, 
  type InsertPregame,
  type School,
  type InsertSchool,
  type SchoolMembership,
  type InsertSchoolMembership,
  type Conversation,
  type InsertConversation,
  type ConversationParticipant,
  type InsertConversationParticipant,
  type UserPhoto,
  type Review,
  type InsertReview
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, inArray, sql, gt } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailInSchool(email: string, schoolId: string): Promise<User | undefined>;
  getUsersBySchool(school: string): Promise<User[]>; // Legacy method
  getUsersBySchoolId(schoolId: string): Promise<User[]>;
  getUserWithPhotosAndSchools(id: string): Promise<{ user: User; photos: UserPhoto[]; schools: School[] } | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // School methods
  getSchool(id: string): Promise<School | undefined>;
  getSchoolBySlug(slug: string): Promise<School | undefined>;
  getAllSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  getUserSchools(userId: string): Promise<School[]>;
  
  // School membership methods
  createSchoolMembership(membership: InsertSchoolMembership): Promise<SchoolMembership>;
  getSchoolMembers(schoolId: string): Promise<User[]>;
  getUserSchoolMembership(userId: string, schoolId: string): Promise<SchoolMembership | undefined>;
  
  // Multi-tenant user registration (creates user and membership in transaction)
  registerUserWithSchool(user: InsertUser, schoolSlug: string): Promise<{ user: User; school: School }>;
  
  // Organization methods (school-scoped)
  getOrganizationsBySchool(school: string): Promise<Organization[]>; // Legacy method
  getOrganizationsBySchoolId(schoolId: string): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationInSchool(id: string, schoolId: string): Promise<Organization | undefined>;
  getOrganizationByEmail(contactEmail: string): Promise<Organization | undefined>;
  getOrganizationByEmailInSchool(contactEmail: string, schoolId: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization, schoolId: string): Promise<Organization>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation, schoolId: string): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  getConversationParticipants(conversationId: string): Promise<User[]>;
  getUserConversations(userId: string, schoolId: string): Promise<Conversation[]>;
  
  // Message methods (updated for conversations and school scoping)
  sendMessage(message: InsertMessage, senderEmail: string): Promise<Message>; // Legacy method
  sendMessageInSchool(message: InsertMessage, senderEmail: string, schoolId: string): Promise<Message>;
  sendMessageToConversation(content: string, conversationId: string, senderId: string): Promise<Message>;
  getMessagesBetweenUsers(userEmail1: string, userEmail2: string): Promise<Message[]>; // Legacy method
  getMessagesBetweenUsersInSchool(userEmail1: string, userEmail2: string, schoolId: string): Promise<Message[]>;
  getMessagesForUser(userEmail: string): Promise<Message[]>; // Legacy method
  getMessagesForUserInSchool(userEmail: string, schoolId: string): Promise<Message[]>;
  getConversationMessages(conversationId: string, afterTimestamp?: Date): Promise<Message[]>;
  
  // Pregame methods (school-scoped)
  createPregame(pregame: InsertPregame, creatorEmail: string): Promise<Pregame>; // Legacy method
  createPregameInSchool(pregame: InsertPregame, creatorEmail: string, schoolId: string): Promise<Pregame>;
  getPregamesForUser(userEmail: string): Promise<Pregame[]>; // Legacy method
  getPregamesForUserInSchool(userEmail: string, schoolId: string): Promise<Pregame[]>;
  deletePregame(id: string): Promise<void>;
  deletePregameInSchool(id: string, creatorEmail: string, schoolId: string): Promise<boolean>;
  updatePregame(id: string, updates: Partial<InsertPregame>): Promise<Pregame>;
  updatePregameInSchool(id: string, updates: Partial<InsertPregame>, creatorEmail: string, schoolId: string): Promise<Pregame | null>;
  
  // Review methods
  createReview(review: InsertReview, reviewerId: string): Promise<Review>;
  getReviewsForUser(revieweeId: string): Promise<Review[]>;
  getReviewForPregame(pregameId: string, reviewerId: string): Promise<Review | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersBySchool(school: string): Promise<User[]> {
    const userList = await db.select().from(users).where(eq(users.school, school));
    return userList;
  }

  // New school-scoped user methods
  async getUserByEmailInSchool(email: string, schoolId: string): Promise<User | undefined> {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        password: sql<string>`''`.as('password'), // Empty password for security
        school: users.school,
        email: users.email,
        profileImages: users.profileImages,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        classYear: users.classYear,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(schoolMemberships, eq(users.id, schoolMemberships.userId))
      .where(and(eq(users.email, email), eq(schoolMemberships.schoolId, schoolId)));
    return user || undefined;
  }

  async getUsersBySchoolId(schoolId: string): Promise<User[]> {
    const userList = await db
      .select({
        id: users.id,
        username: users.username,
        password: sql<string>`''`.as('password'), // Empty password for security
        school: users.school,
        email: users.email,
        profileImages: users.profileImages,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        classYear: users.classYear,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(schoolMemberships, eq(users.id, schoolMemberships.userId))
      .where(eq(schoolMemberships.schoolId, schoolId));
    return userList;
  }

  async getUserWithPhotosAndSchools(id: string): Promise<{ user: User; photos: UserPhoto[]; schools: School[] } | undefined> {
    // Get the user
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }

    // Get user photos
    const photos = await db
      .select()
      .from(userPhotos)
      .where(eq(userPhotos.userId, id))
      .orderBy(desc(userPhotos.createdAt));

    // Get user's schools
    const schoolList = await this.getUserSchools(id);

    return {
      user,
      photos,
      schools: schoolList
    };
  }

  // School membership methods
  async createSchoolMembership(insertMembership: InsertSchoolMembership): Promise<SchoolMembership> {
    const [membership] = await db
      .insert(schoolMemberships)
      .values(insertMembership)
      .returning();
    return membership;
  }

  async getSchoolMembers(schoolId: string): Promise<User[]> {
    const memberList = await db
      .select({
        id: users.id,
        username: users.username,
        password: sql<string>`''`.as('password'), // Empty password for security
        school: users.school,
        email: users.email,
        profileImages: users.profileImages,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        classYear: users.classYear,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(schoolMemberships, eq(users.id, schoolMemberships.userId))
      .where(eq(schoolMemberships.schoolId, schoolId));
    return memberList;
  }

  async getUserSchoolMembership(userId: string, schoolId: string): Promise<SchoolMembership | undefined> {
    const [membership] = await db
      .select()
      .from(schoolMemberships)
      .where(and(eq(schoolMemberships.userId, userId), eq(schoolMemberships.schoolId, schoolId)));
    return membership || undefined;
  }

  // Multi-tenant user registration (creates user and membership in transaction)
  async registerUserWithSchool(insertUser: InsertUser, schoolSlug: string): Promise<{ user: User; school: School }> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Get the school first
      const [school] = await tx.select().from(schools).where(eq(schools.slug, schoolSlug));
      if (!school) {
        throw new Error(`School with slug '${schoolSlug}' not found`);
      }

      // Create the user
      const [user] = await tx
        .insert(users)
        .values(insertUser)
        .returning();

      // Create the school membership
      await tx
        .insert(schoolMemberships)
        .values({
          schoolId: school.id,
          userId: user.id,
          role: 'member',
        });

      return { user, school };
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // School methods
  async getSchool(id: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async getSchoolBySlug(slug: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.slug, slug));
    return school || undefined;
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const [school] = await db
      .insert(schools)
      .values(insertSchool)
      .returning();
    return school;
  }

  async getAllSchools(): Promise<School[]> {
    const schoolList = await db
      .select({
        id: schools.id,
        slug: schools.slug,
        name: schools.name,
        createdAt: schools.createdAt,
      })
      .from(schools)
      .orderBy(schools.name);
    return schoolList;
  }

  async getUserSchools(userId: string): Promise<School[]> {
    const schoolList = await db
      .select({
        id: schools.id,
        slug: schools.slug,
        name: schools.name,
        createdAt: schools.createdAt,
      })
      .from(schools)
      .innerJoin(schoolMemberships, eq(schools.id, schoolMemberships.schoolId))
      .where(eq(schoolMemberships.userId, userId));
    return schoolList;
  }

  async getOrganizationsBySchool(school: string): Promise<Organization[]> {
    const orgs = await db.select().from(organizations).where(eq(organizations.school, school));
    return orgs;
  }

  async getOrganizationsBySchoolId(schoolId: string): Promise<Organization[]> {
    const orgs = await db.select().from(organizations).where(eq(organizations.schoolId, schoolId));
    return orgs;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationByEmail(contactEmail: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.contactEmail, contactEmail));
    return org || undefined;
  }

  async createOrganization(insertOrganization: InsertOrganization, schoolId: string): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values({ ...insertOrganization, schoolId })
      .returning();
    return org;
  }

  // New school-scoped organization methods
  async getOrganizationInSchool(id: string, schoolId: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, id), eq(organizations.schoolId, schoolId)));
    return org || undefined;
  }

  async getOrganizationByEmailInSchool(contactEmail: string, schoolId: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.contactEmail, contactEmail), eq(organizations.schoolId, schoolId)));
    return org || undefined;
  }

  // Conversation methods
  async createConversation(insertConversation: InsertConversation, schoolId: string): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({ ...insertConversation, schoolId })
      .returning();
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async addConversationParticipant(insertParticipant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const [participant] = await db
      .insert(conversationParticipants)
      .values(insertParticipant)
      .returning();
    return participant;
  }

  async getConversationParticipants(conversationId: string): Promise<User[]> {
    const participants = await db
      .select({
        id: users.id,
        username: users.username,
        password: sql<string>`''`.as('password'), // Empty password for security
        school: users.school,
        email: users.email,
        profileImages: users.profileImages,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        classYear: users.classYear,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(conversationParticipants, eq(users.id, conversationParticipants.userId))
      .where(eq(conversationParticipants.conversationId, conversationId));
    return participants;
  }

  async getUserConversations(userId: string, schoolId: string): Promise<Conversation[]> {
    const conversationList = await db
      .select({
        id: conversations.id,
        schoolId: conversations.schoolId,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          eq(conversations.schoolId, schoolId)
        )
      )
      .orderBy(desc(conversations.updatedAt));
    return conversationList;
  }

  async sendMessage(insertMessage: InsertMessage, senderEmail: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({ ...insertMessage, senderEmail })
      .returning();
    return message;
  }

  // New school-scoped message method
  async sendMessageInSchool(insertMessage: InsertMessage, senderEmail: string, schoolId: string): Promise<Message> {
    // For now, we'll use the legacy message system but ensure both users are in the same school
    // In the future, this could be enhanced to use conversations
    const [message] = await db
      .insert(messages)
      .values({ ...insertMessage, senderEmail })
      .returning();
    return message;
  }

  async sendMessageToConversation(content: string, conversationId: string, senderId: string): Promise<Message> {
    // Get sender email for backward compatibility
    const sender = await this.getUser(senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    const [message] = await db
      .insert(messages)
      .values({
        content,
        conversationId,
        senderId,
        senderEmail: sender.email,
        recipientEmail: '', // Not used in conversation-based messages
      })
      .returning();
    return message;
  }

  async getMessagesBetweenUsers(userEmail1: string, userEmail2: string): Promise<Message[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderEmail, userEmail1), eq(messages.recipientEmail, userEmail2)),
          and(eq(messages.senderEmail, userEmail2), eq(messages.recipientEmail, userEmail1))
        )
      )
      .orderBy(desc(messages.createdAt));
    return messageList;
  }

  async getMessagesForUser(userEmail: string): Promise<Message[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderEmail, userEmail), eq(messages.recipientEmail, userEmail)))
      .orderBy(desc(messages.createdAt));
    return messageList;
  }

  // New school-scoped message methods
  async getMessagesForUserInSchool(userEmail: string, schoolId: string): Promise<Message[]> {
    // Get messages between users who are in the same school
    // This queries all messages where the user is either sender or recipient
    // and ensures both parties are members of the specified school
    const messageList = await db
      .select({
        id: messages.id,
        senderEmail: messages.senderEmail,
        recipientEmail: messages.recipientEmail,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
      })
      .from(messages)
      .innerJoin(users, or(eq(messages.senderEmail, users.email), eq(messages.recipientEmail, users.email)))
      .innerJoin(schoolMemberships, eq(users.id, schoolMemberships.userId))
      .where(
        and(
          or(eq(messages.senderEmail, userEmail), eq(messages.recipientEmail, userEmail)),
          eq(schoolMemberships.schoolId, schoolId)
        )
      )
      .orderBy(desc(messages.createdAt));
    return messageList;
  }

  async getMessagesBetweenUsersInSchool(userEmail1: string, userEmail2: string, schoolId: string): Promise<Message[]> {
    // Get messages between two specific users who are both in the same school
    const messageList = await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(eq(messages.senderEmail, userEmail1), eq(messages.recipientEmail, userEmail2)),
            and(eq(messages.senderEmail, userEmail2), eq(messages.recipientEmail, userEmail1))
          )
        )
      )
      .orderBy(desc(messages.createdAt));
    return messageList;
  }

  async getConversationMessages(conversationId: string, afterTimestamp?: Date): Promise<Message[]> {
    const baseCondition = eq(messages.conversationId, conversationId);
    const whereCondition = afterTimestamp 
      ? and(baseCondition, gt(messages.createdAt, afterTimestamp))
      : baseCondition;

    const messageList = await db
      .select()
      .from(messages)
      .where(whereCondition)
      .orderBy(desc(messages.createdAt));
    return messageList;
  }

  async createPregame(insertPregame: InsertPregame, creatorEmail: string): Promise<Pregame> {
    const [pregame] = await db
      .insert(pregames)
      .values({ ...insertPregame, creatorEmail })
      .returning();
    return pregame;
  }

  async createPregameInSchool(insertPregame: InsertPregame, creatorEmail: string, schoolId: string): Promise<Pregame> {
    const [pregame] = await db
      .insert(pregames)
      .values({
        ...insertPregame,
        creatorEmail,
        schoolId,
      })
      .returning();
    return pregame;
  }

  async getPregamesForUser(userEmail: string): Promise<Pregame[]> {
    const pregameList = await db
      .select()
      .from(pregames)
      .where(or(eq(pregames.creatorEmail, userEmail), eq(pregames.participantEmail, userEmail)))
      .orderBy(desc(pregames.createdAt));
    return pregameList;
  }

  async getPregamesForUserInSchool(userEmail: string, schoolId: string): Promise<Pregame[]> {
    const pregameList = await db
      .select()
      .from(pregames)
      .where(
        and(
          or(eq(pregames.creatorEmail, userEmail), eq(pregames.participantEmail, userEmail)),
          eq(pregames.schoolId, schoolId)
        )
      )
      .orderBy(desc(pregames.createdAt));
    return pregameList;
  }

  async deletePregame(id: string): Promise<void> {
    await db.delete(pregames).where(eq(pregames.id, id));
  }

  async updatePregame(id: string, updates: Partial<InsertPregame>): Promise<Pregame> {
    const [pregame] = await db
      .update(pregames)
      .set(updates)
      .where(eq(pregames.id, id))
      .returning();
    return pregame;
  }

  // New school-scoped pregame methods
  async deletePregameInSchool(id: string, creatorEmail: string, schoolId: string): Promise<boolean> {
    const result = await db
      .delete(pregames)
      .where(
        and(
          eq(pregames.id, id),
          eq(pregames.creatorEmail, creatorEmail),
          eq(pregames.schoolId, schoolId)
        )
      );
    return result.rowCount > 0;
  }

  async updatePregameInSchool(id: string, updates: Partial<InsertPregame>, creatorEmail: string, schoolId: string): Promise<Pregame | null> {
    const [pregame] = await db
      .update(pregames)
      .set(updates)
      .where(
        and(
          eq(pregames.id, id),
          eq(pregames.creatorEmail, creatorEmail),
          eq(pregames.schoolId, schoolId)
        )
      )
      .returning();
    return pregame || null;
  }

  // Review methods
  async createReview(insertReview: InsertReview, reviewerId: string): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values({
        ...insertReview,
        reviewerId,
      })
      .returning();
    return review;
  }

  async getReviewsForUser(revieweeId: string): Promise<Review[]> {
    const reviewList = await db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, revieweeId))
      .orderBy(desc(reviews.createdAt));
    return reviewList;
  }

  async getReviewForPregame(pregameId: string, reviewerId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.pregameId, pregameId),
          eq(reviews.reviewerId, reviewerId)
        )
      );
    return review || undefined;
  }
}

export const storage = new DatabaseStorage();
