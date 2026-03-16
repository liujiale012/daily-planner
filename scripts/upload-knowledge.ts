// scripts/upload-knowledge.ts
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ================= 配置检查与初始化 =================

const apiKey = process.env.OPENAI_API_KEY; // 匹配你的 .env.local
const baseURL = process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

if (!apiKey) {
  console.error('❌ 错误：未找到环境变量 OPENAI_API_KEY');
  console.error('请检查 .env.local 文件，确保包含：OPENAI_API_KEY=sk-...');
  process.exit(1);
}

// 🔍 调试日志：打印 Key 的特征
const keyPreview = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
console.log(`🔑 检测到 API Key: ${keyPreview} (长度: ${apiKey.length})`);
console.log(`🌐 使用 Base URL: ${baseURL}`);

if (apiKey.length < 20) {
  console.error('⚠️ 警告：API Key 长度过短，可能配置错误！');
  process.exit(1);
}

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL, 
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：缺少 Supabase 配置');
  console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '已设置' : '缺失'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '已设置' : '缺失'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ================= 业务逻辑 =================

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/自杀 | 轻生|抑郁症 | 绝望|活不下去|结束生命|伤害自己|suicide|depressed/.test(text)) return '危机干预';
  if (/考试 | 复习|作业|论文|学习|上课|刷题|考研|gpa|成绩/.test(text)) return '学习党';
  if (/工作 | 加班|领导|同事|offer|面试|职场|kpi|绩效|裁员/.test(text)) return '职场人';
  return '学习党';
}

function extractKeywords(entry: string): string[] {
  const lines = entry.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';
  const keywordLine = lines.find((l) => /^关键词[:：]/.test(l));
  
  if (keywordLine) {
    const raw = keywordLine.replace(/^关键词[:：]/, '').trim();
    return raw.split(/[、，,]/).map((s) => s.trim()).filter(Boolean);
  }

  const candidates = firstLine
    .replace(/[#*]/g, '')
    .split(/[\s,，。；;、]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  return Array.from(new Set(candidates)).slice(0, 5);
}

async function main() {
  const kbPath = path.join(process.cwd(), 'rag_knowledge_base_v2.md');
  
  if (!fs.existsSync(kbPath)) {
    console.error(`❌ 文件不存在：${kbPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(kbPath, 'utf-8');
  const parts = raw.split(/^###\s+条目/m).map((p) => p.trim());
  const entries = parts.filter((p, idx) => idx !== 0 && p.length > 0);

  console.log(`\n📚 共解析到 ${entries.length} 个条目，开始生成向量并上传到 Supabase...\n`);

  const records: any[] = [];

  for (const entry of entries) {
    const lines = entry.split('\n').map((l) => l.trim());
    const titleLine = (lines.find((l) => l.length > 0) || '').replace(/^[-*#\s]+/, '');
    const content = entry.trim();

    if (!content) continue;

    const category = inferCategory(content);
    const keywords = extractKeywords(entry);

    console.log(`⏳ 生成向量：${titleLine || '[无标题]'} (${category})`);

    try {
      // 使用阿里云推荐的 embedding 模型
      const embResp = await openai.embeddings.create({
        model: 'text-embedding-v3', 
        input: content,
      });

      const embedding = embResp.data[0].embedding as number[];

      records.push({
        title: titleLine || '未命名条目',
        content,
        category,
        keywords,
        embedding,
      });
    } catch (error: any) {
      console.error(`❌ 生成向量失败：${titleLine}`);
      console.error(`   错误信息：${error.message || error}`);
      if (error.status === 401) {
        console.error('\n💡 提示：401 错误意味着 API Key 无效。请检查 .env.local 中的 OPENAI_API_KEY 是否正确，或是否需要在阿里云控制台重新生成。');
        process.exit(1);
      }
      throw error;
    }
  }

  console.log(`\n🚀 开始批量插入 ${records.length} 条数据到 Supabase...`);

  const { error } = await supabase.from('knowledge_base').insert(
    records.map((r) => ({
      title: r.title,
      content: r.content,
      category: r.category,
      keywords: r.keywords,
      embedding: r.embedding,
    }))
  );

  if (error) {
    console.error('❌ 插入 Supabase 失败：', error);
    process.exit(1);
  }

  console.log('\n✅ 知识库上传完成！');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});