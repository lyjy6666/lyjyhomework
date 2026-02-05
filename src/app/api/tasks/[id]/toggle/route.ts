import { NextResponse } from 'next/server';
import { taskManager } from '@/lib/taskManager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的任务ID' },
        { status: 400 }
      );
    }

    const task = await taskManager.toggleTaskCompleted(id);

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // 转换字段名以匹配前端期望的格式
    const formattedTask = {
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('Error toggling task:', error);
    return NextResponse.json(
      { error: '切换任务状态失败' },
      { status: 500 }
    );
  }
}
