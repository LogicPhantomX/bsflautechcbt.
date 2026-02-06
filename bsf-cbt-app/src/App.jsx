import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Clock, LogOut, Users, BookOpen, Trophy, Award, 
  CheckCircle, XCircle, Edit3, Plus, Trash2, Play, 
  BarChart3, TrendingUp, Target, Zap, Star, 
  Save, ArrowLeft, FileText, Settings, Eye, Calendar, 
  AlertCircle, CheckSquare, Package, Loader, GraduationCap, 
  Briefcase, FlaskConical, RefreshCw
} from 'lucide-react';

// Initialize Supabase
// Use environment variables for Supabase credentials. Provide defaults to avoid runtime crashes in environments where envs aren't set.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ==================== FIELD OPTIONS CONSTANT ====================
const FIELD_OPTIONS = [
  { value: 'science', label: 'Science', icon: FlaskConical },
  { value: 'art', label: 'Art', icon: BookOpen },
  { value: 'commercial', label: 'Commercial', icon: Briefcase }
];

// ==================== FIELD SELECTION COMPONENT ====================
function FieldSelection({ profile, onComplete }) {
  const [field, setField] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!field) {
      setError('Please select a field');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[Field] Updating field to:', field);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ field: field })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      console.log('[Field] Field updated successfully');
      onComplete();
    } catch (error) {
      console.error('[Field] Error:', error);
      setError('Failed to save field selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <GraduationCap className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Your Field</h2>
          <p className="text-slate-600">Choose your field of study to see relevant exams</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {FIELD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setField(option.value);
                    setError('');
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    field === option.value
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <Icon className={`w-7 h-7 ${
                      field === option.value ? 'text-emerald-600' : 'text-slate-400'
                    }`} />
                    <span className="text-lg font-semibold text-slate-800">
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !field}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function BSFCBTApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('auth');

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setView('auth');
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await loadProfile(session.user.id);
    } else {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      console.log('[Profile] Loading for user ID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.log('[Profile] No profile found, showing setup');
        setView('profile-setup');
        setLoading(false);
        return;
      }

      console.log('[Profile] Profile loaded:', data);

      // CHECK IF STUDENT NEEDS FIELD SELECTION
      if (data.role === 'student' && !data.field) {
        console.log('[Profile] Student needs field selection');
        setView('field-selection');
        setProfile(data);
        setLoading(false);
        return;
      }

      setProfile(data);
      setView(data.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
    } catch (error) {
      console.error('[Profile] Error:', error);
      setView('profile-setup');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('auth');
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen onSuccess={() => checkSession()} />;
  if (view === 'profile-setup') return <ProfileSetup user={user} onComplete={() => loadProfile(user.id)} />;
  if (view === 'field-selection') return <FieldSelection profile={profile} onComplete={() => loadProfile(user.id)} />;
  
  if (!profile) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-white">
      <Navigation profile={profile} onLogout={handleLogout} />
      {profile?.role === 'admin' ? (
        <AdminDashboard profile={profile} />
      ) : (
        <StudentDashboard profile={profile} />
      )}
    </div>
  );
}

// ==================== LOADING SCREEN ====================
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2">
            <img src="/logo.png" alt="BSF LAUTECH Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">BSF LAUTECH CBT</h2>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
}

// ==================== NAVIGATION ====================
function Navigation({ profile, onLogout }) {
  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 border-2 border-emerald-100 p-2">
              <img src="/logo.png" alt="BSF LAUTECH Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                BSF LAUTECH
              </h1>
              <p className="text-xs text-slate-500">CBT Excellence Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{profile?.full_name}</p>
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">{profile?.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 group"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ==================== AUTH SCREEN ====================
function AuthScreen({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-blob" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6 p-4 transform hover:scale-105 transition-transform">
            <img src="/logo.png" alt="BSF LAUTECH Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">BSF LAUTECH</h1>
          <p className="text-emerald-100 text-lg">Computer Based Testing Excellence</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            {isLogin ? 'Welcome Back!' : 'Join the Fellowship'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 mb-4 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-slate-700">Continue with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                placeholder="you@lautech.edu.ng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-emerald-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 font-semibold hover:text-emerald-700"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-white/80 text-sm mt-6">
          © 2026 BSF LAUTECH Fellowship. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ==================== PROFILE SETUP ====================
function ProfileSetup({ user, onComplete }) {
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [role] = useState('student');
  const [field, setField] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!fullName || !role) {
      setError('Please fill in all required fields');
      return;
    }

    if (role === 'student' && !matricNumber) {
      setError('Matric number is required for students');
      return;
    }

    if (role === 'student' && !field) {
      setError('Field selection is required for students');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profileData = {
        id: user.id,
        full_name: fullName,
        matric_number: role === 'student' ? matricNumber : null,
        role: role,
        field: role === 'student' ? field : null
      };

      console.log('[ProfileSetup] Creating profile:', profileData);

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (insertError) throw insertError;

      console.log('[ProfileSetup] Profile created successfully');
      onComplete();
    } catch (error) {
      console.error('[ProfileSetup] Error:', error);
      setError('Failed to create profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Complete Your Profile</h2>
          <p className="text-slate-600 mt-2">Let's get to know you better</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              placeholder="Your full name"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a *</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 transition-all"
                >
                  <GraduationCap className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                  <span className="font-medium">Student</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Admin accounts are managed separately
              </p>
            </div>

            {/* REMOVE the entire admin button block */}
                            

          {role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Matric Number *</label>
              <input
                type="text"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                placeholder="LAU/20/0001"
              />
            </div>
          )}

          {role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Field of Study *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {FIELD_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setField(option.value);
                        setError('');
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        field === option.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-6 h-6 ${
                          field === option.value ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                        <span className="font-medium text-slate-800">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Complete Setup</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== ADMIN DASHBOARD ====================
function AdminDashboard({ profile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const [examsRes, banksRes, attemptsRes, studentsRes] = await Promise.all([
        supabase.from('exams').select('id'),
        supabase.from('question_banks').select('id'),
        supabase.from('exam_attempts').select('id, status'),
        supabase.from('profiles').select('id').eq('role', 'student')
      ]);

      setStats({
        totalExams: examsRes.data?.length || 0,
        totalBanks: banksRes.data?.length || 0,
        totalAttempts: attemptsRes.data?.length || 0,
        pendingGrading: attemptsRes.data?.filter(a => a.status === 'submitted').length || 0,
        totalStudents: studentsRes.data?.length || 0
      });
    } catch (error) {
      console.error('[Admin] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'banks', label: 'Question Banks', icon: Package },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'grading', label: 'Grading', icon: CheckSquare },
    { id: 'students', label: 'Students', icon: Users }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-purple-100 text-lg">Manage your CBT platform with excellence</p>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard icon={FileText} label="Total Exams" value={stats.totalExams} color="blue" />
          <StatCard icon={Package} label="Question Banks" value={stats.totalBanks} color="emerald" />
          <StatCard icon={Users} label="Students" value={stats.totalStudents} color="purple" />
          <StatCard icon={CheckCircle} label="Submissions" value={stats.totalAttempts} color="amber" />
          <StatCard icon={AlertCircle} label="Pending Grading" value={stats.pendingGrading} color="red" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-white rounded-2xl p-2 shadow-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-3 px-6 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <AdminOverview stats={stats} />}
      {activeTab === 'banks' && <QuestionBanksManager profile={profile} />}
      {activeTab === 'exams' && <ExamsManager profile={profile} />}
      {activeTab === 'grading' && <GradingInterface profile={profile} />}
      {activeTab === 'students' && <StudentsManager />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 group cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold text-slate-800">{value}</span>
      </div>
      <p className="text-slate-600 font-medium">{label}</p>
    </div>
  );
}

// ==================== ADMIN OVERVIEW ====================
function AdminOverview({ stats }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-slate-800 mb-4">Platform Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <h4 className="font-semibold text-emerald-800 mb-2">System Health</h4>
            <p className="text-3xl font-bold text-emerald-600">Excellent</p>
            <p className="text-sm text-emerald-700 mt-2">All systems operational</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Total Activity</h4>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalAttempts || 0}</p>
            <p className="text-sm text-blue-700 mt-2">Exam submissions</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-xl">
        <h3 className="text-2xl font-bold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
            <Package className="w-6 h-6 mb-2" />
            <p className="text-2xl font-bold">{stats?.totalBanks || 0}</p>
            <p className="text-sm text-white/90">Question Banks</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
            <FileText className="w-6 h-6 mb-2" />
            <p className="text-2xl font-bold">{stats?.totalExams || 0}</p>
            <p className="text-sm text-white/90">Active Exams</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
            <Users className="w-6 h-6 mb-2" />
            <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
            <p className="text-sm text-white/90">Students</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== QUESTION BANKS MANAGER ====================
function QuestionBanksManager({ profile }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const { data } = await supabase
        .from('question_banks')
        .select('*')
        .order('created_at', { ascending: false });
      setBanks(data || []);
    } catch (error) {
      console.error('[Banks] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedBank) {
    return (
      <QuestionBankDetail
        bank={selectedBank}
        onBack={() => {
          setSelectedBank(null);
          loadBanks();
        }}
        profile={profile}
      />
    );
  }

  if (showBankForm) {
    return (
      <QuestionBankForm
        onCancel={() => setShowBankForm(false)}
        onSuccess={() => {
          setShowBankForm(false);
          loadBanks();
        }}
        profile={profile}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800">Question Banks</h3>
        <button
          onClick={() => setShowBankForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span>Create Bank</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-600 mt-4">Loading banks...</p>
        </div>
      ) : banks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No question banks yet</p>
          <button
            onClick={() => setShowBankForm(true)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            Create Your First Bank
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <div
              key={bank.id}
              onClick={() => setSelectedBank(bank)}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(bank.created_at).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
                {bank.title}
              </h4>
              <p className="text-slate-600 text-sm line-clamp-2">{bank.description}</p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="text-emerald-600 font-semibold text-sm hover:text-emerald-700 flex items-center">
                  Manage Questions
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== QUESTION BANK FORM ====================
function QuestionBankForm({ onCancel, onSuccess, profile }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('question_banks').insert([{
        title,
        description,
        created_by: profile.id
      }]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      alert('Error creating bank: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800">Create Question Bank</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bank Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              placeholder="e.g., General Knowledge 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
              placeholder="Describe this question bank..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Bank</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Note: Due to character limits, I'll continue in the next file with the remaining components
// This includes: QuestionBankDetail, QuestionForm, ExamsManager, ExamForm, GradingInterface, 
// StudentsManager, StudentDashboard, and ExamInterface components
// ==================== PART 2: REMAINING COMPONENTS ====================
// This file continues from BSF_LAUTECH_CBT_FIXED.jsx
// Copy this content and append it to the first file after the QuestionBankForm component

// ==================== QUESTION BANK DETAIL ====================
function QuestionBankDetail({ bank, onBack, profile }) {
  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('bank_id', bank.id)
        .order('created_at', { ascending: true });
      
      setQuestions(data || []);
    } catch (error) {
      console.error('[Questions] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Delete this question?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      loadQuestions();
    } catch (error) {
      alert('Error deleting question: ' + error.message);
    }
  };

  if (showQuestionForm) {
    return (
      <QuestionForm
        bank={bank}
        question={editingQuestion}
        onCancel={() => {
          setShowQuestionForm(false);
          setEditingQuestion(null);
        }}
        onSuccess={() => {
          setShowQuestionForm(false);
          setEditingQuestion(null);
          loadQuestions();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Banks</span>
        </button>
        <button
          onClick={() => setShowQuestionForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Question</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{bank.title}</h3>
        <p className="text-slate-600 mb-4">{bank.description}</p>
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          <span className="flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            {questions.length} questions
          </span>
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(bank.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-600 mt-4">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No questions yet</p>
          <button
            onClick={() => setShowQuestionForm(true)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            Add Your First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                      {q.question_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-500">Question {index + 1}</span>
                    <span className="text-sm text-amber-600 font-semibold">{q.points} pts</span>
                  </div>
                  <p className="text-lg text-slate-800 font-medium mb-3">{q.question_text}</p>
                  
                  {q.question_type === 'multiple_choice' && q.options && (
                    <div className="space-y-2 mt-3">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${
                            opt === q.correct_answer
                              ? 'bg-emerald-50 border-2 border-emerald-300'
                              : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <span className="font-medium text-slate-700">{String.fromCharCode(65 + i)}. </span>
                          <span className="text-slate-800">{opt}</span>
                          {opt === q.correct_answer && (
                            <span className="ml-2 text-emerald-600 font-semibold">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(q.question_type === 'true_false' || q.question_type === 'fill_in_gap') && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-sm font-medium text-emerald-700">Correct Answer: </span>
                      <span className="text-emerald-800 font-semibold">{q.correct_answer}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setShowQuestionForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== QUESTION FORM ====================
function QuestionForm({ bank, question, onCancel, onSuccess }) {
  const [questionType, setQuestionType] = useState(question?.question_type || 'multiple_choice');
  const [questionText, setQuestionText] = useState(question?.question_text || '');
  const [options, setOptions] = useState(question?.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(question?.correct_answer || '');
  const [points, setPoints] = useState(question?.points || 1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const questionData = {
        bank_id: bank.id,
        question_type: questionType,
        question_text: questionText,
        options: questionType === 'multiple_choice' ? options.filter(o => o.trim()) : null,
        correct_answer: correctAnswer,
        points: points
      };

      if (question) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([questionData]);
        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      alert('Error saving question: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800">
            {question ? 'Edit Question' : 'Add Question'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="fill_in_gap">Fill in the Gap</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question Text</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              rows="4"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
              placeholder="Enter your question here..."
            />
          </div>

          {questionType === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
            {questionType === 'multiple_choice' ? (
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              >
                <option value="">Select correct answer</option>
                {options.filter(o => o.trim()).map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            ) : questionType === 'true_false' ? (
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              >
                <option value="">Select answer</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : questionType === 'essay' ? (
              <textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Sample answer or grading criteria..."
                rows="3"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
              />
            ) : (
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                placeholder="Enter correct answer"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              min="1"
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{question ? 'Update Question' : 'Add Question'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== EXAMS MANAGER ====================
function ExamsManager({ profile }) {
  const [exams, setExams] = useState([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await supabase
        .from('exams')
        .select('*, question_banks(title)')
        .order('created_at', { ascending: false });
        
      setExams(data || []);
    } catch (error) {
      console.error('[Exams] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExamStatus = async (examId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_active: !currentStatus })
        .eq('id', examId);

      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Error updating exam: ' + error.message);
    }
  };

  const deleteExam = async (examId) => {
    if (!confirm('Delete this exam? All associated attempts will also be deleted.')) return;

    try {
      const { error } = await supabase.from('exams').delete().eq('id', examId);
      if (error) throw error;
      loadData();
    } catch (error) {
      alert('Error deleting exam: ' + error.message);
    }
  };

  if (showExamForm) {
    return (
      <ExamForm
        profile={profile}
        onCancel={() => setShowExamForm(false)}
        onSuccess={() => {
          setShowExamForm(false);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800">Exams</h3>
        <button
          onClick={() => setShowExamForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Create Exam</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-600 mt-4">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No exams created yet</p>
          <button
            onClick={() => setShowExamForm(true)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            Create Your First Exam
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className="text-xl font-bold text-slate-800">{exam.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      exam.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {exam.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {exam.field && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                        {exam.field.charAt(0).toUpperCase() + exam.field.slice(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mb-4">{exam.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center text-slate-600">
                      <Package className="w-4 h-4 mr-1 text-emerald-600" />
                      {exam.question_banks?.title || 'No bank'}
                    </span>
                    <span className="flex items-center text-slate-600">
                      <Clock className="w-4 h-4 mr-1 text-blue-600" />
                      {exam.duration_minutes} mins
                    </span>
                    <span className="flex items-center text-slate-600">
                      <Target className="w-4 h-4 mr-1 text-amber-600" />
                      Pass: {exam.passing_score}%
                    </span>
                    {exam.number_of_questions > 0 && (
                      <span className="flex items-center text-slate-600">
                        <FileText className="w-4 h-4 mr-1 text-purple-600" />
                        {exam.number_of_questions} questions
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      exam.is_active
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {exam.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== EXAM FORM ====================
function ExamForm({ profile, onCancel, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bankId, setBankId] = useState('');
  const [field, setField] = useState('');
  const [duration, setDuration] = useState(60);
  const [passingScore, setPassingScore] = useState(50);
  const [numberOfQuestions, setNumberOfQuestions] = useState(0);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const { data } = await supabase
        .from('question_banks')
        .select('*')
        .order('title');
      setBanks(data || []);
    } catch (error) {
      console.error('[ExamForm] Error loading banks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!field) {
      setError('Please select a field');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log('[ExamForm] Creating exam');

     const { error: insertError } = await supabase
        .from('exams')
        .insert([{
          title,
          description,
          bank_id: bankId,
          duration_minutes: duration,
          passing_score: passingScore,
          number_of_questions: numberOfQuestions,
          field: field,
          max_attempts: maxAttempts,
          is_active: true,
          created_by: profile.id
        }]);

      if (insertError) throw insertError;

      console.log('[ExamForm] Exam created successfully');
      onSuccess();
    } catch (error) {
      console.error('[ExamForm] Error:', error);
      setError('Failed to create exam: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800">Create New Exam</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Exam Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              placeholder="e.g., Mid-Term Examination"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
              placeholder="Describe the exam..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Field *</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            >
              <option value="">Select field</option>
              <option value="science">Science</option>
              <option value="art">Art</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question Bank *</label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            >
              <option value="">Select a question bank</option>
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>{bank.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              placeholder="0 = use all questions"
            />
            <p className="text-xs text-slate-500 mt-1">
              Set to 0 to use all questions, or specify exact number (e.g., 20 questions)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes) *</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="5"
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Passing Score (%) *</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                min="0"
                max="100"
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Max Attempts *
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setMaxAttempts(1)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  maxAttempts === 1
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                }`}
              >
                <div className="font-semibold">One Attempt</div>
                <div className="text-xs mt-1">Students can take once</div>
              </button>
              <button
                type="button"
                onClick={() => setMaxAttempts(-1)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  maxAttempts === -1
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                }`}
              >
                <div className="font-semibold">Unlimited</div>
                <div className="text-xs mt-1">Students can retake</div>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Control how many times students can attempt this exam
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Exam</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Continue with remaining components in next file...
// ==================== PART 3: GRADING, STUDENT DASHBOARD & EXAM INTERFACE ====================
// Continue from Part 2

// ==================== GRADING INTERFACE ====================
function GradingInterface({ profile }) {
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradingScores, setGradingScores] = useState({});
  const [essayQuestions, setEssayQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    loadPendingAttempts();
  }, []);

  useEffect(() => {
    if (selectedAttempt) {
      loadEssayQuestions();
    }
  }, [selectedAttempt]);

  const loadPendingAttempts = async () => {
    try {
      console.log('[Grading] Loading pending attempts');

      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          profiles!inner (full_name, matric_number),
          exams!inner (title)
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('[Grading] Error loading attempts:', error);
        setAttempts([]);
        return;
      }

      console.log('[Grading] Loaded attempts:', data);
      setAttempts(data || []);
    } catch (error) {
      console.error('[Grading] Fatal error:', error);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEssayQuestions = async () => {
    try {
      setLoadingQuestions(true);
      
      // Parse answers
      let parsedAnswers = {};
      try {
        parsedAnswers = typeof selectedAttempt.answers === 'string'
          ? JSON.parse(selectedAttempt.answers)
          : selectedAttempt.answers || {};
      } catch (e) {
        console.error('[Grading] Error parsing answers:', e);
      }

      // Fetch the exam to get bank_id
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('bank_id')
        .eq('id', selectedAttempt.exam_id)
        .single();

      if (examError) throw examError;

      // Fetch all questions from the bank
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('bank_id', examData.bank_id);

      if (questionsError) throw questionsError;

      // Filter for essay questions only
      const essays = questionsData.filter(q => q.question_type === 'essay');
      console.log('[Grading] Found essay questions:', essays);

      setEssayQuestions(essays);
      setAnswers(parsedAnswers);
    } catch (error) {
      console.error('[Grading] Error loading essay questions:', error);
      setEssayQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedAttempt) return;

    try {
      console.log('[Grading] Submitting grades for attempt:', selectedAttempt.id);

      const totalScore = Object.values(gradingScores).reduce((sum, score) => sum + (parseFloat(score) || 0), 0);
      const totalPoints = selectedAttempt.total_points || 100;
      const finalScore = selectedAttempt.score + totalScore;

      console.log('[Grading] Essay score:', totalScore, 'Auto-graded score:', selectedAttempt.score, 'Final score:', finalScore, 'Total points:', totalPoints);

      const { error } = await supabase
        .from('exam_attempts')
        .update({
          score: finalScore,
          status: 'graded'
        })
        .eq('id', selectedAttempt.id);

      if (error) throw error;

      console.log('[Grading] Grades submitted successfully');
      alert('Grades submitted successfully!');
      setSelectedAttempt(null);
      setGradingScores({});
      loadPendingAttempts();
    } catch (error) {
      console.error('[Grading] Error submitting grades:', error);
      alert('Failed to submit grades: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
        <p className="text-slate-600 mt-4">Loading pending attempts...</p>
      </div>
    );
  }

  if (selectedAttempt) {
    if (loadingQuestions) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <button
              onClick={() => {
                setSelectedAttempt(null);
                setGradingScores({});
              }}
              className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Pending Attempts
            </button>
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-slate-600 mt-4">Loading essay questions...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <button
            onClick={() => {
              setSelectedAttempt(null);
              setGradingScores({});
            }}
            className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Pending Attempts
          </button>

          <div className="border-b border-slate-200 pb-4 mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              {selectedAttempt.exams?.title}
            </h3>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <div>Student: {selectedAttempt.profiles?.full_name}</div>
              <div>Matric: {selectedAttempt.profiles?.matric_number}</div>
              <div>Submitted: {new Date(selectedAttempt.submitted_at).toLocaleString()}</div>
            </div>
          </div>

          {essayQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              No essay questions to grade in this attempt
            </div>
          ) : (
            <div className="space-y-6">
              {essayQuestions.map((question, index) => {
                const studentAnswer = answers[question.id];
                return (
                  <div key={question.id} className="border border-slate-200 rounded-xl p-6">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-slate-500 mb-2">
                        Question {index + 1}
                      </div>
                      <div className="text-slate-800 font-medium mb-3">
                        {question.question_text}
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-slate-700 mb-2">
                          Student's Answer:
                        </div>
                        <div className="text-slate-600 whitespace-pre-wrap">
                          {studentAnswer || '(No answer provided)'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Score (out of {question.points} points)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={question.points}
                        step="0.5"
                        value={gradingScores[question.id] || ''}
                        onChange={(e) => setGradingScores({
                          ...gradingScores,
                          [question.id]: e.target.value
                        })}
                        className="w-32 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleGradeSubmit}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Submit Grades</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Pending Grading</h3>

        {attempts.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-sm text-blue-700 mb-2">
                <strong>ℹ️ What is Pending Grading?</strong>
              </p>
              <p className="text-sm text-blue-600">
                When students submit exams that contain essay questions, those exams appear here for you to grade manually. Once you assign scores to the essay questions and submit grades, the student's exam is marked as "graded" and they can view their results.
              </p>
            </div>
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <div className="text-slate-600 font-semibold">No exams pending grading</div>
              <div className="text-slate-500 text-sm mt-2">
                Exams with essay questions will appear here once students submit them.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-emerald-500 transition-colors cursor-pointer"
                onClick={() => setSelectedAttempt(attempt)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {attempt.exams?.title}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {attempt.profiles?.full_name} ({attempt.profiles?.matric_number})
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Submitted {new Date(attempt.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-emerald-600">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== STUDENTS MANAGER ====================
function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data } = await supabase
        .from('student_progress')
        .select('*, profiles(full_name, matric_number, created_at)')
        .order('average_score', { ascending: false });
      
      setStudents(data || []);
    } catch (error) {
      console.error('[Students] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-800">Students Overview</h3>

      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-600 mt-4">Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No student data yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Rank</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Matric Number</th>
                  <th className="px-6 py-4 text-center">Exams Taken</th>
                  <th className="px-6 py-4 text-center">Total Points</th>
                  <th className="px-6 py-4 text-center">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-amber-500 text-white' :
                        index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {student.profiles?.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.profiles?.matric_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-700">
                      {student.total_exams_taken || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-600">
                      {student.total_points_earned || 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                        {student.average_score?.toFixed(1) || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STUDENT DASHBOARD ====================
function StudentDashboard({ profile }) {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    loadStudentData();
  }, [profile]);

  const loadStudentData = async () => {
    try {
      console.log('[Student] Loading data for profile:', profile);

      // Load exams filtered by student's field
      const { data: examsData, error: examsError} = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .eq('field', profile?.field)
        .order('created_at', { ascending: false });

      if (examsError) {
        console.error('[Student] Error loading exams:', examsError);
      } else {
        console.log('[Student] Loaded exams:', examsData);
        setExams(examsData || []);
      }

      // Load exam attempts with better error handling
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          exam_id,
          student_id,
          started_at,
          submitted_at,
          time_remaining,
          score,
          total_points,
          answers,
          status,
          exams!inner (
            id,
            title,
            passing_score,
            duration_minutes
          )
        `)
        .eq('student_id', profile.id)
        .order('started_at', { ascending: false });

      if (attemptsError) {
        console.error('[Student] Error loading attempts:', attemptsError);
        setAttempts([]);
      } else {
        console.log('[Student] Loaded attempts:', attemptsData);
        setAttempts(attemptsData || []);
      }

      // Load leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('student_progress')
        .select(`
          id,
          student_id,
          total_exams_taken,
          total_points_earned,
          average_score,
          profiles (
            full_name,
            matric_number
          )
        `)
        .order('average_score', { ascending: false })
        .limit(10);

      if (leaderboardError) {
        console.error('[Student] Error loading leaderboard:', leaderboardError);
      }

      const totalAttempts = attemptsData?.length || 0;
      const completedAttempts = attemptsData?.filter(a => a.status === 'graded') || [];
      const avgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => {
            let perc = 0;
            if (a.total_points && a.total_points > 0) {
              if (a.score > a.total_points && a.score <= 100) {
                perc = Number(a.score);
              } else {
                perc = (a.score / a.total_points) * 100;
              }
            } else {
              perc = Number(a.score) || 0;
            }
            return sum + perc;
          }, 0) / completedAttempts.length
        : 0;

      setLeaderboard(leaderboardData || []);
      setStats({
        totalExams: totalAttempts,
        avgScore: avgScore.toFixed(1),
        rank: leaderboardData?.findIndex(l => l.student_id === profile.id) + 1 || '-'
      });
    } catch (error) {
      console.error('[Student] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
        <p className="text-slate-600 mt-4">Loading your dashboard...</p>
      </div>
    );
  }

  if (selectedExam) {
    return (
      <ExamInterface
        exam={selectedExam}
        profile={profile}
        onExit={() => {
          setSelectedExam(null);
          loadStudentData();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {profile.full_name}!</h2>
            <p className="text-emerald-100 text-lg">Ready to showcase your excellence today?</p>
          </div>
          <button
            onClick={loadStudentData}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={BookOpen} label="Exams Taken" value={stats.totalExams} color="blue" />
        <StatCard icon={Target} label="Average Score" value={`${stats.avgScore}%`} color="emerald" />
        <StatCard icon={Trophy} label="Your Rank" value={`#${stats.rank}`} color="amber" />
      </div>

      <div className="flex space-x-2 mb-6 bg-white rounded-2xl p-2 shadow-lg">
        {['available', 'results', 'leaderboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'available' && (
        <AvailableExamsTab exams={exams} attempts={attempts} onSelectExam={setSelectedExam} />
      )}

      {activeTab === 'results' && (
        <ResultsTab attempts={attempts} profile={profile} onRefresh={loadStudentData} />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab leaderboard={leaderboard} profile={profile} />
      )}
    </div>
  );
}

// Continue with AvailableExamsTab, ResultsTab, LeaderboardTab, and ExamInterface in the next section...
// These will be added to complete the file.

// Add custom CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
`;
document.head.appendChild(style);
// ==================== AVAILABLE EXAMS TAB ====================
function AvailableExamsTab({ exams, attempts, onSelectExam }) {
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <Zap className="w-6 h-6 text-amber-500 mr-2" />
        Available Exams
      </h3>
      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No exams available at the moment.</p>
        </div>
      ) : (
        exams.map((exam) => {
    // Count how many times student has attempted this exam
      const examAttempts = attempts.filter(a => a.exam_id === exam.id);
      const attemptCount = examAttempts.length;
      const maxAttempts = exam.max_attempts || 1;
      
      // Check if student can still take the exam
      const canTakeExam = maxAttempts === -1 || attemptCount < maxAttempts;
      const hasCompletedAttempt = examAttempts.some(a => 
        a.status === 'graded' || a.status === 'submitted'
      );
      
      return (
        <div key={exam.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-800 mb-2">{exam.title}</h4>
              <p className="text-slate-600 mb-3">{exam.description}</p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                  <Clock className="w-4 h-4 mr-1" />
                  {exam.duration_minutes} mins
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700">
                  <Target className="w-4 h-4 mr-1" />
                  Pass: {exam.passing_score}%
                </span>
                {exam.number_of_questions > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700">
                    <FileText className="w-4 h-4 mr-1" />
                    {exam.number_of_questions} questions
                  </span>
                )}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  maxAttempts === -1 
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-50 text-slate-700'
                }`}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {maxAttempts === -1 ? 'Unlimited' : `${attemptCount}/${maxAttempts} attempts`}
                </span>
              </div>
            </div>
            <button
              onClick={() => onSelectExam(exam)}
              disabled={!canTakeExam}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                !canTakeExam
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {!canTakeExam ? (
                maxAttempts === -1 ? 'In Progress' : 'Max Attempts Reached'
              ) : hasCompletedAttempt ? (
                'Retake Exam'
              ) : (
                'Start Exam'
              )}
            </button>
          </div>
      </div>
    
      );
    })
  )}
    </div>
  );
}

// ==================== DETAILED RESULTS ====================
function DetailedResults({ attempt, onBack }) {
  const [answers, setAnswers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResultDetails();
  }, [attempt]);

  const loadResultDetails = async () => {
    try {
      setLoading(true);
      
      // Parse answers from attempt
      let parsedAnswers = [];
      try {
        parsedAnswers = typeof attempt.answers === 'string' 
          ? JSON.parse(attempt.answers) 
          : attempt.answers || [];
      } catch (e) {
        console.error('[Results] Error parsing answers:', e);
        parsedAnswers = [];
      }

      // First, get the exam details to retrieve the bank_id
      let bankId = attempt.exams?.bank_id;
      
      if (!bankId) {
        console.log('[Results] bank_id not in attempt.exams, fetching exam:', attempt.exam_id);
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('bank_id')
          .eq('id', attempt.exam_id)
          .single();

        if (examError) {
          console.error('[Results] Error loading exam:', examError);
        } else {
          bankId = examData?.bank_id;
        }
      }

      console.log('[Results] Using bank_id:', bankId);

      // Load questions from the exam's question bank
      let questionsData = [];
      if (bankId) {
        const { data, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('bank_id', bankId);

        if (questionsError) {
          console.error('[Results] Error loading questions:', questionsError);
        } else {
          questionsData = data || [];
          console.log('[Results] Loaded questions:', questionsData.length);
        }
      } else {
        console.error('[Results] No bank_id available');
      }

      setQuestions(questionsData);
      setAnswers(parsedAnswers);
    } catch (error) {
      console.error('[Results] Error loading details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Results
        </button>
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-600 mt-4">Loading detailed results...</p>
        </div>
      </div>
    );
  }

  // Normalize scoring: some attempts may have score stored as percentage
  let percentage = 0;
  if (attempt.total_points && attempt.total_points > 0) {
    if (attempt.score > attempt.total_points && attempt.score <= 100) {
      // score stored as percentage already
      percentage = Number(attempt.score);
    } else {
      percentage = (attempt.score / attempt.total_points) * 100;
    }
  } else {
    percentage = Number(attempt.score) || 0;
  }
  percentage = Number(percentage).toFixed(1);
  const passed = percentage >= (attempt.exams?.passing_score || 50);

  // Determine which questions were actually delivered/answered by the student
  const displayedQuestions = questions.filter((question) => {
    let studentAnswerValue = null;
    if (typeof answers === 'object' && !Array.isArray(answers)) {
      studentAnswerValue = answers[question.id];
    } else if (Array.isArray(answers)) {
      const found = answers.find(a => a.questionId === question.id || a.id === question.id);
      studentAnswerValue = found?.answer || found;
    }

    const hasAnswer = studentAnswerValue !== undefined && studentAnswerValue !== null && !(typeof studentAnswerValue === 'string' && studentAnswerValue.trim() === '');
    return hasAnswer;
  });
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Results
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {attempt.exams?.title || 'Exam Results'}
              </h2>
              <p className="text-slate-600">
                Submitted: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}
              </p>
            </div>
            <div className={`px-6 py-3 rounded-2xl ${passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`text-4xl font-bold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                {percentage}%
              </div>
              <div className={`text-sm font-semibold mt-1 ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                {passed ? '✓ PASSED' : '✗ NOT PASSED'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600 font-medium">Score</p>
              <p className="text-xl font-bold text-blue-700">{attempt.score > (attempt.total_points || 0) && attempt.score <= 100 ? `${attempt.score}%` : `${attempt.score}/${attempt.total_points}`}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-600 font-medium">Questions</p>
              <p className="text-xl font-bold text-purple-700">{displayedQuestions.length}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-sm text-amber-600 font-medium">Pass Mark</p>
              <p className="text-xl font-bold text-amber-700">{attempt.exams?.passing_score || 50}%</p>
            </div>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No questions found for this exam</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Question Breakdown</h3>
            {/* Only show questions the student actually answered */}
            {(() => {
              if (displayedQuestions.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-600">No answered questions to display</div>
                );
              }

              return displayedQuestions.map((question, index) => {
              // Handle answers stored as object {questionId: answer}
                let studentAnswerValue = null;
                if (typeof answers === 'object' && !Array.isArray(answers)) {
                  studentAnswerValue = answers[question.id];
                } else if (Array.isArray(answers)) {
                  const found = answers.find(a => a.questionId === question.id || a.id === question.id);
                  studentAnswerValue = found?.answer || found;
                }

                const isCorrect = studentAnswerValue === question.correct_answer;

              return (
                <div key={question.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg font-semibold text-sm">
                          Question {index + 1}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                          {question.points} pts
                        </span>
                      </div>
                      <p className="text-lg text-slate-800 font-medium leading-relaxed">
                        {question.question_text}
                      </p>
                    </div>
                    <div className="ml-4">
                      {studentAnswerValue && isCorrect ? (
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                      ) : studentAnswerValue ? (
                        <XCircle className="w-8 h-8 text-red-500" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Student's Answer */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Your Answer:</p>
                      {studentAnswerValue ? (
                        <p className="text-slate-800">
                          {typeof studentAnswerValue === 'string'
                            ? studentAnswerValue
                            : JSON.stringify(studentAnswerValue)}
                        </p>
                      ) : (
                        <p className="text-slate-500 italic">No answer provided</p>
                      )}
                    </div>

                    {/* Correct Answer */}
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-emerald-600 mb-2">Correct Answer:</p>
                      <p className="text-emerald-800">
                        {typeof question.correct_answer === 'string'
                          ? question.correct_answer
                          : JSON.stringify(question.correct_answer)}
                      </p>
                    </div>
                  </div>

                  {/* Question options for multiple choice */}
                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 mb-3">All Options:</p>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isStudentAnswer = studentAnswerValue === option;
                          const isCorrectAnswer = question.correct_answer === option;
                          
                          return (
                            <div
                              key={optIndex}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                isCorrectAnswer && isStudentAnswer
                                  ? 'bg-emerald-50 border-emerald-500 shadow-md'
                                  : isCorrectAnswer
                                  ? 'bg-emerald-50 border-emerald-300'
                                  : isStudentAnswer
                                  ? 'bg-red-100 border-red-500 shadow-md'
                                  : 'bg-slate-100 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start flex-1">
                                  <span className="font-bold text-slate-700 mr-2">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span className={`${isStudentAnswer && !isCorrectAnswer ? 'text-red-800 font-semibold' : isCorrectAnswer ? 'text-emerald-800' : 'text-slate-800'}`}>
                                    {option}
                                  </span>
                                </div>
                                <div className="ml-3 flex-shrink-0">
                                  {isCorrectAnswer && (
                                    <div className="flex flex-col items-end">
                                      <CheckCircle className="w-5 h-5 text-emerald-600 mb-1" />
                                      <span className="text-xs font-bold text-emerald-600">CORRECT</span>
                                    </div>
                                  )}
                                  {isStudentAnswer && !isCorrectAnswer && (
                                    <div className="flex flex-col items-end">
                                      <XCircle className="w-5 h-5 text-red-600 mb-1" />
                                      <span className="text-xs font-bold text-red-600">YOU CHOSE</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== RESULTS TAB ====================
function ResultsTab({ attempts, profile, onRefresh }) {
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  if (selectedAttempt) {
    return <DetailedResults attempt={selectedAttempt} onBack={() => setSelectedAttempt(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center">
          <BarChart3 className="w-6 h-6 text-emerald-500 mr-2" />
          Your Results
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {!attempts || attempts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-semibold mb-2">No exam results yet</p>
          <p className="text-slate-500 mb-4">Take your first exam to see your results here!</p>
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            Refresh Results
          </button>
        </div>
      ) : (
        attempts.map((attempt) => {
          // Normalize scoring: handle cases where score may be stored as percentage
          let percentage = 0;
          if (attempt.total_points && attempt.total_points > 0) {
            if (attempt.score > attempt.total_points && attempt.score <= 100) {
              percentage = Number(attempt.score);
            } else {
              percentage = (attempt.score / attempt.total_points) * 100;
            }
          } else {
            percentage = Number(attempt.score) || 0;
          }
          percentage = Number(percentage).toFixed(1);
          const passed = percentage >= (attempt.exams?.passing_score || 50);
          
          return (
            <div key={attempt.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800 mb-2">
                    {attempt.exams?.title || 'Untitled Exam'}
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Submitted: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}
                  </p>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`px-4 py-2 rounded-xl ${passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <span className={`text-2xl font-bold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">
                        Score: {attempt.score > (attempt.total_points || 0) && attempt.score <= 100 ? `${attempt.score}%` : `${attempt.score}/${attempt.total_points}`}
                      </p>
                      <p className={`text-sm font-semibold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                        {passed ? '✓ Passed' : '✗ Not Passed'}
                      </p>
                    </div>
                  </div>
                  {attempt.status === 'graded' && (
                    <button
                      onClick={() => setSelectedAttempt(attempt)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Detailed Results</span>
                    </button>
                  )}
                  {attempt.status === 'submitted' && (
                    <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl inline-flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Pending grading by admin</span>
                    </div>
                  )}
                </div>
                {passed ? <CheckCircle className="w-12 h-12 text-emerald-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
              </div>
            </div>
          );
        }).filter(Boolean)
      )}
    </div>
  );
}

// ==================== LEADERBOARD TAB ====================
function LeaderboardTab({ leaderboard, profile }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <Trophy className="w-8 h-8 mr-3" />
          Top Performers
        </h3>
        <p className="text-amber-100 mt-1">Excellence recognizes excellence</p>
      </div>
      <div className="p-6">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-semibold mb-2">No rankings yet</p>
            <p className="text-slate-500">Complete and pass exams to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.student_id === profile.id;
              const averageScore = entry.average_score || 0;
              
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    isCurrentUser ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-slate-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {index < 3 ? <Trophy className="w-5 h-5" /> : `#${index + 1}`}
                    </div>
                    <div>
                      <p className={`font-semibold ${isCurrentUser ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {entry.profiles?.full_name || 'Unknown Student'} {isCurrentUser && '(You)'}
                      </p>
                      <p className="text-sm text-slate-600">{entry.profiles?.matric_number || 'No matric number'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{averageScore.toFixed(1)}%</p>
                    <p className="text-xs text-slate-600">{entry.total_exams_taken || 0} exam{entry.total_exams_taken !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== EXAM INTERFACE ====================
function ExamInterface({ exam, profile, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(exam.duration_minutes * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExamQuestions();
  }, []);

  useEffect(() => {
    if (timeRemaining > 0 && !submitting) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, submitting]);

  const loadExamQuestions = async () => {
    try {
      setError(null);
      console.log('[Exam] Starting exam:', exam.title);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('bank_id', exam.bank_id);

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        setError('This exam has no questions yet. Please contact the admin.');
        setTimeout(() => onExit(), 2000);
        return;
      }

      let selectedQuestions = questionsData;

      if (exam.number_of_questions && exam.number_of_questions > 0 && selectedQuestions.length > exam.number_of_questions) {
        selectedQuestions = selectedQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, exam.number_of_questions);
      }

      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert([{
          exam_id: exam.id,
          student_id: profile.id,
          answers: {},
          status: 'in_progress'
        }])
        .select()
        .single();

      if (attemptError) throw attemptError;

      setQuestions(selectedQuestions);
      setAttemptId(attemptData.id);
    } catch (error) {
      console.error('[Exam] Error:', error);
      setError('Error loading exam: ' + error.message);
      setTimeout(() => onExit(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      let score = 0;
      let totalPoints = 0;
      let hasEssay = false;

      questions.forEach(q => {
        totalPoints += q.points;
        const studentAnswer = answers[q.id];
        
        if (q.question_type === 'essay') {
          hasEssay = true;
          return;
        }
        
        if (studentAnswer?.toLowerCase() === q.correct_answer?.toLowerCase()) {
          score += q.points;
        }
      });

      const examStatus = hasEssay ? 'submitted' : 'graded';

      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          answers: answers,
          score: score,
          total_points: totalPoints,
          status: examStatus,
          time_remaining: timeRemaining
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      const percentage = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : 0;
      alert(`Exam submitted successfully!\nYour score: ${score}/${totalPoints} (${percentage}%)`);
      onExit();
    } catch (error) {
      console.error('[Exam] Error submitting:', error);
      alert('Error submitting exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Loader className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold mb-2">{error}</p>
          <p className="text-slate-600">Redirecting back...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{exam.title}</h2>
            <p className="text-slate-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
          <div className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-lg ${
            timeRemaining < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
          }`}>
            <Clock className="w-5 h-5" />
            <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium mb-4">
            {currentQuestion.question_type.replace('_', ' ').toUpperCase()} - {currentQuestion.points} pts
          </span>
          <p className="text-lg text-slate-800 font-medium leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        <div className="space-y-3">
          {currentQuestion.question_type === 'multiple_choice' && (
            currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerChange(currentQuestion.id, option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                  answers[currentQuestion.id] === option
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium text-slate-700">{String.fromCharCode(65 + index)}. </span>
                <span className="text-slate-800">{option}</span>
              </button>
            ))
          )}

          {currentQuestion.question_type === 'true_false' && (
            <>
              <button
                onClick={() => handleAnswerChange(currentQuestion.id, 'true')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQuestion.id] === 'true' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <CheckCircle className="w-5 h-5 inline mr-2 text-emerald-600" />
                <span className="text-slate-800 font-medium">True</span>
              </button>
              <button
                onClick={() => handleAnswerChange(currentQuestion.id, 'false')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQuestion.id] === 'false' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-300'
                }`}
              >
                <XCircle className="w-5 h-5 inline mr-2 text-red-600" />
                <span className="text-slate-800 font-medium">False</span>
              </button>
            </>
          )}

          {currentQuestion.question_type === 'fill_in_gap' && (
            <input
              type="text"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
          )}

          {currentQuestion.question_type === 'essay' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Write your detailed answer here..."
              rows="8"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
            />
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50 transition-all"
        >
          Previous
        </button>

        <div className="flex space-x-2 flex-wrap justify-center">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                index === currentQuestionIndex ? 'bg-emerald-500 text-white scale-110' :
                answers[questions[index].id] ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Exam</span>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
