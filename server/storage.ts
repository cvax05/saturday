import { users, organizations, messages, type User, type InsertUser, type Organization, type InsertOrganization, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getOrganizationsBySchool(school: string): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  sendMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userEmail1: string, userEmail2: string): Promise<Message[]>;
  getMessagesForUser(userEmail: string): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getOrganizationsBySchool(school: string): Promise<Organization[]> {
    const orgs = await db.select().from(organizations).where(eq(organizations.school, school));
    return orgs;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(insertOrganization)
      .returning();
    return org;
  }

  async sendMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
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
}

export const storage = new DatabaseStorage();
