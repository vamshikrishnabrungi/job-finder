import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Briefcase, LayoutDashboard, Search, FileText, Settings, Clock, Key, Download, LogOut, Menu, X, Plus, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

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

const CredentialsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newCred, setNewCred] = useState({
    portal_name: '',
    username: '',
    password: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await axios.get(`${API_URL}/credentials`, { headers: getAuthHeaders() });
      setCredentials(response.data.credentials || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCredential = async () => {
    if (!newCred.portal_name || !newCred.username || !newCred.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/credentials`, newCred, { headers: getAuthHeaders() });
      toast.success('Credential added securely');
      setDialogOpen(false);
      setNewCred({ portal_name: '', username: '', password: '', notes: '' });
      fetchCredentials();
    } catch (error) {
      toast.error('Failed to add credential');
    } finally {
      setSaving(false);
    }
  };

  const deleteCredential = async (credId) => {
    try {
      await axios.delete(`${API_URL}/credentials/${credId}`, { headers: getAuthHeaders() });
      toast.success('Credential removed');
      fetchCredentials();
    } catch (error) {
      toast.error('Failed to delete credential');
    }
  };

  const portalSuggestions = [
    'LinkedIn', 'Indeed', 'Glassdoor', 'Naukri', 'Monster',
    'Google Careers', 'Microsoft Careers', 'Amazon Jobs', 'Meta Careers'
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F3F2E9' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30" style={{ backgroundColor: 'rgba(243, 242, 233, 0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: '#666666' }}><Menu className="w-5 h-5" /></button>
              <div>
                <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a' }}>Credential Vault</h1>
                <p className="text-sm" style={{ color: '#999999' }}>Securely store your job portal credentials</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary flex items-center gap-2" data-testid="add-credential-btn">
                  <Plus className="w-4 h-4" /> Add Credential
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Outfit' }}>Add New Credential</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Portal Name *</Label>
                    <Input
                      value={newCred.portal_name}
                      onChange={(e) => setNewCred({ ...newCred, portal_name: e.target.value })}
                      placeholder="e.g., LinkedIn"
                      className="h-11 rounded-xl"
                      list="portal-suggestions"
                      data-testid="portal-name-input"
                    />
                    <datalist id="portal-suggestions">
                      {portalSuggestions.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label>Username / Email *</Label>
                    <Input
                      value={newCred.username}
                      onChange={(e) => setNewCred({ ...newCred, username: e.target.value })}
                      placeholder="your@email.com"
                      className="h-11 rounded-xl"
                      data-testid="username-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={newCred.password}
                        onChange={(e) => setNewCred({ ...newCred, password: e.target.value })}
                        placeholder="••••••••"
                        className="h-11 rounded-xl pr-10"
                        data-testid="password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={newCred.notes}
                      onChange={(e) => setNewCred({ ...newCred, notes: e.target.value })}
                      placeholder="Any additional notes"
                      className="h-11 rounded-xl"
                      data-testid="notes-input"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={addCredential} disabled={saving} className="btn-primary" data-testid="save-credential-btn">
                    {saving ? 'Saving...' : 'Save Credential'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-4xl">
          {/* Security Notice */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-1">Your credentials are secure</h3>
              <p className="text-sm text-emerald-700">
                All passwords are encrypted before storage. We never store plain-text passwords and use industry-standard encryption.
              </p>
            </div>
          </div>

          {/* Credentials List */}
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div></div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-zinc-200 bg-white">
              <Key className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-700 mb-2">No credentials stored</h3>
              <p className="text-zinc-500 mb-6">Add your job portal credentials for automated login</p>
              <Button onClick={() => setDialogOpen(true)} className="btn-primary" data-testid="empty-add-credential-btn">
                <Plus className="w-4 h-4 mr-2" /> Add First Credential
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {credentials.map((cred, idx) => (
                <div key={cred.id} className="rounded-2xl border border-zinc-200 bg-white p-6 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }} data-testid={`credential-${cred.id}`}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <Key className="w-6 h-6 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900">{cred.portal_name}</h3>
                    <p className="text-sm text-zinc-500">{cred.username}</p>
                    {cred.notes && <p className="text-xs text-zinc-400 mt-1">{cred.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCredential(cred.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    data-testid={`delete-credential-${cred.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CredentialsPage;
