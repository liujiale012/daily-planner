import type { VercelRequest, VercelResponse } from '@vercel/node';

const DASHSCOPE_CHAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

type IncomingMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    return res.status(500).send('服务端未配置 QWEN_API_KEY');
  }

  const body = req.body as {
    messages?: IncomingMessage[];
    model?: string;
    max_tokens?: number;
  };

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return res.status(400).send('messages 不能为空');
  }

  try {
    const upstream = await fetch(DASHSCOPE_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || 'qwen3-max',
        messages,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 1024,
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).send(text || '上游请求失败');
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务暂时不可用';
    return res.status(500).send(message);
  }
}
