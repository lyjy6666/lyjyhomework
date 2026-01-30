import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { taskManager } from '@/storage/database/taskManager';

// GET - 获取所有任务
export async function GET() {
  try {
    const tasks = await taskManager.getAllTasks();
    return NextResponse.json({ tasks });
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

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config);

    // 构建消息
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

    // 调用 LLM
    const response = await client.invoke(messages, {
      temperature: 0.3
    });

    // 处理返回的内容，分割成任务列表
    const tasksText = response.content.trim();
    const taskItems = tasksText
      .split('\n')
      .map(line => line.replace(/^[0-9]+[.、]\s*/, '').trim())
      .filter(line => line.length > 0);

    if (taskItems.length === 0) {
      // 如果没有分割成功，将整个文本作为一个任务
      const task = await taskManager.createTask({
        text: text.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: false,
        isPinned: false
      });
      return NextResponse.json({ tasks: [task] });
    }

    // 批量创建任务到数据库
    const createdTasks = await Promise.all(
      taskItems.map(item =>
        taskManager.createTask({
          text: item,
          dueDate: dueDate ? new Date(dueDate) : null,
          completed: false,
          isPinned: false
        })
      )
    );

    return NextResponse.json({ tasks: createdTasks });
  } catch (error) {
    console.error('Error processing tasks:', error);
    return NextResponse.json(
      { error: '处理作业时出错，请重试' },
      { status: 500 }
    );
  }
}
