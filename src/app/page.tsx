'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Check, Trash2, Plus, Sparkles, Clock, AlertTriangle, ChevronUp, Calendar, X, Send } from 'lucide-react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: Date;
  isPinned?: boolean;
}

export default function Home() {
  const [taskInput, setTaskInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [batchDueDate, setBatchDueDate] = useState('');
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const recognitionRef = useRef<any>(null);
  const isManualStopRef = useRef(false);  // 标记是否手动停止

  // 设置页面标题
  useEffect(() => {
    document.title = 'lyjy作业管理系统';
  }, []);

  // 初始加载动画
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progress = 0;

    const startAnimation = () => {
      interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // 每次增加 5-20%
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setInitialLoading(false);
          }, 500); // 100% 后等待 0.5 秒再进入主界面
        }
        setLoadingProgress(Math.min(progress, 100));
      }, 200); // 每 200ms 更新一次
    };

    startAnimation();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // 加载任务列表
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (data.tasks) {
        setTasks(data.tasks.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        })));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载任务列表（只在加载动画完成后执行）
  useEffect(() => {
    if (!initialLoading) {
      loadTasks();
    }
  }, [initialLoading]);

  // 定时更新倒计时（每分钟更新一次）
  useEffect(() => {
    const timer = setInterval(() => {
      // 触发重新渲染以更新倒计时
      setTasks(prev => [...prev]);
    }, 60000); // 60秒

    return () => clearInterval(timer);
  }, []);

  // 组件卸载时停止录音
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 添加任务（打字输入）
  const handleAddTask = async () => {
    if (!taskInput.trim()) return;
    setIsProcessing(true);
    
    try {
      // 调用后端API自动分点并保存到数据库
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: taskInput,
          dueDate: dueDate 
        }),
      });
      
      const data = await response.json();
      if (data.tasks) {
        setTasks(prev => [...prev, ...data.tasks.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        }))]);
      }
      setTaskInput('');
      setDueDate('');
    } catch (error) {
      console.error('Error processing tasks:', error);
      alert('添加作业失败，请重试');
    }
    
    setIsProcessing(false);
  };

  // 语音输入
  const handleVoiceInput = async () => {
    // 如果正在录音，则停止录音（手动停止）
    if (isRecording && recognitionRef.current) {
      isManualStopRef.current = true;  // 标记为手动停止
      recognitionRef.current.stop();
      return;
    }

    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别功能。请使用 Chrome、Edge 或 Safari 最新版本。');
      return;
    }

    try {
      // 请求麦克风权限
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (error) {
      console.error('麦克风权限请求失败:', error);
      alert('无法访问麦克风。请在浏览器设置中允许麦克风权限，然后刷新页面重试。');
      return;
    }

    // 重置手动停止标记
    isManualStopRef.current = false;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'zh-CN';
    recognition.continuous = true;  // 持续录音，不自动停止
    recognition.interimResults = true;  // 显示中间识别结果
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('语音识别已启动');
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      console.log('收到语音识别结果');
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          console.log('最终结果:', transcript);
        }
      }

      // 只更新最终结果到输入框
      if (finalTranscript) {
        setTaskInput(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error, event.message);
      
      // 如果是 no-speech 错误且正在录音，不要停止录音
      if (event.error === 'no-speech' && isRecording && !isManualStopRef.current) {
        console.log('未检测到语音，继续录音');
        return;
      }

      setIsRecording(false);
      recognitionRef.current = null;
      
      let errorMsg = '语音识别出错，请重试';
      switch (event.error) {
        case 'audio-capture':
          errorMsg = '无法捕获音频，请检查麦克风是否正常工作';
          break;
        case 'not-allowed':
          errorMsg = '麦克风权限被拒绝。请在浏览器设置中允许麦克风权限';
          break;
        case 'network':
          errorMsg = '网络错误，请检查网络连接后重试';
          break;
        case 'aborted':
          errorMsg = '语音识别已取消';
          break;
        default:
          errorMsg = `语音识别出错: ${event.error || '未知错误'}`;
      }
      alert(errorMsg);
    };

    recognition.onend = () => {
      console.log('语音识别已结束');
      
      // 如果是手动停止，则更新状态；否则重新启动（持续录音模式）
      if (isManualStopRef.current) {
        console.log('手动停止录音');
        setIsRecording(false);
        recognitionRef.current = null;
        isManualStopRef.current = false;
      } else if (isRecording && recognitionRef.current) {
        console.log('自动重新启动语音识别（持续录音模式）');
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('重新启动语音识别失败:', error);
          setIsRecording(false);
          recognitionRef.current = null;
        }
      } else {
        setIsRecording(false);
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('启动语音识别失败:', error);
      setIsRecording(false);
      recognitionRef.current = null;
      alert('启动语音识别失败，请重试');
    }
  };

  // 标记任务完成
  const toggleTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}/toggle`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.task) {
        setTasks(prev => prev.map(task =>
          task.id === id ? { ...task, completed: data.task.completed } : task
        ));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // 删除任务
  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== id));
        // 从选中列表中移除
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('删除作业失败，请重试');
    }
  };

  // 批量选择/取消选择
  const toggleSelectTask = (id: number) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要删除的作业');
      return;
    }
    if (confirm(`确定要删除选中的 ${selectedTasks.size} 个作业吗？`)) {
      try {
        await Promise.all(
          Array.from(selectedTasks).map(id =>
            fetch(`/api/tasks/${id}`, { method: 'DELETE' })
          )
        );
        setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)));
        setSelectedTasks(new Set());
        setShowBatchOperations(false);
      } catch (error) {
        console.error('Error batch deleting tasks:', error);
        alert('批量删除失败，请重试');
      }
    }
  };

  // 批量修改到期时间
  const handleBatchUpdateDueDate = async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要修改的作业');
      return;
    }
    if (!batchDueDate) {
      alert('请选择到期时间');
      return;
    }
    
    try {
      const newDueDate = new Date(batchDueDate);
      await Promise.all(
        Array.from(selectedTasks).map(id =>
          fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dueDate: newDueDate }),
          })
        )
      );
      setTasks(prev => prev.map(task =>
        selectedTasks.has(task.id)
          ? { ...task, dueDate: newDueDate }
          : task
      ));
      setSelectedTasks(new Set());
      setBatchDueDate('');
      setShowBatchOperations(false);
    } catch (error) {
      console.error('Error batch updating due dates:', error);
      alert('批量修改时间失败，请重试');
    }
  };

  // 批量置顶
  const handleBatchPin = async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要置顶的作业');
      return;
    }
    
    try {
      await Promise.all(
        Array.from(selectedTasks).map(id =>
          fetch(`/api/tasks/${id}/pin`, { method: 'POST' })
        )
      );
      setTasks(prev => prev.map(task =>
        selectedTasks.has(task.id)
          ? { ...task, isPinned: !task.isPinned }
          : task
      ));
      setSelectedTasks(new Set());
      setShowBatchOperations(false);
    } catch (error) {
      console.error('Error batch pinning tasks:', error);
      alert('批量置顶失败，请重试');
    }
  };

  // 单个任务修改到期时间
  const updateTaskDueDate = async (id: number, newDueDate: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: newDueDate ? new Date(newDueDate) : null
        }),
      });
      const data = await response.json();
      if (data.task) {
        setTasks(prev => prev.map(task =>
          task.id === id
            ? { ...task, dueDate: data.task.dueDate }
            : task
        ));
      }
    } catch (error) {
      console.error('Error updating task due date:', error);
      alert('修改到期时间失败，请重试');
    }
  };

  // 计算到期时间
  const getTimeUntilDue = (dueDate?: Date) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    
    if (diff <= 0) return { text: '已过期', urgent: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    let urgent = false;
    
    if (days > 0) {
      text = `${days}天后到期`;
      if (days === 1) urgent = true;
    } else if (hours > 0) {
      text = `${hours}小时后到期`;
      if (hours <= 2) urgent = true;
    } else if (minutes > 0) {
      text = `${minutes}分钟后到期`;
      if (minutes <= 30) urgent = true;
    } else {
      text = '即将到期';
      urgent = true;
    }
    
    return { text, urgent };
  };

  // 排序任务（置顶 > 未完成按到期时间 > 已完成）
  const sortedTasks = [...tasks].sort((a, b) => {
    // 置顶的任务排在最前面
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    
    // 已完成的任务排在最后
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // 如果都已完成或都未完成，按到期时间排序
    if (a.completed) return 0; // 已完成的按添加顺序
    
    // 未完成的按到期时间排序
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1; // 没有到期时间的排在后面
    if (!b.dueDate) return -1;
    
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return (
    <>
      {/* 加载动画 */}
      {initialLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center">
          {/* 背景网格和光效 */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[150px]" />
          </div>

          {/* 加载内容 */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo 图标容器 */}
            <div className="relative">
              {/* 外圈旋转动画 */}
              <div className="absolute inset-0 w-32 h-32 -m-4 border-2 border-blue-500/30 rounded-full animate-spin" />
              
              {/* 内圈旋转动画（反向） */}
              <div className="absolute inset-0 w-28 h-28 -m-2 border-2 border-purple-500/30 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
              
              {/* Logo 图标 */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 animate-pulse relative z-10">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* 加载文字 */}
            <h2 className="text-2xl font-semibold text-white">
              正在加载历史作业，请稍候
            </h2>

            {/* 进度条容器 */}
            <div className="w-80 h-3 bg-slate-800 rounded-full overflow-hidden shadow-lg">
              {/* 进度条 */}
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full transition-all duration-200 ease-out relative"
                style={{ width: `${loadingProgress}%` }}
              >
                {/* 进度条发光效果 */}
                <div className="absolute inset-0 bg-white/20 blur-sm" />
                {/* 进度条前端高光 */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-lg shadow-blue-500/50"
                  style={{ opacity: loadingProgress > 0 && loadingProgress < 100 ? 1 : 0 }}
                />
              </div>
            </div>

            {/* 进度百分比 */}
            <div className="flex items-center gap-3">
              <p className="text-slate-400 text-lg font-mono">
                {Math.round(loadingProgress)}%
              </p>
              {/* 加载中的小圆点动画 */}
              {loadingProgress < 100 && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 主界面 */}
      {!initialLoading && (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
          {/* 背景网格和光效 */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[150px]" />
          </div>

          {/* 主容器 */}
          <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* 标题 */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">AI 智能作业管理系统</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            lyjy作业管理系统
          </h1>
          <p className="text-slate-400 text-lg">语音或文字输入，智能分点，轻松管理</p>
        </header>

        {/* 输入区域 */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-8 shadow-2xl">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="在此输入您的作业内容..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none h-32"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleVoiceInput}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse hover:bg-red-500/30'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span className="text-sm">停止录音</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span className="text-sm">语音输入</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* 到期时间选择器 */}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <label className="text-sm text-slate-400">到期时间（可选）:</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <button
              onClick={handleAddTask}
              disabled={!taskInput.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>智能处理中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>添加作业</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 作业列表 */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-400" />
              作业清单
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({tasks.filter(t => !t.completed).length} 待完成)
              </span>
            </h2>
            {!isLoading && tasks.length > 0 && (
              <button
                onClick={loadTasks}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                刷新
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-10 h-10 mx-auto mb-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p>加载中...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-slate-600" />
              </div>
              <p>还没有作业，开始添加吧！</p>
            </div>
          ) : (
            <>
              {/* 批量操作按钮栏 */}
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowBatchOperations(!showBatchOperations)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-all text-sm"
                >
                  <Check className="w-4 h-4" />
                  {showBatchOperations ? '取消批量选择' : `批量选择 (${selectedTasks.size})`}
                </button>
                
                {showBatchOperations && selectedTasks.size > 0 && (
                  <>
                    <div className="h-6 w-px bg-slate-600 mx-1" />
                    <button
                      onClick={handleBatchDelete}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 transition-all text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除 ({selectedTasks.size})
                    </button>
                    <button
                      onClick={handleBatchPin}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50 transition-all text-sm"
                    >
                      <ChevronUp className="w-4 h-4" />
                      置顶
                    </button>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <input
                        type="datetime-local"
                        value={batchDueDate}
                        onChange={(e) => setBatchDueDate(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        onClick={handleBatchUpdateDueDate}
                        className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-all text-sm"
                      >
                        设置时间
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* 任务列表 */}
              <div className="space-y-3">
              {sortedTasks.map((task) => {
                const timeInfo = getTimeUntilDue(task.dueDate);
                
                return (
                  <div
                    key={task.id}
                    className={`group flex items-start gap-3 p-4 rounded-xl transition-all ${
                      task.completed
                        ? 'bg-slate-800/30 border border-slate-700/50 opacity-50'
                        : timeInfo?.urgent
                        ? 'bg-red-950/30 border border-red-500/50 hover:border-red-500/80 hover:shadow-lg hover:shadow-red-500/10'
                        : 'bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10'
                    } ${task.isPinned ? 'ring-2 ring-purple-500/50' : ''}`}
                  >
                    {/* 批量选择框 */}
                    {showBatchOperations && (
                      <button
                        onClick={() => toggleSelectTask(task.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                          selectedTasks.has(task.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-600 hover:border-blue-500'
                        }`}
                      >
                        {selectedTasks.has(task.id) && <Check className="w-3 h-3 text-white" />}
                      </button>
                    )}
                    
                    {/* 完成状态切换 */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-600 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 text-white" />}
                    </button>
                    
                    {/* 置顶图标 */}
                    {task.isPinned && (
                      <ChevronUp className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <span
                        className={`block text-base ${
                          task.completed
                            ? 'text-slate-500 line-through'
                            : 'text-slate-200'
                        }`}
                      >
                        {task.text}
                      </span>
                      
                      {/* 到期时间显示和修改 */}
                      {timeInfo && !task.completed && (
                        <div className={`flex items-center gap-1.5 mt-2 text-xs ${
                          timeInfo.urgent ? 'text-red-400 font-semibold' : 'text-slate-400'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timeInfo.text}</span>
                          {timeInfo.urgent && <AlertTriangle className="w-3.5 h-3.5" />}
                        </div>
                      )}
                      
                      {/* 单个任务到期时间选择器 */}
                      <div className="mt-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <input
                          type="datetime-local"
                          value={task.dueDate ? task.dueDate.toISOString().slice(0, 16) : ''}
                          onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                          className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>提示：点击左侧方框可标记完成，悬停显示删除按钮</p>
        </div>
      </div>

      {/* 右下角按钮组 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* 纸飞机按钮 */}
        <a
          href="https://lyjy.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 transition-all flex items-center justify-center group"
        >
          <Send className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </a>

        {/* 时钟按钮 */}
        <button
          onClick={() => setShowUpdateLog(true)}
          className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 transition-all flex items-center justify-center group animate-pulse"
        >
          <Clock className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* 更新记录弹窗 */}
      {showUpdateLog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpdateLog(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                更新记录
              </h3>
              <button
                onClick={() => setShowUpdateLog(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-blue-400 font-semibold mb-2">
                2026.1.30 更新 V2.0
              </div>
              <p className="text-slate-300 leading-relaxed">
                网站焕新上线了
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowUpdateLog(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    )}
    </>
  );
}
