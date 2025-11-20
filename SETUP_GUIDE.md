# Saturday - Quick Setup Guide (Mac/Linux)

This guide will help you get Saturday running on Mac or Linux in under 10 minutes.

---

## Prerequisites

Before you begin, ensure you have:
- **Node.js v20+** installed ([download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** installed
- A **Neon PostgreSQL database** (free tier: https://neon.tech)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/cvax05/saturday.git
cd saturday
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React, Express, TypeScript
- Security packages (helmet, rate-limit, cors)
- Database tools (Drizzle ORM, Neon client)
- All UI components (shadcn/ui, Tailwind)

---

## Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:

```env
# REQUIRED - Get from https://neon.tech
DATABASE_URL="postgresql://user:password@your-host.neon.tech/dbname?sslmode=require"

# REQUIRED - Generate a random secret
JWT_SECRET="your-super-secret-random-string-here-make-it-long"

# OPTIONAL - For production
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:5000"
```

### How to Get DATABASE_URL:
1. Go to https://neon.tech and sign up (free)
2. Create a new project
3. Copy the connection string from your project dashboard
4. Paste it into your `.env` file

### How to Generate JWT_SECRET:
```bash
# On Mac/Linux:
openssl rand -base64 64

# Copy the output and paste it as JWT_SECRET
```

---

## Step 4: Initialize the Database

Push the database schema to your Neon database:

```bash
npm run db:push
```

This will create all necessary tables:
- users, schools, conversations, messages
- pregames, reviews, user_availability
- And all relationships

---

## Step 5: Start the Development Server

```bash
npm run dev
```

You should see:
```
serving on port 5000
```

---

## Step 6: Open the App

Open your browser and navigate to:
```
http://localhost:5000
```

You should see the Saturday landing page!

---

## Common Issues & Solutions

### Issue: "DATABASE_URL must be set"
**Solution**: Make sure your `.env` file exists in the project root with a valid DATABASE_URL

### Issue: "Cannot connect to database"
**Solution**:
1. Check your Neon database is running
2. Verify the connection string is correct
3. Ensure your IP is allowed (Neon allows all IPs by default)

### Issue: "Port 5000 already in use"
**Solution**:
```bash
# Find and kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change the port in .env
PORT=3000
```

### Issue: npm install fails
**Solution**:
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Production Build & Deployment

### Build for Production:
```bash
npm run build
```

This creates:
- `dist/public/` - Optimized React frontend
- `dist/index.js` - Bundled Express server

### Start Production Server:
```bash
npm run start
```

### Deploy to Render.com (Recommended):

1. **Create Render Account**: https://render.com
2. **New Web Service**: Connect your GitHub repo
3. **Configure**:
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Environment: Node
4. **Add Environment Variables**:
   - `DATABASE_URL` - Your Neon connection string
   - `JWT_SECRET` - Your JWT secret
   - `NODE_ENV` - `production`
   - `FRONTEND_URL` - Your Render URL (e.g., `https://saturday.onrender.com`)
5. **Deploy!**

---

## Testing Checklist

Before showing the demo, verify these features work:

- [ ] Registration (5-step flow)
- [ ] Login/logout
- [ ] Profile editing
- [ ] Image uploads (profile + gallery)
- [ ] Browse groups page
- [ ] Filtering (by music, vibe, availability)
- [ ] Send messages
- [ ] View conversations
- [ ] Schedule pregame
- [ ] Mark Saturday availability (Calendar tab)
- [ ] View leaderboard
- [ ] Dark/light theme toggle

---

## Project Structure Quick Reference

```
.
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   └── lib/         # Utilities
│   └── index.html
│
├── server/           # Express backend
│   ├── index.ts      # Server entry
│   ├── routes.ts     # API endpoints
│   ├── storage.ts    # Database layer
│   └── auth/         # JWT authentication
│
├── shared/           # Shared code
│   └── schema.ts     # Database schema + validation
│
├── .env              # Environment variables (YOU CREATE THIS)
├── .env.example      # Environment template
└── package.json      # Dependencies
```

---

## Available npm Scripts

```bash
npm run dev        # Start development server (with hot reload)
npm run build      # Build for production
npm run start      # Start production server
npm run check      # TypeScript type check
npm run db:push    # Push schema changes to database
```

---

## Security Features Enabled

✅ **helmet.js** - Security headers (CSP, XSS protection)
✅ **Rate limiting** - 5 login attempts per 15 min, 100 API requests per 15 min
✅ **CORS** - Cross-origin protection with credentials support
✅ **Compression** - Gzip compression for performance
✅ **httpOnly cookies** - JWT stored securely (no localStorage)
✅ **bcrypt** - Password hashing with 12 salt rounds

---

## Database Schema

The app uses PostgreSQL with these main tables:

- **users** - User accounts and profiles
- **schools** - College/university directory (2,092 US colleges)
- **conversations** - Chat threads
- **messages** - Chat messages with pagination
- **pregames** - Event scheduling
- **user_availability** - Saturday availability tracking
- **reviews** - Post-event ratings

All queries are school-scoped for multi-tenancy.

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query (state management)
- Wouter (routing)

### Backend
- Node.js + Express
- TypeScript
- Drizzle ORM
- Neon PostgreSQL
- JWT authentication

---

## Documentation

- **Full Architecture**: [CODEBASE_ANALYSIS_REPORT.md](CODEBASE_ANALYSIS_REPORT.md)
- **Deployment Guide**: [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md)
- **Messaging System**: [MESSAGING_SYSTEM.md](MESSAGING_SYSTEM.md)
- **Main README**: [README.md](README.md)

---

## Support

If you encounter issues:

1. Check this guide's "Common Issues" section
2. Review [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md)
3. Ensure all environment variables are set correctly
4. Verify your database connection

---

## Demo Preparation Checklist

Before showing the demo on Mac:

- [ ] Git clone completed
- [ ] `npm install` successful
- [ ] `.env` file created with valid DATABASE_URL and JWT_SECRET
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] App opens in browser at http://localhost:5000
- [ ] Can register a test user
- [ ] Can login with test user
- [ ] All features functional (messaging, scheduling, etc.)

**Estimated setup time**: 5-10 minutes (including Neon signup)

---

*Last updated: November 19, 2025*
*Ready for Mac deployment ✅*
