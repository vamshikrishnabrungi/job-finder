import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders, getMatchScoreColor, getStatusColor, formatDate } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ExternalLink,
  MoreVertical,
  Bookmark,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  RefreshCw
} from 'lucide-react';

// Sidebar component (same as DashboardPage)
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
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-zinc-200 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>JobFinder AI</span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={onClose} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                {item.icon}<span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-zinc-200">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                <span className="text-rose-600 font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="nav-item w-full text-red-600 hover:bg-red-50 hover:text-red-700">
              <LogOut className="w-5 h-5" /><span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const JobsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '100');
      
      const response = await axios.get(`${API_URL}/jobs?${params.toString()}`, { headers: getAuthHeaders() });
      setJobs(response.data.jobs || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverJobs = async () => {
    setDiscovering(true);
    try {
      const response = await axios.post(`${API_URL}/jobs/discover`, {}, { headers: getAuthHeaders() });
      toast.success(`Discovered ${response.data.new_jobs_count} new jobs!`);
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to discover jobs');
    } finally {
      setDiscovering(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await axios.put(`${API_URL}/jobs/${jobId}/status`, { status }, { headers: getAuthHeaders() });
      toast.success(`Job marked as ${status}`);
      fetchJobs();
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await axios.delete(`${API_URL}/jobs/${jobId}`, { headers: getAuthHeaders() });
      toast.success('Job removed');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(query) ||
      job.company?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Jobs</h1>
                <p className="text-sm text-zinc-500">{total} jobs discovered</p>
              </div>
            </div>
            <Button onClick={handleDiscoverJobs} disabled={discovering} className="btn-primary flex items-center gap-2" data-testid="discover-jobs-btn">
              {discovering ? <><RefreshCw className="w-4 h-4 animate-spin" />Discovering...</> : <><Search className="w-4 h-4" />Discover Jobs</>}
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-zinc-200"
                data-testid="search-jobs-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-11 rounded-xl" data-testid="status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jobs Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="job-card animate-pulse">
                  <div className="h-6 bg-zinc-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-zinc-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-700 mb-2">No jobs found</h3>
              <p className="text-zinc-500 mb-6">
                {jobs.length === 0 ? 'Start by discovering jobs based on your resume.' : 'Try adjusting your filters.'}
              </p>
              {jobs.length === 0 && (
                <Button onClick={handleDiscoverJobs} disabled={discovering} className="btn-primary" data-testid="empty-discover-btn">
                  Discover Jobs
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job, idx) => (
                <div key={job.id} className="job-card animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }} data-testid={`job-card-${job.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 truncate" title={job.title}>{job.title}</h3>
                      <p className="text-sm text-zinc-500">{job.company}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-zinc-100 rounded-lg" data-testid={`job-menu-${job.id}`}>
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'saved')}>
                          <Bookmark className="w-4 h-4 mr-2" /> Save
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'applied')}>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Applied
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'rejected')}>
                          <XCircle className="w-4 h-4 mr-2" /> Mark Rejected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
                    <span>{job.location}</span>
                    {job.remote_status && job.remote_status !== 'unknown' && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{job.remote_status}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getMatchScoreColor(job.match_score)}`}>
                      {job.match_score}% Match
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  
                  {job.matched_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.matched_skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                      {job.matched_skills.length > 3 && (
                        <span className="px-2 py-0.5 text-zinc-400 text-xs">
                          +{job.matched_skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <span className="text-xs text-zinc-400">{job.source}</span>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center gap-1"
                      data-testid={`view-job-${job.id}`}
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobsPage;
