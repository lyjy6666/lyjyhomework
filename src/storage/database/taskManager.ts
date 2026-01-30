import { eq, sql } from "drizzle-orm"
import { getDb } from "coze-coding-dev-sdk"
import { tasks, insertTaskSchema, updateTaskSchema } from "./shared/schema"
import type { Task, InsertTask, UpdateTask } from "./shared/schema"

export class TaskManager {
  async createTask(data: InsertTask): Promise<Task> {
    try {
      const db = await getDb()
      console.log('Creating task with data:', JSON.stringify(data, null, 2))
      const validated = insertTaskSchema.parse(data)
      console.log('Validated data:', validated)
      const [task] = await db
        .insert(tasks)
        .values({
          ...validated,
          updatedAt: new Date(),
        })
        .returning()
      return task
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  async getAllTasks(): Promise<Task[]> {
    const db = await getDb()
    return db
      .select()
      .from(tasks)
      .orderBy(sql`CASE WHEN is_pinned THEN 0 ELSE 1 END, id DESC`)
  }

  async getTaskById(id: number): Promise<Task | null> {
    const db = await getDb()
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id))
    return task || null
  }

  async updateTask(id: number, data: UpdateTask): Promise<Task | null> {
    const db = await getDb()
    const validated = updateTaskSchema.parse(data)
    const [task] = await db
      .update(tasks)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
    return task || null
  }

  async deleteTask(id: number): Promise<boolean> {
    const db = await getDb()
    const result = await db.delete(tasks).where(eq(tasks.id, id))
    return (result.rowCount ?? 0) > 0
  }

  async toggleTaskCompleted(id: number): Promise<Task | null> {
    const db = await getDb()
    const [task] = await db
      .select({ completed: tasks.completed })
      .from(tasks)
      .where(eq(tasks.id, id))

    if (!task) return null

    return this.updateTask(id, { completed: !task.completed })
  }

  async toggleTaskPinned(id: number): Promise<Task | null> {
    const db = await getDb()
    const [task] = await db
      .select({ isPinned: tasks.isPinned })
      .from(tasks)
      .where(eq(tasks.id, id))

    if (!task) return null

    return this.updateTask(id, { isPinned: !task.isPinned })
  }
}

export const taskManager = new TaskManager()
