import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertProjectSchema } from "../shared/schema.js";
import mongoose from "mongoose";
import crypto from "crypto";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  
  try {
    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedPassword);
    
    if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
  } catch (e) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/projects", async (_req, res) => {
    const projects = await storage.getProjects();
    // Cache at the CDN/edge for 60 s; allow revalidation for up to 5 min.
    // This means the Vercel edge serves the response without hitting the
    // serverless function (and therefore MongoDB) on every single request.
    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json(projects);
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const expectedPassword = process.env.ADMIN_PASSWORD || "";
    
    try {
      const passwordBuffer = Buffer.from(password || "");
      const expectedBuffer = Buffer.from(expectedPassword);
      
      if (passwordBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(passwordBuffer, expectedBuffer)) {
        res.json({ success: true });
        return;
      }
    } catch (e) {
      // Ignore buffer errors and fall through to unauthorized
    }
    
    res.status(401).json({ success: false, message: "Invalid password" });
  });

  app.post("/api/projects", requireAdmin, async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid project data", errors: parsed.error.flatten() });
      return;
    }
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.patch("/api/projects/:id", requireAdmin, async (req, res) => {
    const id = req.params.id as string;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid project ID" });
      return;
    }
    const parsed = insertProjectSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid project data", errors: parsed.error.flatten() });
      return;
    }
    const project = await storage.updateProject(id, parsed.data);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json(project);
  });

  app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
    const id = req.params.id as string;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid project ID" });
      return;
    }
    const deleted = await storage.deleteProject(id);
    if (!deleted) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json({ success: true });
  });

  return httpServer;
}
