import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile } from "fs/promises";
import mongoose from "mongoose";

const allowlist = [
  "@google/generative-ai",
  "axios",
  "cors",
  "date-fns",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "mongoose",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  // 1. Fetch projects from MongoDB at build-time to avoid runtime database connection latency on cold starts
  let staticProjectsData: any[] = [];
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      console.log("Fetching projects from MongoDB at build-time...");
      await mongoose.connect(MONGODB_URI);
      const projectSchema = new mongoose.Schema({
        titleEn: String, titleAr: String, titleHe: String,
        descEn: String, descAr: String, descHe: String,
        category: String, imageUrl: String, sortOrder: Number,
      });
      const ProjectModel = mongoose.models.Project || mongoose.model("Project", projectSchema);
      const docs = await ProjectModel.find().sort({ sortOrder: 1 });
      staticProjectsData = docs.map((doc: any) => {
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
          sortOrder: obj.sortOrder || 0,
        };
      });
      await mongoose.disconnect();
      console.log(`Successfully pre-rendered ${staticProjectsData.length} projects.`);
    } catch (e: any) {
      console.warn("Could not fetch projects during build, using empty fallback:", e.message);
    }
  } else {
    console.warn("MONGODB_URI not set during build, using empty fallback projects list.");
  }

  await writeFile(
    "server/projects-static.ts",
    `export const staticProjects: any[] = ${JSON.stringify(staticProjectsData, null, 2)};\n`
  );

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
