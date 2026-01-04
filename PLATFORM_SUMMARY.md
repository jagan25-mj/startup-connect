# CollabHub Platform Summary

## Overview
CollabHub is a comprehensive platform that connects startup founders with talent. The platform facilitates matching, communication, and collaboration between founders and skilled professionals using AI-assisted insights and trust verification.

## Features Implemented

### 1. Multi-role System
- **Founder Role**: Create and manage startups, seek talent, view team health analytics
- **Talent Role**: Browse startups, express interest, find opportunities

### 2. Profiles with Trust & Achievements
- Full name, bio, avatar, skills
- Trust score based on profile completeness and account age
- Trust badges (Verified, Active, Skilled, Trusted)
- GitHub and LinkedIn links
- Resume upload (PDF, max 2MB)
- Achievements section (hackathons, projects, certifications, awards, internships)
- Public profile viewing at /profile/:id

### 3. AI-Powered Matching
- SQL-based scoring function evaluating skill overlap, industry relevance, and startup stage
- Auto-generated matches via database triggers
- Explainable match scores with breakdown

### 4. Startups
- Create, edit, delete startups
- Industry categories and stage tracking
- Team health dashboard for founders
- Skill gap analysis

### 5. Messaging
- Real-time conversations between users
- Unread message tracking
- Clickable profile avatars

### 6. Notifications
- Real-time notification system
- Interest notifications for founders
- Message notifications

### 7. AI Insights
- Founder insights: startup health, hiring priorities
- Talent insights: opportunity fit, impact predictions

## Tech Stack
- Frontend: React (Vite), TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, RLS, Realtime, Storage)
- Animations: Framer Motion

## Security
- Row Level Security (RLS) on all tables
- Profile data publicly readable (for discovery)
- Authenticated users can only modify their own data
- Resume storage with user-specific folder policies
