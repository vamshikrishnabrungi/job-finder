import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  Target, 
  Clock, 
  FileSpreadsheet, 
  Globe, 
  Shield,
  Sparkles,
  ArrowRight,
  Search,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "AI-Powered Matching",
      description: "Advanced algorithms analyze your resume and match you with the most relevant opportunities"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Global Discovery",
      description: "Access jobs from 22+ platforms across US, UK, India, UAE, Canada, and Germany"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "24/7 Automation",
      description: "Continuous job hunting while you focus on interviews and career growth"
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5" />,
      title: "Excel Reports",
      description: "Comprehensive exports with match scores, insights, and application tracking"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure & Private",
      description: "Enterprise-grade encryption for your credentials and personal information"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Smart Insights",
      description: "Real-time analytics on job market trends and salary benchmarks"
    }
  ];

  const teamMembers = [
    { name: "Sarah Chen", role: "Senior Software Engineer", company: "Google" },
    { name: "Michael Park", role: "Product Manager", company: "Microsoft" },
    { name: "Priya Sharma", role: "Data Scientist", company: "Amazon" }
  ];

  const companies = [
    "LinkedIn", "Indeed", "Naukri", "Glassdoor", "Wellfound", "Monster"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-light tracking-tight text-gray-900">
              JobFinder AI
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-light">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Product</a>
            <a href="#sources" className="text-gray-600 hover:text-gray-900 transition-colors">Services</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">Career</a>
            <a href="#cta" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#footer" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
          </div>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-light hover:bg-gray-800 transition-all"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 text-sm font-light text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-light hover:bg-gray-800 transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-7xl md:text-8xl font-extralight tracking-tight text-gray-900 mb-8 leading-[0.95]">
              Where Job Discovery<br />
              <span className="font-light">is Automated.</span>
            </h1>
            <p className="text-xl font-light text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              We bring together the best of AI and automation to continuously discover<br />
              and rank job opportunities tailored to your unique profile.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 bg-black text-white rounded-full text-sm font-light hover:bg-gray-800 transition-all shadow-sm"
              >
                Start Discovering
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 border border-gray-200 text-gray-700 rounded-full text-sm font-light hover:border-gray-300 transition-all"
              >
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-extralight text-gray-900 mb-2">22+</div>
              <div className="text-sm font-light text-gray-500">Job Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extralight text-gray-900 mb-2">500+</div>
              <div className="text-sm font-light text-gray-500">Jobs Per Day</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extralight text-gray-900 mb-2">6</div>
              <div className="text-sm font-light text-gray-500">Global Regions</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extralight text-gray-900 mb-2">95%</div>
              <div className="text-sm font-light text-gray-500">Match Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section - Card Style */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Image/Visual */}
            <div className="relative">
              <div className="bg-gray-50 rounded-3xl p-12 shadow-sm border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-light text-gray-500">Active Discovery</div>
                      <div className="text-lg font-light text-gray-900">Running across 22 sources</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-8">
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                      <div className="text-3xl font-light text-gray-900 mb-1">247</div>
                      <div className="text-xs font-light text-gray-500">Jobs Found</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                      <div className="text-3xl font-light text-gray-900 mb-1">18/22</div>
                      <div className="text-xs font-light text-gray-500">Sources</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                      <div className="text-3xl font-light text-gray-900 mb-1">96%</div>
                      <div className="text-xs font-light text-gray-500">Match</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-black h-1.5 rounded-full transition-all" style={{ width: '75%' }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-light text-gray-500">
                      <span>Progress</span>
                      <span>75%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div>
              <h2 className="text-5xl md:text-6xl font-extralight text-gray-900 mb-6 leading-tight">
                Efficiently transform your<br />
                <span className="font-light">job search experience.</span>
              </h2>
              <p className="text-lg font-light text-gray-500 mb-8 leading-relaxed">
                Modern job hunting that adapts to your needs. Our AI-powered platform continuously scans 22 global job boards, matches opportunities to your profile, and delivers curated results—all while you sleep.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 text-sm font-light text-gray-900 hover:gap-3 transition-all"
              >
                Learn more <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extralight text-gray-900 mb-4">
              Everything you need.
            </h2>
            <p className="text-lg font-light text-gray-500">
              Comprehensive automation for modern job seekers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-6 text-gray-700">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm font-light text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/Profile Cards Section */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extralight text-gray-900 mb-4">
              The help you Need,<br />When you Need it.
            </h2>
            <div className="flex items-center justify-center gap-3 mt-8">
              <button className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-light text-gray-700 hover:border-gray-300 transition-colors">
                Our Team
              </button>
              <button className="px-6 py-2 text-sm font-light text-gray-500 hover:text-gray-900 transition-colors">
                Customer Support
              </button>
              <button className="px-6 py-2 text-sm font-light text-gray-500 hover:text-gray-900 transition-colors">
                Strategy Group
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="group">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto" />
                    <div className="absolute bottom-0 right-1/2 translate-x-16">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-light text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-sm font-light text-gray-500 mb-1">{member.role}</p>
                    <p className="text-xs font-light text-gray-400">{member.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Sources */}
      <section id="sources" className="py-24 px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extralight text-gray-900 mb-4">
              Connected to 22+ platforms.
            </h2>
            <p className="text-lg font-light text-gray-500">
              We search everywhere, so you don't have to
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {companies.map((company, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 flex items-center justify-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-sm font-light text-gray-900">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-extralight text-gray-900 mb-4">
              How it works.
            </h2>
            <p className="text-lg font-light text-gray-500">
              Three simple steps to automated job discovery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: "01", title: "Upload Resume", desc: "AI extracts your skills, experience, and career preferences automatically" },
              { num: "02", title: "Set Preferences", desc: "Choose target roles, locations, and configure your discovery schedule" },
              { num: "03", title: "Get Results", desc: "Receive matched jobs daily with scores, insights, and Excel exports" }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="text-7xl font-extralight text-gray-200 mb-6">{step.num}</div>
                <h3 className="text-2xl font-light text-gray-900 mb-4">{step.title}</h3>
                <p className="text-sm font-light text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-32 px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-extralight text-white mb-6 leading-tight">
            Ready to automate<br />your job search?
          </h2>
          <p className="text-lg font-light text-gray-400 mb-12">
            Join thousands of professionals using AI-powered job discovery
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-white text-gray-900 rounded-full text-sm font-light hover:bg-gray-100 transition-all shadow-lg"
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="py-16 px-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-light text-gray-900">JobFinder AI</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm font-light text-gray-500">
              <a href="#" className="hover:text-gray-900 transition-colors">Product</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Services</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Career</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#" className="hover:text-gray-900 transition-colors">About</a>
            </div>

            <p className="text-sm font-light text-gray-400">
              © 2026 JobFinder AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;