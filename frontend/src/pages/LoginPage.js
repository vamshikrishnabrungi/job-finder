import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Briefcase, Mail, Lock, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Left Panel - Form */}
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
              Welcome back
            </h1>
            <p className="text-zinc-500">
              Sign in to continue your job search
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  data-testid="login-email-input"
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
                  data-testid="login-password-input"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-zinc-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-rose-600 font-medium hover:text-rose-700" data-testid="register-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-lg">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-rose-200 to-pink-200 rounded-3xl blur-2xl opacity-50"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-zinc-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
                    AI-Powered Matching
                  </h3>
                  <p className="text-zinc-500">Find your perfect job fit</p>
                </div>
              </div>
              <div className="space-y-3">
                {[87, 92, 78].map((score, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-1000"
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-zinc-700">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
