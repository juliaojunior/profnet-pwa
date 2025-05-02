// pages/gerador.tsx
import { useState } from 'react';
import styled from 'styled-components';
import { Layout } from '../components/Layout';
import { Button } from '../components/styled';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { ChevronDown } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Document, Paragraph, Packer } from 'docx';


type TipoConteudo = 'Plano de Aula' | 'Plano de Curso' | 'Lista de Exercícios' | 'Projeto Pedagógico';

/* ---------- campos por tipo ---------- */
const camposPorTipo: Record<TipoConteudo, { id: string; label: string; tipo?: 'textarea' | 'input' }[]> = {
  'Plano de Aula': [
    { id: 'tema', label: 'Tema / Título' },
    { id: 'objetivo', label: 'Objetivo Geral', tipo: 'textarea' },
    { id: 'publico', label: 'Público‑Alvo' },
    { id: 'disciplina', label: 'Disciplina' },
    { id: 'conteudos', label: 'Conteúdos', tipo: 'textarea' },
    { id: 'recursos', label: 'Recursos Didáticos' },
    { id: 'estrategias', label: 'Estratégias de Ensino', tipo: 'textarea' },
    { id: 'avaliacao', label: 'Avaliação' },
    { id: 'observacoes', label: 'Observações', tipo: 'textarea' },
  ],
  'Plano de Curso': [
    { id: 'curso', label: 'Nome do Curso' },
    { id: 'objetivo', label: 'Objetivo Geral', tipo: 'textarea' },
    { id: 'publico', label: 'Público‑Alvo' },
    { id: 'carga', label: 'Carga Horária total' },
    { id: 'conteudos', label: 'Módulos / Conteúdos', tipo: 'textarea' },
    { id: 'metodologia', label: 'Metodologia', tipo: 'textarea' },
    { id: 'avaliacao', label: 'Avaliação' },
  ],
  'Lista de Exercícios': [
    { id: 'tema', label: 'Tema / Tópico' },
    { id: 'nivel', label: 'Nível (fundamental, médio...)' },
    { id: 'disciplina', label: 'Disciplina' },
    { id: 'quantidade', label: 'Quantidade de questões' },
    { id: 'habilidades', label: 'Habilidades / Competências', tipo: 'textarea' },
    { id: 'observacoes', label: 'Observações', tipo: 'textarea' },
  ],
  'Projeto Pedagógico': [
    { id: 'titulo', label: 'Título do Projeto' },
    { id: 'justificativa', label: 'Justificativa', tipo: 'textarea' },
    { id: 'objetivos', label: 'Objetivos', tipo: 'textarea' },
    { id: 'publico', label: 'Público‑Alvo' },
    { id: 'areas', label: 'Área(s) do conhecimento' },
    { id: 'duracao', label: 'Duração' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'avaliacao', label: 'Avaliação' },
    { id: 'produtos', label: 'Resultados esperados', tipo: 'textarea' },
  ],
};

/* ---------- prompt templates ---------- */
function gerarPrompt(tipo: TipoConteudo, dados: Record<string, string>) {
  switch (tipo) {
    case 'Plano de Aula':
      return `Você é um professor especialista. Elabore um PLANO DE AULA detalhado.\nTema: ${dados.tema}\nObjetivo: ${dados.objetivo}\nPúblico: ${dados.publico}\nDisciplina: ${dados.disciplina}\nConteúdos: ${dados.conteudos}\nRecursos: ${dados.recursos}\nEstratégias: ${dados.estrategias}\nAvaliação: ${dados.avaliacao}\nObservações: ${dados.observacoes}`;
    case 'Plano de Curso':
      return `Crie um PLANO DE CURSO completo, seja detalhista e escreva como um especialista com 30 anos de experiência.\nCurso: ${dados.curso}\nObjetivo: ${dados.objetivo}\nPúblico: ${dados.publico}\nCarga Horária: ${dados.carga}\nConteúdos/Módulos: ${dados.conteudos}\nMetodologia: ${dados.metodologia}\nAvaliação: ${dados.avaliacao}`;
    case 'Lista de Exercícios':
      return `Gere uma LISTA DE EXERCÍCIOS, escreva como um especialista com 30 anos de experiência na área.\nTema: ${dados.tema}\nNível: ${dados.nivel}\nDisciplina: ${dados.disciplina}\nQuantidade: ${dados.quantidade}\nHabilidades trabalhadas: ${dados.habilidades}\nObservações adicionais: ${dados.observacoes}`;
    case 'Projeto Pedagógico':
      return `Desenvolva um PROJETO PEDAGÓGICO, seja extremamente detalhista e escreva como um especialista com 30 anos de experiência.\nTítulo: ${dados.titulo}\nJustificativa: ${dados.justificativa}\nObjetivos: ${dados.objetivos}\nPúblico: ${dados.publico}\nÁreas: ${dados.areas}\nDuração: ${dados.duracao}\nRecursos: ${dados.recursos}\nAvaliação: ${dados.avaliacao}\nResultados esperados: ${dados.produtos}`;
  }
}

/* ---------- styled ---------- */
const Wrapper = styled.main`
  max-width: 850px;
  margin: 48px auto;
  padding: 0 1rem;
`;

const Heading = styled.h1`
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  gap: .5rem;
  svg { font-size: 1.8rem; color: #d946ef; }
`;

const Accordion = styled.section<{ open: boolean }>`
  background: #f5f7ff;
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  transition: all .3s;
  > header{
    padding: 16px 20px;
    display:flex; justify-content:space-between; align-items:center;
    cursor:pointer; user-select:none;
    h3{margin:0;font-size:1rem;}
  }
  > div.content{
    max-height: ${({ open }) => (open ? '999px' : '0')};
    transition:max-height .35s ease;
    overflow:hidden;
    padding: ${({ open }) => (open ? '20px' : '0 20px')};
  }
`;

const Field = styled.div`
  margin-bottom: 16px;
  label{ display:block; font-size:.875rem; margin-bottom:4px; color:#475569; }
  input,textarea,select{
    width:100%; padding:10px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:.95rem;
    &:focus{ outline:none; border-color:#6366f1; box-shadow:0 0 0 2px #c7d2fe; }
  }
  textarea{ resize: vertical; min-height:80px; }
`;

const ResultBox = styled.pre`
  white-space: pre-wrap;
  background:#f8fafc;
  padding:24px;
  border-radius:12px;
  margin-top:32px;
  font-family: 'Inter', sans-serif;
  line-height:1.5;
`;

export default function GeradorPage() {
  const [tipo, setTipo] = useState<TipoConteudo>('Plano de Aula');
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [openAccordions, setOpen] = useState<Record<string, boolean>>({ basico: true });
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (id: string, value: string) => {
    setCampos(prev => ({ ...prev, [id]: value }));
  };

  const gerar = async () => {
    const prompt = gerarPrompt(tipo, campos);
    setLoading(true);
    setResultado('');
    try {
      const res = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error('sem stream');
      const decoder = new TextDecoder('utf-8');
      let text = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
        setResultado(text);
      }
    } catch (e: any) {
      console.error(e);
      setResultado('Erro ao gerar conteúdo.');
    } finally {
      setLoading(false);
    }
  };


/* …dentro do componente… */
const downloadDocx = async () => {
  if (!resultado) return;

  // cria documento com cada linha em um parágrafo
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: resultado.split('\n').map(linha => new Paragraph(linha || ' ')),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${tipo.replace(' ', '_')}.docx`);
};








  /* -------- JSX -------- */
  return (
    <Layout>
      <Wrapper>
        <Heading>
          <span role="img" aria-label="brain">🧠</span> Gerador de Conteúdo com IA
        </Heading>

        {/* Tipo */}
        <Field>
          <label>Tipo de Conteúdo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as TipoConteudo)}>
            {Object.keys(camposPorTipo).map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>

        {/* Form dinâmico dentro de um accordion */}
        <Accordion open={true}>
          <header onClick={() => {}}>
            <h3>Dados</h3> <ChevronDown />
          </header>
          <div className="content">
            {camposPorTipo[tipo].map(c => (
              <Field key={c.id}>
                <label>{c.label}</label>
                {c.tipo === 'textarea' ? (
                  <textarea value={campos[c.id] || ''} onChange={e => handleChange(c.id, e.target.value)} />
                ) : (
                  <input value={campos[c.id] || ''} onChange={e => handleChange(c.id, e.target.value)} />
                )}
              </Field>
            ))}
          </div>
        </Accordion>

        <Button onClick={gerar} disabled={loading} style={{ width: '100%', marginTop: 12 }}>
          {loading ? <AiOutlineLoading3Quarters className="spin" /> : 'Gerar Conteúdo'}
        </Button>

        {resultado && (
          <>
            <ResultBox>{resultado}</ResultBox>
            <Button onClick={downloadDocx} style={{ marginTop: 16 }}>Baixar .docx</Button>
          </>
        )}
      </Wrapper>
    </Layout>
  );
}
