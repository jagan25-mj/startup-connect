import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  Rocket, Users, Lightbulb, ArrowRight,
  Zap, Shield, Globe, Sparkles, Quote, Heart, Code, TrendingUp
} from 'lucide-react';
import { useState } from 'react';

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 gradient-glow" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

        {/* Premium Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-primary/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />

        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Where founders meet their dream team
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
              Build the future,
              <span className="block text-gradient">together.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              LaunchPad connects visionary founders with exceptional talent using
              AI-assisted insights. We surface the matches — you make the decisions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {user ? (
                <>
                  <Button asChild variant="gradient" size="xl">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="hero" size="xl">
                    <Link to="/startups">Explore Startups</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="gradient" size="xl">
                    <Link to="/auth/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="hero" size="xl">
                    <Link to="/startups">Browse Startups</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to launch
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform for connecting startup founders with the talent they need
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Lightbulb,
                title: 'Share Your Vision',
                description: 'Create a compelling startup profile that attracts the right talent to your mission.',
                gradient: 'from-primary to-primary/50',
              },
              {
                icon: Users,
                title: 'Find Your Team',
                description: 'Browse talented individuals looking to join exciting startups and make an impact.',
                gradient: 'from-accent to-accent/50',
              },
              {
                icon: Zap,
                title: 'Connect Instantly',
                description: 'Express interest, view profiles, and start building relationships immediately.',
                gradient: 'from-success to-success/50',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your data is protected with enterprise-grade security and privacy controls.',
                gradient: 'from-warning to-warning/50',
              },
              {
                icon: Globe,
                title: 'Global Reach',
                description: 'Connect with founders and talent from around the world, no boundaries.',
                gradient: 'from-primary to-accent',
              },
              {
                icon: Rocket,
                title: 'Launch Ready',
                description: 'Built for speed. From idea to team, get ready to launch faster than ever.',
                gradient: 'from-destructive to-destructive/50',
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 transition-transform group-hover:scale-110`}>
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Stories Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Heart className="h-4 w-4" />
              Real Stories, Real Impact
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From struggling alone to building together
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every great startup begins with finding the right people
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Story 1: Solo Founder */}
            <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
              <CardContent className="p-6 space-y-4">
                <Quote className="h-8 w-8 text-primary/20" />
                <h3 className="text-xl font-bold italic text-primary">
                  "I built the product. But I couldn't sell the dream."
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ananya spent 14 months coding alone. Her AI-powered healthcare app worked beautifully — but investor meetings kept ending the same way: "Great tech. Come back when you have a business co-founder."
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">
                    Then she found Startup Connect.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    She saw an <span className="text-primary font-semibold">87% compatibility score</span> next to Priya's profile. Within two months, they closed their pre-seed.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ananya K.</p>
                    <p className="text-xs text-muted-foreground">Technical Founder → Found Business Co-founder</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story 2: Non-Technical Founder */}
            <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/50" />
              <CardContent className="p-6 space-y-4">
                <Quote className="h-8 w-8 text-accent/20" />
                <h3 className="text-xl font-bold italic text-accent">
                  "I had the vision. I just couldn't build it alone."
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Rahul knew exactly what his EdTech platform should do. After two failed freelancer hires and ₹3 lakhs spent, he was ready to quit.
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">
                    Startup Connect showed him something different.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    A <span className="text-accent font-semibold">Team Health Dashboard</span> mapped exactly which skills were missing. When he found Karthik, the platform flagged him with a "Fills Key Gap" badge.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold">
                    R
                  </div>
                  <div>
                    <p className="font-medium text-sm">Rahul M.</p>
                    <p className="text-xs text-muted-foreground">Business Founder → Found Technical Co-founder</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story 3: College Entrepreneur */}
            <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success to-success/50" />
              <CardContent className="p-6 space-y-4">
                <Quote className="h-8 w-8 text-success/20" />
                <h3 className="text-xl font-bold italic text-green-500">
                  "Everyone had ideas. No one wanted to commit."
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Arjun pitched to 15 classmates. Everyone said "yes" — and then ghosted. WhatsApp groups became graveyards.
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">
                    On Startup Connect, profiles showed something powerful: intent.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    He filtered for "<span className="text-green-500 font-semibold">Serious — actively seeking</span>" with 20+ hours/week. They won their college hackathon, then a national competition.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-medium text-sm">Arjun S.</p>
                    <p className="text-xs text-muted-foreground">College Student → Seed Funded Founder</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emotional CTA */}
          <div className="text-center mt-16">
            <p className="text-2xl font-bold mb-2">
              Startup Connect didn't just help them find teammates —
            </p>
            <p className="text-2xl font-bold text-primary">
              it helped them find belief.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-50" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to build something amazing?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of founders and talent already connecting on LaunchPad.
          </p>
          <Button asChild variant="gradient" size="xl">
            <Link to={user ? '/dashboard' : '/auth/register'}>
              {user ? 'Go to Dashboard' : 'Start Building Today'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Rocket className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">LaunchPad</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LaunchPad. Built for Microsoft Imagine Cup.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
