const DASHSCOPE_CHAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithQwen(
  apiKey: string,
  messages: ChatMessage[],
  model = 'qwen-turbo'
): Promise<string> {
  const res = await fetch(DASHSCOPE_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(res.status === 401 ? 'API Key 无效或已过期' : err || `请求失败 ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice?.message?.content) throw new Error('未返回有效回复');
  return choice.message.content;
}
