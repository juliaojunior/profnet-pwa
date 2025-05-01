// pages/gerador.tsx
import { useState } from 'react';
import styled from 'styled-components';
import { Layout } from '../components/Layout';
import { ChevronDown } from 'lucide-react';

/* =====================================================
   PÁGINA: Gerador de Conteúdo com IA
   – UI em acordion/cards
   – Streaming live + botão .docx
   ===================================================== */

const Wrapper = styled.div`
  max-width: 880px;
  margin: 0 auto;
  padding: 32px 16px 64px;
`;

const Heading = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  color: #553c9a;
  margin-bottom: 40px;
`;

const PrimaryBtn = styled.button`
  background: #553c9a;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-2px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

/* ---------- Accordion ---------- */
const Card = styled.div<{ $open: boolean }>`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: ${({ $open }) => ($open ? '2000px' : '64px')};
`;

const CardHeader = styled.button<{ $open: boolean }>`
  width: 100%;
  padding: 18px 24px;
  background: #edf2ff;
  border: none;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardBody = styled.div`
  padding: 24px;
  display: grid;
  gap: 18px;
`;

/* ---------- Campos ---------- */
const base = `
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  background: #f7fafc;
`;
const Input = styled.input`
  ${base}
`;
const TextArea = styled.textarea`
  ${base};
  min-height: 90px;
  resize: vertical;
`;
const Select = styled.select`
  ${base}
`;
const Label = styled.label`
  font-weight: 500;
`;

/* ---------- Resultado ---------- */
const ResultBox = styled.pre`
  white-space: pre-wrap;
  background: #f7fafc;
  border-radius: 12px;
  padding: 24px;
  overflow: auto;
  max-height: 500px;
`;

export default function GeradorPage() {
  /* Campos */
  const tipos = [
    'Plano de Aula',
    'Plano de Curso',
    'Lista de Exercícios',
    'Projeto Pedagógico',
  ];
  const [tipo, setTipo] = useState(tipos[0]);
  const [titulo, setTitulo] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [publico, setPublico] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [conteudos, setConteudos] = useState('');
  const [recursos, setRecursos] = useState('');
  const [estrategias, setEstrategias] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  /* UI */
  const [open, setOpen] = useState<number | null>(0);
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState('');

  /* ---------- IA ---------- */
  const gerar = async () => {
    const prompt =
      `Comporte-se como um professor especialista. Elabore um ${tipo}.\n` +
      `Tema: ${titulo}\nObjetivo: ${objetivo}\nPúblico: ${publico}\nDisciplina: ${disciplina}\n` +
      `Conteúdos: ${conteudos}\nRecursos: ${recursos}\nEstratégias: ${estrategias}\n` +
      `Avaliação: ${avaliacao}\nObservações: ${observacoes}`;

    setResultado('');
    setGerando(true);

    const resp = await fetch('/api/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      setResultado((prev) => prev + decoder.decode(value, { stream: true }));
    }
    setGerando(false);
  };

  /* ---------- DOCX ---------- */
  const baixarDocx = async () => {
    const resp = await fetch('/api/gerar-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: `${tipo} - ${titulo}`,
        corpo: resultado,
      }),
    });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tipo.replace(/\\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Render ---------- */
  return (
    <Layout>
      <Wrapper>
        <Heading>🧠 Gerador de Conteúdo com IA</Heading>

        {/* CARD 0 */}
        <Card $open={open === 0}>
          <CardHeader $open={open === 0} onClick={() => setOpen(open === 0 ? null : 0)}>
            Tipo de Conteúdo
            <ChevronDown
              size={18}
              style={{ transform: open === 0 ? 'rotate(180deg)' : undefined }}
            />
          </CardHeader>
          <CardBody>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tipos.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </CardBody>
        </Card>

        {/* CARD 1 */}
        <Card $open={open === 1}>
          <CardHeader $open={open === 1} onClick={() => setOpen(open === 1 ? null : 1)}>
            Detalhes Básicos
            <ChevronDown
              size={18}
              style={{ transform: open === 1 ? 'rotate(180deg)' : undefined }}
            />
          </CardHeader>
          <CardBody>
            <Label>Título ou Tema</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <Label>Objetivo Geral</Label>
            <TextArea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
          </CardBody>
        </Card>

        {/* CARD 2 */}
        <Card $open={open === 2}>
          <CardHeader $open={open === 2} onClick={() => setOpen(open === 2 ? null : 2)}>
            Público & Disciplina
            <ChevronDown
              size={18}
              style={{ transform: open === 2 ? 'rotate(180deg)' : undefined }}
            />
          </CardHeader>
          <CardBody>
            <Label>Público-Alvo</Label>
            <Input value={publico} onChange={(e) => setPublico(e.target.value)} />
            <Label>Disciplina</Label>
            <Input value={disciplina} onChange={(e) => setDisciplina(e.target.value)} />
          </CardBody>
        </Card>

        {/* CARD 3 */}
        <Card $open={open === 3}>
          <CardHeader $open={open === 3} onClick={() => setOpen(open === 3 ? null : 3)}>
            Conteúdos & Recursos
            <ChevronDown
              size={18}
              style={{ transform: open === 3 ? 'rotate(180deg)' : undefined }}
            />
          </CardHeader>
          <CardBody>
            <Label>Conteúdos</Label>
            <TextArea value={conteudos} onChange={(e) => setConteudos(e.target.value)} />
            <Label>Recursos Didáticos</Label>
            <TextArea value={recursos} onChange={(e) => setRecursos(e.target.value)} />
          </CardBody>
        </Card>

        {/* CARD 4 */}
        <Card $open={open === 4}>
          <CardHeader $open={open === 4} onClick={() => setOpen(open === 4 ? null : 4)}>
            Estratégias & Avaliação
            <ChevronDown
              size={18}
              style={{ transform: open === 4 ? 'rotate(180deg)' : undefined }}
            />
          </CardHeader>
          <CardBody>
            <Label>Estratégias de Ensino</Label>
            <TextArea
              value={estrategias}
              onChange={(e) => setEstrategias(e.target.value)}
            />
            <Label>Avaliação</Label>
            <TextArea value={avaliacao} onChange={(e) => setAvaliacao(e.target.value)} />
            <Label>Observações</Label>
            <TextArea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </CardBody>
        </Card>

        {/* BOTÃO GERAR */}
        <PrimaryBtn onClick={gerar} disabled={gerando}>
          {gerando ? 'Gerando…' : 'Gerar Conteúdo'}
        </PrimaryBtn>

        {/* RESULTADO */}
        {resultado && (
          <div style={{ marginTop: 40 }}>
            <Heading style={{ fontSize: '1.25rem', marginBottom: 16 }}>Resultado</Heading>
            <ResultBox>{resultado}</ResultBox>
            <PrimaryBtn onClick={baixarDocx} style={{ marginTop: 24 }}>
              📄 Baixar .docx
            </PrimaryBtn>
          </div>
        )}
      </Wrapper>
    </Layout>
  );
}
