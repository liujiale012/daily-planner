export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithQwen(messages: ChatMessage[], model = 'qwen3-max'): Promise<string> {
  const res = await fetch('/api/qwen-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `请求失败 ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice?.message?.content) throw new Error('未返回有效回复');
  return choice.message.content;
}
