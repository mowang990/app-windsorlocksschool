import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole, hashPassword, comparePasswords } from "./auth";
import { insertClassSchema, insertChildSchema, insertUpdateSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function getMailTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailAppPassword) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  });
}

async function sendNotificationEmail(to: string, subject: string, html: string) {
  const transporter = getMailTransporter();
  if (!transporter || !to) return;
  try {
    await transporter.sendMail({
      from: `"Windsor Locks ELC" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.use("/uploads", (await import("express")).default.static(uploadDir));

  // ========== PHOTO UPLOAD ==========
  app.post("/api/upload", requireAuth, upload.single("photo"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // ========== PASSWORD RESET (admin resets for any user) ==========
  app.post("/api/auth/reset-password", requireRole("admin"), async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) return res.status(400).json({ message: "userId and newPassword required" });
      if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
      const hashed = await hashPassword(newPassword);
      const updated = await storage.updateUser(userId, { password: hashed });
      if (!updated) return res.status(404).json({ message: "User not found" });

      if (updated.email) {
        await sendNotificationEmail(
          updated.email,
          "Your Password Has Been Reset — Windsor Locks ELC",
          `<h2>Password Reset</h2><p>Hi ${updated.fullName},</p><p>Your password for Windsor Locks ELC has been reset by an administrator.</p><p>If you did not request this, please contact your school admin.</p>`
        );
      }

      res.json({ message: "Password reset successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ========== SELF PASSWORD CHANGE ==========
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ message: "Current and new password required" });
      if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const valid = await comparePasswords(currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
      const hashed = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashed });
      res.json({ message: "Password changed successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ========== ADMIN PASSWORD RECOVERY (verify ownership via Gmail App Password) ==========
  app.post("/api/auth/admin-recover", async (req, res) => {
    try {
      const { apiKey, newPassword } = req.body;
      if (!apiKey || !newPassword) return res.status(400).json({ message: "App password and new password required" });
      if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

      const storedKey = process.env.GMAIL_APP_PASSWORD;
      if (!storedKey || apiKey !== storedKey) {
        return res.status(403).json({ message: "Invalid app password. Only the server owner can recover the admin account." });
      }

      const admins = await storage.getUsersByRole("admin");
      if (admins.length === 0) return res.status(404).json({ message: "No admin account exists. Use setup instead." });

      const admin = admins[0];
      const hashed = await hashPassword(newPassword);
      const updated = await storage.updateUser(admin.id, { password: hashed });
      if (!updated) return res.status(500).json({ message: "Failed to update password" });

      req.logIn(updated, (err) => {
        if (err) return res.json({ message: "Password reset. Please log in with your new password." });
        const { password: _, ...safeUser } = updated;
        return res.json({ message: "Password reset successfully. You are now signed in.", user: safeUser });
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ========== ADMIN SETUP (public, creates or replaces the admin account) ==========
  app.post("/api/auth/setup", async (req, res) => {
    try {
      const { username, password, fullName, email } = req.body;
      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Username, password, and full name are required." });
      }

      const admins = await storage.getUsersByRole("admin");

      if (admins.length > 0) {
        const existingAdmin = admins[0];
        const hashed = await hashPassword(password);
        const updated = await storage.updateUser(existingAdmin.id, {
          username, password: hashed, fullName, email,
        });
        if (!updated) return res.status(500).json({ message: "Failed to update admin account." });
        req.logIn(updated, (err) => {
          if (err) return res.status(500).json({ message: "Account updated but login failed." });
          const { password: _, ...safeUser } = updated;
          return res.status(200).json(safeUser);
        });
      } else {
        const hashed = await hashPassword(password);
        const user = await storage.createUser({ username, password: hashed, role: "admin", fullName, email });
        req.logIn(user, (err) => {
          if (err) return res.status(500).json({ message: "Account created but login failed." });
          const { password: _, ...safeUser } = user;
          return res.status(201).json(safeUser);
        });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/setup-status", async (_req, res) => {
    const admins = await storage.getUsersByRole("admin");
    const hasOnlyDefaultAdmin = admins.length === 1 && admins[0].username === "admin" && admins[0].fullName === "Administrator";
    res.json({ needsSetup: admins.length === 0 || hasOnlyDefaultAdmin });
  });

  // ========== USERS ==========
  app.get("/api/users", requireRole("admin"), async (_req, res) => {
    const all = await storage.getAllUsers();
    res.json(all.map(({ password, ...u }) => u));
  });

  app.get("/api/users/role/:role", requireRole("admin"), async (req, res) => {
    const all = await storage.getUsersByRole(req.params.role);
    res.json(all.map(({ password, ...u }) => u));
  });

  app.post("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const { username, password, role, fullName, email } = req.body;
      if (!username || !password || !role || !fullName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ message: "Username already exists" });
      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashed, role, fullName, email });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);

      if (email) {
        const roleName = role.charAt(0).toUpperCase() + role.slice(1);
        await sendNotificationEmail(
          email,
          `Welcome to Windsor Locks ELC — Your ${roleName} Account`,
          `<h2>Welcome to Windsor Locks ELC!</h2>
          <p>Hi ${fullName},</p>
          <p>A ${roleName.toLowerCase()} account has been created for you.</p>
          <p><strong>Username:</strong> ${username}</p>
          <p>Please log in and change your password as soon as possible.</p>
          <p style="color:#999;font-size:12px;">Windsor Locks Early Learning Centre</p>`
        );
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.password) data.password = await hashPassword(data.password);
      const updated = await storage.updateUser(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ message: "Deleted" });
  });

  // ========== CLASSES ==========
  app.get("/api/classes", requireAuth, async (_req, res) => {
    res.json(await storage.getAllClasses());
  });

  app.post("/api/classes", requireRole("admin"), async (req, res) => {
    try {
      const data = insertClassSchema.parse(req.body);
      const cls = await storage.createClass(data);
      res.status(201).json(cls);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/classes/:id", requireRole("admin"), async (req, res) => {
    const updated = await storage.updateClass(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Class not found" });
    res.json(updated);
  });

  app.delete("/api/classes/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteClass(req.params.id);
    res.json({ message: "Deleted" });
  });

  // ========== CHILDREN ==========
  app.get("/api/children", requireAuth, async (req, res) => {
    const user = req.user!;
    if (user.role === "parent") {
      const links = await storage.getParentChildren(user.id);
      const kids = await Promise.all(links.map(l => storage.getChild(l.childId)));
      return res.json(kids.filter(Boolean));
    }
    if (user.role === "teacher") {
      const teacherClassLinks = await storage.getTeacherClasses(user.id);
      if (teacherClassLinks.length === 0) return res.json([]);
      const classIds = teacherClassLinks.map(l => l.classId);
      const allByClass = await Promise.all(classIds.map(cid => storage.getChildrenByClass(cid)));
      const flat = allByClass.flat();
      const unique = Array.from(new Map(flat.map(c => [c.id, c])).values());
      return res.json(unique);
    }
    res.json(await storage.getAllChildren());
  });

  app.get("/api/children/:id", requireAuth, async (req, res) => {
    const child = await storage.getChild(req.params.id);
    if (!child) return res.status(404).json({ message: "Child not found" });
    if (req.user!.role === "parent") {
      const links = await storage.getParentChildren(req.user!.id);
      if (!links.some(l => l.childId === child.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    res.json(child);
  });

  app.post("/api/children", requireRole("admin"), async (req, res) => {
    try {
      const data = insertChildSchema.parse(req.body);
      const child = await storage.createChild(data);
      res.status(201).json(child);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/children/:id", requireRole("admin"), async (req, res) => {
    const updated = await storage.updateChild(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Child not found" });
    res.json(updated);
  });

  app.delete("/api/children/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteChild(req.params.id);
    res.json({ message: "Deleted" });
  });

  // ========== PARENT-CHILD LINKS ==========
  app.get("/api/parent-children/:parentId", requireRole("admin"), async (req, res) => {
    res.json(await storage.getParentChildren(req.params.parentId));
  });

  app.get("/api/child-parents/:childId", requireRole("admin"), async (req, res) => {
    res.json(await storage.getChildParents(req.params.childId));
  });

  app.post("/api/parent-children", requireRole("admin"), async (req, res) => {
    try {
      const { parentId, childId } = req.body;
      if (!parentId || !childId) return res.status(400).json({ message: "parentId and childId required" });
      const link = await storage.linkParentChild({ parentId, childId });
      res.status(201).json(link);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/parent-children/:parentId/:childId", requireRole("admin"), async (req, res) => {
    await storage.unlinkParentChild(req.params.parentId, req.params.childId);
    res.json({ message: "Unlinked" });
  });

  // ========== TEACHER-CLASS LINKS ==========
  app.get("/api/teacher-classes", requireRole("admin"), async (_req, res) => {
    res.json(await storage.getAllTeacherClasses());
  });

  app.get("/api/teacher-classes/:teacherId", requireAuth, async (req, res) => {
    res.json(await storage.getTeacherClasses(req.params.teacherId));
  });

  app.post("/api/teacher-classes", requireRole("admin"), async (req, res) => {
    try {
      const { teacherId, classId } = req.body;
      if (!teacherId || !classId) return res.status(400).json({ message: "teacherId and classId required" });
      const link = await storage.linkTeacherClass({ teacherId, classId });
      res.status(201).json(link);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/teacher-classes/:teacherId/:classId", requireRole("admin"), async (req, res) => {
    await storage.unlinkTeacherClass(req.params.teacherId, req.params.classId);
    res.json({ message: "Unlinked" });
  });

  // ========== UPDATES (TIMELINE) ==========
  app.get("/api/updates/:childId", requireAuth, async (req, res) => {
    if (req.user!.role === "parent") {
      const links = await storage.getParentChildren(req.user!.id);
      if (!links.some(l => l.childId === req.params.childId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const all = await storage.getUpdatesByChild(req.params.childId);
    res.json(all);
  });

  app.post("/api/updates", requireRole("admin", "teacher"), async (req, res) => {
    try {
      const data = insertUpdateSchema.parse({ ...req.body, teacherId: req.user!.id });
      const update = await storage.createUpdate(data);
      res.status(201).json(update);

      const child = await storage.getChild(data.childId);
      if (child) {
        const parentLinks = await storage.getChildParents(data.childId);
        for (const link of parentLinks) {
          const parent = await storage.getUser(link.parentId);
          if (parent?.email) {
            const typeLabel = data.type.charAt(0).toUpperCase() + data.type.slice(1);
            await sendNotificationEmail(
              parent.email,
              `New ${typeLabel} Update for ${child.name} — Windsor Locks ELC`,
              `<h2>New Update for ${child.name}</h2>
              <p>Hi ${parent.fullName},</p>
              <p>A new <strong>${typeLabel}</strong> update has been posted for ${child.name}:</p>
              <blockquote style="border-left:3px solid #8b5cf6;padding-left:12px;color:#555;">${data.content}</blockquote>
              ${data.mood ? `<p>Mood: ${data.mood}</p>` : ''}
              ${data.tags?.length ? `<p>Tags: ${data.tags.join(', ')}</p>` : ''}
              <p>Log in to see the full update on the timeline.</p>
              <p style="color:#999;font-size:12px;">Windsor Locks Early Learning Centre</p>`
            );
          }
        }
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/updates/:id", requireRole("admin", "teacher"), async (req, res) => {
    await storage.deleteUpdate(req.params.id);
    res.json({ message: "Deleted" });
  });

  return httpServer;
}
