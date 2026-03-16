// app/api/chat/route.ts
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SYSTEM_PROMPT_BASE = `
你是「情绪树洞」里的小森林精灵，是一个温柔、安静、很会倾听的朋友。

【语气要求】
- 先共情，再回应：先用 1 句话承接用户情绪，再用 1～2 句话给出安慰或轻微建议。
- 语气轻柔、口语化，不过度鸡汤，不过度理性分析，不评价对错，不批判任何人。
- 每次最多追问 1 个简单问题，帮助对方继续表达。
- 回复长度控制在 2～5 句话之间，尽量短一点，让人读起来不累。
- 不要提到自己是 AI、模型、程序，不出现“作为一个 AI”之类表述。

【危机干预要求（非常重要）】
如果你在用户的话或上下文中检测到与自杀、轻生、严重自残、明显的现实危险相关的内容（包括但不限于：“我不想活了”、“想结束一切”、“已经准备好了工具”等）：
1）必须用非常严肃但仍然温柔的语气表达你的关心；
2）明确提醒用户【你不能提供医疗或法律上的专业判断】；
3）强烈建议用户立刻联系身边可信任的人，或拨打当地的心理危机干预热线 / 紧急求助电话；
4）如果对方在中国大陆，可以温柔提示例如：北京心理危机干预中心热线：800-810-1117 或 010-8295-1332；也可以建议 TA 搜索所在地官方公布的心理热线；
5）在这类危机场景中，不要转移话题，不要开玩笑。

下面是与本产品 / 用户场景相关的一些知识片段，你需要在回复时结合这些上下文，但不要逐字照抄，也不要暴露这是“检索结果”：
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessage: string = body.message;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: '缺少 message 字段' }, { status: 400 });
    }

    // 1. 为用户问题生成向量
    const embResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: userMessage,
    });
    const queryEmbedding = embResp.data[0].embedding as number[];

    // 2. 调用 Supabase 的 match_documents 函数检索最相似的 3 条
    const { data: matches, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 3,
    });

    if (matchError) {
      console.error('match_documents 调用失败：', matchError);
    }

    // 假设 match_documents 返回的每条记录包含：title, content, similarity 等字段
    const contextText = (matches || [])
      .map(
        (m: any, idx: number) =>
          `【片段 ${idx + 1}：${m.title ?? '无标题'}】\n${m.content ?? ''}`
      )
      .join('\n\n');

    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n${contextText}\n\n请基于以上知识片段，以及用户的输入，给出你的回复。`;

    // 3. 调用 OpenAI gpt-4o-mini 生成回复
    const chatResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    const reply = chatResp.choices[0]?.message?.content ?? '抱歉，我刚刚有点走神，可以再说一遍吗？';

    return NextResponse.json({ reply, context: matches ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}