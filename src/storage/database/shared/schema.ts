import { pgTable } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import {
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

export const tasks = pgTable(
  "tasks",
  {
    id: integer("id")
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    text: text("text").notNull(),
    completed: boolean("completed").notNull().default(false),
    dueDate: timestamp("due_date", { withTimezone: true }),
    isPinned: boolean("is_pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    completedIdx: index("tasks_completed_idx").on(table.completed),
  })
)

// 使用 createSchemaFactory 配置 date coercion（处理前端 string → Date 转换）
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
})

// Zod schemas for validation
export const insertTaskSchema = createCoercedInsertSchema(tasks).pick({
  text: true,
  completed: true,
  dueDate: true,
  isPinned: true,
})

export const updateTaskSchema = createCoercedInsertSchema(tasks)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
    isPinned: true,
  })
  .partial()

// TypeScript types
export type Task = typeof tasks.$inferSelect
export type InsertTask = z.infer<typeof insertTaskSchema>
export type UpdateTask = z.infer<typeof updateTaskSchema>
