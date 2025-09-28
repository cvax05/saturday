import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertMessageSchema, insertPregameSchema, registerSchema, loginSchema, type AuthResponse, type AuthUser } from "@shared/schema";
import { signJWT } from "./auth/jwt";
import { authenticateJWT, optionalAuth } from "./auth/middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, displayName, schoolSlug, profileImages } = registerSchema.parse(req.body);
      
      // Check if user already exists (by username or email)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Register user with school using transaction
      try {
        const { user, school } = await storage.registerUserWithSchool({
          username,
          email,
          password: hashedPassword,
          displayName: displayName || username,
          profileImages: profileImages || [],
          school: null, // Will be set after we get school info
        }, schoolSlug);
        
        // Update user with school name for backward compatibility
        user.school = school.name;
        
        console.log(`[AUTH] User registered successfully: ${user.username} (${user.email}) at ${school.name}`);
        
        // Create JWT token
        const token = signJWT({
          user_id: user.id,
          school_id: school.id,
          school_slug: school.slug,
          email: user.email,
          username: user.username,
        });

        // Set httpOnly cookie
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        // Return user and schools
        const userSchools = await storage.getUserSchools(user.id);
        const authResponse: AuthResponse = {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            profileImages: user.profileImages,
            school: user.school,
          },
          schools: userSchools.map(s => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
          })),
        };
        
        res.status(201).json(authResponse);
      } catch (error) {
        console.error("Registration error:", error);
        if (error instanceof Error && error.message.includes('not found')) {
          return res.status(400).json({ error: "Invalid school selection" });
        }
        throw error;
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, schoolSlug } = loginSchema.parse(req.body);
      
      // Find user by username or email (try username first, then email)
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username); // Try email if username fails
      }
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Get user's schools
      const userSchools = await storage.getUserSchools(user.id);
      
      if (userSchools.length === 0) {
        return res.status(403).json({ error: "User is not a member of any school" });
      }
      
      // If multiple schools and no specific school requested, return schools for selection
      if (userSchools.length > 1 && !schoolSlug) {
        const authResponse: AuthResponse = {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            profileImages: user.profileImages,
            school: user.school,
          },
          schools: userSchools.map(s => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
          })),
        };
        return res.status(200).json({ requiresSchoolSelection: true, ...authResponse });
      }
      
      // Determine which school to use
      let selectedSchool = userSchools[0]; // Default to first school
      if (schoolSlug) {
        const requestedSchool = userSchools.find(s => s.slug === schoolSlug);
        if (!requestedSchool) {
          return res.status(403).json({ error: "User is not a member of the requested school" });
        }
        selectedSchool = requestedSchool;
      }
      
      // Create JWT token
      const token = signJWT({
        user_id: user.id,
        school_id: selectedSchool.id,
        school_slug: selectedSchool.slug,
        email: user.email,
        username: user.username,
      });

      // Set httpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImages: user.profileImages,
          school: user.school,
        },
        schools: userSchools.map(s => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
        })),
      };
      
      res.status(200).json(authResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get fresh user data
      const user = await storage.getUser(req.user.user_id);
      if (!user) {
        res.clearCookie('auth_token');
        return res.status(401).json({ error: "User not found" });
      }

      // Get user's schools
      const userSchools = await storage.getUserSchools(user.id);
      
      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImages: user.profileImages,
          school: user.school,
        },
        schools: userSchools.map(s => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
        })),
      };
      
      res.status(200).json(authResponse);
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('auth_token');
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Legacy Registration endpoint (maintain backward compatibility)
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, school, profileImages } = registerSchema.parse(req.body);
      
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
        school: school || null,
        profileImages: profileImages || []
      });
      
      console.log(`[API] User registered successfully: ${user.username} (${user.email})`);
      
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
      
      // Find user by username or email (try username first, then email)
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username); // Try email if username fails
      }
      
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

  // User profile endpoint
  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const decodedEmail = decodeURIComponent(email);
      console.log(`[API] Looking up user by email. Original: ${email}, Decoded: ${decodedEmail}`);
      
      const user = await storage.getUserByEmail(decodedEmail);
      if (!user) {
        console.log(`[API] User not found for email: ${decodedEmail}`);
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`[API] Found user: ${user.username} (${user.email})`);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get users by school
  app.get("/api/users/school/:school", async (req, res) => {
    try {
      const { school } = req.params;
      const users = await storage.getUsersBySchool(school);
      // Return users without passwords
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.status(200).json({ users: usersWithoutPasswords });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Organization profile endpoint
  app.get("/api/organizations/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const organization = await storage.getOrganizationByEmail(email);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.status(200).json({ organization });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
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

      // Create or find default schools for sample organizations
      const schoolMap = new Map();
      
      // Get unique schools from sample organizations
      const uniqueSchools = Array.from(new Set(sampleOrgs.map(org => org.school)));
      
      for (const schoolName of uniqueSchools) {
        const slug = schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        let school = await storage.getSchoolBySlug(slug);
        
        if (!school) {
          school = await storage.createSchool({
            slug,
            name: schoolName,
          });
        }
        
        schoolMap.set(schoolName, school.id);
      }

      const createdOrgs = [];
      for (const org of sampleOrgs) {
        const schoolId = schoolMap.get(org.school);
        const created = await storage.createOrganization(org, schoolId);
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
        recipientEmail,
        content,
        isRead: 0
      }, senderEmail);
      
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

  // Pregame endpoints
  app.post("/api/pregames", async (req, res) => {
    try {
      const { participantEmail, date, time, location, notes } = insertPregameSchema.parse(req.body);
      
      // TODO: In a real app, get creatorEmail from authenticated session/JWT
      // For MVP, we'll accept it from request body as a temporary stub
      const { creatorEmail } = req.body;
      
      if (!creatorEmail) {
        return res.status(400).json({ message: "Creator email is required" });
      }
      
      // Validate that creator and participant exist in users table
      const creator = await storage.getUserByEmail(creatorEmail);
      if (!creator) {
        return res.status(401).json({ message: "Creator not authenticated" });
      }
      
      const participant = await storage.getUserByEmail(participantEmail);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      const pregame = await storage.createPregame({
        participantEmail,
        date,
        time,
        location,
        notes
      }, creatorEmail);
      
      res.status(201).json({ message: "Pregame scheduled", data: pregame });
    } catch (error) {
      console.error("Error creating pregame:", error);
      res.status(400).json({ message: "Failed to create pregame" });
    }
  });

  app.get("/api/pregames/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      // Validate that the user exists
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // TODO: In a real app, verify that the requesting user is authenticated 
      // and is authorized to access these pregames
      
      const pregames = await storage.getPregamesForUser(userEmail);
      res.json({ pregames });
    } catch (error) {
      console.error("Error fetching pregames:", error);
      res.status(500).json({ message: "Failed to fetch pregames" });
    }
  });

  app.delete("/api/pregames/:pregameId", async (req, res) => {
    try {
      const { pregameId } = req.params;
      
      // TODO: In a real app, verify that the requesting user is authenticated 
      // and is authorized to delete this pregame (creator only)
      
      await storage.deletePregame(pregameId);
      res.status(200).json({ message: "Pregame deleted" });
    } catch (error) {
      console.error("Error deleting pregame:", error);
      res.status(500).json({ message: "Failed to delete pregame" });
    }
  });

  app.put("/api/pregames/:pregameId", async (req, res) => {
    try {
      const { pregameId } = req.params;
      const updates = insertPregameSchema.partial().parse(req.body);
      
      // TODO: In a real app, verify that the requesting user is authenticated 
      // and is authorized to update this pregame (creator only)
      
      const pregame = await storage.updatePregame(pregameId, updates);
      res.status(200).json({ message: "Pregame updated", data: pregame });
    } catch (error) {
      console.error("Error updating pregame:", error);
      res.status(500).json({ message: "Failed to update pregame" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
