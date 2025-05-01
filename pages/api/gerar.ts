// pages/api/gerar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PassThrough } from 'stream';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt = '' } = req.body;
  if (!prompt.trim()) return res.status(400).json({ error: 'Prompt ausente' });

  const stream = new PassThrough();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  stream.pipe(res);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',      // troque por gpt-4.x se tiver créditos
      stream: true,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    for await (const part of completion) {
      stream.write(part.choices[0]?.delta?.content || '');
    }
    stream.end();
  } catch (err) {
    console.error('Erro na API OpenAI:', err);
    stream.end('❌ Erro ao gerar conteúdo.');
  }
}
