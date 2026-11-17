import React, { useEffect, useState } from 'react';
import { RefreshCw, Plus, CheckCircle2, Clock } from 'lucide-react';
import { safeReadJson } from '../utils/http';

export interface HumanitarianProject {
  id: string;
  title: string;
  category: string;
  district: string;
  leadDirector: string;
  progress: number;
  status: 'In Progress' | 'Active Outreach' | 'Completed';
  beneficiariesReached: number;
  latestMilestone: string;
  updatedAt: string;
}

export const DashboardWidget: React.FC = () => {
  const [projects, setProjects] = useState<HumanitarianProject[]>([]);
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Active Outreach' | 'Completed'>('All');
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const [selectedId, setSelectedId] = useState('');
  const [newProgress, setNewProgress] = useState(75);
  const [newMilestone, setNewMilestone] = useState('');
  const [newBeneficiaries, setNewBeneficiaries] = useState('');
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await safeReadJson<{ projects?: HumanitarianProject[] }>(res);
        const list: HumanitarianProject[] = data.projects || [];
        setProjects(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
          setNewProgress(list[0].progress);
        }
      }
    } catch {
      // Retain existing state if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProjectToUpdate = (id: string) => {
    setSelectedId(id);
    const found = projects.find((p) => p.id === id);
    if (found) {
      setNewProgress(found.progress);
    }
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/projects/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: Number(newProgress),
          latestMilestone: newMilestone.trim() || undefined,
          beneficiariesReached: newBeneficiaries ? Number(newBeneficiaries) : undefined,
        }),
      });
      const data = await safeReadJson<{ project?: HumanitarianProject }>(res);
      if (res.ok && data.project) {
        setProjects((prev) => prev.map((p) => (p.id === selectedId ? data.project! : p)));
        setNewMilestone('');
        setNewBeneficiaries('');
        setShowUpdateForm(false);
      } else {
        setUpdateError(data.error || 'Could not save project update.');
      }
    } catch {
      setUpdateError('Network error while saving project update.');
    } finally {
      setSaving(false);
    }
  };

  const visibleProjects =
    filter === 'All' ? projects : projects.filter((p) => p.status === filter);

  const totalBeneficiaries = projects.reduce((sum, p) => sum + p.beneficiariesReached, 0);
  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0;

  return (
    <section className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E5DFD3] pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#78716C]">
            Live Humanitarian Operations Tracker
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            Ongoing KDF Uganda Projects
          </h2>
          <p className="mt-1 text-sm text-[#57534E]">
            Real-time progress across school construction, rural medical camps, rehabilitation
            centers, and agricultural cooperatives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F3EFE7] rounded-lg">
            {(['All', 'In Progress', 'Active Outreach', 'Completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab
                    ? 'bg-white text-[#14532D] shadow-sm'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={fetchProjects}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold text-[#1C1917] hover:bg-[#F3EFE7] whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowUpdateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Field Update</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#FBF9F5] border border-[#E5DFD3]">
          <p className="text-xs text-[#78716C]">Active Humanitarian Initiatives</p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-[#1C1917]">
            {projects.length}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-[#FBF9F5] border border-[#E5DFD3]">
          <p className="text-xs text-[#78716C]">Average Milestone Completion</p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-[#14532D]">
            {avgProgress}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-[#FBF9F5] border border-[#E5DFD3]">
          <p className="text-xs text-[#78716C]">Community Beneficiaries Reached</p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-[#1E3A8A]">
            {totalBeneficiaries.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Optional Field Update Drawer */}
      {showUpdateForm && (
        <form
          onSubmit={handleSaveUpdate}
          className="p-5 rounded-xl bg-[#FBF9F5] border border-[#D6CEBE] space-y-4"
        >
          <h3 className="text-base font-semibold text-[#1C1917]">
            Post Real-Time Project Development Update
          </h3>
          {updateError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
              {updateError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Project</label>
              <select
                value={selectedId}
                onChange={(e) => handleSelectProjectToUpdate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-lg"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Completion Progress ({newProgress}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                className="w-full mt-2 accent-[#14532D]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Total Beneficiaries Reached
              </label>
              <input
                type="number"
                min={0}
                value={newBeneficiaries}
                onChange={(e) => setNewBeneficiaries(e.target.value)}
                placeholder="Optional updated count"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D6CEBE] rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Latest Field Milestone</label>
            <input
              type="text"
              required
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="e.g. Completed roofing of 4 classrooms in Mityana or served 180 patients at mobile camp"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUpdateForm(false)}
              className="px-4 py-2 rounded-lg border border-[#D6CEBE] text-xs font-semibold hover:bg-[#F3EFE7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-xs font-semibold"
            >
              {saving ? 'Saving...' : 'Publish Progress Update'}
            </button>
          </div>
        </form>
      )}

      {/* Project Tracker Cards */}
      {loading && projects.length === 0 ? (
        <p className="text-sm text-[#57534E]">Loading live project tracker...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className="p-5 rounded-xl bg-[#FBF9F5] border border-[#E5DFD3] flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#78716C]">
                  <span>
                    {project.category} · {project.district}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#14532D]">
                    {project.status === 'Completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{project.status}</span>
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-semibold text-[#1C1917]">{project.title}</h3>
                <p className="mt-1.5 text-sm text-[#44403C] leading-relaxed">
                  {project.latestMilestone}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-[#E5DFD3]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#57534E]">Lead: {project.leadDirector}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#14532D]">
                    {project.progress}% Complete
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-[#E5DFD3] overflow-hidden">
                  <div
                    className="h-full bg-[#14532D] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#78716C] font-mono tabular-nums">
                  <span>{project.beneficiariesReached.toLocaleString()} beneficiaries reached</span>
                  <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
