import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/taskManager';

export async function PUT(
  request: NextRequest,
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

    const data = await request.json();

    // 转换字段名
    const updateData: any = {};
    if (data.text !== undefined) updateData.text = data.text;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate ? new Date(data.dueDate).toISOString() : null;
    if (data.isPinned !== undefined) updateData.is_pinned = data.isPinned;

    const task = await taskManager.updateTask(id, updateData);

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
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: '更新任务失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
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

    const success = await taskManager.deleteTask(id);

    if (!success) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: '删除任务失败' },
      { status: 500 }
    );
  }
}
