import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, LogOut, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAuthenticated, setAdminToken, clearAdminToken, adminFetch } from "@/lib/api";
import type { Project, InsertProject } from "@shared/schema";

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAdminToken(password);
      onLogin();
    } else {
      setError("Invalid password");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="border-4 border-foreground p-8 md:p-12 w-full max-w-md space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Lock className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-extrabold uppercase tracking-tight">Admin Access</h2>
        </div>
        {error && (
          <div className="border-2 border-destructive text-destructive p-3 font-bold text-sm uppercase">{error}</div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wide block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-foreground bg-background p-4 focus:outline-none focus:border-primary transition-colors rounded-none"
            data-testid="input-admin-password"
          />
        </div>
        <Button type="submit" className="w-full" data-testid="button-admin-login">
          Login
        </Button>
      </form>
    </div>
  );
}

const emptyProject: InsertProject = {
  titleEn: "", titleAr: "", titleHe: "",
  descEn: "", descAr: "", descHe: "",
  category: "Web Development",
  imageUrl: "",
  sortOrder: 0,
};

function ProjectForm({ project, onSave, onCancel }: { 
  project?: Project; 
  onSave: (data: InsertProject) => void; 
  onCancel: () => void 
}) {
  const [form, setForm] = useState<InsertProject>(
    project ? {
      titleEn: project.titleEn, titleAr: project.titleAr, titleHe: project.titleHe,
      descEn: project.descEn, descAr: project.descAr, descHe: project.descHe,
      category: project.category, imageUrl: project.imageUrl, sortOrder: project.sortOrder,
    } : emptyProject
  );

  const update = (key: keyof InsertProject, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="border-4 border-primary p-6 md:p-8 space-y-6 bg-background">
      <h3 className="text-xl font-extrabold uppercase">{project ? "Edit Project" : "Add New Project"}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Title (English)</label>
          <input value={form.titleEn} onChange={e => update("titleEn", e.target.value)} className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Title (Arabic)</label>
          <input value={form.titleAr} onChange={e => update("titleAr", e.target.value)} dir="rtl" className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none font-ar" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Title (Hebrew)</label>
          <input value={form.titleHe} onChange={e => update("titleHe", e.target.value)} dir="rtl" className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none font-he" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Description (English)</label>
          <textarea value={form.descEn} onChange={e => update("descEn", e.target.value)} rows={3} className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none resize-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Description (Arabic)</label>
          <textarea value={form.descAr} onChange={e => update("descAr", e.target.value)} dir="rtl" rows={3} className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none resize-none font-ar" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Description (Hebrew)</label>
          <textarea value={form.descHe} onChange={e => update("descHe", e.target.value)} dir="rtl" rows={3} className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none resize-none font-he" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Category</label>
          <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none appearance-none cursor-pointer">
            <option>Web Development</option>
            <option>AI Automation</option>
            <option>Data Solutions</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Image URL</label>
          <input value={form.imageUrl} onChange={e => update("imageUrl", e.target.value)} className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide block">Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={e => update("sortOrder", parseInt(e.target.value) || 0)} className="w-full border-2 border-foreground bg-background p-3 focus:outline-none focus:border-primary rounded-none" />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button onClick={() => onSave(form)} data-testid="button-save-project">Save</Button>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel">Cancel</Button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { admin: true }],
    queryFn: () => fetch("/api/projects?bypass=true").then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await adminFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        let msg = err.message || "Failed to create project";
        if (err.errors?.fieldErrors) {
          msg += ": " + Object.keys(err.errors.fieldErrors).join(", ") + " cannot be empty.";
        }
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowForm(false);
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProject> }) => {
      const res = await adminFetch(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        let msg = err.message || "Failed to update project";
        if (err.errors?.fieldErrors) {
          msg += ": " + Object.keys(err.errors.fieldErrors).join(", ") + " cannot be empty.";
        }
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingProject(null);
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const handleLogout = () => {
    clearAdminToken();
    window.location.reload();
  };

  const t = {
    en: { title: "Admin Panel", subtitle: "Manage Portfolio Projects", addBtn: "Add Project", headers: ["Title", "Category", "Actions"], empty: "No projects yet. Add your first one." },
    ar: { title: "لوحة التحكم", subtitle: "إدارة مشاريع المعرض", addBtn: "إضافة مشروع", headers: ["العنوان", "الفئة", "الإجراءات"], empty: "لا توجد مشاريع بعد. أضف أول مشروع." },
    he: { title: "פאנל ניהול", subtitle: "ניהול פרויקטים בתיק עבודות", addBtn: "הוסף פרויקט", headers: ["כותרת", "קטגוריה", "פעולות"], empty: "אין פרויקטים עדיין. הוסף את הראשון." }
  }[language];

  return (
    <main className="flex-1 py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground font-medium">{t.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <Button className="flex items-center gap-2" onClick={() => { setShowForm(true); setEditingProject(null); }} data-testid="button-add-project">
              <Plus className="w-5 h-5" />
              <span>{t.addBtn}</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2" data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showForm && !editingProject && (
          <div className="mb-8">
            <ProjectForm onSave={(data) => createMutation.mutate(data)} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-foreground border-t-primary animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border-4 border-foreground bg-background">
            <p className="text-xl font-bold text-muted-foreground uppercase">{t.empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project._id}>
                {editingProject?._id === project._id ? (
                  <ProjectForm
                    project={project}
                    onSave={(data) => updateMutation.mutate({ id: project._id, data })}
                    onCancel={() => setEditingProject(null)}
                  />
                ) : (
                  <div className="bg-background border-4 border-foreground p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" data-testid={`row-project-${project._id}`}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {project.imageUrl && (
                        <div className="w-16 h-16 border-2 border-foreground flex-shrink-0 overflow-hidden hidden sm:block">
                          <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg truncate">{project.titleEn}</h3>
                        <span className="text-sm text-muted-foreground font-medium uppercase">{project.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setEditingProject(project)} className="p-2 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors" data-testid={`button-edit-${project._id}`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this project?")) deleteMutation.mutate(project._id); }} className="p-2 border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors" data-testid={`button-delete-${project._id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(isAuthenticated());

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      {authed ? <AdminDashboard /> : <LoginForm onLogin={() => setAuthed(true)} />}
      <Footer />
    </div>
  );
}
