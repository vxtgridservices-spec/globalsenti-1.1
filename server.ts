import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://kgcrojvuyzijlgoqpzmt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Admin Authentication Middleware
const adminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: "Unauthorized" });

  // Simple role check (assuming a 'role' column in 'profiles' table)
  const { data: userData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*") // Select all to see what's actually there
    .eq("id", user.id)
    .single();

  console.log("Debug - User ID:", user.id);
  console.log("Debug - Full Profile Data:", JSON.stringify(userData));
  console.log("Debug - Profile Error:", profileError);

  if (profileError || !userData || userData.role !== "admin") {
    return res.status(403).json({ 
      error: "Forbidden", 
      debug: { 
        role: userData?.role,
        error: profileError,
        dataFound: !!userData
      } 
    });
  }

  next();
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin Route
  app.get("/api/admin/dashboard-stats", adminAuth, async (req, res) => {
    try {
      // Fetch real data from Supabase
      const { count: totalUsers } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
      const { count: activeEscrows } = await supabaseAdmin.from("escrows").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: pendingApprovals } = await supabaseAdmin.from("escrows").select("*", { count: "exact", head: true }).eq("status", "pending");
      
      // Placeholder for revenue calculation
      const revenue = 45000;

      res.json({
        totalUsers,
        activeEscrows,
        pendingApprovals,
        revenue
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
