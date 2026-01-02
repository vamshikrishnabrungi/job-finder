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
  Search,
  TrendingUp,
  Shield,
  Sparkles,
  Play
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Target className="w-5 h-5" />,
      title: "AI-Powered Matching",
      description: "Advanced AI analyzes your resume and matches you with relevant jobs across 22 global platforms"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "22 Global Sources",
      description: "LinkedIn, Naukri, Wellfound, Indeed, and 18+ platforms across US, EU, UK, India, and UAE"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "24/7 Job Discovery",
      description: "Automated job hunting runs continuously while you focus on interviews"
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5" />,
      title: "Excel Reports",
      description: "Export discoveries to formatted Excel with match scores and insights"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure & Private",
      description: "Encrypted credential vault with audit logging for portal automation"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Smart Deduplication",
      description: "Advanced fingerprinting ensures no duplicate jobs across sources"
    }
  ];

  const stats = [
    { value: "22+", label: "Job Platforms" },
    { value: "500+", label: "Jobs/Day" },
    { value: "6", label: "Global Regions" },
    { value: "95%", label: "Match Accuracy" }
  ];

  const sources = [
    { name: "LinkedIn", category: "Enhanced" },
    { name: "Naukri", category: "Enhanced" },
    { name: "Wellfound", category: "Enhanced" },
    { name: "Indeed", category: "Browser" },
    { name: "Glassdoor", category: "Browser" },
    { name: "Monster", category: "Browser" },
    { name: "Shine", category: "Browser" },
    { name: "Bayt", category: "Browser" },
    { name: "StepStone", category: "Browser" },
    { name: "Totaljobs", category: "Browser" },
    { name: "ZipRecruiter", category: "Browser" },
    { name: "Remotive", category: "API" }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Navigation - Matching Dashboard Style */}
      <nav className="sticky top-0 z-50" style={{ backgroundColor: '#FAFAF8', borderBottom: '1px solid #E8E8E0' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                 style={{ backgroundColor: '#1a1a1a' }}>
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold" 
                  style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
              JobFinder AI
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                data-testid="go-to-dashboard-btn"
                style={{ 
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#666666',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  data-testid="login-btn"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="btn-primary"
                  data-testid="get-started-btn"
                  style={{ 
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    borderRadius: '50px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Dashboard Style */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" 
                 style={{ backgroundColor: '#F5F5F0', border: '1px solid #E8E8E0' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#666666' }} />
              <span className="text-sm font-medium" style={{ color: '#666666' }}>
                AI-Powered Job Discovery
              </span>
            </div>
            
            <h1 className="text-5xl font-semibold leading-tight" 
                style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
              Find Your Next Job<br />
              <span style={{ color: '#666666' }}>While You Sleep</span>
            </h1>
            
            <p className="text-lg leading-relaxed" style={{ color: '#666666' }}>
              Our AI system continuously discovers and ranks jobs from 22 global platforms, 
              matching them to your resume with 95% accuracy. No manual searching required.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={() => navigate('/register')}
                style={{ 
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '14px 32px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Discovering Jobs
              </Button>
              <Button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666666',
                  border: '1px solid #E8E8E0',
                  borderRadius: '50px',
                  padding: '14px 32px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                View Demo
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-6 pt-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-3xl font-semibold" 
                     style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#999999' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual - Dashboard Style Card */}
          <div className="relative">
            <div className="job-card" style={{ padding: '32px' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ backgroundColor: '#F5F5F0' }}>
                    <Search className="w-6 h-6" style={{ color: '#666666' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1a1a1a' }}>
                      Active Discovery
                    </h3>
                    <p className="text-sm" style={{ color: '#999999' }}>
                      Running across 22 sources
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full" 
                     style={{ backgroundColor: '#E8F5E9' }}>
                  <span className="text-xs font-medium" style={{ color: '#4CAF50' }}>
                    Live
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#666666' }}>Jobs Found</span>
                  <span className="text-2xl font-semibold" 
                        style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                    247
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-300"
                       style={{ 
                         width: '75%',
                         backgroundColor: '#1a1a1a'
                       }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#F5F5F0' }}>
                    <p className="text-xl font-semibold" style={{ color: '#1a1a1a' }}>95</p>
                    <p className="text-xs" style={{ color: '#999999' }}>New</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#F5F5F0' }}>
                    <p className="text-xl font-semibold" style={{ color: '#1a1a1a' }}>18/22</p>
                    <p className="text-xs" style={{ color: '#999999' }}>Sources</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#F5F5F0' }}>
                    <p className="text-xl font-semibold" style={{ color: '#1a1a1a' }}>96%</p>
                    <p className="text-xs" style={{ color: '#999999' }}>Match</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-3" 
              style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
            Everything You Need
          </h2>
          <p className="text-lg" style={{ color: '#666666' }}>
            Comprehensive job discovery automation in one platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="stat-card" style={{ padding: '24px' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                   style={{ backgroundColor: '#F5F5F0' }}>
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Job Sources Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-3" 
              style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
            Connected to 22 Job Platforms
          </h2>
          <p className="text-lg" style={{ color: '#666666' }}>
            We search everywhere so you don't have to
          </p>
        </div>

        <div className="job-card" style={{ padding: '32px' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sources.map((source, idx) => (
              <div key={idx} 
                   className="flex items-center justify-between p-4 rounded-lg transition-all hover:scale-105"
                   style={{ backgroundColor: '#F5F5F0', border: '1px solid #E8E8E0' }}>
                <span className="font-medium text-sm" style={{ color: '#1a1a1a' }}>
                  {source.name}
                </span>
                <span className="text-xs px-2 py-1 rounded-full" 
                      style={{ 
                        backgroundColor: source.category === 'Enhanced' ? '#E8F5E9' : '#FFF3E0',
                        color: source.category === 'Enhanced' ? '#4CAF50' : '#FF9800'
                      }}>
                  {source.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-3" 
              style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
            How It Works
          </h2>
          <p className="text-lg" style={{ color: '#666666' }}>
            Get started in 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Upload Resume",
              description: "AI extracts your skills, experience, and preferences automatically"
            },
            {
              step: "02",
              title: "Set Preferences",
              description: "Choose target roles, locations, and configure discovery schedule"
            },
            {
              step: "03",
              title: "Get Results",
              description: "Receive matched jobs daily with scores, insights, and Excel exports"
            }
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ backgroundColor: '#1a1a1a' }}>
                <span className="text-2xl font-bold text-white">{item.step}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a1a1a' }}>
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="job-card text-center" style={{ padding: '64px 32px' }}>
          <h2 className="text-4xl font-semibold mb-4" 
              style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
            Ready to Find Your Dream Job?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#666666' }}>
            Join thousands of job seekers using AI-powered automation
          </p>
          <Button
            onClick={() => navigate('/register')}
            style={{ 
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              borderRadius: '50px',
              padding: '16px 40px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: '#E8E8E0' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: '#1a1a1a' }}>
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold" style={{ color: '#1a1a1a' }}>
                JobFinder AI
              </span>
            </div>
            <p className="text-sm" style={{ color: '#999999' }}>
              © 2026 JobFinder AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
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
