📅 每日计划本 | Daily Planner

> 一个专为高压人群设计的情绪疏导 + 任务管理双驱效能工具  
> **情绪出口 × 番茄钟 × AI 陪伴 = 更专注、更平静的每一天**

---

## 🌟 项目简介

「每日计划本」是一款结合 **情绪树洞** 与 **番茄工作法** 的个人效率工具。它不只帮你规划任务，更在你焦虑、疲惫时提供即时倾听与共情反馈，让你“边做事，边被治愈”。

- 💬 情绪树洞：随时倾诉，AI 陪你聊天，不评判、不打断
- 📝 情绪记录：按日期记录心情档位 + 备注，沉淀日常情绪轨迹
- ⏱️ 番茄钟：番茄模式 / 自由计时，支持专注模块选择与统计
- 🌧️ 沉浸式专注背景：雨景 / 雪景切换 + 雨滴环境音开关
- 🧠 RAG 记忆引擎：记住你的情绪历史，对话更有连续性
- 🛡️ 安全熔断机制：识别高危情绪，强制干预，保障心理安全
- 💾 本地数据：导出 JSON 备份 / 从备份恢复（覆盖式）

---

## 🖼️ 项目预览

本仓库当前未内置截图资源（`screenshots/` 目录不存在）。下面先放**图片占位符**：你只要在根目录新增 `screenshots/` 并按同名文件放图，README 会自动显示。

- `screenshots/home.png`：首页（今日任务 / 情绪入口 / 番茄钟状态）
- `screenshots/mood.png`：情绪记录（按日期选心情 + 备注 + 最近记录）
- `screenshots/treehole.png`：情绪树洞（AI 对话 / 共情回应）
- `screenshots/pomodoro.png`：番茄钟页面（番茄模式 / 自由计时 / 专注模块 / 统计）
- `screenshots/pomodoro-overlay-rain.png`：专注遮罩（雨景 + 雨声音效）
- `screenshots/pomodoro-overlay-snow.png`：专注遮罩（雪景）

![首页界面（占位）](./screenshots/home.png)
*首页：今日任务 + 情绪入口 + 番茄钟状态*

![情绪记录（占位）](./screenshots/mood.png)
*情绪记录：按日期选心情 + 备注，最近记录可回填编辑*

![情绪树洞（占位）](./screenshots/treehole.png)
*情绪树洞：AI 共情回应，支持多轮对话*

![番茄钟页面（占位）](./screenshots/pomodoro.png)
*番茄钟：番茄模式 / 自由计时 / 专注模块选择与统计*

![专注遮罩·雨景（占位）](./screenshots/pomodoro-overlay-rain.png)
*专注遮罩：雨景背景 + 雨滴环境音开关*

![专注遮罩·雪景（占位）](./screenshots/pomodoro-overlay-snow.png)
*专注遮罩：雪景背景，一键切换场景*

### 本地运行

```bash
git clone https://github.com/liujiale012/daily-planner.git
cd daily-planner
npm install
npm run dev
```

访问 `http://localhost:5173` 即可体验。

---

## 🧩 技术栈

- **前端**：React + TypeScript + Vite + Tailwind CSS
- **状态管理**：Zustand（含持久化到 LocalStorage）
- **后端（可选/规划）**：Supabase（Vector DB + Auth）
- **AI 层（可选/规划）**：LangChain + Gemini API + RAG 架构
- **部署**：Vercel
- **开发辅助**：Cursor + GitHub Copilot

---

## 🧠 核心功能详解

### 1) 情绪树洞（Emotional Tree Hole）

- 用户可随时输入情绪文字
- AI 基于心理学/共情表达生成回应
- 支持多轮对话，并可结合记忆让对话更有连续性

### 2) 情绪记录（Mood Log）

- 按日期选择心情档位（含 emoji）并可写备注
- 支持查看最近记录，点击一条即可载入到上方继续编辑
- 数据默认保存在本地（LocalStorage），无需登录也可使用

### 3) 番茄钟（Pomodoro / Timer）

- **番茄模式**：专注段 + 休息段切换，支持常用时长配置
- **自由计时**：用滚轮选择 1–120 分钟，适配不规则任务
- **专注模块**：可选择「今日任务 / 自定义模块」等，用于更细粒度统计
- **专注遮罩（沉浸模式）**：
  - 雨景 / 雪景两套背景可一键切换（WebGL2 着色器）
  - 支持雨滴环境音开关（遮罩开启且开关打开时播放）
  - 支持暂停/继续、重新计时、结束并结算本次专注
- **健康节奏**：连续专注累计达 3 小时会弹出关怀提示并暂停，避免过载

### 4) 安全熔断机制（Safety Circuit Breaker）

- 实时检测高危关键词（如“想死”、“绝望”等）
- 触发后立即中断 AI 回复，提示求助热线与引导语
- 可记录日志并标记为高风险事件（如项目配置启用）

### 5) 设置（Settings）

- 主题：浅色 / 深色 / 跟随系统
- 强调色：多套配色可选
- 本地数据：导出 JSON 备份 / 从备份恢复
