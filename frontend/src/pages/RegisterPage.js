import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Briefcase, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "AI-powered job matching",
    "24/7 automated job hunting",
    "Global MNC coverage",
    "Excel export & tracking"
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold text-zinc-900 mb-6" style={{ fontFamily: 'Outfit' }}>
            Start Your AI-Powered Job Search Today
          </h2>
          <p className="text-lg text-zinc-600 mb-8">
            Join thousands of professionals who've transformed their job search with intelligent automation.
          </p>
          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-zinc-700 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
              JobFinder AI
            </span>
          </Link>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2" style={{ fontFamily: 'Outfit' }}>
              Create your account
            </h1>
            <p className="text-zinc-500">
              Get started with AI-powered job discovery
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-700 font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="John Doe"
                  data-testid="register-name-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="you@example.com"
                  data-testid="register-email-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="••••••••"
                  data-testid="register-password-input"
                />
              </div>
              <p className="text-xs text-zinc-400">Minimum 6 characters</p>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-600 font-medium hover:text-rose-700" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
