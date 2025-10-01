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
**PostgreSQL with Drizzle ORM**: Uses Drizzle for type-safe database operations and schema management. Currently has minimal schema with just users table containing basic authentication fields.

**Schema Structure**: 
- Users table with UUID primary keys, username, and password fields
- Designed for extension with additional tables for profiles, messages, ratings, etc.

### Authentication & Authorization
**JWT Implementation**: Complete JWT authentication system with httpOnly cookies for secure token storage. Tokens expire after 7 days and are automatically sent with all API requests.

**Security Considerations**: 
- Password hashing with bcryptjs
- JWT tokens stored in httpOnly cookies (not accessible to JavaScript)
- Trust proxy configuration for Replit production environment
- All authentication flows rely on API endpoints, no localStorage caching
- /api/auth/me endpoint for user data retrieval

**LocalStorage Fix (October 2025)**: Removed all localStorage caching from auth flows to prevent quota exceeded errors. Previously, base64-encoded profile images were cached in localStorage, exceeding the 5MB browser limit. Now all user data is fetched fresh from API using JWT authentication.

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