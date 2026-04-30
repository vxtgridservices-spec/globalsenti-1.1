import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import * as templates from "./src/lib/emailTemplates";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy Resend initialization
let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("RESEND_API_KEY is missing. Email features will be disabled.");
      return null;
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

const SENDER = "Global Sentinel <info@globalsentinelgroup.com>"; 

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
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: userData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !userData || userData.role !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden"
      });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Email API Routes
  app.post("/api/email/send", async (req, res) => {
    const { type, recipientEmail, data } = req.body;
    
    try {
      const resend = getResend();
      if (!resend) {
        return res.status(500).json({ error: "Email service not configured" });
      }

      let html = "";
      let subject = "";

      switch (type) {
        case "investment-confirmation":
          html = templates.investmentConfirmationTemplate(data);
          subject = "Investment Confirmed – Global Sentinel Group";
          break;
        case "withdrawal-request":
          html = templates.withdrawalRequestTemplate(data);
          subject = "Withdrawal Request Received";
          break;
        case "withdrawal-approved":
          html = templates.withdrawalApprovedTemplate(data);
          subject = "Withdrawal Approved";
          break;
        case "withdrawal-rejected":
          html = templates.withdrawalRejectedTemplate(data);
          subject = "Withdrawal Request Update";
          break;
        case "roi-update":
          html = templates.roiUpdateTemplate(data);
          subject = "Portfolio Update";
          break;
        case "welcome":
          html = templates.welcomeEmailTemplate(data);
          subject = "Welcome to Global Sentinel Group";
          break;
        case "verification":
          html = templates.verificationEmailTemplate(data);
          subject = "Verify Your Account – Global Sentinel Group";
          break;
        case "password-reset":
          html = templates.passwordResetTemplate(data);
          subject = "Password Reset Request";
          break;
        case "order-confirmation":
          html = templates.orderConfirmationTemplate(data);
          subject = "Order Confirmation – Chemical Division";
          break;
        case "order-status":
          html = templates.orderStatusTemplate(data);
          subject = "Order Status Update";
          break;
        case "order-cancelled":
          html = templates.orderCancelledTemplate(data);
          subject = "Order Update";
          break;
        case "deal-invitation":
          html = templates.dealInvitationTemplate(data);
          subject = "Deal Room Access Granted";
          break;
        case "deal-stage-update":
          html = templates.dealStageUpdateTemplate(data);
          subject = "Transaction Status Updated";
          break;
        case "contract-ready":
          html = templates.contractReadyTemplate(data);
          subject = "Contract Ready for Review";
          break;
        case "escrow-initiated":
          html = templates.escrowInitiatedTemplate(data);
          subject = "Escrow Process Initiated";
          break;
        case "funding-confirmed":
          html = templates.fundingConfirmedTemplate(data);
          subject = "Funding Confirmed";
          break;
        case "deal-completed":
          html = templates.dealCompletedTemplate(data);
          subject = "Transaction Completed";
          break;
        case "deal-rejected":
          html = templates.dealRejectedTemplate(data);
          subject = "Transaction Closed";
          break;
        default:
          return res.status(400).json({ error: "Invalid email type" });
      }

      const response = await resend.emails.send({
        from: SENDER,
        to: recipientEmail,
        subject: subject,
        html: html,
      });

      console.log(`Email sent successfully: ${type} to ${recipientEmail}`);
      res.json({ success: true, response });
    } catch (error) {
      console.error("Failed to send email:", error);
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  // Authentication Proxy with Resend Integration
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, fullName, companyName, serviceRequest } = req.body;

    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        password: password,
        options: {
           redirectTo: `${req.headers.origin}/portal`,
           data: {
             full_name: fullName,
             company_name: companyName,
             service_request: serviceRequest,
             role: 'client'
           }
        }
      });

      if (linkError) throw linkError;

      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: SENDER,
          to: email,
          subject: "Verify Your Global Sentinel Identity",
          html: templates.verificationEmailTemplate({
            userName: fullName || 'Valued Client',
            verificationLink: linkData.properties.action_link
          }),
        });
      }

      res.json({ success: true, message: "Credential request registered. Verification dispatched." });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Admin Route
  app.get("/api/admin/dashboard-stats", adminAuth, async (req, res) => {
    try {
      const { count: totalUsers } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
      const { count: activeEscrows } = await supabaseAdmin.from("escrows").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: pendingApprovals } = await supabaseAdmin.from("escrows").select("*", { count: "exact", head: true }).eq("status", "pending");
      
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

startServer().catch(err => {
    console.error("Critical server startup error:", err);
    process.exit(1);
});
