# Seed Data for Startup Connect Platform

This document provides sample data for testing and demonstration of the Startup Connect platform. The data includes 10 startups, 20 talent profiles, and 7 investors as requested.

## Data Overview

### Startups (10)
1. **TechVenture AI** - Technology, Early Stage
2. **GreenEnergy Solutions** - Clean Energy, Growth
3. **HealthTech Innovations** - Healthcare, Early Stage
4. **FinSecure** - Fintech, Idea
5. **EduFuture** - Education, Early Stage
6. **AgriTech Plus** - Agriculture, Growth
7. **LogiChain** - Logistics, Early Stage
8. **MediBotics** - Healthcare, Scaling
9. **EcoFashion** - Retail, Idea
10. **SmartCity Solutions** - Smart City, Growth

### Talent Profiles (20)
- Full-stack developers
- Product designers
- Data scientists
- Marketing specialists
- Mobile app developers
- Financial analysts
- DevOps engineers
- HR specialists
- Cybersecurity experts
- Business development professionals
- And more specialized roles

### Investors (7)
- Victoria Capital Partners (Venture Capital)
- Samuel Chen (Angel Investor)
- Global Ventures (Global Investment)
- Jennifer Rodriguez (Angel Investor)
- Innovation Fund (Venture Fund)
- Robert Kim (Private Equity)
- Future Tech Ventures (Venture Capital)

## How to Use This Data

To seed your Supabase database with this sample data:

1. Make sure Docker Desktop and Supabase CLI are installed
2. Start your local Supabase instance:
   ```bash
   npx supabase start
   ```
3. Run the seed script:
   ```bash
   npx tsx scripts/seed-data.ts
   ```

## Alternative: Manual Data Entry

If you're using a deployed Supabase instance, you can manually create these accounts through the application UI:

1. Register accounts for each founder, talent, and investor
2. Have founders create their startup profiles
3. Have talents and investors browse and express interest in startups
4. The matching algorithm will automatically calculate compatibility scores

## Purpose

This seed data helps with:
- Testing the matching algorithm
- Demonstrating the platform to stakeholders
- Providing sample content for UI/UX evaluation
- Validating the platform's core functionality