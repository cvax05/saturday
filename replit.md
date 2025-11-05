# Pregame Connect - Social Platform for College Groups

## Overview
Pregame Connect (branded as "Saturday") is a social platform for college groups and organizations to connect for pregame activities. It features profile discovery, real-time messaging, and a rating system. The platform aims to facilitate connections between groups, coordinate pregame events, and build a trusted community within college campuses.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React + TypeScript SPA built with Vite.
- **Routing**: Wouter for client-side routing.
- **UI Components**: shadcn/ui built on Radix UI for accessibility and consistency.
- **State Management**: TanStack Query for server state; React's built-in state for client state.
- **Styling**: Tailwind CSS with a custom design system, dark/light theme, and responsive mobile-first design.

### Backend
- **Server**: Express.js with TypeScript and ES modules, featuring middleware for logging, JSON parsing, and error handling.
- **Storage**: Abstracted storage layer, designed for easy database integration.
- **API**: RESTful API with centralized route registration and JSON response formatting.

### Database
- **Type**: PostgreSQL with Drizzle ORM for type-safe operations.
- **Schema**:
    - **Users**: Authentication, profile data (display name, bio, group size, availability).
    - **Conversations**: Direct and group conversations, titles.
    - **Conversation Participants**: Links users to conversations, tracks unread counts.
    - **Messages**: Content, indexed for efficient pagination.
    - **Schools**: Comprehensive database of 2,092 US colleges populated via a script.
    - **User School Memberships**: Many-to-many relationship for multi-tenancy.
    - **Reviews & Pregames**: Rating and event coordination features, including pregame scheduling linked to conversations.
- **Schools Data Population**: Automated script `scripts/populate-schools.ts` handles CSV parsing, slug generation, and ensures data integrity and idempotency.

### Authentication & Authorization
- **Method**: JWT authentication using httpOnly cookies for secure token storage (30-day expiry).
- **Security**: Password hashing with bcryptjs, JWT in httpOnly cookies, trust proxy for Replit.
- **Flows**: All authentication flows rely on API endpoints; no localStorage caching. `setAuthCookie` helper ensures consistent cookie settings. Seamless authentication flows with TanStack Query caching for improved UX.
- **Session Isolation (November 2025)**: Enhanced session management to prevent account confusion when testing multiple accounts on same browser. Login flow clears all TanStack Query cache before setting new auth data. Logout endpoint clears cookies with explicit options (path, httpOnly, sameSite, secure) for complete session cleanup. Cookie overwrites handled automatically by setAuthCookie on successful login.

### Features
- **Messaging System**: Full-featured messaging with cursor-based pagination, unread count tracking, and school isolation.
  - **Database Integrity Fix (October 2025)**: Fixed "Unknown" profiles bug by adding missing PRIMARY KEY constraint on `conversation_participants (conversation_id, user_id)`. Removed 4 duplicate participant entries and 3 orphaned conversations. Constraint prevents duplicate participants and ensures data integrity.
  - **Message Styling (November 2025)**: Own messages display with purple background (bg-purple-600) and right alignment. Other users' messages show neutral/muted background and left alignment. Styling automatically adjusts based on logged-in user for proper conversation perspective.
- **Profile Photo System**: Two-tier architecture with a primary avatar and an optional gallery. Centralized user mapper ensures consistent API responses.
- **Mobile Responsiveness**: Complete mobile-first implementation with a fixed bottom tab bar, single-pane messages view, and touch-friendly interactions.
- **Schedule Pregame**: Conversation-based pregame scheduling with database integration and API endpoints.
  - **Saturday-Only Scheduling (October 2025)**: Updated scheduling UI to enforce Saturday-only pregames with dropdown selector showing next 10 upcoming Saturdays. Removed manual date input to prevent scheduling on non-Saturday dates. Includes timezone-safe date formatting using local date components to prevent date drift across timezones.
  - **Implementation**: Saturday selector dropdown implemented in both SchedulePregameModal component (used by ChatView) and Messages page inline dialog. Both automatically refresh to show current upcoming Saturdays when dialog opens, preventing stale date selections.
- **Saturday Availability Tracking (October 2025)**: Complete implementation of Saturday-focused availability system.
  - Users can select multiple upcoming Saturdays during registration and profile editing via checkbox-based UI (12 upcoming Saturdays displayed)
  - Backend stores availability as text array in `available_saturdays` column
  - Integrates with existing filter system (`/api/users/filter`) for finding groups with matching availability
  - Display on profile pages shows formatted Saturday dates with Calendar icon
  - Fixed critical double-toggle bug by removing redundant event handlers

## External Dependencies

### UI & Styling
- **Radix UI**: Accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **class-variance-authority**: Type-safe variant styling.

### State & Data Management
- **TanStack Query**: Server state management and caching.
- **React Hook Form**: Form state management and validation.
- **Drizzle ORM**: Type-safe PostgreSQL ORM.
- **Zod**: Schema validation.

### Database & Storage
- **PostgreSQL**: Primary database.
- **Neon Database**: Serverless PostgreSQL.
- **connect-pg-simple**: PostgreSQL session store.

### Development & Build
- **Vite**: Fast build tool and dev server.
- **TypeScript**: Type safety.
- **ESBuild**: Fast JavaScript bundler.
- **tsx**: TypeScript execution for development.

### Utilities & Formatting
- **date-fns**: Date manipulation.
- **clsx & tailwind-merge**: CSS class composition.
- **nanoid**: Unique ID generation.
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT handling.