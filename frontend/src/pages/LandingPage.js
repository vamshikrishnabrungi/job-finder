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
                className="px-8 py-3.5 bg-black text-white rounded-full text-sm font-light hover:bg-gray-800 transition-all shadow-sm inline-flex items-center gap-2"
              >
                Build career <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 border border-gray-200 text-gray-700 rounded-full text-sm font-light hover:border-gray-300 transition-all inline-flex items-center gap-2"
              >
                Contact us <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Card Section with Floating Profiles */}
      <section className="pb-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 rounded-[2.5rem] overflow-hidden shadow-xl" style={{ minHeight: '600px' }}>
            {/* Background Image Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400/30 to-transparent" />
            
            {/* Top Left Tags */}
            <div className="absolute top-8 left-8 flex items-center gap-3">
              <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-light text-gray-600">
                EVENT
              </span>
              <button className="px-5 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-light text-gray-900 inline-flex items-center gap-2 hover:bg-white transition-colors">
                Job Discovery <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Top Right Button */}
            <div className="absolute top-8 right-8">
              <button className="px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-light text-gray-900 inline-flex items-center gap-2 hover:bg-white transition-colors">
                Match yours <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Left Content */}
            <div className="absolute bottom-0 left-0 p-12 max-w-xl">
              <span className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-xs font-light text-gray-600 mb-6">
                Job Opportunities
              </span>
              
              <h2 className="text-5xl font-extralight text-white mb-4 leading-tight drop-shadow-lg">
                Efficiently transform your<br />
                job search experience.
              </h2>
              
              <p className="text-base font-light text-white/90 leading-relaxed drop-shadow">
                Modern AI-powered Job Discovery Platform that automates interview<br />
                scheduling to perfection, so you stay focused on the right talent.
              </p>
            </div>

            {/* Floating Profile Cards - Right Side */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 space-y-4">
              {/* Row 1 */}
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Floyd Miles</div>
                    <div className="text-xs font-light text-gray-500">CEO Specialist</div>
                  </div>
                </div>
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Brooklyn Simmons</div>
                    <div className="text-xs font-light text-gray-500">Barone LLC</div>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-4 pl-8">
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Eleanor Pena</div>
                    <div className="text-xs font-light text-gray-500">Marketing Coord.</div>
                  </div>
                </div>
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Savannah Nguyen</div>
                    <div className="text-xs font-light text-gray-500">Medical Assistant</div>
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Kristin Watson</div>
                    <div className="text-xs font-light text-gray-500">Acme Co.</div>
                  </div>
                </div>
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Ronald Richards</div>
                    <div className="text-xs font-light text-gray-500">Abebing Ltd.</div>
                  </div>
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex items-center gap-4 pl-8">
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Esther Howard</div>
                    <div className="text-xs font-light text-gray-500">President of Sales</div>
                  </div>
                </div>
                <div className="bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-light text-gray-900">Courtney Henry</div>
                    <div className="text-xs font-light text-gray-500">Biffco Enterprises</div>
                  </div>
                </div>
              </div>
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