# Windsor Locks ELC - Daily Updates App

## Overview
A full-stack web application for the Windsor Locks School Early Years Section (Early Learning Centre) that enables teachers to provide daily updates to parents about their children (ages 18-60 months).

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS v4 + shadcn/ui components
- **Backend**: Express.js with session-based authentication (Passport.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend API)
- **State**: TanStack React Query

## User Roles
- **Admin** (default: username `admin`, password `admin123`): Manage teachers, parents, children, classes, and link parents to children
- **Teacher**: Log daily updates (meals, naps, activities, milestones, moods) for children with voice dictation and AI auto-formatting
- **Parent**: View private timeline ("Day in My World") for their linked child only

## Key Features
- Role-based authentication with session persistence
- Voice-to-text using Web Speech API for teacher notes
- AI auto-format button that structures raw notes and suggests developmental tags
- Developmental tags: communication, social-emotional, physical, early math, creativity
- Mood tracking with emojis
- Milestone "Moments of Growth" entries
- Parent-child access control (parents only see their own children)
- Admin panel with full CRUD for users, children, classes, and parent-child linking
- Photo uploads via multer (stored in /uploads directory, 10MB max)
- Password reset by admin (key icon in admin header)
- Self password change for any logged-in user
- Email notifications via Resend (requires RESEND_API_KEY env var):
  - Welcome email when teacher/parent account is created
  - Password reset notification
  - Parent notification when teacher posts a child update
- Teacher-to-class assignment

## Database Schema (shared/schema.ts)
- `users` - All accounts with role field (admin/teacher/parent)
- `classes` - Classroom groups with age ranges
- `children` - Child profiles with age, class assignment
- `parent_children` - Links parents to their children
- `teacher_classes` - Links teachers to their classes
- `updates` - Timeline entries (type, content, tags, mood, images)

## API Routes (all prefixed /api)
- Auth: POST /api/auth/login, /api/auth/logout, GET /api/auth/me, POST /api/auth/setup, GET /api/auth/setup-status
- Auth: POST /api/auth/reset-password (admin), POST /api/auth/change-password (self)
- Users: GET/POST /api/users, PATCH/DELETE /api/users/:id, GET /api/users/role/:role
- Classes: GET/POST /api/classes, PATCH/DELETE /api/classes/:id
- Children: GET/POST /api/children, PATCH/DELETE /api/children/:id
- Parent-Child links: GET/POST/DELETE /api/parent-children
- Teacher-Class links: GET/GET-all/POST/DELETE /api/teacher-classes
- Updates: GET /api/updates/:childId, POST /api/updates, DELETE /api/updates/:id
- Upload: POST /api/upload (multipart form, field "photo")

## Environment Variables
- `GMAIL_USER` - Gmail address for sending notifications (e.g. yourname@gmail.com)
- `GMAIL_APP_PASSWORD` - Gmail App Password (generate at https://myaccount.google.com/apppasswords)
- `SESSION_SECRET` - Optional session secret (has a default fallback)
- `DATABASE_URL` - PostgreSQL connection (auto-provided by Replit)

## File Structure
- `client/src/pages/` - home, admin-view, teacher-view, parent-view
- `client/src/hooks/use-auth.ts` - Authentication hook
- `server/auth.ts` - Passport setup, password hashing, role middleware
- `server/db.ts` - Database connection
- `server/storage.ts` - Database CRUD operations
- `server/routes.ts` - API endpoints
