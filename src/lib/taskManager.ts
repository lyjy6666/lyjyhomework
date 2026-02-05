import { supabase } from './supabase'

export interface Task {
  id: number
  text: string
  completed: boolean
  due_date?: string | null
  is_pinned: boolean
  created_at: string
  updated_at?: string | null
}

// 确保 supabase 已配置
const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check environment variables.')
  }
  return supabase
}

export class TaskManager {
  async createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      console.log('Creating task with data:', data)

      const client = getSupabaseClient()
      const { data: task, error } = await client
        .from('tasks')
        .insert({
          text: data.text,
          completed: data.completed,
          due_date: data.due_date,
          is_pinned: data.is_pinned,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating task:', error)
        throw error
      }

      console.log('Task created:', task)
      return task as Task
    } catch (error) {
      console.error('Error in createTask:', error)
      throw error
    }
  }

  async getAllTasks(): Promise<Task[]> {
    try {
      const client = getSupabaseClient()
      const { data: tasks, error } = await client
        .from('tasks')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('id', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        throw error
      }

      console.log('Tasks fetched:', tasks)
      return tasks as Task[]
    } catch (error) {
      console.error('Error in getAllTasks:', error)
      throw error
    }
  }

  async getTaskById(id: number): Promise<Task | null> {
    try {
      const client = getSupabaseClient()
      const { data: task, error } = await client
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching task:', error)
        return null
      }

      return task as Task
    } catch (error) {
      console.error('Error in getTaskById:', error)
      return null
    }
  }

  async updateTask(id: number, data: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task | null> {
    try {
      const client = getSupabaseClient()
      const { data: task, error } = await client
        .from('tasks')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating task:', error)
        throw error
      }

      return task as Task
    } catch (error) {
      console.error('Error in updateTask:', error)
      return null
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting task:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteTask:', error)
      return false
    }
  }

  async toggleTaskCompleted(id: number): Promise<Task | null> {
    const task = await this.getTaskById(id)
    if (!task) return null

    return this.updateTask(id, { completed: !task.completed })
  }

  async toggleTaskPinned(id: number): Promise<Task | null> {
    const task = await this.getTaskById(id)
    if (!task) return null

    return this.updateTask(id, { is_pinned: !task.is_pinned })
  }
}

export const taskManager = new TaskManager()
