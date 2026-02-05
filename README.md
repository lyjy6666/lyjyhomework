# lyjy作业管理系统

一个智能的作业管理工具，支持语音/文字输入、AI自动分点、到期时间提醒、批量操作等功能。

## 🚀 部署到 Netlify

### 前置条件

1. **注册并配置 Supabase**
   - 访问：https://supabase.com/
   - 创建项目并获取 API keys
   - 运行 SQL 创建 tasks 表：

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

2. **申请豆包 API Key**
   - 访问：https://console.volcengine.com/ark
   - 创建 API Key

### 部署步骤

#### 1. 准备代码

```bash
# 安装依赖
pnpm install

# 本地测试
pnpm dev
```

#### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_Supabase_anon_key

# 豆包 API 配置
DOUBAO_API_KEY=你的豆包_API_Key
```

#### 3. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

#### 4. 在 Netlify 部署

1. 访问：https://app.netlify.com/
2. 点击 "Add new site" → "Import an existing project"
3. 连接你的 GitHub 仓库
4. 配置构建设置：
   - **Build command**: `pnpm install && pnpm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`
5. 添加环境变量（在 Site settings → Environment variables）：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase anon key
   - `DOUBAO_API_KEY`: 你的豆包 API Key
6. 点击 "Deploy site"

## 📦 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 🎨 功能特性

- ✅ 语音/文字输入作业
- ✅ AI 自动分点（豆包大模型）
- ✅ 作业到期时间管理
- ✅ 智能倒计时提醒
- ✅ 批量操作（删除、置顶、修改时间）
- ✅ 数据持久化（Supabase 数据库）
- ✅ 跨设备同步
- ✅ 科技风界面
- ✅ 加载动画

## 🔧 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **AI**: 豆包大模型 API
- **部署**: Netlify

## 📄 许可证

MIT
