import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertMessageSchema, insertPregameSchema, insertReviewSchema, registerSchema, loginSchema, updateProfileSchema, type AuthResponse, type AuthUser } from "@shared/schema";
import { signJWT } from "./auth/jwt";
import { authenticateJWT, optionalAuth } from "./auth/middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Schools endpoint - public for registration
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getAllSchools();
      res.json({ schools });
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  // JWT Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { 
        username, 
        email, 
        password, 
        displayName, 
        schoolSlug, 
        profileImage,
        galleryImages,
        bio,
        groupSizeMin,
        groupSizeMax,
        preferredAlcohol,
        availability
      } = registerSchema.parse(req.body);
      
      // Combine profileImage and galleryImages into profileImages array for database storage
      const profileImages: string[] = [];
      if (profileImage) {
        profileImages.push(profileImage);
      }
      if (galleryImages && Array.isArray(galleryImages)) {
        profileImages.push(...galleryImages);
      }
      
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
          displayName: displayName || null,
          profileImages: profileImages,
          bio: bio || null,
          groupSizeMin: groupSizeMin || null,
          groupSizeMax: groupSizeMax || null,
          preferredAlcohol: preferredAlcohol || null,
          availability: availability || null,
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
          sameSite: 'lax', // Changed from 'strict' to 'lax' to work with navigation
          path: '/', // Explicitly set path to root
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        // Return user and schools with separated photo structure
        const userSchools = await storage.getUserSchools(user.id);
        const userProfileImages = user.profileImages || [];
        const authResponse: AuthResponse = {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            profileImage: userProfileImages[0] || null,
            galleryImages: userProfileImages.slice(1),
            profileImages: user.profileImages, // Keep for backward compatibility
            school: user.school,
            bio: user.bio,
            groupSizeMin: user.groupSizeMin,
            groupSizeMax: user.groupSizeMax,
            preferredAlcohol: user.preferredAlcohol,
            availability: user.availability,
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
        const userProfileImages = user.profileImages || [];
        const authResponse: AuthResponse = {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            profileImage: userProfileImages[0] || null,
            galleryImages: userProfileImages.slice(1),
            profileImages: user.profileImages, // Keep for backward compatibility
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
        sameSite: 'lax', // Changed from 'strict' to 'lax' to work with navigation
        path: '/', // Explicitly set path to root
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      // Separate profile image and gallery images
      const userProfileImages = user.profileImages || [];
      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImage: userProfileImages[0] || null,
          galleryImages: userProfileImages.slice(1),
          profileImages: user.profileImages, // Keep for backward compatibility
          school: user.school,
          bio: user.bio,
          groupSizeMin: user.groupSizeMin,
          groupSizeMax: user.groupSizeMax,
          preferredAlcohol: user.preferredAlcohol,
          availability: user.availability,
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
      
      // Separate profile image and gallery images
      const userProfileImages = user.profileImages || [];
      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImage: userProfileImages[0] || null,
          galleryImages: userProfileImages.slice(1),
          profileImages: user.profileImages, // Keep for backward compatibility
          school: user.school,
          bio: user.bio,
          groupSizeMin: user.groupSizeMin,
          groupSizeMax: user.groupSizeMax,
          preferredAlcohol: user.preferredAlcohol,
          availability: user.availability,
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

  // Update user profile - JWT protected
  app.patch("/api/users/profile", authenticateJWT, async (req, res) => {
    try {
      const profileData = updateProfileSchema.parse(req.body);
      const userId = req.user!.user_id;
      const schoolId = req.user!.school_id;
      
      // Verify user belongs to the school (security check)
      const membership = await storage.getUserSchoolMembership(userId, schoolId);
      if (!membership) {
        return res.status(403).json({ error: "Unauthorized: User not in this school" });
      }
      
      // Combine profileImage and galleryImages into profileImages array for database storage
      let profileImages: string[] | undefined = undefined;
      if (profileData.profileImage !== undefined || profileData.galleryImages !== undefined) {
        profileImages = [];
        if (profileData.profileImage) {
          profileImages.push(profileData.profileImage);
        }
        if (profileData.galleryImages && Array.isArray(profileData.galleryImages)) {
          profileImages.push(...profileData.galleryImages);
        }
      }
      
      // Only update allowed fields (restrict to profile-editable fields only)
      const updatedUser = await storage.updateUserProfile(userId, {
        displayName: profileData.displayName,
        bio: profileData.bio,
        groupSizeMin: profileData.groupSizeMin,
        groupSizeMax: profileData.groupSizeMax,
        preferredAlcohol: profileData.preferredAlcohol,
        availability: profileData.availability,
        profileImages: profileImages,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Split profileImages back into profileImage and galleryImages for response
      const userProfileImages = updatedUser.profileImages || [];
      
      // Return updated user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.status(200).json({
        user: {
          ...userWithoutPassword,
          profileImage: userProfileImages[0] || null,
          galleryImages: userProfileImages.slice(1),
        }
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Legacy endpoints removed for security - all authentication now goes through JWT-based /api/auth/* endpoints

  // User profile endpoint - JWT protected, school-scoped
  app.get("/api/users/email/:email", authenticateJWT, async (req, res) => {
    try {
      const { email } = req.params;
      const decodedEmail = decodeURIComponent(email);
      console.log(`[API] Looking up user by email. Original: ${email}, Decoded: ${decodedEmail}`);
      
      // Get user and verify they're in the same school
      const user = await storage.getUserByEmailInSchool(decodedEmail, req.user!.school_id);
      if (!user) {
        console.log(`[API] User not found for email: ${decodedEmail} in school: ${req.user!.school_slug}`);
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

  // Get users in current school - JWT protected, auto school-scoped
  app.get("/api/users/school", authenticateJWT, async (req, res) => {
    try {
      const users = await storage.getUsersBySchoolId(req.user!.school_id);
      // Return users without passwords
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.status(200).json({ users: usersWithoutPasswords });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get individual user profile by ID with photos and schools - JWT protected, school-scoped
  app.get("/api/users/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params;
      
      // SECURITY: Verify the requested user is in the same school as the requester
      const membership = await storage.getUserSchoolMembership(id, req.user!.school_id);
      if (!membership) {
        return res.status(403).json({ message: "Access denied - user not in your school" });
      }
      
      const userProfile = await storage.getUserWithPhotosAndSchools(id);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password and filter schools to current school only
      const { password: _, ...userWithoutPassword } = userProfile.user;
      const currentSchool = userProfile.schools.find(s => s.id === req.user!.school_id);
      
      res.status(200).json({
        user: userWithoutPassword,
        photos: userProfile.photos,
        schools: currentSchool ? [currentSchool] : []
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Organization profile endpoint - JWT protected, school-scoped
  app.get("/api/organizations/email/:email", authenticateJWT, async (req, res) => {
    try {
      const { email } = req.params;
      const organization = await storage.getOrganizationByEmailInSchool(email, req.user!.school_id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.status(200).json({ organization });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Get organizations in current school - JWT protected, auto school-scoped
  app.get("/api/organizations/school", authenticateJWT, async (req, res) => {
    try {
      const organizations = await storage.getOrganizationsBySchoolId(req.user!.school_id);
      res.status(200).json({ organizations });
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Get organization details by ID - JWT protected, school-scoped
  app.get("/api/organizations/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params;
      const organization = await storage.getOrganizationInSchool(id, req.user!.school_id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.status(200).json({ organization });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Seeding endpoint removed for security - use proper admin tools for data seeding

  // Message endpoints - JWT protected, school-scoped
  app.post("/api/messages/send", authenticateJWT, async (req, res) => {
    try {
      const { recipientEmail, content } = insertMessageSchema.parse(req.body);
      
      // Get sender email from JWT token
      const senderEmail = req.user!.email;
      
      // Validate that recipient exists in the same school
      const recipient = await storage.getUserByEmailInSchool(recipientEmail, req.user!.school_id);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found in your school" });
      }
      
      const message = await storage.sendMessageInSchool({
        recipientEmail,
        content,
        isRead: 0
      }, senderEmail, req.user!.school_id);
      
      res.status(201).json({ message: "Message sent", data: message });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/:userEmail", authenticateJWT, async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      // Only allow users to access their own messages
      if (userEmail !== req.user!.email) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get messages for user in their school
      const messages = await storage.getMessagesForUserInSchool(userEmail, req.user!.school_id);
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/conversation/:userEmail1/:userEmail2", authenticateJWT, async (req, res) => {
    try {
      const { userEmail1, userEmail2 } = req.params;
      
      // Verify that the requesting user is one of the participants
      if (userEmail1 !== req.user!.email && userEmail2 !== req.user!.email) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate that both users exist in the same school
      const user1 = await storage.getUserByEmailInSchool(userEmail1, req.user!.school_id);
      const user2 = await storage.getUserByEmailInSchool(userEmail2, req.user!.school_id);
      
      if (!user1 || !user2) {
        return res.status(404).json({ message: "One or both users not found in your school" });
      }
      
      const messages = await storage.getMessagesBetweenUsersInSchool(userEmail1, userEmail2, req.user!.school_id);
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Pregame endpoints - JWT protected, school-scoped
  app.post("/api/pregames", authenticateJWT, async (req, res) => {
    try {
      const { participantEmail, date, time, location, notes } = insertPregameSchema.parse(req.body);
      
      // Get creator email from JWT token
      const creatorEmail = req.user!.email;
      
      // Validate that participant exists in the same school
      const participant = await storage.getUserByEmailInSchool(participantEmail, req.user!.school_id);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found in your school" });
      }
      
      const pregame = await storage.createPregameInSchool({
        participantEmail,
        date,
        time,
        location,
        notes
      }, creatorEmail, req.user!.school_id);
      
      res.status(201).json({ message: "Pregame scheduled", data: pregame });
    } catch (error) {
      console.error("Error creating pregame:", error);
      res.status(400).json({ message: "Failed to create pregame" });
    }
  });

  app.get("/api/pregames/:userEmail", authenticateJWT, async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      // Only allow users to access their own pregames
      if (userEmail !== req.user!.email) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get pregames for user in their school
      const pregames = await storage.getPregamesForUserInSchool(userEmail, req.user!.school_id);
      res.json({ pregames });
    } catch (error) {
      console.error("Error fetching pregames:", error);
      res.status(500).json({ message: "Failed to fetch pregames" });
    }
  });

  app.delete("/api/pregames/:pregameId", authenticateJWT, async (req, res) => {
    try {
      const { pregameId } = req.params;
      
      // Verify that the requesting user is the creator and the pregame is in their school
      const success = await storage.deletePregameInSchool(pregameId, req.user!.email, req.user!.school_id);
      if (!success) {
        return res.status(404).json({ message: "Pregame not found or access denied" });
      }
      
      res.status(200).json({ message: "Pregame deleted" });
    } catch (error) {
      console.error("Error deleting pregame:", error);
      res.status(500).json({ message: "Failed to delete pregame" });
    }
  });

  app.put("/api/pregames/:pregameId", authenticateJWT, async (req, res) => {
    try {
      const { pregameId } = req.params;
      const updates = insertPregameSchema.partial().parse(req.body);
      
      // Update pregame only if user is the creator and it's in their school
      const pregame = await storage.updatePregameInSchool(pregameId, updates, req.user!.email, req.user!.school_id);
      if (!pregame) {
        return res.status(404).json({ message: "Pregame not found or access denied" });
      }
      
      res.status(200).json({ message: "Pregame updated", data: pregame });
    } catch (error) {
      console.error("Error updating pregame:", error);
      res.status(500).json({ message: "Failed to update pregame" });
    }
  });

  // Review routes
  app.post("/api/reviews", authenticateJWT, async (req, res) => {
    try {
      const { pregameId, revieweeId, rating, message } = insertReviewSchema.parse(req.body);
      const reviewerId = req.user!.user_id;
      
      // Validate that the pregame exists and the user is a participant
      const pregames = await storage.getPregamesForUserInSchool(req.user!.email, req.user!.school_id);
      const pregame = pregames.find(p => p.id === pregameId);
      
      if (!pregame) {
        return res.status(404).json({ message: "Pregame not found or access denied" });
      }
      
      // Validate that reviewee is the other participant (not the reviewer)
      const isCreator = pregame.creatorEmail === req.user!.email;
      const otherUserId = isCreator ? pregame.participantId : pregame.creatorId;
      
      if (revieweeId !== otherUserId) {
        return res.status(400).json({ message: "You can only review the person you pregamed with" });
      }
      
      // Check if review already exists for this pregame by this reviewer
      const existingReview = await storage.getReviewForPregame(pregameId, reviewerId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this pregame" });
      }
      
      const review = await storage.createReview({
        pregameId,
        revieweeId,
        rating,
        message,
      }, reviewerId);
      
      res.status(201).json({ message: "Review submitted", data: review });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to submit review" });
    }
  });

  app.get("/api/reviews/user/:userId", authenticateJWT, async (req, res) => {
    try {
      const { userId } = req.params;
      // Pass schoolId from JWT to ensure school scoping
      const reviews = await storage.getReviewsForUser(userId, req.user!.school_id);
      res.json({ reviews });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/my-reviews", authenticateJWT, async (req, res) => {
    try {
      const reviewerId = req.user!.user_id;
      // Pass schoolId from JWT to ensure school scoping
      const reviews = await storage.getReviewsByReviewer(reviewerId, req.user!.school_id);
      res.json({ reviews });
    } catch (error) {
      console.error("Error fetching my reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
