# Netlify 部署指南

## 🎉 代码修改完成！

你的项目已经成功修改为使用 Supabase 和豆包 API，可以部署到 Netlify 了。

## 📋 部署清单

### ✅ 已完成的修改

1. ✅ 创建 `.env.local` 环境变量文件
2. ✅ 创建 `src/lib/supabase.ts` - Supabase 客户端配置
3. ✅ 创建 `src/lib/taskManager.ts` - 任务管理器
4. ✅ 修改所有 API 路由：
   - `/api/tasks` - 获取/创建任务
   - `/api/tasks/[id]` - 更新/删除任务
   - `/api/tasks/[id]/toggle` - 切换完成状态
   - `/api/tasks/[id]/pin` - 切换置顶状态
5. ✅ 创建 `netlify.toml` - Netlify 配置文件
6. ✅ 更新 `package.json` - 添加 Supabase 依赖
7. ✅ 删除旧的 Coze SDK 代码
8. ✅ 创建 `README.md` - 项目说明文档

## 🚀 开始部署到 Netlify

### 步骤 1：推送到 GitHub

```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "feat: 迁移到 Supabase 和豆包 API，支持 Netlify 部署"

# 添加远程仓库
git branch -M main
git remote add origin https://github.com/你的用户名/lyjy-homework.git

# 推送到 GitHub
git push -u origin main
```

### 步骤 2：在 Netlify 创建站点

1. 访问：https://app.netlify.com/
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub 并授权
4. 选择你的仓库 `lyjy-homework`
5. 配置构建设置：
   ```
   Build command: pnpm install && pnpm run build
   Publish directory: .next
   Node version: 18
   ```
6. 点击 "Deploy site"

### 步骤 3：配置环境变量

1. 部署后，进入你的 Netlify 站点
2. 点击 "Site settings" → "Environment variables"
3. 添加以下环境变量：

   **Supabase 配置**：
   ```
   NEXT_PUBLIC_SUPABASE_URL
   值: https://chksygcjtgsgpiqyolod.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY
   值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoa3N5Z2NqdGdzZ3BpcXlvbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzYwMzcsImV4cCI6MjA4NTgxMjAzN30.RtRSHMZSj1u4IubXw4AltY3U2NS9U1yFmIwOxEmb254
   ```

   **豆包 API 配置**：
   ```
   DOUBAO_API_KEY
   值: a70fccf3-d665-4093-b93e-ac3c89db24c8
   ```

4. 保存后，点击 "Deploy" 重新部署

### 步骤 4：创建数据库表

**重要！** 在 Supabase 中创建 tasks 表：

1. 访问你的 Supabase 项目
2. 点击左侧 "SQL Editor"
3. 点击 "New query"
4. 粘贴并运行以下 SQL：

```sql
CREATE TABLE tasks (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX tasks_completed_idx ON tasks(completed);
```

## ✅ 部署完成！

部署成功后，你的网站将可以在：
- 任何设备上访问（手机、电脑）
- 数据自动同步到 Supabase 数据库
- 使用豆包 AI 进行智能分点

## 🔍 测试功能

1. **添加作业**：输入作业内容，AI 自动分点
2. **语音输入**：点击语音按钮，说出作业内容
3. **管理任务**：
   - 点击左侧方框标记完成
   - 悬停显示删除按钮
   - 批量选择进行操作
4. **到期时间**：设置到期时间，智能倒计时提醒

## 🆘 故障排除

### 问题 1：部署失败

- 检查 `netlify.toml` 文件是否存在
- 确认环境变量已正确配置
- 查看 Netlify 构建日志

### 问题 2：添加作业失败

- 检查 Supabase API keys 是否正确
- 确认 tasks 表已创建
- 查看 Netlify Functions 日志

### 问题 3：AI 分点不工作

- 检查豆包 API Key 是否正确
- 确认 API Key 有足够的配额
- 查看 Netlify Functions 日志

## 📚 相关链接

- Supabase: https://supabase.com/
- 豆包 API: https://console.volcengine.com/ark
- Netlify: https://www.netlify.com/

---

**恭喜！你的项目已经可以在 Netlify 上部署了！** 🎉
