// pages/mensagens.tsx – Fase 1: Notas 400 chars, Tags e Reações múltiplas
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import styled from 'styled-components';
import { Button } from '../components/Button';


/* ---------- tipos ---------- */
interface Nota {
  id: string;
  texto: string;
  uid: string;
  autor: string;
  photoURL?: string | null;
  data: string;
  tags: string[];
  reactions: Record<string, number>; // 👍,💡,🔄,🔖
  reactedBy?: Record<string, string[]>; // {emoji: [u1,u2]}
}

const REACTIONS = [
  { key: '👍', label: 'Concordo' },
  { key: '💡', label: 'Inspirador' },
  { key: '🔄', label: 'Compartilhar' },
  { key: '🔖', label: 'Salvar' },
];

/* ---------- styled ---------- */
const Wrapper = styled.div`
  max-width: 620px;
  margin: 32px auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TagChip = styled.span`
  background: #e2e8f0;
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 0.75rem;
  margin-right: 4px;
`;

export default function MensagensPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [texto, setTexto] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- carregar usuário e notas ---------- */
  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace('/login');
      setUser(u);
      const q = query(collection(db, 'notas'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      const lista = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Nota));
      setNotas(lista);
    });
  }, [router]);

  /* ---------- helpers ---------- */
  const parseTags = (raw: string) => {
    return raw
      .split(/[ ,#]+/)
      .map((t) => t.trim())
      .filter((t) => t);
  };

  /* ---------- publicar ---------- */
  const publicar = async () => {
    if (!texto.trim()) return;
    if (texto.length > 400) {
      alert('Máx 400 caracteres');
      return;
    }
    setLoading(true);
    const tags = parseTags(tagsInput);
    const newDoc = await addDoc(collection(db, 'notas'), {
      texto,
      uid: user.uid,
      autor: user.email,
      photoURL: user.photoURL || null,
      data: new Date().toISOString(),
      tags,
      reactions: { '👍': 0, '💡': 0, '🔄': 0, '🔖': 0 },
      reactedBy: {},
    });
    const nota: Nota = {
      id: newDoc.id,
      texto,
      uid: user.uid,
      autor: user.email,
      photoURL: user.photoURL || null,
      data: new Date().toISOString(),
      tags,
      reactions: { '👍': 0, '💡': 0, '🔄': 0, '🔖': 0 },
      reactedBy: {},
    };
    setNotas((prev) => [nota, ...prev]);
    setTexto('');
    setTagsInput('');
    setLoading(false);
  };

  /* ---------- reagir ---------- */
  const reagir = async (nt: Nota, emoji: string) => {
    if (!user) return;
    const jáReagiu = nt.reactedBy?.[emoji]?.includes(user.uid);
    if (jáReagiu) return;
    const ref = doc(db, 'notas', nt.id);
    await updateDoc(ref, {
      [`reactions.${emoji}`]: increment(1),
      [`reactedBy.${emoji}`]: arrayUnion(user.uid),
    });
    setNotas((prev) =>
      prev.map((n) =>
        n.id === nt.id
          ? {
              ...n,
              reactions: { ...n.reactions, [emoji]: (n.reactions[emoji] || 0) + 1 },
              reactedBy: {
                ...n.reactedBy,
                [emoji]: [...(n.reactedBy?.[emoji] || []), user.uid],
              },
            }
          : n,
      ),
    );
  };

  /* ---------- JSX ---------- */
  return (
    <Layout>
      <Wrapper>
        {/* publicador */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,.05)' }}>
          <textarea
            placeholder="Compartilhe uma nota (máx. 400 caracteres)"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={400}
            style={{ width: '100%', minHeight: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}
          />
          <input
            placeholder="#tags separadas por espaço ou vírgula"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
          <Button onClick={publicar} disabled={loading} style={{ marginTop: 10 }}>Publicar</Button>
        </div>

        {/* feed */}
        {notas.map((nt) => (
          <div key={nt.id} style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <img src={nt.photoURL || '/icons/icon-192x192.png'} width={40} height={40} style={{ borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#475569' }}>{nt.autor}</div>
                <p style={{ margin: '4px 0 8px', whiteSpace: 'pre-wrap' }}>{nt.texto}</p>
                {/* tags */}
                {nt.tags.map((t) => (
                  <TagChip key={t}>#{t}</TagChip>
                ))}
                {/* reações */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {REACTIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => reagir(nt, r.key)}
                      disabled={nt.reactedBy?.[r.key]?.includes(user?.uid)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                    >
                      {r.key} {nt.reactions[r.key] || 0}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Wrapper>
    </Layout>
  );
}
