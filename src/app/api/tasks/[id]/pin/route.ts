import { NextResponse } from 'next/server';
import { taskManager } from '@/storage/database/taskManager';

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

    const task = await taskManager.toggleTaskPinned(id);

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error pinning task:', error);
    return NextResponse.json(
      { error: '切换任务置顶状态失败' },
      { status: 500 }
    );
  }
}
