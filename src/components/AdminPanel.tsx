import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Scheme, User } from '../types.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ShieldCheck, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Users, 
  FilePlus, 
  BarChart4, 
  Loader2, 
  CheckCircle2, 
  Bell,
  Search,
  Check,
  X
} from 'lucide-react';

export default function AdminPanel() {
  const { token } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'schemes' | 'users' | 'add-scheme'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [schemesList, setSchemesList] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  // Create / Edit Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eligibilityDescription, setEligibilityDescription] = useState('');
  const [benefits, setBenefits] = useState('');
  const [docsReq, setDocsReq] = useState('');
  const [officialLink, setOfficialLink] = useState('');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [stateSel, setStateSel] = useState('National');
  const [categorySel, setCategorySel] = useState('Scholarships');
  const [tagsSel, setTagsSel] = useState('');

  // Eligibility criteria limits
  const [ageMin, setAgeMin] = useState<number>(18);
  const [ageMax, setAgeMax] = useState<number>(65);
  const [incomeMax, setIncomeMax] = useState<number>(300000);
  const [genderFilter, setGenderFilter] = useState('All');

  // Load Data
  const loadAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. Fetch Analytics
      const resAnal = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAnal.ok) {
        const data = await resAnal.json();
        setAnalytics(data);
      }

      // 2. Fetch Users
      const resUsers = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsersList(data.users);
      }

      // 3. Fetch Schemes
      const resSchemes = await fetch('/api/schemes');
      if (resSchemes.ok) {
        const data = await resSchemes.json();
        setSchemesList(data.schemes);
      }

    } catch (err) {
      console.error("Admin data loading failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleCreateOrUpdateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !benefits) {
      setFeedbackMsg("Please fill in the required fields: Name, Description, Benefits");
      return;
    }

    const payload = {
      name,
      description,
      eligibilityDescription,
      benefits,
      documentsRequired: docsReq.split(',').map(d => d.trim()).filter(Boolean),
      officialApplicationLink: officialLink || 'https://www.india.gov.in/',
      deadline,
      state: stateSel,
      category: categorySel,
      tags: tagsSel.split(',').map(t => t.trim()).filter(Boolean),
      eligibilityCriteria: {
        ageMin: Number(ageMin),
        ageMax: Number(ageMax),
        incomeMax: Number(incomeMax),
        genders: genderFilter === 'All' ? [] : [genderFilter],
        states: [stateSel, "All"]
      }
    };

    try {
      const url = editingId ? `/api/admin/schemes/${editingId}` : '/api/admin/schemes';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFeedbackMsg(editingId ? "Government Scheme successfully updated!" : "New Scheme successfully registered & Broadcasted!");
        resetForm();
        setActiveSubTab('schemes');
        await loadAdminData();
      } else {
        const data = await res.json();
        setFeedbackMsg(data.error || "Action failed");
      }
    } catch (err: any) {
      setFeedbackMsg("Network error: " + err.message);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this government scheme?")) return;

    try {
      const res = await fetch(`/api/admin/schemes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFeedbackMsg("Scheme deleted successfully.");
        await loadAdminData();
      }
    } catch (err: any) {
      console.error("Deletion error:", err);
    }
  };

  const handleEditClick = (s: Scheme) => {
    setEditingId(s.id);
    setName(s.name);
    setDescription(s.description);
    setEligibilityDescription(s.eligibilityDescription);
    setBenefits(s.benefits);
    setDocsReq(s.documentsRequired.join(', '));
    setOfficialLink(s.officialApplicationLink);
    setDeadline(s.deadline);
    setStateSel(s.state);
    setCategorySel(s.category);
    setTagsSel(s.tags.join(', '));
    
    if (s.eligibilityCriteria) {
      setAgeMin(s.eligibilityCriteria.ageMin || 18);
      setAgeMax(s.eligibilityCriteria.ageMax || 65);
      setIncomeMax(s.eligibilityCriteria.incomeMax || 300000);
      setGenderFilter(s.eligibilityCriteria.genders?.[0] || 'All');
    }
    
    setActiveSubTab('add-scheme');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setEligibilityDescription('');
    setBenefits('');
    setDocsReq('');
    setOfficialLink('');
    setDeadline('2026-12-31');
    setStateSel('National');
    setCategorySel('Scholarships');
    setTagsSel('');
    setAgeMin(18);
    setAgeMax(65);
    setIncomeMax(300000);
    setGenderFilter('All');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading Administrator Core Gateway...</p>
      </div>
    );
  }

  // Formatting chart data
  const categoryChartData = analytics?.categoryDistribution 
    ? Object.keys(analytics.categoryDistribution).map(key => ({
        name: key.substring(0, 15),
        count: analytics.categoryDistribution[key]
      }))
    : [];

  const stateChartData = analytics?.stateDistribution
    ? Object.keys(analytics.stateDistribution).map(key => ({
        name: key,
        count: analytics.stateDistribution[key]
      }))
    : [];

  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E'];

  return (
    <div className="space-y-6" id="admin-control-portal">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/40 border border-red-500/20 text-red-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">Administrator Command Center</h2>
            <p className="text-xs text-slate-400">Management interface for registration, scheme configuration, and platform metrics</p>
          </div>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex flex-wrap gap-1 mt-4 md:mt-0 bg-slate-950 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${activeSubTab === 'analytics' ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            <BarChart4 className="h-3.5 w-3.5" />
            <span>Metrics</span>
          </button>
          <button
            onClick={() => setActiveSubTab('schemes')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${activeSubTab === 'schemes' ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            <FilePlus className="h-3.5 w-3.5" />
            <span>Welfare Registry ({schemesList.length})</span>
          </button>
          <button
            onClick={() => { resetForm(); setActiveSubTab('add-scheme'); }}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${activeSubTab === 'add-scheme' ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{editingId ? 'Edit Config' : 'Publish Scheme'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${activeSubTab === 'users' ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Manage Citizens ({usersList.length})</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border border-amber-800/20 bg-amber-950/10 p-4 text-xs text-amber-400 flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}

      {/* 1. METRICS & GRAPHS TAB */}
      {activeSubTab === 'analytics' && analytics && (
        <div className="space-y-6" id="admin-analytics-view">
          {/* Quick counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Registered Accounts</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">{analytics.totalUsers}</h3>
              <p className="text-[9px] text-emerald-400 mt-0.5">● Active sessions live</p>
            </div>
            <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Welfare Schemes</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">{analytics.totalSchemes}</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">Distributed nationally & statewise</p>
            </div>
            <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submitted Applications</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">{analytics.totalApplications}</h3>
              <p className="text-[9px] text-amber-400 mt-0.5">{analytics.pendingApplications} pending review</p>
            </div>
            <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Digitized Documents Verified</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">{analytics.verifiedDocuments}</h3>
              <p className="text-[9px] text-emerald-400 mt-0.5">{analytics.verifiedDocuments} verified via OCR</p>
            </div>
          </div>

          {/* Recharts Block */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Category distribution bar chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Welfare Schemes By Categories</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937' }} />
                    <Bar dataKey="count" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* State Distribution Pie Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Welfare Schemes Geographic Scope</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stateChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stateChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. MANAGE SCHEMES LIST */}
      {activeSubTab === 'schemes' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden" id="admin-schemes-management">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
            <h3 className="font-display text-sm font-bold text-white">Government Welfare Scheme Catalogue ({schemesList.length})</h3>
            <button
              onClick={() => { resetForm(); setActiveSubTab('add-scheme'); }}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400"
            >
              Add New Scheme
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 font-semibold">
                  <th className="py-3 px-6">SCHEME NAME</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">GEOGRAPHIC SCOPE</th>
                  <th className="py-3 px-4">BENEFITS COVERED</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {schemesList.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-slate-900/30">
                    <td className="py-3.5 px-6 font-semibold text-white max-w-xs truncate">{scheme.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-slate-850 px-2.5 py-0.5 text-[10px] text-amber-400">{scheme.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{scheme.state}</td>
                    <td className="py-3.5 px-4 font-medium text-emerald-400">{scheme.benefits}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(scheme)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400"
                        title="Edit Configuration"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteScheme(scheme.id)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ADD / EDIT SCHEME FORM */}
      {activeSubTab === 'add-scheme' && (
        <form onSubmit={handleCreateOrUpdateScheme} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md grid gap-6 md:grid-cols-2" id="admin-add-edit-scheme-form">
          <div className="md:col-span-2 border-b border-slate-800 pb-3">
            <h3 className="font-display text-sm font-bold text-white">
              {editingId ? `Update Scheme Configuration (${editingId})` : 'Register New Government Scheme'}
            </h3>
            <p className="text-xs text-slate-400">Specify details, required files checklist, and dynamic matching limits</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Scheme Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pradhan Mantri Fasal Bima Yojana"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Short Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Core intent and objectives of this welfare initiative..."
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Eligibility Criteria Description *</label>
              <textarea
                value={eligibilityDescription}
                onChange={(e) => setEligibilityDescription(e.target.value)}
                placeholder="In simple terms, who can apply for this scheme..."
                rows={2}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Benefits & Financial Payouts *</label>
              <input
                type="text"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="e.g. ₹6,000 annually or 50% seed subsidy"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Scope State</label>
                <select
                  value={stateSel}
                  onChange={(e) => setStateSel(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {["National", "Karnataka", "Tamil Nadu", "Maharashtra", "Uttar Pradesh", "Bihar", "Gujarat", "Rajasthan", "Delhi", "Kerala"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category Group</label>
                <select
                  value={categorySel}
                  onChange={(e) => setCategorySel(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {[
                    "Scholarships", "Farmer Schemes", "Women Welfare", "Startup Support", "MSME Benefits",
                    "Senior Citizen Schemes", "Pension Programs", "Healthcare Schemes", "Housing Schemes",
                    "Employment Schemes", "Skill Development", "Education Support", "Rural Development", "State Welfare Programs"
                  ].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Criteria details & upload parameters */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-4 space-y-3.5">
              <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Automated Eligibility Rules</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Min Age Limit</label>
                  <input
                    type="number"
                    value={ageMin}
                    onChange={(e) => setAgeMin(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Max Age Limit</label>
                  <input
                    type="number"
                    value={ageMax}
                    onChange={(e) => setAgeMax(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Max Family Income Limit (₹)</label>
                <input
                  type="number"
                  value={incomeMax}
                  onChange={(e) => setIncomeMax(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Gender Restriction</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">All Genders</option>
                  <option value="Female">Female Only</option>
                  <option value="Male">Male Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Required Documents (Comma-separated)</label>
              <input
                type="text"
                value={docsReq}
                onChange={(e) => setDocsReq(e.target.value)}
                placeholder="Aadhaar Card, Income Certificate, PAN Card"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Official Application Portal Link</label>
              <input
                type="url"
                value={officialLink}
                onChange={(e) => setOfficialLink(e.target.value)}
                placeholder="https://pmjay.gov.in/"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Filing Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tags / Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={tagsSel}
                  onChange={(e) => setTagsSel(e.target.value)}
                  placeholder="agriculture, health, sc-priority"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 border-t border-slate-800 pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => { resetForm(); setActiveSubTab('schemes'); }}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400"
            >
              {editingId ? "Save Schemes Revision" : "Publish to Bharat Gateway"}
            </button>
          </div>
        </form>
      )}

      {/* 4. MANAGE REGISTERED USERS LIST */}
      {activeSubTab === 'users' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden" id="admin-users-management">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
            <h3 className="font-display text-sm font-bold text-white">Registered Indian Citizens Accounts ({usersList.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 font-semibold">
                  <th className="py-3 px-6">CITIZEN NAME</th>
                  <th className="py-3 px-4">EMAIL ADDRESS</th>
                  <th className="py-3 px-4">CONTACT NO</th>
                  <th className="py-3 px-4">STATE / DOMICILE</th>
                  <th className="py-3 px-4">VERIFIED STATUS</th>
                  <th className="py-3 px-4">ANNUAL INCOME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-900/30">
                    <td className="py-3.5 px-6">
                      <div>
                        <span className="font-semibold text-white block">{usr.fullName}</span>
                        <span className="text-[9px] text-slate-500 font-mono">ID: {usr.id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{usr.email}</td>
                    <td className="py-3.5 px-4 font-mono">{usr.phoneNumber}</td>
                    <td className="py-3.5 px-4">{usr.profile?.state || 'Not Configured'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        usr.isEmailVerified 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {usr.isEmailVerified ? <Check className="h-3 w-3 mr-0.5" /> : <X className="h-3 w-3 mr-0.5" />}
                        {usr.isEmailVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {usr.profile?.annualIncome ? `₹${usr.profile.annualIncome.toLocaleString('en-IN')}` : '—'}
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
