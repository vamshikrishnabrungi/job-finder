import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Briefcase, LayoutDashboard, Search, FileText, Settings, Clock, Key, Download, LogOut, Menu, X, Plus, Trash2, Save } from 'lucide-react';

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

const PreferencesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    preferred_roles: [],
    preferred_industries: [],
    excluded_companies: [],
    included_companies: [],
    preferred_locations: [],
    min_salary: 0,
    max_salary: 0,
    seniority_levels: [],
    tech_stack: [],
    remote_only: false,
    posted_within_days: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newExcludedCompany, setNewExcludedCompany] = useState('');
  const [newIncludedCompany, setNewIncludedCompany] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get(`${API_URL}/preferences`, { headers: getAuthHeaders() });
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/preferences`, preferences, { headers: getAuthHeaders() });
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (field, value, setValue) => {
    if (value.trim() && !preferences[field].includes(value.trim())) {
      setPreferences({ ...preferences, [field]: [...preferences[field], value.trim()] });
      setValue('');
    }
  };

  const removeItem = (field, index) => {
    setPreferences({ ...preferences, [field]: preferences[field].filter((_, i) => i !== index) });
  };

  const TagInput = ({ label, field, value, setValue, placeholder }) => (
    <div className="space-y-3">
      <Label className="text-zinc-700 font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(field, value, setValue))}
          placeholder={placeholder}
          className="h-11 rounded-xl border-zinc-200"
          data-testid={`${field}-input`}
        />
        <Button type="button" onClick={() => addItem(field, value, setValue)} variant="outline" className="h-11 px-4 rounded-xl">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {preferences[field]?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {preferences[field].map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 text-sm rounded-full">
              {item}
              <button onClick={() => removeItem(field, idx)} className="hover:text-rose-900"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F2E9' }}><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div></div>;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F3F2E9' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30" style={{ backgroundColor: 'rgba(243, 242, 233, 0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: '#666666' }}><Menu className="w-5 h-5" /></button>
              <div>
                <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>Preferences</h1>
                <p className="text-sm" style={{ color: '#999999' }}>Customize your job search criteria</p>
              </div>
            </div>
            <Button onClick={savePreferences} disabled={saving} className="btn-primary flex items-center gap-2" data-testid="save-preferences-btn">
              {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-4xl">
          {/* Roles & Skills */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Roles & Skills</h2>
            <TagInput label="Preferred Roles" field="preferred_roles" value={newRole} setValue={setNewRole} placeholder="e.g., Software Engineer" />
            <TagInput label="Tech Stack" field="tech_stack" value={newSkill} setValue={setNewSkill} placeholder="e.g., React, Python" />
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Location</h2>
            <TagInput label="Preferred Locations" field="preferred_locations" value={newLocation} setValue={setNewLocation} placeholder="e.g., San Francisco, Remote" />
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50">
              <div>
                <p className="font-medium text-zinc-900">Remote Only</p>
                <p className="text-sm text-zinc-500">Only show remote positions</p>
              </div>
              <Switch checked={preferences.remote_only} onCheckedChange={(checked) => setPreferences({ ...preferences, remote_only: checked })} data-testid="remote-only-switch" />
            </div>
          </div>

          {/* Salary */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Salary Range</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 font-medium">Minimum Salary ($/year)</Label>
                <Input type="number" value={preferences.min_salary || ''} onChange={(e) => setPreferences({ ...preferences, min_salary: parseInt(e.target.value) || 0 })} className="h-11 rounded-xl border-zinc-200" placeholder="e.g., 100000" data-testid="min-salary-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 font-medium">Maximum Salary ($/year)</Label>
                <Input type="number" value={preferences.max_salary || ''} onChange={(e) => setPreferences({ ...preferences, max_salary: parseInt(e.target.value) || 0 })} className="h-11 rounded-xl border-zinc-200" placeholder="e.g., 200000" data-testid="max-salary-input" />
              </div>
            </div>
          </div>

          {/* Company Preferences */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Company Preferences</h2>
            <TagInput label="Target Companies (Whitelist)" field="included_companies" value={newIncludedCompany} setValue={setNewIncludedCompany} placeholder="e.g., Google, Microsoft" />
            <TagInput label="Excluded Companies (Blacklist)" field="excluded_companies" value={newExcludedCompany} setValue={setNewExcludedCompany} placeholder="e.g., Company to avoid" />
          </div>

          {/* Job Freshness */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Job Freshness</h2>
            <div className="space-y-2">
              <Label className="text-zinc-700 font-medium">Show jobs posted within (days)</Label>
              <Input type="number" value={preferences.posted_within_days || 30} onChange={(e) => setPreferences({ ...preferences, posted_within_days: parseInt(e.target.value) || 30 })} className="h-11 rounded-xl border-zinc-200 max-w-xs" min="1" max="90" data-testid="posted-within-input" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreferencesPage;
