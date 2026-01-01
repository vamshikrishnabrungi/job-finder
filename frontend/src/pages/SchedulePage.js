import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Briefcase, LayoutDashboard, Search, FileText, Settings, Clock, Key, Download, LogOut, Menu, X, Save, Globe, Play, Pause } from 'lucide-react';

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
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-zinc-200 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Briefcase className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>JobFinder AI</span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (<Link key={item.path} to={item.path} onClick={onClose} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>{item.icon}<span>{item.label}</span></Link>))}
          </nav>
          <div className="p-4 border-t border-zinc-200">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center"><span className="text-rose-600 font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-zinc-900 truncate">{user?.name || 'User'}</p><p className="text-xs text-zinc-500 truncate">{user?.email}</p></div>
            </div>
            <button onClick={logout} className="nav-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"><LogOut className="w-5 h-5" /><span>Logout</span></button>
          </div>
        </div>
      </aside>
    </>
  );
};

const SchedulePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schedule, setSchedule] = useState({
    enabled: false,
    schedule_time: '07:30',
    regions: [],
    sources: [],
    frequency: 'daily'
  });
  const [sources, setSources] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scheduleRes, sourcesRes] = await Promise.all([
        axios.get(`${API_URL}/schedule`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/sources`, { headers: getAuthHeaders() })
      ]);
      if (scheduleRes.data.schedule) setSchedule(scheduleRes.data.schedule);
      setSources(sourcesRes.data.sources || []);
      setRegions(sourcesRes.data.regions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/schedule`, schedule, { headers: getAuthHeaders() });
      toast.success('Schedule saved successfully!');
    } catch (error) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const toggleRegion = (regionId) => {
    const newRegions = schedule.regions.includes(regionId)
      ? schedule.regions.filter(r => r !== regionId)
      : [...schedule.regions, regionId];
    setSchedule({ ...schedule, regions: newRegions });
  };

  const toggleSource = (sourceId) => {
    const newSources = schedule.sources.includes(sourceId)
      ? schedule.sources.filter(s => s !== sourceId)
      : [...schedule.sources, sourceId];
    setSchedule({ ...schedule, sources: newSources });
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"><Menu className="w-5 h-5" /></button>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Schedule</h1>
                <p className="text-sm text-zinc-500">Configure automated job hunting</p>
              </div>
            </div>
            <Button onClick={saveSchedule} disabled={saving} className="btn-primary flex items-center gap-2" data-testid="save-schedule-btn">
              {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-4xl">
          {/* Enable Schedule */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${schedule.enabled ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                  {schedule.enabled ? <Play className="w-6 h-6 text-emerald-600" /> : <Pause className="w-6 h-6 text-zinc-400" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Automated Job Hunting</h2>
                  <p className="text-sm text-zinc-500">Run job discovery on a schedule without keeping the app open</p>
                </div>
              </div>
              <Switch checked={schedule.enabled} onCheckedChange={(checked) => setSchedule({ ...schedule, enabled: checked })} data-testid="enable-schedule-switch" />
            </div>
          </div>

          {/* Schedule Time */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Schedule Time</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 font-medium">Run Time</Label>
                <Input type="time" value={schedule.schedule_time} onChange={(e) => setSchedule({ ...schedule, schedule_time: e.target.value })} className="h-11 rounded-xl border-zinc-200" data-testid="schedule-time-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 font-medium">Frequency</Label>
                <Select value={schedule.frequency} onValueChange={(value) => setSchedule({ ...schedule, frequency: value })}>
                  <SelectTrigger className="h-11 rounded-xl" data-testid="frequency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice_daily">Twice Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Regions */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Target Regions</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-4">Select regions to search for jobs</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {regions.map((region) => (
                <label key={region.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${schedule.regions.includes(region.id) ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                  <Checkbox checked={schedule.regions.includes(region.id)} onCheckedChange={() => toggleRegion(region.id)} data-testid={`region-${region.id}`} />
                  <span className="font-medium text-zinc-700">{region.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Job Sources</h2>
            <p className="text-sm text-zinc-500 mb-4">Select job portals and career sites to search</p>
            
            {/* MNC Career Portals */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-600 mb-3">MNC Career Portals</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sources.filter(s => s.type === 'mnc').map((source) => (
                  <label key={source.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${schedule.sources.includes(source.id) ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <Checkbox checked={schedule.sources.includes(source.id)} onCheckedChange={() => toggleSource(source.id)} data-testid={`source-${source.id}`} />
                    <span className="text-sm font-medium text-zinc-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Aggregators */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-600 mb-3">Job Aggregators</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sources.filter(s => s.type === 'aggregator').map((source) => (
                  <label key={source.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${schedule.sources.includes(source.id) ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <Checkbox checked={schedule.sources.includes(source.id)} onCheckedChange={() => toggleSource(source.id)} data-testid={`source-${source.id}`} />
                    <span className="text-sm font-medium text-zinc-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Regional */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-600 mb-3">Regional Job Sites</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sources.filter(s => s.type === 'regional').map((source) => (
                  <label key={source.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${schedule.sources.includes(source.id) ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <Checkbox checked={schedule.sources.includes(source.id)} onCheckedChange={() => toggleSource(source.id)} data-testid={`source-${source.id}`} />
                    <span className="text-sm font-medium text-zinc-700">{source.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchedulePage;
