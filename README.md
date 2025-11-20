# Saturday: The College Social Platform

**Saturday** is a full-stack social platform designed to connect students on college campuses. It provides a multi-tenant, school-scoped environment where users can find each other, organize events ("pregames"), and communicate through a real-time messaging system.

The project has reached a significant level of maturity, with a robust feature set and a solid architectural foundation. This document serves as a guide to understanding, running, and further developing the platform.

## Project Status: Nearing MVP

The platform is well on its way to being a deployable Minimum Viable Product (MVP).

- **Core functionality is complete**: User registration, profiles, event scheduling, and real-time messaging are implemented and tested.
- **Architecture is scalable**: The backend is built with Express.js, a Neon serverless Postgres database, and Drizzle ORM. The frontend is a modern React/Vite application.
- **Security is in place**: Authentication is handled via JWTs stored in secure, `httpOnly` cookies. Authorization is enforced at the API level, with strict school-scoping to ensure data privacy between tenants.

The application is ready for deployment to standard cloud platforms (Render, Railway, Heroku, AWS, etc.).

## Core Features

- **Multi-Tenant by School**: The entire platform is partitioned by college/university. Users exist within their school's scope.
- **User Authentication**: Secure user registration and login system with email/password.
- **User Profiles**: Viewable and editable user profiles with display names and profile images.
- **Event Scheduling ("Pregames")**: Users can schedule events, setting availability, and minimum/maximum capacity.
- **Real-Time Messaging**: A complete, conversation-based messaging system with:
    - 1-on-1 conversations with intelligent deduplication.
    - Real-time updates via frontend polling.
    - Unread message counts.
    - Cursor-based pagination for infinite message scrolling.
    - Detailed API and testing documentation (see `MESSAGING_SYSTEM.md`).
- **UI Components**: A rich set of UI components built with **shadcn/ui** and **Tailwind CSS**.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Serverless Postgres (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js with JWTs (`jsonwebtoken`)
- **TypeScript**: End-to-end type safety

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Routing**: Wouter
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **State Management**: TanStack Query (React Query) for server state

### Shared
- **Schema & Validation**: Drizzle schema definitions and Zod for validation are shared between the client and server.

## Project Structure

The project is organized as a monorepo with three main directories:

```
.
├── client/         # React/Vite frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Top-level page components
│   │   ├── lib/        # Utilities, query client, etc.
│   │   └── App.tsx     # Root component with routing
│   └── index.html
├── server/         # Express.js backend API
│   ├── auth/       # Authentication middleware (JWT, Passport)
│   ├── index.ts    # Server entry point
│   ├── routes.ts   # API route definitions
│   ├── storage.ts  # Database abstraction layer (Drizzle)
│   └── vite.ts     # Vite dev server middleware
└── shared/         # Code shared between client and server
    └── schema.ts   # Drizzle DB schema and Zod validation schemas
```

## Local Environment Setup

1.  **Prerequisites**:
    - Node.js (v20 or later recommended)
    - `npm` or another package manager
    - A PostgreSQL database. You can run one locally using Docker or use a free cloud provider like Neon (which this project is already configured for).

2.  **Environment Variables**: Create a `.env` file in the root of the project. This will hold your database connection string and JWT secret.

    ```env
    # Example .env file
    # Get this from your Neon database project settings
    DATABASE_URL="postgres://user:password@host.neon.tech/dbname?sslmode=require"

    # A strong, random string for signing JWTs
    JWT_SECRET="your-super-secret-and-long-random-string"
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Database Migrations**: The project uses `drizzle-kit` to manage the database schema. To push the schema defined in `shared/schema.ts` to your database, run:
    ```bash
    npm run db:push
    ```
    *Note: In a production workflow, you would generate SQL migration files with `drizzle-kit generate` and apply them, but `db:push` is sufficient for development.*

### Step 3: Running the Application Locally

The `package.json` `dev` script is configured to run the backend server, which in turn serves the Vite dev server for the frontend.

To run both client and server in development mode:
```bash
npm run dev
```

The server will start (typically on port 5000), and you can access the application at `http://localhost:5000`.

### Step 4: Building for Production

To build the application for production, run:
```bash
npm run build
```
This command does two things:
1.  Runs `vite build` to create a production-optimized build of the React frontend in the `dist/public` directory.
2.  Runs `esbuild` to compile the TypeScript backend server into a single JavaScript file in `dist/`.

To start the production server:
```bash
npm run start
```
This runs the compiled `dist/index.js` file, which will serve both the API and the static frontend assets.

## Deployment

The application is now a standard Node.js project and can be deployed to any platform that supports Node.js and PostgreSQL (e.g., Heroku, Render, AWS, a VPS).

A typical deployment process would look like this:
1.  Connect your deployment service to your Git repository.
2.  Set the environment variables (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`).
3.  Configure the **build command**: `npm run build`.
4.  Configure the **start command**: `npm run start`.
5.  If your platform requires database migrations as a separate step, you may need to add a command to run your migration script (e.g., `npx drizzle-kit migrate`).
