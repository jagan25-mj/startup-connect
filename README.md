# CollabHub - Production Ready

**AI-Assisted Startup Collaboration Platform**

Connect founders with talent through intelligent skill-based matching, real-time collaboration, and trust-verified networking.

![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Hardening Score](https://img.shields.io/badge/Hardening%20Score-8.5%2F10-blue)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://startup-connect-one.vercel.app)

---

## 📖 Critical Documentation for Deployment

**For Judges & Deployment Teams**:
- 🚀 [FINAL_README.md](./FINAL_README.md) - **START HERE** - Complete product overview
- 📋 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- 🎬 [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md) - 5-minute judge-ready demo flow
- ⚠️ [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) - What's included & roadmap
- ✅ [PRODUCTION_DEPLOYMENT_FINAL_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_FINAL_CHECKLIST.md) - Final verification checklist

---

## ✨ Features

### For Founders
- **Create & Manage Startups** — Post your startup with stage, industry, and skill requirements
- **AI-Assisted Talent Matching** — Find talent whose skills match your startup needs
- **Team Formation** — Accept interested talent and build your team
- **Progress Updates** — Post milestones and updates for your team and followers

### For Talent
- **Discover Startups** — Browse and filter startups by stage, industry, and skills
- **Express Interest** — Show interest in startups that match your goals
- **Skill Gap Analysis** — See how your skills align with startup needs
- **Team Membership** — Join startup teams and collaborate

### Platform Features
- **Real-time Messaging** — 1:1 conversations with read receipts
- **Network & Connections** — Build your professional network
- **Trust System** — Endorsements, trust scores, and user reporting
- **AI Insights** — Personalized suggestions (framed as AI-assisted, not automated)
- **Activity Feed** — Stay updated on startup progress

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Auth, RLS, Realtime, Storage) |
| **State** | TanStack Query |
| **Animations** | Framer Motion |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun
- Supabase project

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/startup-connect-2.git
cd startup-connect-2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ai/          # AI insight components
│   ├── auth/        # Protected routes
│   ├── dashboard/   # Dashboard widgets
│   ├── match/       # Matching components
│   ├── messages/    # Chat UI
│   ├── profile/     # Profile components
│   ├── startup/     # Startup management
│   ├── trust/       # Trust system
│   └── ui/          # shadcn components
├── hooks/           # Custom React hooks
├── lib/             # Utilities & AI logic
├── pages/           # Route components
└── types/           # TypeScript definitions
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

---

## 📦 Deployment

The app is deployed on Vercel:

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is built for the Microsoft Imagine Cup competition.

---

## 🎯 Demo Highlights

- **AI-Assisted Matching** — Skill-based talent-startup matching with explainable scores
- **Real-time Collaboration** — Live messaging, notifications, and activity feeds
- **Trust & Safety** — Endorsements, trust scores, and user reporting

*Built with ❤️ for startups and the talent who power them.*
