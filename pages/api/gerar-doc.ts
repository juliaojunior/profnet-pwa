// pages/api/gerar-doc.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

// -------------------------------------------------------------
// Gera um arquivo .docx a partir do texto retornado pela IA.
// Espera { titulo: string, corpo: string } no body do POST.
// -------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { titulo = 'Conteudo', corpo = '' } = req.body as {
    titulo?: string;
    corpo?: string;
  };

  // Cada linha vira parágrafo; linhas começadas por # -> Heading 1
  const paragraphs = corpo.split('\n').map((line) => {
    const txt = line.trim();
    if (!txt) return new Paragraph('');

    if (txt.startsWith('#')) {
      return new Paragraph({
        text: txt.replace(/^#+\s*/, ''),
        heading: HeadingLevel.HEADING_1,
      });
    }
    return new Paragraph({ children: [new TextRun(txt)] });
  });

  const doc = new Document({
    sections: [
      {
        children: [new Paragraph({ text: titulo, heading: HeadingLevel.TITLE }), ...paragraphs],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${encodeURIComponent(titulo)}.docx`
  );
  return res.end(buffer);
}
