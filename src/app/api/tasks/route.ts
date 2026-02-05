import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/taskManager';

// GET - 获取所有任务
export async function GET() {
  try {
    const tasks = await taskManager.getAllTasks();
    // 转换字段名以匹配前端期望的格式
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined
    }));
    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: '获取任务列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新任务（AI 分点 + 数据库保存）
export async function POST(request: NextRequest) {
  try {
    const { text, dueDate } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '请输入作业内容' },
        { status: 400 }
      );
    }

    console.log('开始处理任务:', text);

    // 调用豆包 API 进行 AI 分点
    const taskItems = await callDoubaoAPI(text);

    console.log('AI 分点结果:', taskItems);

    // 批量创建任务到数据库
    const createdTasks = await Promise.all(
      taskItems.map(item =>
        taskManager.createTask({
          text: item,
          completed: false,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          is_pinned: false
        })
      )
    );

    // 转换字段名以匹配前端期望的格式
    const formattedTasks = createdTasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      isPinned: task.is_pinned,
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : undefined
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error processing tasks:', error);

    // 获取更详细的错误信息
    let errorMessage = '处理作业时出错，请重试';

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error('Full error:', error);

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

// 调用豆包 API
async function callDoubaoAPI(text: string): Promise<string[]> {
  const apiKey = process.env.DOUBAO_API_KEY;

  if (!apiKey) {
    console.error('Missing DOUBAO_API_KEY environment variable');
    throw new Error('豆包 API Key 未配置');
  }

  const url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  const messages = [
    {
      role: 'system' as const,
      content: `你是一个专业的作业管理助手。用户会输入一段作业内容，你需要将其整理成清晰的作业列表。

**重要规则：**
1. 如果用户输入的某个科目有多个作业（例如"语文作业一张试卷三个练习册"），需要将这些作业分别列为独立的不同作业项
2. 每个作业项都必须包含科目名称作为前缀
3. 每个作业项目要简洁明了，去掉多余的词语
4. 只返回作业列表，不要有任何额外的解释或前言

**格式示例：**
输入："语文作业一张试卷三个练习册，数学作业完成习题1-10"
输出：
语文一张试卷
语文三个练习册
数学完成习题1-10

输入："英语单词抄写三遍，阅读理解两篇，作文一篇"
输出：
英语单词抄写三遍
英语阅读理解两篇
英语作文一篇`
    },
    {
      role: 'user' as const,
      content: `请帮我将以下作业内容整理成列表：\n${text}`
    }
  ];

  try {
    console.log('调用豆包 API...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'doubao-pro-256k-250522',
        messages: messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('豆包 API 错误:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      // 如果 AI API 失败，返回原始文本作为任务
      console.warn('豆包 API 失败，使用原始文本作为任务');
      return [text.trim()];
    }

    const data = await response.json();
    console.log('豆包 API 响应:', data);

    const content = data.choices?.[0]?.message?.content || '';

    // 处理返回的内容，分割成任务列表
    const tasksText = content.trim();
    const taskItems = tasksText
      .split('\n')
      .map((line: string) => line.replace(/^[0-9]+[.、]\s*/, '').trim())
      .filter((line: string) => line.length > 0);

    if (taskItems.length === 0) {
      // 如果没有分割成功，将整个文本作为一个任务
      return [text.trim()];
    }

    return taskItems;
  } catch (error) {
    console.error('调用豆包 API 失败:', error);
    // 如果发生任何错误，返回原始文本作为任务
    console.warn('豆包 API 调用异常，使用原始文本作为任务');
    return [text.trim()];
  }
}
