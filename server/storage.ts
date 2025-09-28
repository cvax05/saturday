import { 
  users, 
  organizations, 
  messages, 
  pregames, 
  schools,
  schoolMemberships,
  conversations,
  conversationParticipants,
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
  type InsertConversationParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, inArray } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersBySchool(school: string): Promise<User[]>; // Legacy method
  createUser(user: InsertUser): Promise<User>;
  
  // School methods
  getSchool(id: string): Promise<School | undefined>;
  getSchoolBySlug(slug: string): Promise<School | undefined>;
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
  getOrganizationByEmail(contactEmail: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization, schoolId: string): Promise<Organization>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation, schoolId: string): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  getConversationParticipants(conversationId: string): Promise<User[]>;
  getUserConversations(userId: string, schoolId: string): Promise<Conversation[]>;
  
  // Message methods (updated for conversations and school scoping)
  sendMessage(message: InsertMessage, senderEmail: string): Promise<Message>; // Legacy method
  sendMessageToConversation(content: string, conversationId: string, senderId: string): Promise<Message>;
  getMessagesBetweenUsers(userEmail1: string, userEmail2: string): Promise<Message[]>; // Legacy method
  getMessagesForUser(userEmail: string): Promise<Message[]>; // Legacy method
  getConversationMessages(conversationId: string, afterTimestamp?: Date): Promise<Message[]>;
  
  // Pregame methods (school-scoped)
  createPregame(pregame: InsertPregame, creatorEmail: string): Promise<Pregame>; // Legacy method
  createPregameInSchool(pregame: InsertPregame, creatorId: string, schoolId: string): Promise<Pregame>;
  getPregamesForUser(userEmail: string): Promise<Pregame[]>; // Legacy method
  getPregamesForUserInSchool(userId: string, schoolId: string): Promise<Pregame[]>;
  deletePregame(id: string): Promise<void>;
  updatePregame(id: string, updates: Partial<InsertPregame>): Promise<Pregame>;
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
        password: users.password,
        school: users.school,
        email: users.email,
        profileImages: users.profileImages,
        displayName: users.displayName,
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
        password: users.password,
        school: users.school,
        email: users.email,
        profileImages: users.profileImages,
        displayName: users.displayName,
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

  async getConversationMessages(conversationId: string, afterTimestamp?: Date): Promise<Message[]> {
    let whereCondition = eq(messages.conversationId, conversationId);

    if (afterTimestamp) {
      whereCondition = and(eq(messages.conversationId, conversationId), eq(messages.createdAt, afterTimestamp));
    }

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

  async createPregameInSchool(insertPregame: InsertPregame, creatorId: string, schoolId: string): Promise<Pregame> {
    // Get creator email for backward compatibility
    const creator = await this.getUser(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    const [pregame] = await db
      .insert(pregames)
      .values({
        ...insertPregame,
        creatorEmail: creator.email,
        creatorId,
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

  async getPregamesForUserInSchool(userId: string, schoolId: string): Promise<Pregame[]> {
    const pregameList = await db
      .select()
      .from(pregames)
      .where(
        and(
          or(eq(pregames.creatorId, userId), eq(pregames.participantId, userId)),
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
}

export const storage = new DatabaseStorage();
