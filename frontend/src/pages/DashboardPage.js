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
    CheckCircle2,
    Bookmark,
    RefreshCw,
    ArrowUpRight,
    ChevronDown,
    User,
    GraduationCap
} from 'lucide-react';

// Sidebar component matching reference exactly
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
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 z-50
          transition-transform duration-300 lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
                style={{ backgroundColor: '#F3F2E9' }}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 flex items-center justify-between">
                        <Link to="/dashboard" className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: '#1a1a1a' }}
                            >
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                                JobFinder
                            </span>
                        </Link>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg"
                            style={{ backgroundColor: '#F5F5F0' }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
                    <div className="p-4" style={{ borderTop: '1px solid #E8E8E0' }}>
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                                style={{ backgroundColor: '#F5F5F0', color: '#666666' }}
                            >
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-xs truncate" style={{ color: '#999999' }}>
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors"
                            style={{ color: '#dc2626' }}
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

// Profile Card Component with Match Score
const ProfileCard = ({ stats, user }) => {
    const [expanded, setExpanded] = useState(false);

    const matchBreakdown = [
        { label: 'Education', value: 11, colorClass: 'coral' },
        { label: 'Experience', value: 8, colorClass: 'green' },
        { label: 'Salary', value: 10, colorClass: 'coral' },
        { label: 'Skills', value: 15, colorClass: 'green' },
    ];

    return (
        <div className="profile-card">
            <div className="p-6 text-center">
                <div
                    className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: '#F5F5F0', border: '2px solid #E8E8E0' }}
                >
                    <User className="w-12 h-12" style={{ color: '#999999' }} />
                </div>
                <h2 className="text-xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                    {user?.name || 'Job Seeker'}
                </h2>
                <p className="text-sm mt-1" style={{ color: '#999999' }}>
                    Active Job Seeker
                </p>
                <div className="mt-3">
                    <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: '#F5F5F0', color: '#666666' }}
                    >
                        <GraduationCap className="w-3 h-3" />
                        Profile Complete
                    </span>
                </div>
            </div>

            {/* Job Role */}
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold" style={{ color: '#1a1a1a' }}>Software Engineer</p>
                        <p className="text-sm" style={{ color: '#999999' }}>5 years of experience</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#1a1a1a' }}
                        >
                            <FileText className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expandable Basic Information */}
            <div className="expandable-section">
                <div
                    className="expandable-header"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span className="font-medium" style={{ color: '#1a1a1a' }}>Basic Information</span>
                    <ChevronDown
                        className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        style={{ color: '#999999' }}
                    />
                </div>
                {expanded && (
                    <div className="px-6 pb-4 space-y-2 text-sm" style={{ color: '#666666' }}>
                        <p>Email: {user?.email}</p>
                        <p>Location: Remote</p>
                        <p>Member since: 2025</p>
                    </div>
                )}
            </div>

            {/* Job Match Score */}
            <div className="match-section">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-medium" style={{ color: '#1a1a1a' }}>Job Match</span>
                    <div className="text-right">
                        <span className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                            {stats?.average_match_score || 96}%
                        </span>
                        <p className="text-xs" style={{ color: '#999999' }}>Match Rate</p>
                    </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3">
                    {matchBreakdown.map((item, idx) => (
                        <div key={idx} className="match-row">
                            <span className="match-label">{item.label}</span>
                            <span className="match-value">•{item.value}%</span>
                            <div className="progress-bar">
                                <div
                                    className={`progress-bar-fill ${item.colorClass}`}
                                    style={{ width: `${item.value * 5}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [discovering, setDiscovering] = useState(false);
    const [runStatus, setRunStatus] = useState(null); // null, 'running', 'idle'
    const [currentRun, setCurrentRun] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
        checkRunStatus(); // Check initial status
    }, []);

    // Poll for run status when active
    useEffect(() => {
        let interval;
        if (runStatus === 'running') {
            interval = setInterval(() => {
                checkRunStatus();
            }, 3000); // Check every 3 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [runStatus]);

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

    const checkRunStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/runs/status/current`, { headers: getAuthHeaders() });
            setRunStatus(response.data.status);
            setCurrentRun(response.data.run);
            
            // If run completed, refresh dashboard data
            if (currentRun && currentRun.status === 'running' && response.data.status === 'idle') {
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error checking run status:', error);
        }
    };

    const handleDiscoverJobs = async () => {
        setDiscovering(true);
        try {
            const response = await axios.post(`${API_URL}/runs/start`, {}, { headers: getAuthHeaders() });
            toast.success(`Job discovery started! Finding jobs from 14 sources...`);
            setRunStatus('running');
            checkRunStatus(); // Immediate status check
        } catch (error) {
            console.error('Error starting job discovery:', error);
            let errorMessage = 'Failed to start job discovery';
            
            // Handle different error response formats
            if (error.response?.data?.detail) {
                if (typeof error.response.data.detail === 'string') {
                    errorMessage = error.response.data.detail;
                } else if (Array.isArray(error.response.data.detail)) {
                    // Pydantic validation errors
                    errorMessage = error.response.data.detail
                        .map(err => `${err.loc?.join('.')}: ${err.msg}`)
                        .join(', ');
                }
            }
            
            toast.error(errorMessage);
        } finally {
            setDiscovering(false);
        }
    };

    const handleStopRun = async () => {
        if (!currentRun) return;
        
        try {
            await axios.post(`${API_URL}/runs/stop/${currentRun.id}`, {}, { headers: getAuthHeaders() });
            toast.success('Job discovery stopped');
            setRunStatus('idle');
            setCurrentRun(null);
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to stop job discovery');
        }
    };

    const statCards = [
        { label: 'Total Jobs', value: stats?.total || 0, icon: <Briefcase className="w-5 h-5" /> },
        { label: 'New Jobs', value: stats?.new || 0, icon: <TrendingUp className="w-5 h-5" /> },
        { label: 'Saved', value: stats?.saved || 0, icon: <Bookmark className="w-5 h-5" /> },
        { label: 'Applied', value: stats?.applied || 0, icon: <CheckCircle2 className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#F3F2E9' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 min-w-0">
                {/* Header */}
                <header
                    className="sticky top-0 z-30"
                    style={{
                        backgroundColor: 'rgba(243, 242, 233, 0.95)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg"
                                style={{ backgroundColor: '#FAFAF8' }}
                            >
                                <Menu className="w-5 h-5" style={{ color: '#666666' }} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                                    Dashboard
                                </h1>
                                <p className="text-sm" style={{ color: '#999999' }}>
                                    Welcome back, {user?.name?.split(' ')[0] || 'there'}!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                className="p-2 rounded-full"
                                style={{ backgroundColor: '#FAFAF8', border: '1px solid #E8E8E0' }}
                            >
                                <Search className="w-5 h-5" style={{ color: '#666666' }} />
                            </button>
                            
                            {runStatus === 'running' ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
                                        <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#4CAF50' }} />
                                        <span className="text-sm font-medium" style={{ color: '#4CAF50' }}>
                                            {currentRun?.progress?.jobs_found || 0} jobs found
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleStopRun}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                        data-testid="stop-run-btn"
                                    >
                                        Stop
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleDiscoverJobs}
                                    disabled={discovering}
                                    className="btn-primary"
                                    data-testid="discover-jobs-btn"
                                >
                                    {discovering ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            Run Now
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-6">
                    <div className="grid lg:grid-cols-4 gap-6">
                        {/* Left Column - Profile Card */}
                        <div className="lg:col-span-1">
                            <ProfileCard stats={stats} user={user} />
                        </div>

                        {/* Right Column - Main Content */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {statCards.map((stat, idx) => (
                                    <div
                                        key={idx}
                                        className="stat-card animate-fade-in"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                            style={{ backgroundColor: '#F5F5F0', color: '#666666' }}
                                        >
                                            {stat.icon}
                                        </div>
                                        <p className="text-3xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                                            {loading ? '-' : stat.value}
                                        </p>
                                        <p className="text-sm mt-1" style={{ color: '#999999' }}>{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Job Discovery Progress Card */}
                            {runStatus === 'running' && currentRun && (
                                <div className="job-card animate-fade-in" style={{ backgroundColor: '#F5F9FF', border: '2px solid #E3F2FD' }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#1976D2' }}>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Job Discovery In Progress
                                            </h3>
                                            <p className="text-sm mt-1" style={{ color: '#666666' }}>
                                                Scanning job platforms across the globe...
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleStopRun}
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Stop
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span style={{ color: '#666666' }}>Progress</span>
                                            <span className="font-medium" style={{ color: '#1a1a1a' }}>
                                                {currentRun.progress?.completed_sources || 0} / {currentRun.progress?.total_sources || 14} sources
                                            </span>
                                        </div>
                                        
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${((currentRun.progress?.completed_sources || 0) / (currentRun.progress?.total_sources || 14)) * 100}%`
                                                }}
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4 pt-2">
                                            <div className="text-center">
                                                <p className="text-2xl font-medium" style={{ color: '#1976D2' }}>
                                                    {currentRun.progress?.jobs_found || 0}
                                                </p>
                                                <p className="text-xs" style={{ color: '#999999' }}>Jobs Found</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-medium" style={{ color: '#4CAF50' }}>
                                                    {currentRun.progress?.jobs_new || 0}
                                                </p>
                                                <p className="text-xs" style={{ color: '#999999' }}>New Jobs</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-medium" style={{ color: '#666666' }}>
                                                    {currentRun.progress?.current_source || 'Initializing...'}
                                                </p>
                                                <p className="text-xs" style={{ color: '#999999' }}>Current Source</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Jobs */}
                            <div className="job-card">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>
                                        Recent Jobs
                                    </h3>
                                    <Link
                                        to="/jobs"
                                        className="text-sm font-medium flex items-center gap-1"
                                        style={{ color: '#666666' }}
                                        data-testid="view-all-jobs-link"
                                    >
                                        View all <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="divide-y" style={{ borderColor: '#F0F0E8' }}>
                                    {loading ? (
                                        <div className="py-8 text-center" style={{ color: '#999999' }}>Loading...</div>
                                    ) : recentJobs.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Briefcase className="w-12 h-12 mx-auto mb-4" style={{ color: '#E8E8E0' }} />
                                            <p style={{ color: '#666666' }}>No jobs discovered yet.</p>
                                            <p className="text-sm mt-1" style={{ color: '#999999' }}>
                                                Upload your resume and click "Discover Jobs" to get started.
                                            </p>
                                        </div>
                                    ) : (
                                        recentJobs.map((job, idx) => (
                                            <div
                                                key={job.id}
                                                className="py-4 first:pt-0 last:pb-0 transition-colors animate-fade-in"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                        style={{ backgroundColor: '#F5F5F0' }}
                                                    >
                                                        <Briefcase className="w-5 h-5" style={{ color: '#999999' }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold truncate" style={{ color: '#1a1a1a' }}>{job.title}</h4>
                                                        <p className="text-sm" style={{ color: '#999999' }}>{job.company} · {job.location}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                                                            style={{
                                                                backgroundColor: job.match_score >= 80 ? '#1a1a1a' : '#F5F5F0',
                                                                color: job.match_score >= 80 ? '#ffffff' : '#1a1a1a'
                                                            }}
                                                        >
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
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: '#F5F5F0' }}
                                    >
                                        <FileText className="w-6 h-6" style={{ color: '#666666' }} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold" style={{ color: '#1a1a1a' }}>Upload Resume</h4>
                                        <p className="text-sm" style={{ color: '#999999' }}>Get AI-powered job matches</p>
                                    </div>
                                </Link>

                                <Link to="/preferences" className="job-card flex items-center gap-4" data-testid="quick-action-preferences">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: '#F5F5F0' }}
                                    >
                                        <Settings className="w-6 h-6" style={{ color: '#666666' }} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold" style={{ color: '#1a1a1a' }}>Set Preferences</h4>
                                        <p className="text-sm" style={{ color: '#999999' }}>Customize your job search</p>
                                    </div>
                                </Link>

                                <Link to="/schedule" className="job-card flex items-center gap-4" data-testid="quick-action-schedule">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: '#F5F5F0' }}
                                    >
                                        <Clock className="w-6 h-6" style={{ color: '#666666' }} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold" style={{ color: '#1a1a1a' }}>Configure Schedule</h4>
                                        <p className="text-sm" style={{ color: '#999999' }}>Automate your job search</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
