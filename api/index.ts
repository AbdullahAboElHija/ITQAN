import express from "express";
import { registerRoutes } from "../server/routes.js";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);
registerRoutes(httpServer, app);

export default app;
