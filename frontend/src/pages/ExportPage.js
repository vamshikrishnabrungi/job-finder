import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Briefcase, LayoutDashboard, Search, FileText, Settings, Clock, Key, Download, LogOut, Menu, X, FileSpreadsheet, Filter } from 'lucide-react';

// Sidebar component (matching DashboardPage design)
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
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-56 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: '#F3F2E9' }}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}><Briefcase className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>JobFinder</span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-2 rounded-lg" style={{ color: '#666666' }}><X className="w-5 h-5" /></button>
          </div>
          <nav className="flex-1 px-4 py-2 space-y-1">
            {navItems.map((item) => (<Link key={item.path} to={item.path} onClick={onClose} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>{item.icon}<span>{item.label}</span></Link>))}
          </nav>
          <div className="p-4">
            <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E7DE' }}><span style={{ color: '#1a1a1a', fontWeight: 500 }}>{user?.name?.charAt(0)?.toUpperCase() || 'T'}</span></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{user?.name || 'User'}</p><p className="text-xs truncate" style={{ color: '#999999' }}>{user?.email}</p></div>
            </div>
            <button onClick={logout} className="nav-item w-full" style={{ color: '#EF4444' }}><LogOut className="w-5 h-5" /><span>Logout</span></button>
          </div>
        </div>
      </aside>
    </>
  );
};

const ExportPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [minScore, setMinScore] = useState('0');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/stats`, { headers: getAuthHeaders() });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (parseInt(minScore) > 0) params.append('min_score', minScore);

      const response = await axios.get(`${API_URL}/export/excel?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `job_listings_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error('Failed to export jobs');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F3F2E9' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30" style={{ backgroundColor: 'rgba(243, 242, 233, 0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="px-6 py-4 flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: '#666666' }}><Menu className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>Export</h1>
              <p className="text-sm" style={{ color: '#999999' }}>Download your job listings as Excel files</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-4xl">
          {/* Export Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-rose-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Export to Excel</h2>
                <p className="text-zinc-500">Download all discovered jobs in a structured spreadsheet</p>
              </div>
            </div>

            {/* Stats Summary */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-zinc-50">
                  <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
                  <p className="text-sm text-zinc-500">Total Jobs</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50">
                  <p className="text-2xl font-bold text-rose-600">{stats.new}</p>
                  <p className="text-sm text-zinc-500">New</p>
                </div>
                <div className="p-4 rounded-xl bg-violet-50">
                  <p className="text-2xl font-bold text-violet-600">{stats.saved}</p>
                  <p className="text-sm text-zinc-500">Saved</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50">
                  <p className="text-2xl font-bold text-emerald-600">{stats.applied}</p>
                  <p className="text-sm text-zinc-500">Applied</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Export Filters
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-600">Job Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 rounded-xl" data-testid="export-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="new">New Only</SelectItem>
                      <SelectItem value="saved">Saved Only</SelectItem>
                      <SelectItem value="applied">Applied Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-600">Minimum Match Score</label>
                  <Select value={minScore} onValueChange={setMinScore}>
                    <SelectTrigger className="h-11 rounded-xl" data-testid="export-score-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Scores</SelectItem>
                      <SelectItem value="50">50% and above</SelectItem>
                      <SelectItem value="60">60% and above</SelectItem>
                      <SelectItem value="70">70% and above</SelectItem>
                      <SelectItem value="80">80% and above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={exporting || !stats?.total}
              className="w-full h-14 rounded-xl bg-zinc-900 text-white font-semibold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              data-testid="export-excel-btn"
            >
              {exporting ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Generating Excel...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Excel File
                </>
              )}
            </Button>

            {!stats?.total && (
              <p className="text-center text-zinc-500 mt-4">No jobs to export. Discover jobs first!</p>
            )}
          </div>

          {/* Export Info */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-zinc-900 mb-4" style={{ fontFamily: 'Outfit' }}>What's included in the export?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-zinc-600">
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>Source & Company Information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>Job Title & Location</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>Remote Status (Remote/Hybrid/On-site)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>Posted Date</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>AI Match Score & Matched Skills</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>Salary Information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>Application Status</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span>Direct Application Links</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExportPage;
