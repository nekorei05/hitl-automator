import { useState, useEffect } from "react";
import { User, X, Check, Save } from "lucide-react";
import { getProfile, updateProfile } from "../services/api";

export default function ProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState({
    name: "",
    experience: "",
    skills: "",
    projects: ""
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      if (res.data) {
        setProfile({
          name: res.data.name || "",
          experience: res.data.experience || "",
          skills: Array.isArray(res.data.skills) ? res.data.skills.join(", ") : "",
          projects: Array.isArray(res.data.projects) ? res.data.projects.join(", ") : ""
        });
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      onClose();
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="w-[450px] h-full bg-[#09090b] border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right">

        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">User Profile</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSave} className="space-y-6">

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Bio & Experience</label>
                <textarea
                  name="experience"
                  value={profile.experience}
                  onChange={handleChange}
                  placeholder="Briefly describe your background, years of experience, and what you do..."
                  className="w-full h-32 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Core Skills</label>
                <input
                  type="text"
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  placeholder="React, Node.js, AWS, Python (comma separated)"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  Projects
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">For AI context</span>
                </label>
                <textarea
                  name="projects"
                  value={profile.projects}
                  onChange={handleChange}
                  placeholder="E-commerce site with Stripe, Chat app using Socket.io (comma separated list of project summaries)"
                  className="w-full h-32 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm resize-none leading-relaxed"
                />
              </div>

            </form>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950">
          <button
            type="submit"
            form="profile-form"
            disabled={loading || saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

      </div>
    </div>
  );
}
