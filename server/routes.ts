import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertMessageSchema, registerSchema, loginSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, school } = registerSchema.parse(req.body);
      
      // Check if user already exists (by username or email)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user with hashed password
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        school: school || null
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Get organizations by school
  app.get("/api/organizations/school/:school", async (req, res) => {
    try {
      const { school } = req.params;
      const organizations = await storage.getOrganizationsBySchool(school);
      res.status(200).json({ organizations });
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Get organization details by ID
  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.status(200).json({ organization });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Add sample organizations for testing (development only)
  app.post("/api/organizations/seed", async (req, res) => {
    try {
      const sampleOrgs = [
        {
          name: "Alpha Phi Alpha",
          school: "University of California, Berkeley",
          description: "The first intercollegiate historically African American fraternity, focused on scholarship, fellowship, good character, and the uplift of humanity.",
          memberCount: 45,
          groupType: "Fraternity",
          establishedYear: 1906,
          contactEmail: "alpha@berkeley.edu",
          socialMedia: JSON.stringify({ instagram: "@alphaphiberkeley", twitter: "@aplhaberkeley" }),
          profileImage: "/api/placeholder/100/100?text=AΦA"
        },
        {
          name: "Delta Sigma Theta",
          school: "University of California, Berkeley", 
          description: "A sisterhood committed to academic excellence, political awareness, and community service.",
          memberCount: 38,
          groupType: "Sorority",
          establishedYear: 1913,
          contactEmail: "dst@berkeley.edu",
          socialMedia: JSON.stringify({ instagram: "@deltasigmathetaberkeley" }),
          profileImage: "/api/placeholder/100/100?text=ΔΣΘ"
        },
        {
          name: "Engineering Student Council",
          school: "University of California, Berkeley",
          description: "Student government representing all engineering students, organizing events and advocating for student interests.",
          memberCount: 125,
          groupType: "Student Government",
          establishedYear: 1965,
          contactEmail: "esc@berkeley.edu",
          socialMedia: JSON.stringify({ website: "engineering.berkeley.edu/esc" }),
          profileImage: "/api/placeholder/100/100?text=ESC"
        },
        {
          name: "Kappa Alpha Psi",
          school: "Stanford University",
          description: "A fraternity built on the four cardinal principles: training for leadership, promoting scholarship, encouraging good character, and fostering fellowship.",
          memberCount: 28,
          groupType: "Fraternity", 
          establishedYear: 1911,
          contactEmail: "kappa@stanford.edu",
          socialMedia: JSON.stringify({ instagram: "@kappaalphasistanford" }),
          profileImage: "/api/placeholder/100/100?text=ΚΑΨ"
        },
        {
          name: "Zeta Phi Beta",
          school: "Stanford University",
          description: "A sorority founded on the principles of scholarship, service, sisterhood, and finer womanhood.",
          memberCount: 22,
          groupType: "Sorority",
          establishedYear: 1920,
          contactEmail: "zpb@stanford.edu", 
          socialMedia: JSON.stringify({ instagram: "@zetaphibetastanford" }),
          profileImage: "/api/placeholder/100/100?text=ΖΦΒ"
        }
      ];

      const createdOrgs = [];
      for (const org of sampleOrgs) {
        const created = await storage.createOrganization(org);
        createdOrgs.push(created);
      }

      res.status(201).json({ message: "Sample organizations created", organizations: createdOrgs });
    } catch (error) {
      console.error("Error seeding organizations:", error);
      res.status(500).json({ message: "Failed to seed organizations" });
    }
  });

  // Message endpoints
  app.post("/api/messages/send", async (req, res) => {
    try {
      const { recipientEmail, content } = insertMessageSchema.parse(req.body);
      
      // TODO: In a real app, get senderEmail from authenticated session/JWT
      // For MVP, we'll accept it from request body as a temporary stub
      // but validate it exists in the database to prevent spoofing non-existent users
      const { senderEmail } = req.body;
      
      if (!senderEmail) {
        return res.status(400).json({ message: "Sender email is required" });
      }
      
      // Validate that sender and recipient exist in users table
      const sender = await storage.getUserByEmail(senderEmail);
      if (!sender) {
        return res.status(401).json({ message: "Sender not authenticated" });
      }
      
      const recipient = await storage.getUserByEmail(recipientEmail);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      const message = await storage.sendMessage({
        senderEmail,
        recipientEmail,
        content,
        isRead: 0
      });
      
      res.status(201).json({ message: "Message sent", data: message });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      // Validate that the user exists
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // TODO: In a real app, verify that the requesting user is authenticated 
      // and is authorized to access these messages (either the user themselves or admin)
      
      const messages = await storage.getMessagesForUser(userEmail);
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/conversation/:userEmail1/:userEmail2", async (req, res) => {
    try {
      const { userEmail1, userEmail2 } = req.params;
      
      // Validate that both users exist
      const user1 = await storage.getUserByEmail(userEmail1);
      const user2 = await storage.getUserByEmail(userEmail2);
      
      if (!user1 || !user2) {
        return res.status(404).json({ message: "One or both users not found" });
      }
      
      // TODO: In a real app, verify that the requesting user is authenticated 
      // and is one of the participants in this conversation
      
      const messages = await storage.getMessagesBetweenUsers(userEmail1, userEmail2);
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
