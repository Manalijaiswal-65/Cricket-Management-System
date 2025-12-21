import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import LiveMatchCard from '../components/LiveMatchCard';
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  ChevronRight,
  Play,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Create and manage teams with detailed rosters, player stats, and team analytics.',
      color: 'text-neon-green'
    },
    {
      icon: Calendar,
      title: 'Match Scheduling',
      description: 'Automated round-robin scheduling with conflict detection and venue management.',
      color: 'text-neon-blue'
    },
    {
      icon: Zap,
      title: 'Live Updates',
      description: 'Real-time score updates and notifications during live matches.',
      color: 'text-neon-pink'
    },
    {
      icon: BarChart3,
      title: 'Statistics',
      description: 'Comprehensive player and team statistics with leaderboards.',
      color: 'text-neon-green'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Different access levels for admins, managers, players, and spectators.',
      color: 'text-neon-blue'
    },
    {
      icon: Trophy,
      title: 'Standings',
      description: 'Auto-updated league standings with points table and net run rate.',
      color: 'text-neon-pink'
    }
  ];

  const stats = [
    { value: '100+', label: 'Teams Managed' },
    { value: '1000+', label: 'Matches Tracked' },
    { value: '5000+', label: 'Players Registered' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center neon-glow-green">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-chivo font-bold text-xl">CricketHub</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" data-testid="login-nav-btn">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="neon-glow-green" data-testid="register-nav-btn">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1709134800864-15d9d04bc1f2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxjcmlja2V0JTIwcGxheWVyJTIwYWN0aW9uJTIwc3RhZGl1bXxlbnwwfHx8fDE3NjU1NDIwNTJ8MA&ixlib=rb-4.1.0&q=85')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div
                id="hero-badge"
                data-animate
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium transition-all duration-700 ${isVisible['hero-badge'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <Zap className="w-4 h-4" />
                Real-time Cricket League Management
              </div>

              <h1
                id="hero-title"
                data-animate
                className={`font-chivo font-black text-4xl sm:text-5xl lg:text-6xl leading-tight transition-all duration-700 delay-100 ${isVisible['hero-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                Manage Your
                <span className="block text-primary">Cricket League</span>
                Like a Pro
              </h1>

              <p
                id="hero-desc"
                data-animate
                className={`text-lg text-muted-foreground max-w-lg transition-all duration-700 delay-200 ${isVisible['hero-desc'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                The ultimate platform for managing local cricket leagues. Track scores in real-time, manage teams and players, and keep your fans engaged.
              </p>

              <div
                id="hero-buttons"
                data-animate
                className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-300 ${isVisible['hero-buttons'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto neon-glow-green group" data-testid="get-started-btn">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto group" data-testid="watch-demo-btn">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div
                id="hero-stats"
                data-animate
                className={`grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-border/50 transition-all duration-700 delay-400 ${isVisible['hero-stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center sm:text-left">
                    <div className="font-mono text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image/Card */}
            <div
              id="hero-visual"
              data-animate
              className={`relative hidden lg:block transition-all duration-1000 delay-300 ${isVisible['hero-visual'] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-neon-pink/20 rounded-2xl blur-xl" />
                <div className="relative glass rounded-2xl p-6 space-y-4">
                  {/* Live Match Card - Dynamic Component */}
                  <LiveMatchCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div
            id="features-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ${isVisible['features-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <h2 className="font-chivo font-bold text-3xl sm:text-4xl mb-4">
              Everything You Need to
              <span className="text-primary"> Run a League</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From team management to live scoring, we've got all the tools you need to run a professional cricket league.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  id={`feature-${index}`}
                  data-animate
                  className={`group p-6 bg-surface/50 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-500 card-hover ${isVisible[`feature-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-chivo font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div
            id="cta-section"
            data-animate
            className={`relative overflow-hidden rounded-2xl transition-all duration-700 ${isVisible['cta-section'] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-neon-pink/20" />
            <div className="relative glass p-8 sm:p-12 text-center">
              <h2 className="font-chivo font-bold text-3xl sm:text-4xl mb-4">
                Ready to Transform Your League?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of cricket enthusiasts who are already using CricketHub to manage their leagues.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="neon-glow-green" data-testid="cta-get-started-btn">
                    Start Free Trial
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" data-testid="cta-signin-btn">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-chivo font-bold">CricketHub</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 CricketHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
