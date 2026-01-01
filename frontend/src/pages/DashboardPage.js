import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Briefcase,
  LayoutDashboard,
  Search,
  FileText,
  Settings,
  Clock,
  Key,
  Download,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Target,
  CheckCircle2,
  Bookmark,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';

// Sidebar component
const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/jobs', icon: <Search className="w-5 h-5" />, label: 'Jobs' },
    { path: '/resume', icon: <FileText className="w-5 h-5" />, label: 'Resume' },
    { path: '/preferences', icon: <Settings className="w-5 h-5" />, label: 'Preferences' },
    { path: '/schedule', icon: <Clock className="w-5 h-5" />, label: 'Schedule' },
    { path: '/credentials', icon: <Key className="w-5 h-5" />, label: 'Credentials' },
    { path: '/export', icon: <Download className="w-5 h-5" />, label: 'Export' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-zinc-200 z-50
        transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
                JobFinder AI
              </span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t border-zinc-200">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                <span className="text-rose-600 font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="nav-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        axios.get(`${API_URL}/jobs/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/jobs?limit=5`, { headers: getAuthHeaders() })
      ]);
      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.jobs || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverJobs = async () => {
    setDiscovering(true);
    try {
      const response = await axios.post(`${API_URL}/jobs/discover`, {}, { headers: getAuthHeaders() });
      toast.success(`Discovered ${response.data.new_jobs_count} new jobs!`);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to discover jobs');
    } finally {
      setDiscovering(false);
    }
  };

  const statCards = [
    { label: 'Total Jobs', value: stats?.total || 0, icon: <Briefcase className="w-5 h-5" />, color: 'bg-rose-50 text-rose-600' },
    { label: 'New Jobs', value: stats?.new || 0, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Saved', value: stats?.saved || 0, icon: <Bookmark className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
    { label: 'Applied', value: stats?.applied || 0, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
                  Dashboard
                </h1>
                <p className="text-sm text-zinc-500">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</p>
              </div>
            </div>
            <Button
              onClick={handleDiscoverJobs}
              disabled={discovering}
              className="btn-primary flex items-center gap-2"
              data-testid="discover-jobs-btn"
            >
              {discovering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Discover Jobs
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, idx) => (
              <div key={idx} className="stat-card animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
                  {loading ? '-' : stat.value}
                </p>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Match Score */}
          {stats?.average_match_score > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
                    Average Match Score
                  </h3>
                  <p className="text-sm text-zinc-500">Across all discovered jobs</p>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" />
                  <span className="text-3xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
                    {stats.average_match_score}%
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${stats.average_match_score}%` }}
                />
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div className="rounded-2xl border border-zinc-200 bg-white">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>
                Recent Jobs
              </h3>
              <Link 
                to="/jobs" 
                className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                data-testid="view-all-jobs-link"
              >
                View all <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {loading ? (
                <div className="p-6 text-center text-zinc-500">Loading...</div>
              ) : recentJobs.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <p className="text-zinc-500">No jobs discovered yet.</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Upload your resume and click "Discover Jobs" to get started.
                  </p>
                </div>
              ) : (
                recentJobs.map((job, idx) => (
                  <div 
                    key={job.id} 
                    className="p-4 hover:bg-zinc-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-zinc-900 truncate">{job.title}</h4>
                        <p className="text-sm text-zinc-500">{job.company} · {job.location}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          job.match_score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                          job.match_score >= 60 ? 'bg-blue-50 text-blue-700' :
                          'bg-zinc-100 text-zinc-600'
                        }`}>
                          {job.match_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/resume" className="job-card flex items-center gap-4" data-testid="quick-action-resume">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Upload Resume</h4>
                <p className="text-sm text-zinc-500">Get AI-powered job matches</p>
              </div>
            </Link>
            
            <Link to="/preferences" className="job-card flex items-center gap-4" data-testid="quick-action-preferences">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <Settings className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Set Preferences</h4>
                <p className="text-sm text-zinc-500">Customize your job search</p>
              </div>
            </Link>
            
            <Link to="/schedule" className="job-card flex items-center gap-4" data-testid="quick-action-schedule">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Configure Schedule</h4>
                <p className="text-sm text-zinc-500">Automate your job search</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
