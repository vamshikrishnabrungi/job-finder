import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../lib/utils';
import { useDropzone } from 'react-dropzone';
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
  Upload,
  CheckCircle2,
  FileUp,
  User,
  Sparkles
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

const ResumePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/resume/profile`, { headers: getAuthHeaders() });
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/resume/upload`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
      });
      setProfile(response.data.profile);
      toast.success('Resume uploaded and parsed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
          <div className="px-6 py-4 flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"><Menu className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Resume</h1>
              <p className="text-sm text-zinc-500">Upload and manage your resume profile</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Upload Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-zinc-900 mb-6" style={{ fontFamily: 'Outfit' }}>Upload Resume</h2>
            
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              data-testid="resume-dropzone"
            >
              <input {...getInputProps()} data-testid="resume-file-input" />
              <div className="flex flex-col items-center">
                {uploading ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-rose-600 animate-pulse" />
                    </div>
                    <p className="text-zinc-600 font-medium">AI is analyzing your resume...</p>
                    <p className="text-sm text-zinc-400 mt-1">This may take a moment</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                      <FileUp className="w-8 h-8 text-rose-500" />
                    </div>
                    <p className="text-zinc-600 font-medium">
                      {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">or click to browse</p>
                    <p className="text-xs text-zinc-400 mt-4">Supports PDF, DOCX, TXT</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Section */}
          {profile && (
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-zinc-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <User className="w-7 h-7 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900" style={{ fontFamily: 'Outfit' }}>Parsed Profile</h2>
                  <p className="text-sm text-zinc-500">AI-extracted information from your resume</p>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Analyzed
                  </span>
                </div>
              </div>
              
              <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* Skills */}
                {profile.skills?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-rose-50 text-rose-700 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {profile.experience_years > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3">Experience</h3>
                    <p className="text-2xl font-bold text-zinc-900">{profile.experience_years} years</p>
                  </div>
                )}

                {/* Roles */}
                {profile.roles?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3">Target Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.roles.map((role, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industries */}
                {profile.industries?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3">Industries</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.industries.map((industry, idx) => (
                        <span key={idx} className="px-3 py-1 bg-violet-50 text-violet-700 text-sm rounded-full">
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {profile.education?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3">Education</h3>
                    <ul className="space-y-1">
                      {profile.education.map((edu, idx) => (
                        <li key={idx} className="text-zinc-600">{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Remote Preference */}
                {profile.remote_preference && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3">Work Preference</h3>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full capitalize">
                      {profile.remote_preference}
                    </span>
                  </div>
                )}
              </div>

              {/* Summary from AI */}
              {profile.parsed_data?.summary && (
                <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-sm font-semibold text-zinc-700 mb-2">AI Summary</h3>
                  <p className="text-zinc-600 leading-relaxed">{profile.parsed_data.summary}</p>
                </div>
              )}
            </div>
          )}

          {!profile && !loading && (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-700 mb-2">No resume uploaded yet</h3>
              <p className="text-zinc-500">Upload your resume to get AI-powered job matches</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResumePage;
