import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  Target, 
  Clock, 
  FileSpreadsheet, 
  Globe, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
  Search
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "AI-Powered Matching",
      description: "Our AI analyzes your resume and matches you with the most relevant jobs across thousands of listings"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Job Discovery",
      description: "Search across US, EU, UK, India, Middle East, SEA, and Australia from MNCs and regional portals"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7 Automated Search",
      description: "Set your schedule and let our system hunt for jobs while you sleep"
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      title: "Excel Export",
      description: "Export all discovered jobs to beautifully formatted Excel files for tracking"
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: "MNC Career Portals",
      description: "Direct integration with Google, Microsoft, Amazon, Apple, Meta, and more"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Smart Automation",
      description: "Secure credential vault for automated portal logins and job discovery"
    }
  ];

  const companies = [
    "Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", 
    "Spotify", "Stripe", "Airbnb", "Uber", "Oracle", "SAP"
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
              JobFinder AI
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                data-testid="go-to-dashboard-btn"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-zinc-600 hover:text-zinc-900"
                  data-testid="login-btn"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="btn-primary"
                  data-testid="get-started-btn"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                AI-Powered Job Discovery
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none text-zinc-900 mb-6" style={{ fontFamily: 'Outfit' }}>
                Find Your Dream Job{' '}
                <span className="gradient-text">Automatically</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-600 leading-relaxed mb-8 max-w-xl">
                Upload your resume once. Our AI continuously discovers and ranks the best job matches from global portals and MNC career sites — even while you sleep.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate('/register')}
                  className="btn-primary flex items-center gap-2"
                  data-testid="hero-get-started-btn"
                >
                  Start Free <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="btn-secondary"
                  data-testid="hero-login-btn"
                >
                  Sign In
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-12 flex items-center gap-8">
                <div className="flex items-center gap-2 text-zinc-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm">Free to start</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm">No credit card</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm">Global coverage</span>
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative animate-fade-in animation-delay-200">
              <div className="absolute -inset-4 bg-gradient-to-r from-rose-200 to-pink-200 rounded-3xl blur-2xl opacity-40"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 overflow-hidden">
                {/* Mock Job Cards */}
                <div className="space-y-4">
                  {[
                    { company: "Google", role: "Senior Software Engineer", score: 94, location: "Mountain View, CA" },
                    { company: "Microsoft", role: "Full Stack Developer", score: 88, location: "Seattle, WA" },
                    { company: "Amazon", role: "Backend Engineer", score: 82, location: "New York, NY" }
                  ].map((job, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-zinc-900">{job.role}</h4>
                        <p className="text-sm text-zinc-500">{job.company} · {job.location}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
                          {job.score}% Match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="py-16 px-6 border-y border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-zinc-500 mb-8 text-sm font-medium uppercase tracking-wide">
            Discover opportunities at top companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {companies.map((company, idx) => (
              <span 
                key={idx} 
                className="text-xl font-semibold text-zinc-300 hover:text-zinc-600 transition-colors"
                style={{ fontFamily: 'Outfit' }}
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium uppercase tracking-wide text-rose-600">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-4 mb-6" style={{ fontFamily: 'Outfit' }}>
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Our AI-powered platform automates the tedious job search process so you can focus on what matters — preparing for interviews.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-white p-8 card-hover animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center text-rose-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3" style={{ fontFamily: 'Outfit' }}>
                  {feature.title}
                </h3>
                <p className="text-zinc-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>
            Ready to Transform Your Job Search?
          </h2>
          <p className="text-xl text-zinc-400 mb-10">
            Join thousands of professionals who've found their dream jobs with AI-powered matching.
          </p>
          <Button
            onClick={() => navigate('/register')}
            className="h-14 px-10 rounded-full bg-white text-zinc-900 font-semibold text-lg hover:bg-zinc-100 transition-all hover:scale-105"
            data-testid="cta-get-started-btn"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
              JobFinder AI
            </span>
          </div>
          <p className="text-zinc-500 text-sm">
            © 2025 JobFinder AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
