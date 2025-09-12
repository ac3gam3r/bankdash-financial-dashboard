# BankDash - Personal Financial Dashboard

## Overview

BankDash is a comprehensive personal financial dashboard that allows users to manage multiple bank accounts, track transactions, monitor credit card rewards, and analyze spending patterns. The application provides a secure, mobile-first interface for users to gain insights into their financial health with features like account aggregation, expense categorization, rewards tracking, and travel expense management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with custom design system following Material Design principles
- **Theme System**: Light/dark mode support with CSS custom properties

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Authentication**: Replit OIDC integration with Passport.js strategy
- **API Design**: RESTful endpoints with comprehensive error handling and request logging

### Database Design
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Structure**:
  - Users table for authentication data
  - Accounts table supporting checking, savings, credit, investment, and loan types
  - Transactions with category classification and rewards tracking
  - Categories for expense organization
  - Credit scores for financial health tracking
  - Bank and credit card bonuses for rewards optimization
  - Recurring payments for subscription management
  - Trips for travel expense tracking
  - Reward redemptions for cashback/points usage

### Design System
- **Color Palette**: Professional blue-based theme with semantic colors for financial data
- **Typography**: Inter font family optimized for financial readability
- **Component Library**: Consistent spacing using Tailwind's 8-point grid system
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Accessibility**: High contrast ratios and ARIA compliance

### Data Management
- **Financial Data Types**: Support for multiple account types with credit limits, reward rates, and balance tracking
- **Transaction Classification**: Automatic categorization with manual override capabilities
- **Rewards Calculation**: Real-time tracking of cashback, points, and miles earned
- **Expense Analytics**: Category-based spending analysis and trend identification

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migrations and schema management

### Authentication
- **Replit OIDC**: OAuth 2.0 authentication provider
- **OpenID Client**: Standards-compliant OIDC implementation

### Development Tools
- **Vite**: Frontend build tool with HMR and optimized bundling
- **PostCSS**: CSS processing with Tailwind integration
- **TypeScript**: Type safety across frontend and backend

### UI Libraries
- **Radix UI**: Unstyled, accessible component primitives
- **Lucide React**: Consistent icon system
- **Date-fns**: Date manipulation and formatting
- **Recharts**: Chart library for financial data visualization

### Utility Libraries
- **Zod**: Runtime type validation for API endpoints
- **Class Variance Authority**: Type-safe utility classes
- **Memoizee**: Function memoization for performance optimization