import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher", "parent"] }).notNull().default("parent"),
  fullName: text("full_name").notNull(),
  email: text("email"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  fullName: true,
  email: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ageRange: text("age_range").notNull(),
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
  ageRange: true,
});
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export const children = pgTable("children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ageMonths: integer("age_months").notNull(),
  avatarUrl: text("avatar_url").default(""),
  classId: varchar("class_id"),
  interests: text("interests").array().default(sql`'{}'::text[]`),
});

export const insertChildSchema = createInsertSchema(children).pick({
  name: true,
  ageMonths: true,
  avatarUrl: true,
  classId: true,
  interests: true,
});
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;

export const parentChildren = pgTable("parent_children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull(),
  childId: varchar("child_id").notNull(),
});

export const insertParentChildSchema = createInsertSchema(parentChildren).pick({
  parentId: true,
  childId: true,
});
export type InsertParentChild = z.infer<typeof insertParentChildSchema>;
export type ParentChild = typeof parentChildren.$inferSelect;

export const teacherClasses = pgTable("teacher_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull(),
  classId: varchar("class_id").notNull(),
});

export const insertTeacherClassSchema = createInsertSchema(teacherClasses).pick({
  teacherId: true,
  classId: true,
});
export type InsertTeacherClass = z.infer<typeof insertTeacherClassSchema>;
export type TeacherClass = typeof teacherClasses.$inferSelect;

export const updates = pgTable("updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type", { enum: ["photo", "meal", "nap", "learning", "milestone", "mood", "arrival", "departure", "note"] }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  mood: text("mood"),
});

export const insertUpdateSchema = createInsertSchema(updates).pick({
  childId: true,
  teacherId: true,
  type: true,
  content: true,
  imageUrl: true,
  tags: true,
  mood: true,
});
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type Update = typeof updates.$inferSelect;
