import {
  type User, type InsertUser,
  type Class, type InsertClass,
  type Child, type InsertChild,
  type ParentChild, type InsertParentChild,
  type TeacherClass, type InsertTeacherClass,
  type Update, type InsertUpdate,
  users, classes, children, parentChildren, teacherClasses, updates
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  createClass(cls: InsertClass): Promise<Class>;
  updateClass(id: string, data: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<void>;

  getChild(id: string): Promise<Child | undefined>;
  getAllChildren(): Promise<Child[]>;
  getChildrenByClass(classId: string): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: string, data: Partial<InsertChild>): Promise<Child | undefined>;
  deleteChild(id: string): Promise<void>;

  getParentChildren(parentId: string): Promise<ParentChild[]>;
  getChildParents(childId: string): Promise<ParentChild[]>;
  linkParentChild(link: InsertParentChild): Promise<ParentChild>;
  unlinkParentChild(parentId: string, childId: string): Promise<void>;

  getAllTeacherClasses(): Promise<TeacherClass[]>;
  getTeacherClasses(teacherId: string): Promise<TeacherClass[]>;
  linkTeacherClass(link: InsertTeacherClass): Promise<TeacherClass>;
  unlinkTeacherClass(teacherId: string, classId: string): Promise<void>;

  getUpdate(id: string): Promise<Update | undefined>;
  getUpdatesByChild(childId: string): Promise<Update[]>;
  createUpdate(update: InsertUpdate): Promise<Update>;
  deleteUpdate(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(user: InsertUser) {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
  async getAllUsers() {
    return db.select().from(users);
  }
  async getUsersByRole(role: string) {
    return db.select().from(users).where(eq(users.role, role));
  }
  async updateUser(id: string, data: Partial<InsertUser>) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }
  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }

  async getClass(id: string) {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }
  async getAllClasses() {
    return db.select().from(classes);
  }
  async createClass(cls: InsertClass) {
    const [created] = await db.insert(classes).values(cls).returning();
    return created;
  }
  async updateClass(id: string, data: Partial<InsertClass>) {
    const [updated] = await db.update(classes).set(data).where(eq(classes.id, id)).returning();
    return updated;
  }
  async deleteClass(id: string) {
    await db.delete(classes).where(eq(classes.id, id));
  }

  async getChild(id: string) {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }
  async getAllChildren() {
    return db.select().from(children);
  }
  async getChildrenByClass(classId: string) {
    return db.select().from(children).where(eq(children.classId, classId));
  }
  async createChild(child: InsertChild) {
    const [created] = await db.insert(children).values(child).returning();
    return created;
  }
  async updateChild(id: string, data: Partial<InsertChild>) {
    const [updated] = await db.update(children).set(data).where(eq(children.id, id)).returning();
    return updated;
  }
  async deleteChild(id: string) {
    await db.delete(children).where(eq(children.id, id));
  }

  async getParentChildren(parentId: string) {
    return db.select().from(parentChildren).where(eq(parentChildren.parentId, parentId));
  }
  async getChildParents(childId: string) {
    return db.select().from(parentChildren).where(eq(parentChildren.childId, childId));
  }
  async linkParentChild(link: InsertParentChild) {
    const [created] = await db.insert(parentChildren).values(link).returning();
    return created;
  }
  async unlinkParentChild(parentId: string, childId: string) {
    await db.delete(parentChildren).where(
      and(eq(parentChildren.parentId, parentId), eq(parentChildren.childId, childId))
    );
  }

  async getAllTeacherClasses() {
    return db.select().from(teacherClasses);
  }
  async getTeacherClasses(teacherId: string) {
    return db.select().from(teacherClasses).where(eq(teacherClasses.teacherId, teacherId));
  }
  async linkTeacherClass(link: InsertTeacherClass) {
    const [created] = await db.insert(teacherClasses).values(link).returning();
    return created;
  }
  async unlinkTeacherClass(teacherId: string, classId: string) {
    await db.delete(teacherClasses).where(
      and(eq(teacherClasses.teacherId, teacherId), eq(teacherClasses.classId, classId))
    );
  }

  async getUpdate(id: string) {
    const [update] = await db.select().from(updates).where(eq(updates.id, id));
    return update;
  }
  async getUpdatesByChild(childId: string) {
    return db.select().from(updates).where(eq(updates.childId, childId));
  }
  async createUpdate(update: InsertUpdate) {
    const [created] = await db.insert(updates).values(update).returning();
    return created;
  }
  async deleteUpdate(id: string) {
    await db.delete(updates).where(eq(updates.id, id));
  }
}

export const storage = new DatabaseStorage();
