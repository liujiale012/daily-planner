import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const localQwenApiKey = env.QWEN_API_KEY || env.VITE_QWEN_API_KEY || process.env.QWEN_API_KEY;

  return {
    plugins: [
      react(),
      {
        name: 'local-qwen-api',
        configureServer(server) {
          server.middlewares.use('/api/qwen-chat', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Allow', 'POST');
            res.end('Method Not Allowed');
            return;
          }

          try {
            const bodyText = await new Promise<string>((resolve, reject) => {
              let raw = '';
              req.on('data', (chunk) => {
                raw += String(chunk);
              });
              req.on('end', () => resolve(raw));
              req.on('error', reject);
            });

            const body = bodyText ? JSON.parse(bodyText) : {};
            const messages = Array.isArray(body?.messages) ? body.messages : [];
            if (messages.length === 0) {
              res.statusCode = 400;
              res.end('messages 不能为空');
              return;
            }

            const apiKey = localQwenApiKey || process.env.VITE_QWEN_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.end('本地开发未配置 QWEN_API_KEY（或 VITE_QWEN_API_KEY）');
              return;
            }

            const upstream = await fetch(
              'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: body?.model || 'qwen3-max',
                  messages,
                  max_tokens: typeof body?.max_tokens === 'number' ? body.max_tokens : 1024,
                }),
              }
            );

            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(text);
          } catch (error) {
            const message = error instanceof Error ? error.message : '请求失败';
            res.statusCode = 500;
            res.end(message);
          }
          });
        },
      },
    ],
    root: '.',
    server: { port: 5173 },
  };
});
