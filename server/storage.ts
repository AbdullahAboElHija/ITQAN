import { type Project, type InsertProject } from "../shared/schema.ts";
import { ProjectModel } from "./db.js";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Simple in-memory TTL cache for the projects list.
// Projects change rarely – a 5-minute cache avoids a MongoDB round-trip on
// every page load without any risk of serving stale data for long.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let projectsCache: { data: Project[]; expiresAt: number } | null = null;

function getCached(): Project[] | null {
  if (projectsCache && Date.now() < projectsCache.expiresAt) {
    return projectsCache.data;
  }
  return null;
}

function setCache(data: Project[]) {
  projectsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
}

function invalidateCache() {
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
    if (cached) return cached;

    const docs = await ProjectModel.find().sort({ sortOrder: 1 });
    const projects = docs.map(toProject);
    setCache(projects);
    return projects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const doc = await ProjectModel.findById(id);
    return doc ? toProject(doc) : undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const doc = await ProjectModel.create(project);
    invalidateCache();
    return toProject(doc);
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const doc = await ProjectModel.findByIdAndUpdate(id, project, { new: true });
    invalidateCache();
    return doc ? toProject(doc) : undefined;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await ProjectModel.findByIdAndDelete(id);
    invalidateCache();
    return !!result;
  }
}

export const storage = new DatabaseStorage();
