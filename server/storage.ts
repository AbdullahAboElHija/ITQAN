import { type Project, type InsertProject } from "../shared/schema.ts";
import { ProjectModel, connectDB } from "./db.js";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// In-memory TTL cache + ETag for the projects list.
//
// ETag strategy: an integer counter (version) that increments on every write.
// Comparing two integers for 304 decisions is O(1) — no JSON hashing needed.
// The base is randomised on startup so stale browser ETags never match after
// a server restart (which may mean new data in MongoDB).
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface ProjectsCache {
  data: Project[];
  expiresAt: number;
  etag: string;
}

import { staticProjects } from "./projects-static.ts";

// Random base prevents cross-restart ETag collisions without any persistent state.
const ETAG_BASE = Math.random().toString(36).slice(2);
let cacheVersion = 0;

// Initialize cache with static pre-rendered build-time data to guarantee < 5ms cold starts!
let projectsCache: ProjectsCache | null = {
  data: staticProjects,
  expiresAt: Date.now() + CACHE_TTL_MS,
  etag: `"${ETAG_BASE}-${cacheVersion}"`
};

/** Returns the current ETag string, or null when cache is cold/expired. */
export function getProjectsETag(): string | null {
  if (projectsCache && Date.now() < projectsCache.expiresAt) {
    return projectsCache.etag;
  }
  return null;
}

function getCached(): ProjectsCache | null {
  if (projectsCache && Date.now() < projectsCache.expiresAt) {
    return projectsCache;
  }
  return null;
}

function setCache(data: Project[]) {
  const etag = `"${ETAG_BASE}-${cacheVersion}"`;
  projectsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS, etag };
}

function invalidateCache() {
  cacheVersion++;        // bump so the next ETag is different
  projectsCache = null;
}

function toProject(doc: any): Project {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    titleEn: obj.titleEn,
    titleAr: obj.titleAr,
    titleHe: obj.titleHe,
    descEn: obj.descEn,
    descAr: obj.descAr,
    descHe: obj.descHe,
    category: obj.category,
    imageUrl: obj.imageUrl,
    sortOrder: obj.sortOrder,
  };
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<Project[]> {
    const cached = getCached();
    if (cached) return cached.data;

    await connectDB();
    const docs = await ProjectModel.find().sort({ sortOrder: 1 });
    const projects = docs.map(toProject);
    setCache(projects);
    return projects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    await connectDB();
    const doc = await ProjectModel.findById(id);
    return doc ? toProject(doc) : undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    await connectDB();
    const doc = await ProjectModel.create(project);
    invalidateCache();
    return toProject(doc);
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    await connectDB();
    const doc = await ProjectModel.findByIdAndUpdate(id, project, { new: true });
    invalidateCache();
    return doc ? toProject(doc) : undefined;
  }

  async deleteProject(id: string): Promise<boolean> {
    await connectDB();
    const result = await ProjectModel.findByIdAndDelete(id);
    invalidateCache();
    return !!result;
  }
}

export const storage = new DatabaseStorage();
