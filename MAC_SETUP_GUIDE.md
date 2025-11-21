# 🍎 Saturday Platform - Mac Setup Guide

Complete guide for running the Saturday social networking platform locally on macOS.

---

## 📋 Prerequisites

### Required Software

1. **Node.js v20+** and **npm v6+**
   ```bash
   # Check if installed
   node --version  # Should be v20.0.0 or higher
   npm --version   # Should be v6.0.0 or higher

   # If not installed, download from:
   # https://nodejs.org/ (LTS version recommended)
   # Or install via Homebrew:
   brew install node
   ```

2. **Git**
   ```bash
   # Check if installed
   git --version

   # If not installed:
   brew install git
   ```

3. **Supabase Account** (Free tier available)
   - Sign up at https://supabase.com
   - The Saturday project already has a Supabase database configured
   - You'll need the connection strings from the project owner

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/cvax05/saturday.git
cd saturday

# Verify you're on the main branch
git branch
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (~500 packages, takes 1-2 minutes).

### Step 3: Configure Environment Variables

**Option A: Get .env from Team Member**
The easiest way is to get the `.env` file from a team member who already has it set up.

**Option B: Create .env Manually**

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
nano .env  # or use any text editor
```

Add the following (get actual values from your team):

```env
# Database (REQUIRED) - Get from Supabase project
DATABASE_URL="postgresql://postgres.hhclnknlynyaboaasqfl:YOUR_PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

# Authentication (REQUIRED) - Generate a secure random string
SESSION_SECRET="your-64-character-random-string"
JWT_SECRET="your-64-character-random-string"

# Application
NODE_ENV="development"
PORT=3000

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

**Generate Secure Secrets (Mac/Linux):**
```bash
# Generate SESSION_SECRET and JWT_SECRET
openssl rand -base64 64
```

### Step 4: Start the Development Server

```bash
npm run dev
```

You should see:
```
serving on 0.0.0.0:3000
```

**Access the app at:** http://localhost:3000

---

## 🎯 Testing the Installation

### Test Credentials

The database comes pre-seeded with test users:

| Username | Password | Email | School |
|----------|----------|-------|--------|
| alice | pass | alice@test.com | test-school |
| bob | pass | bob@test.com | test-school |

### Create Your Own Account

1. Go to http://localhost:3000
2. Click "Sign Up" or "Get Started"
3. Complete the 5-step registration process
4. Start exploring the platform!

---

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes to database

# Type Checking
npm run check        # Run TypeScript type checking

# Seeding (if needed)
npx tsx scripts/seedTwoUsers.ts  # Create test users
```

---

## 📊 Database Management

### Viewing Your Supabase Database

1. Go to https://supabase.com
2. Sign in to your account
3. Select the "Saturday" project
4. Click "Table Editor" in the left sidebar
5. You'll see all tables: users, schools, conversations, messages, etc.

### If You Need to Reset/Seed Data

```bash
# Seed test users and school
npx tsx scripts/seedTwoUsers.ts
```

This creates:
- Test University (test-school)
- Alice (alice@test.com / pass)
- Bob (bob@test.com / pass)

---

## 🔧 Troubleshooting

### Port 3000 Already in Use

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
# Edit .env and change PORT=3000 to PORT=3001
```

### Database Connection Errors

**Error:** "DATABASE_URL must be set"

**Solution:**
1. Verify `.env` file exists in project root
2. Check DATABASE_URL is set correctly
3. Ensure no extra quotes or spaces

**Error:** "Connection timeout" or "ENOTFOUND"

**Solution:**
1. Check your internet connection
2. Verify Supabase project is active
3. Confirm the connection string is correct
4. Try the direct connection (port 5432) instead of pooler (port 6543)

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Run type checking
npm run check

# Usually fixed by ensuring all dependencies are installed
npm install
```

---

## 🌐 Cross-Platform Notes

The codebase is fully compatible with both Mac and Windows:

- **Host binding**: Automatically uses `0.0.0.0` on Mac (allows network access)
- **Host binding**: Automatically uses `127.0.0.1` on Windows (localhost only)
- **Line endings**: Git handles CRLF/LF conversion automatically
- **File paths**: All paths use Node.js path module (cross-platform)
- **Environment variables**: Handled by dotenv (works on both platforms)

---

## 📦 Project Structure

```
saturday/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── lib/           # Utilities
│   │   └── hooks/         # Custom hooks
│   └── index.html
├── server/                # Express backend
│   ├── index.ts          # Server entry
│   ├── routes.ts         # API routes
│   ├── db.ts            # Database connection
│   └── auth/            # Authentication
├── shared/              # Shared code
│   └── schema.ts        # Database schema
├── scripts/             # Utility scripts
├── .env                 # Environment vars (not in git)
├── .env.example         # Environment template
└── package.json         # Dependencies
```

---

## 🎨 Features to Test

Once running, try these features:

1. **Authentication**
   - Register new account
   - Login/logout
   - Password validation

2. **Profile Setup**
   - Complete 5-step onboarding
   - Upload profile images
   - Set preferences

3. **Social Features**
   - Browse groups
   - Send messages
   - View other profiles

4. **Events**
   - Schedule pregames
   - Set availability
   - View calendar

5. **UI/UX**
   - Dark/light theme toggle
   - Responsive design
   - Smooth animations

---

## 🚀 Deploying to Production

When ready to deploy:

```bash
# 1. Build the app
npm run build

# 2. Update .env for production
NODE_ENV="production"
DATABASE_URL="your-production-db-url"

# 3. Start production server
npm run start
```

**Recommended Hosting Platforms:**
- **Render.com** (easy, free tier available)
- **Vercel** (great for Next.js-style apps)
- **Railway** (simple deployment)
- **DigitalOcean App Platform**

---

## 📞 Getting Help

If you encounter issues:

1. **Check the logs** in your terminal for error messages
2. **Verify environment variables** in `.env`
3. **Ensure Node.js version** is 20+
4. **Check Supabase dashboard** for database status
5. **Contact your team** for database credentials if needed

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Node.js v20+ installed
- [ ] Repository cloned successfully
- [ ] Dependencies installed (npm install)
- [ ] .env file created with all required variables
- [ ] Database connection works
- [ ] Dev server starts without errors
- [ ] Homepage loads at http://localhost:3000
- [ ] Can login with test credentials (alice/pass)
- [ ] Can register a new account
- [ ] All features load properly (no console errors)

---

## 🎉 You're All Set!

Your Saturday platform should now be running locally on your Mac. Enjoy developing!

For questions or issues, reach out to your team or check the GitHub repository for updates.

**Happy coding! 🚀**
