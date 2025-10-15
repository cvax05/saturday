# Pregame Connect - Social Platform for College Groups

## Overview

Pregame Connect (branded as "Saturday") is a social platform designed for college groups and organizations to find others to pregame with before events. The application facilitates connections between groups through profile discovery, messaging, and a rating system to build trust within the community.

The platform uses a card-based discovery feed similar to dating apps, where users can browse group profiles, connect with others, and coordinate pregame activities. It includes comprehensive user management with registration, authentication, profile customization, and real-time messaging capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**React + TypeScript SPA**: Built with Vite for fast development and optimized production builds. Uses Wouter for client-side routing instead of React Router for a lighter footprint.

**Component Library**: Utilizes shadcn/ui components built on Radix UI primitives for accessibility and consistency. All UI components follow a unified design system with proper TypeScript support.

**State Management**: TanStack Query for server state management and caching. No global client state management library - relies on React's built-in state and props for component state.

**Styling**: Tailwind CSS with a custom design system featuring dark/light theme support. Uses CSS variables for theming and includes hover/active state utilities for interactive elements.

### Backend Architecture
**Express.js Server**: RESTful API server with TypeScript support and ES modules. Includes middleware for request logging, JSON parsing, and error handling.

**Storage Interface**: Abstracted storage layer with in-memory implementation for development. Designed to be easily swapped for database implementations without changing business logic.

**Route Organization**: Centralized route registration system with proper HTTP status code handling and JSON response formatting.

### Database Schema
**PostgreSQL with Drizzle ORM**: Uses Drizzle for type-safe database operations and schema management.

**Schema Structure**: 
- **Users table**: UUID primary keys, authentication, profile data (display name, bio, group size, availability)
- **Conversations table**: UUID primary keys, supports both direct (1-on-1) and group conversations with titles
- **Conversation_participants table**: Junction table linking users to conversations with last_read_at timestamps for unread count tracking
- **Messages table**: UUID primary keys, content with CHECK constraint (length > 0), indexed by conversation_id and created_at for efficient pagination
- **Schools table**: School information with unique slugs
- **User_school_memberships table**: Many-to-many relationship between users and schools for multi-tenancy
- **Reviews, pregames tables**: Rating and event coordination features

**Messaging System (October 2025)**: Complete first-class messaging implementation with:
- Cursor-based pagination for efficient message loading
- Direct message deduplication via composite unique constraint on sorted participant IDs
- Unread count tracking via last_read_at timestamps
- School isolation: all conversations scoped to school_id from JWT
- Real-time updates via polling (3-second intervals)

### Authentication & Authorization
**JWT Implementation**: Complete JWT authentication system with httpOnly cookies for secure token storage. Tokens expire after 7 days and are automatically sent with all API requests.

**Security Considerations**: 
- Password hashing with bcryptjs
- JWT tokens stored in httpOnly cookies (not accessible to JavaScript)
- Trust proxy configuration for Replit production environment
- All authentication flows rely on API endpoints, no localStorage caching
- /api/auth/me endpoint for user data retrieval

**LocalStorage Fix (October 2025)**: Removed all localStorage caching from auth flows to prevent quota exceeded errors. Previously, base64-encoded profile images were cached in localStorage, exceeding the 5MB browser limit. Now all user data is fetched fresh from API using JWT authentication.

**Cookie Navigation Fix (October 2025)**: Fixed random logout bug during navigation by setting explicit `path: '/'` on auth cookies and changing `sameSite` from 'strict' to 'lax'. Root cause: cookies without explicit path were scoped to `/api/auth/*`, causing other API calls to miss the cookie. Cookie settings now: `httpOnly: true`, `secure: production only`, `sameSite: 'lax'`, `path: '/'`, `maxAge: 7 days`.

**Auth Hardening (October 2025)**: Created `setAuthCookie` helper function in `server/auth/jwt.ts` to ensure consistent cookie settings across all authentication routes (login, register, profile updates). All auth routes now use this centralized helper for cookie management.

**Legacy Route Cleanup (October 2025)**: Removed three email-based messaging endpoints that were causing Express routing conflicts with conversation-based endpoints. The old `/api/messages/:userEmail` route was matching "conversations" as a URL parameter, causing "Access denied" errors. All messaging now uses conversation-based endpoints exclusively.

**Navigation Fix (October 2025)**: Fixed Messages page back button to navigate to `/groups` instead of `/` (registration page), preventing the appearance of being logged out. Also added `credentials: 'include'` to Login and Registration fetch requests to ensure JWT cookies are properly sent and stored during authentication flows.

**Profile Photo System (October 2025)**: Complete two-tier profile photo architecture with primary photo and optional gallery:
- **Database Schema**: `users.avatar_url` stores primary profile photo (base64 data URL), `users.profile_images` stores gallery photos array
- **Centralized User Mapper**: `mapUserToClient()` function in `server/routes.ts` ensures consistent API responses across all endpoints (register, login, auth/me, users/:id, profile update)
- **Backward Compatibility**: Mapper falls back to `profileImages[0]` when `avatar_url` is null to support legacy users
- **Cache Management**: Added cache-control headers to GET `/api/users/:id` and ProfileEdit invalidates TanStack Query cache after updates
- **Groups Feed Design**: Uses `object-cover` CSS for better photo fitting; intentionally filters out current user (line 118) similar to dating app UX
- **Profile Detail**: Displays primary photo from `avatarUrl` with `object-cover`, gallery photos shown separately
- **Registration UI**: Clear labels distinguish primary photo ("Profile Photo - shown when others see you") from optional gallery photos

### Design System
**Comprehensive Design Guidelines**: Detailed color palette for dark/light themes, typography using Inter font family, consistent spacing system, and component specifications.

**Accessibility Focus**: All UI components built on Radix UI primitives ensuring ARIA compliance and keyboard navigation support.

**Mobile-First Responsive**: Tailwind-based responsive design with mobile-optimized layouts and touch-friendly interactions.

## External Dependencies

### UI & Styling
- **Radix UI**: Complete set of accessible, unstyled UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe variant-based component styling

### State & Data Management
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with validation
- **Drizzle ORM**: Type-safe database operations and schema management
- **Zod**: Schema validation for forms and API requests

### Database & Storage
- **PostgreSQL**: Primary database (configured but not yet implemented)
- **Neon Database**: Serverless PostgreSQL provider for cloud deployment
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Development & Build
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development server

### Utilities & Formatting
- **date-fns**: Date manipulation and formatting utilities
- **clsx & tailwind-merge**: Conditional CSS class composition
- **nanoid**: URL-safe unique ID generation
- **bcryptjs**: Password hashing for authentication
- **jsonwebtoken**: JWT token generation and verification