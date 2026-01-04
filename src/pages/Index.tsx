import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Rocket, Users, Target, Shield, 
  Sparkles, CheckCircle2, Star, Quote
} from 'lucide-react';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-[15%] p-3 rounded-xl bg-card/80 backdrop-blur border shadow-lg"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Users className="h-6 w-6 text-primary" />
          </motion.div>
          <motion.div 
            className="absolute top-32 right-[20%] p-3 rounded-xl bg-card/80 backdrop-blur border shadow-lg"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Target className="h-6 w-6 text-accent" />
          </motion.div>
          <motion.div 
            className="absolute bottom-32 left-[25%] p-3 rounded-xl bg-card/80 backdrop-blur border shadow-lg"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
          </motion.div>
        </div>

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered Team Building
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            Build Your Dream Team with{' '}
            <span className="text-gradient">CollabHub</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            CollabHub connects visionary founders with exceptional talent using
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
                <Button asChild variant="outline" size="xl">
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
                <Button asChild variant="outline" size="xl">
                  <Link to="/auth/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to build the perfect team
            </h2>
            <p className="text-lg text-muted-foreground">
              From AI-powered matching to trust verification, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Smart Matching',
                description: 'Our AI analyzes skills, experience, and goals to find your perfect matches.',
                gradient: 'from-primary to-primary/50'
              },
              {
                icon: Shield,
                title: 'Trust Scores',
                description: 'Verified profiles with endorsements and reputation tracking.',
                gradient: 'from-accent to-accent/50'
              },
              {
                icon: Users,
                title: 'Team Health',
                description: 'Visualize skill gaps and build balanced, high-performing teams.',
                gradient: 'from-green-500 to-green-500/50'
              },
              {
                icon: Sparkles,
                title: 'AI Insights',
                description: 'Get personalized recommendations and actionable suggestions.',
                gradient: 'from-purple-500 to-purple-500/50'
              },
              {
                icon: CheckCircle2,
                title: 'Intent Badges',
                description: 'Know who\'s serious with availability and commitment indicators.',
                gradient: 'from-orange-500 to-orange-500/50'
              },
              {
                icon: Star,
                title: 'Achievements',
                description: 'Showcase hackathon wins, projects, and certifications.',
                gradient: 'from-yellow-500 to-yellow-500/50'
              }
            ].map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
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

      {/* Success Stories Section */}
      <section className="py-24">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real stories from real founders
            </h2>
            <p className="text-lg text-muted-foreground">
              See how CollabHub helped them build their dream teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Story 1 */}
            <Card className="relative overflow-hidden group">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-16 w-16 text-primary" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3 text-primary">The 14-Month Solo Journey</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Ananya spent 14 months coding alone. Her AI-powered healthcare app worked beautifully — but investor meetings kept ending the same way: "Great tech. Come back when you have a business co-founder."
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">
                    Then she found CollabHub.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    She saw an <span className="text-primary font-semibold">87% compatibility score</span> next to Priya's profile. Within two months, they closed their pre-seed.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Story 2 */}
            <Card className="relative overflow-hidden group">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-16 w-16 text-accent" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3 text-accent">The Hiring Nightmare</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Rahul knew exactly what his EdTech platform should do. After two failed freelancer hires and ₹3 lakhs spent, he was ready to quit.
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">
                    CollabHub showed him something different.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    A <span className="text-accent font-semibold">Team Health Dashboard</span> mapped exactly which skills were missing. When he found Karthik, the platform flagged him with a "Fills Key Gap" badge.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Story 3 */}
            <Card className="relative overflow-hidden group">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-16 w-16 text-green-500" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3 text-green-500">The Ghost Co-Founders</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Arjun pitched to 15 classmates. Everyone said "yes" — and then ghosted. WhatsApp groups became graveyards.
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">
                    On CollabHub, profiles showed something powerful: intent.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    He filtered for "<span className="text-green-500 font-semibold">Serious — actively seeking</span>" with 20+ hours/week. They won their college hackathon, then a national competition.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emotional CTA */}
          <div className="text-center mt-16">
            <p className="text-2xl font-bold mb-2">
              CollabHub didn't just help them find teammates —
            </p>
            <p className="text-2xl font-bold text-primary">
              it helped them find belief.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to build something amazing?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of founders and talent already connecting on CollabHub.
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
      <footer className="py-8 border-t">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <Rocket className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">CollabHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CollabHub. Built for Microsoft Imagine Cup.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}