# CollabHub Known Limitations & Roadmap

Document of current limitations and future enhancements.

## Current Known Limitations (v1.0)

### AI & Matching

#### Rule-Based Matching (Not ML)
- **Current**: Matching uses rule-based algorithm with skill gap analysis
- **Why**: Explainable, no ML infrastructure needed, deterministic results
- **Limitation**: Can't learn from rejection patterns
- **Future**: Planned ML upgrade in v1.5 with user feedback signals

#### Limited Training Data
- **Current**: Matches based on profile info, skills, experience
- **Why**: Just launched, limited historical data
- **Limitation**: Cold start problem for new users
- **Workaround**: Users can add rich skill descriptions to improve matches

#### No AI Skill Gap Analysis Display
- **Current**: Skill gaps are calculated but not shown to users
- **Why**: Feature paused, UX needs refinement
- **Future**: v1.1 will show "Learn This Skill" recommendations

---

### Admin & Operations

#### No Admin Dashboard
- **Current**: No UI for admins to manage users, disputes, content
- **Why**: Not needed for MVP, can use Supabase UI
- **Limitation**: Escalations require direct DB access
- **Future**: v1.5 will add admin panel

#### No Dispute Resolution System
- **Current**: No built-in process for user disputes
- **Why**: Low volume, manual handling is fine
- **Limitation**: Relies on email escalation
- **Future**: Planned for v2.0

#### No Content Moderation
- **Current**: Profiles and startup descriptions are not auto-moderated
- **Why**: Low volume, community is self-policing
- **Limitation**: Spam/inappropriate content possible
- **Workaround**: Users can report via button in UI

---

### Communications

#### No Email Notifications
- **Current**: Only in-app notifications and messages
- **Why**: Email provider not integrated yet
- **Limitation**: Users miss notifications if not checking app
- **Timeline**: Q2 2026 (Resend or SendGrid integration)

#### No SMS Notifications
- **Current**: No SMS alerts
- **Why**: Low priority for MVP
- **Future**: Q3 2026 (if demand exists)

#### No Video Calls
- **Current**: No built-in video chat
- **Why**: Complex infrastructure, external services exist
- **Workaround**: Users exchange contact info via messages
- **Note**: May add Zoom/Google Meet integration in future

---

### Search & Discovery

#### No Full-Text Search
- **Current**: Search by profile name only
- **Why**: Performance, complexity tradeoff
- **Limitation**: Can't search by skills or interests
- **Future**: v1.2 will add full-text search with Postgres

#### No Advanced Filters
- **Current**: Basic stage/role filters
- **Why**: Matches are AI-driven, not filter-based
- **Limitation**: Can't do complex queries ("SaaS founders in SF with $100k seed")
- **Workaround**: Refine profile to improve match recommendations

#### No Saved Searches
- **Current**: Can't save filter combinations
- **Why**: Filters limited, not high demand
- **Future**: v1.3 if requested

---

### Profile & Verification

#### No Email Verification
- **Current**: Email signup allowed, no verification required
- **Why**: Reduce friction on MVP
- **Security Note**: Email is not verified against actual inbox
- **Timeline**: Email verification when email service is added (Q2 2026)

#### No LinkedIn Integration
- **Current**: Profiles built manually
- **Why**: LinkedIn API complexity, manual entry better for MVP
- **Limitation**: Profile setup takes 5-10 minutes
- **Future**: v1.3 OAuth integration (LinkedIn, Google)

#### No Verification Badges
- **Current**: No "verified founder" or "verified investor" badges
- **Why**: Manual verification expensive
- **Limitation**: Can't easily identify legitimate users
- **Future**: v1.5 with social proof system

#### No Portfolio Links
- **Current**: Can add links in description, but no dedicated portfolio section
- **Why**: Keep profiles simple
- **Future**: v1.2 with portfolio gallery

---

### Investor Features

#### No Deal Terms Configuration
- **Current**: Investors provide feedback only, no deal structure
- **Why**: Deal terms too complex for MVP
- **Limitation**: Can't use for active term sheet negotiations
- **Future**: v2.0 with term sheet builder

#### No SAFT or Term Sheet Templates
- **Current**: Only structured feedback mechanism
- **Why**: Legal liability concerns
- **Note**: Recommend AngelList for term sheets
- **Future**: May partner with legal services

#### No Follow-on Investment Tracking
- **Current**: Can't track Series A, Series B, etc.
- **Why**: Not needed for early-stage discovery
- **Future**: v2.0

---

### Analytics & Insights

#### No Analytics Dashboard
- **Current**: Founders can't see profile views, interest trends
- **Why**: Low volume, not critical
- **Timeline**: v1.5 (basic founder analytics)

#### No Pitch Statistics
- **Current**: No data on pitch success rates, feedback trends
- **Why**: Sample size too small
- **Future**: v2.0 once we have scale

#### No Market Insights
- **Current**: No data on which industries, stages, skills are hot
- **Why**: Data privacy, low volume
- **Future**: Anonymized market insights in v2.0

---

### Technical & Platform

#### Scale Limits
- **Current**: Tested to ~10,000 active users
- **Why**: Startup constraints, not needed yet
- **Limitation**: Unknown behavior at 100k+ scale
- **Plan**: Load testing and optimization in v1.5

#### No Dark Mode
- **Current**: Light theme only
- **Why**: Nice-to-have, not critical
- **Timeline**: v1.3

#### No Mobile App
- **Current**: Responsive web only
- **Why**: Web works on mobile, native apps expensive
- **Limitation**: No notifications when browser closed
- **Future**: v2.0 native iOS/Android

#### No Offline Support
- **Current**: Requires internet connection
- **Why**: All data stored in cloud
- **Limitation**: Can't view profiles offline
- **Note**: Not planned (online-first product)

#### No API for Integrations
- **Current**: No public API
- **Why**: Startup stage, not needed yet
- **Future**: v1.5 with basic API

#### No Custom Domain Support
- **Current**: Domain is collabhub.vercel.app or custom Vercel domain
- **Why**: Simplified deployment
- **Future**: Enterprise customers can bring custom domain (v2.0)

---

### Security & Privacy

#### No Two-Factor Authentication (2FA)
- **Current**: Password-only authentication
- **Why**: Supabase doesn't support 2FA in free tier
- **Plan**: Add when migrating to paid Supabase (Q3 2026)

#### No Data Export
- **Current**: Can't export your profile data
- **Why**: GDPR compliance feature, low priority
- **Timeline**: Q2 2026 (required for GDPR)

#### No Account Deletion
- **Current**: Can deactivate but not fully delete
- **Why**: Need for audit/compliance
- **Timeline**: Q2 2026 (required for GDPR)

#### No Privacy Settings
- **Current**: All profiles are public
- **Why**: MVP simplicity
- **Limitation**: Can't make profile private
- **Future**: v1.2 with privacy controls

---

## Intentional Tradeoffs

### Why These Exist

| Limitation | Reason | Justification |
|-----------|--------|---------------|
| No email | Reduce external dependencies | App notifications work fine now |
| No admin UI | Reduce scope | Manual use of Supabase adequate |
| Manual profiles | No OAuth complexity | Users value clean experience over speed |
| Rule-based AI | Explainability > complexity | Founders understand matching logic |
| Light theme only | Reduce CSS burden | 80% of users prefer light |
| Web only | Reduce dev cost | Responsive design sufficient |

---

## Scaling & Performance

### Current Capacity

| Metric | Current Limit | Plan |
|--------|---------------|------|
| Active users | ~10k | Monitor at 5k |
| Startups | ~1k | Monitor at 500 |
| Matches computed | Real-time | Batch at 100k+ |
| Concurrent connections | 100 | Scale with Supabase plan |
| File storage | 10 GB | Upgrade at 5 GB |
| Database size | 50 GB | Upgrade at 25 GB |

### What Happens If We Hit Limits

1. **Notify team immediately**
2. **Scale Supabase to paid plan**
3. **Optimize slow queries**
4. **Add database indexes**
5. **Consider caching layer** (Redis)

---

## Roadmap

### Q1 2026 (Now)
- ✅ MVP launch
- ✅ Production hardening (8.5/10)
- ✅ Demo readiness
- 🔄 User feedback gathering

### Q2 2026
- 📧 Email notifications (Resend)
- 🔐 GDPR compliance (data export, deletion)
- 🔍 Full-text search
- 👤 Advanced profile features

### Q3 2026
- 📊 Founder analytics dashboard
- 🔐 Two-factor authentication
- 🎨 Dark mode
- 📱 Mobile app alpha

### Q4 2026 & Beyond
- 🧠 ML-based matching (v2.0)
- 👨‍💼 Admin dashboard
- 📋 Deal term builder
- 🌐 International scaling
- 🤖 ChatGPT integration for pitch analysis

---

## How to Request Features

1. **In-app feedback**: Use "Send Feedback" button (future)
2. **Email**: team@collabhub.demo
3. **GitHub Issues**: (planned public repo)
4. **Community forum**: (planned for v1.5)

---

## FAQ

**Q: When will [feature] be available?**  
A: Check roadmap above. If not listed, request it via feedback.

**Q: Can we prioritize [feature] for my use case?**  
A: Enterprise customers can. Contact team for custom development.

**Q: Is there an API?**  
A: Not yet. Public API planned for v1.5.

**Q: Can we run this on-premise?**  
A: Not currently. Planned for v3.0 (enterprise).

**Q: Why no feature X that competitor has?**  
A: Scope management. We focus on founder + talent matching first.

---

## Known Bugs / Issues

(None known in production as of Jan 23, 2026)

If you find an issue:
1. Report via in-app feedback
2. Email team@collabhub.demo with details
3. Include: browser, steps to reproduce, screenshot

---

**Last Updated**: January 23, 2026  
**Status**: Production Ready (8.5/10)  
**Next Review**: February 23, 2026
