// pages/mensagens.tsx – versão com Threads (respostas)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';

/* -------------------------------------------------------------------------- */
/*                                 Tipagens                                   */
/* -------------------------------------------------------------------------- */

type Reacoes = {
  '👍': number;
  '💡': number;
  '🔄': number;
  '🔖': number;
};

export interface Nota {
  id: string;
  texto: string;
  uid: string;
  autor: string;
  photoURL?: string | null;
  data: string; // ISO
  tags: string[];
  reactions: Reacoes;
  reactedBy: { [emoji: string]: string[] }; // quais usuários já reagiram
}

export interface Resposta {
  id: string;
  texto: string;
  uid: string;
  autor: string;
  data: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export default function MensagensPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [texto, setTexto] = useState('');
  const [tags, setTags] = useState('');
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(false);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<Record<string, Resposta[]>>({});

  /* --------------------------- Carrega usuário/notas -------------------------- */
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace('/login');
      setUser(u);
    });
  }, [router]);

  useEffect(() => {
    // live feed (onSnapshot) para notas
    const q = query(collection(db, 'notas'), orderBy('data', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const lst: Nota[] = [];
      snap.forEach((d) => lst.push({ id: d.id, ...(d.data() as any) }));
      setNotas(lst);
    });
    return () => unsub();
  }, []);

  /* ----------------------------- Postar nova Nota ---------------------------- */
  const publicar = async () => {
    if (!texto.trim()) return;
    if (texto.length > 400) return alert('Máximo de 400 caracteres');
    setLoading(true);
    const tagsArr = tags
      .split(/[, ]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t.substring(1) : t));

    await addDoc(collection(db, 'notas'), {
      texto,
      uid: user.uid,
      autor: user.email,
      photoURL: user.photoURL ?? null,
      data: new Date().toISOString(),
      tags: tagsArr,
      reactions: { '👍': 0, '💡': 0, '🔄': 0, '🔖': 0 },
      reactedBy: {},
    });
    setTexto('');
    setTags('');
    setLoading(false);
  };

  /* --------------------------- Reagir a uma nota ----------------------------- */
  const reagir = async (nota: Nota, emoji: keyof Reacoes) => {
    if (!user) return;
    const jaReagiu = (nota.reactedBy?.[emoji] || []).includes(user.uid);
    if (jaReagiu) return;
    const ref = doc(db, 'notas', nota.id);
    await updateDoc(ref, {
      [`reactions.${emoji}`]: increment(1),
      [`reactedBy.${emoji}`]: arrayUnion(user.uid),
    });
  };

  /* ------------------------- Carregar/responder threads ----------------------- */
  const abrirThread = async (notaId: string) => {
    if (threads[notaId]) return; // já carregado
    const snap = await getDocs(query(collection(db, 'notas', notaId, 'respostas'), orderBy('data', 'asc')));
    const resp: Resposta[] = [];
    snap.forEach((d) => resp.push({ id: d.id, ...(d.data() as any) }));
    setThreads((prev) => ({ ...prev, [notaId]: resp }));
  };

  const enviarResposta = async (notaId: string) => {
    const textoResp = respostas[notaId];
    if (!textoResp?.trim()) return;
    await addDoc(collection(db, 'notas', notaId, 'respostas'), {
      texto: textoResp,
      uid: user.uid,
      autor: user.email,
      data: new Date().toISOString(),
    });
    setRespostas((p) => ({ ...p, [notaId]: '' }));
    abrirThread(notaId); // recarrega
  };

  /* --------------------------------- Render --------------------------------- */
  return (
    <Layout>
      <h1 style={{ textAlign: 'center', color: '#2D3748' }}>Notas</h1>

      {/* Formulário de nova nota */}
      <div style={{ maxWidth: 650, margin: '24px auto' }}>
        <textarea
          value={texto}
          maxLength={400}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua nota (máx. 400 caracteres)"
          style={{ width: '100%', minHeight: 90, padding: 10, borderRadius: 8, border: '1px solid #CBD5E0' }}
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (ex: #Matemática #EnsinoMédio)"
          style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}
        />
        <Button onClick={publicar} disabled={loading} style={{ marginTop: 10 }}>
          Publicar
        </Button>
      </div>

      {/* Feed */}
      <div style={{ maxWidth: 650, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {notas.map((n) => (
          <div key={n.id} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,.05)' }}>
            {/* cabeçalho */}
            <div style={{ display: 'flex', gap: 10 }}>
              <img src={n.photoURL || '/icons/icon-192x192.png'} width={40} height={40} style={{ borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <strong>{n.autor}</strong>
                <div style={{ fontSize: 12, color: '#718096' }}>{new Date(n.data).toLocaleString()}</div>
              </div>
            </div>
            <p style={{ margin: '12px 0', whiteSpace: 'pre-line' }}>{n.texto}</p>
            {/* tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {n.tags.map((t) => (
                <span key={t} style={{ background: '#EDF2F7', padding: '2px 6px', borderRadius: 6, fontSize: 12 }}>#{t}</span>
              ))}
            </div>
            {/* reações */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {(['👍', '💡', '🔄', '🔖'] as (keyof Reacoes)[]).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => reagir(n, emoji)}
                  disabled={(n.reactedBy?.[emoji] || []).includes(user?.uid) || n.uid === user?.uid}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}
                >
                  {emoji} {n.reactions[emoji]}
                </button>
              ))}
            </div>

            {/* Thread */}
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => abrirThread(n.id)}
                style={{ fontSize: 12, color: '#2B6CB0', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {threads[n.id] ? 'Atualizar respostas' : 'Ver respostas'}
              </button>

              {threads[n.id]?.map((r) => (
                <div key={r.id} style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #CBD5E0' }}>
                  <strong style={{ fontSize: 13 }}>{r.autor}</strong>{' '}
                  <span style={{ fontSize: 12, color: '#718096' }}>{new Date(r.data).toLocaleString()}</span>
                  <p style={{ margin: '4px 0', fontSize: 14 }}>{r.texto}</p>
                </div>
              ))}

              {/* caixa de resposta */}
              <textarea
                value={respostas[n.id] || ''}
                onChange={(e) => setRespostas({ ...respostas, [n.id]: e.target.value })}
                placeholder="Responder…"
                maxLength={400}
                style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid #E2E8F0', marginTop: 8 }}
              />
              <Button onClick={() => enviarResposta(n.id)} style={{ marginTop: 4 }}>
                Enviar resposta
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
