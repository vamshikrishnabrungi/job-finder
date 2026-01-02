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
          <div className="relative bg-gradient-to-br from-[#c4b5a0] via-[#b8a899] to-[#ada294] rounded-[2.5rem] overflow-hidden shadow-2xl" style={{ minHeight: '650px' }}>
            
            {/* Main Image - Professional at desk */}
            <div className="absolute right-0 top-0 bottom-0 w-2/3">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80" 
                alt="Professional"
                className="w-full h-full object-cover object-center"
                style={{ objectPosition: '60% center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#c4b5a0]/20 to-[#c4b5a0]" />
            </div>

            {/* Top Left Tags */}
            <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
              <span className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-xs font-normal text-gray-600 shadow-sm">
                EVENT
              </span>
              <button className="px-5 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-normal text-gray-900 inline-flex items-center gap-2 hover:bg-white transition-all shadow-sm">
                Job Discovery <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Top Right Button */}
            <div className="absolute top-8 right-8 z-10">
              <button className="px-6 py-2.5 bg-white/95 backdrop-blur-sm rounded-full text-sm font-normal text-gray-900 inline-flex items-center gap-2 hover:bg-white transition-all shadow-sm">
                Match yours <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Left Content */}
            <div className="absolute bottom-0 left-0 p-12 max-w-xl z-10">
              <span className="inline-block px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-normal text-gray-700 mb-6 shadow-sm">
                Job Opportunities
              </span>
              
              <h2 className="text-5xl font-extralight text-white mb-5 leading-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
                Efficiently transform your<br />
                job search experience.
              </h2>
              
              <p className="text-base font-light text-white leading-relaxed" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}>
                Modern AI-powered Job Discovery Platform that automates interview<br />
                scheduling to perfection, so you stay focused on the right talent.
              </p>
            </div>

            {/* Floating Profile Cards - Right Side with Real Images */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-4 z-20">
              {/* Row 1 */}
              <div className="flex items-center gap-4 justify-end">
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
                    alt="Floyd Miles"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Floyd Miles</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">CEO Specialist</div>
                  </div>
                </div>
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                    alt="Brooklyn Simmons"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Brooklyn Simmons</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">Barone LLC</div>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-4 justify-end pr-12">
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" 
                    alt="Eleanor Pena"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Eleanor Pena</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">Marketing Coord.</div>
                  </div>
                </div>
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" 
                    alt="Savannah Nguyen"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Savannah Nguyen</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">Medical Assistant</div>
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center gap-4 justify-end">
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" 
                    alt="Kristin Watson"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Kristin Watson</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">Acme Co.</div>
                  </div>
                </div>
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" 
                    alt="Ronald Richards"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Ronald Richards</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">Abebing Ltd.</div>
                  </div>
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex items-center gap-4 justify-end pr-12">
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop" 
                    alt="Esther Howard"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Esther Howard</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">President of Sales</div>
                  </div>
                </div>
                <div className="bg-white rounded-full pl-4 pr-6 py-3 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" 
                    alt="Courtney Henry"
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-left pr-2">
                    <div className="text-sm font-normal text-gray-900 whitespace-nowrap">Courtney Henry</div>
                    <div className="text-xs font-light text-gray-500 whitespace-nowrap">Biffco Enterprises</div>
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