// pages/mensagens.tsx – feed com threads, reações, exclusão e tempo‑relativo
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';

/* --------------------------------------------------------------------
 🗂️ TIPOS
---------------------------------------------------------------------*/
type Reacoes = { '👍': number; '💡': number; '🔄': number; '🔖': number };
interface Nota {
  id: string;
  texto: string;
  uid: string;
  autor: string;
  photoURL?: string | null;
  data: string;
  tags: string[];
  reactions: Reacoes;
  reactedBy: { [k in keyof Reacoes]?: string[] };
}
interface Resposta {
  id: string;
  texto: string;
  autor: string;
  uid: string;
  data: string;
  photoURL?: string | null;
}

export default function MensagensPage() {
  const router = useRouter();

  /* ------------------------------------------------------------------
   🔑 ESTADO
  -------------------------------------------------------------------*/
  const [user, setUser]               = useState<any>(null);
  const [draft, setDraft]             = useState('');
  const [draftTags, setDraftTags]     = useState('');
  const [notas, setNotas]             = useState<Nota[]>([]);
  const [threads, setThreads]         = useState<Record<string, Resposta[]>>({});
  const [replyDraft, setReplyDraft]   = useState<Record<string, string>>({});

  /* ------------------------------------------------------------------
   👤 AUTENTICAÇÃO + SUBSCRIÇÃO EM TEMPO‑REAL
  -------------------------------------------------------------------*/
  useEffect(() => {
    const offAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace('/login');
      setUser(u);

      const qNotas = query(collection(db, 'notas'), orderBy('data', 'desc'));
      const unsubNotas = onSnapshot(qNotas, (snap) => {
        const lista: Nota[] = [];
        snap.forEach((d) => lista.push({ id: d.id, ...(d.data() as any) }));
        setNotas(lista);

        /* escutar respostas de cada nota */
        const unsubs: (() => void)[] = [];
        lista.forEach((n) => {
          const qResp = query(collection(db, 'notas', n.id, 'respostas'), orderBy('data', 'asc'));
          unsubs.push(
            onSnapshot(qResp, (s) => {
              setThreads((p) => ({ ...p, [n.id]: s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) }));
            })
          );
        });
        return () => unsubs.forEach((u) => u());
      });

      return () => unsubNotas();
    });
    return () => offAuth();
  }, [router]);

  /* ------------------------------------------------------------------
   🛠 HELPERS
  -------------------------------------------------------------------*/
  const parseTags = (raw: string) => raw.split(/[#,\s]+/).filter(Boolean).map((t) => t.toLowerCase());

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'agora mesmo';
    if (m < 60) return `há ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.floor(h / 24);
    return `há ${d} d`;
  };

  /* ------------------------------------------------------------------
   ✍️ PUBLICAR NOTA / RESPOSTA
  -------------------------------------------------------------------*/
  const publicarNota = async () => {
    if (!draft.trim()) return;
    if (draft.length > 400) return alert('Máx 400 caracteres');

    await addDoc(collection(db, 'notas'), {
      texto: draft.trim(),
      uid: user.uid,
      autor: user.email,
      photoURL: user.photoURL ?? null,
      data: new Date().toISOString(),
      tags: parseTags(draftTags),
      reactions: { '👍': 0, '💡': 0, '🔄': 0, '🔖': 0 },
      reactedBy: {},
    });
    setDraft('');
    setDraftTags('');
  };

  const publicarResposta = async (notaId: string) => {
    const txt = replyDraft[notaId]?.trim();
    if (!txt) return;
    await addDoc(collection(db, 'notas', notaId, 'respostas'), {
      texto: txt,
      uid: user.uid,
      autor: user.email,
      photoURL: user.photoURL ?? null,
      data: new Date().toISOString(),
    });
    setReplyDraft((p) => ({ ...p, [notaId]: '' }));
  };

  /* ------------------------------------------------------------------
   💬 REAÇÕES
  -------------------------------------------------------------------*/
  const reagir = async (nota: Nota, emoji: keyof Reacoes) => {
    if (nota.uid === user.uid) return; // não reage na própria nota
    if (nota.reactedBy?.[emoji]?.includes(user.uid)) return; // já reagiu

    await updateDoc(doc(db, 'notas', nota.id), {
      [`reactions.${emoji}`]: increment(1),
      [`reactedBy.${emoji}`]: arrayUnion(user.uid),
    });
  };

  /* ------------------------------------------------------------------
   🗑️ EXCLUIR NOTA
  -------------------------------------------------------------------*/
  const excluirNota = async (id: string) => {
    if (!confirm('Excluir esta nota?')) return;
    await deleteDoc(doc(db, 'notas', id));
  };

  if (!user) return null;

  /* ------------------------------------------------------------------
   🖼️ UI
  -------------------------------------------------------------------*/
  return (
    <Layout>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Notas</h1>

      {/* Composer */}
      <div style={{ maxWidth: 650, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea
          maxLength={400}
          placeholder="Escreva sua nota (máx. 400 caracteres)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: '1px solid #CBD5E0', minHeight: 90 }}
        />
        <input
          placeholder="Tags (ex: #matematica #ensinomedio)"
          value={draftTags}
          onChange={(e) => setDraftTags(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}
        />
        <Button onClick={publicarNota}>Publicar</Button>
      </div>

      {/* Feed */}
      <div style={{ maxWidth: 650, margin: '32px auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {notas.map((n) => (
          <div key={n.id} style={{ background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,.05)' }}>
            {/* cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={n.photoURL ?? '/icons/icon-192x192.png'} width={40} height={40} style={{ borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <strong>{n.autor}</strong>
                <div style={{ fontSize: 12, color: '#718096' }}>{timeAgo(n.data)}</div>
              </div>
              {n.uid === user.uid && (
                <button
                  onClick={() => excluirNota(n.id)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626', fontSize: 18 }}
                >
                  🗑️
                </button>
              )}
            </div>

            <p style={{ margin: '12px 0', whiteSpace: 'pre-line' }}>{n.texto}</p>

            {/* tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {n.tags.map((t) => (
                <span key={t} style={{ background: '#EDF2F7', borderRadius: 6, padding: '2px 6px', fontSize: 12 }}>#{t}</span>
              ))}
            </div>

            {/* reações */}
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              {(Object.keys(n.reactions) as (keyof Reacoes)[]).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => reagir(n, emoji)}
                  disabled={n.uid === user.uid || n.reactedBy?.[emoji]?.includes(user.uid)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 15 }}
                >
                  {emoji} {n.reactions[emoji]}
                </button>
              ))}
            </div>

            {/* respostas */}
            <div style={{ borderLeft: '2px solid #E2E8F0', marginTop: 12, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(threads[n.id] || []).map((r) => (
                <div key={r.id} style={{ fontSize: 14 }}>
                  <strong>{r.autor}</strong> <span style={{ color: '#718096' }}>• {timeAgo(r.data)}</span>
                  <p style={{ margin: '4px 0', whiteSpace: 'pre-line' }}>{r.texto}</p>
                </div>
              ))}

              {/* composer de resposta */}
              <textarea
                placeholder="Responder…"
                maxLength={400}
                value={replyDraft[n.id] || ''}
                onChange={(e) => setReplyDraft({ ...replyDraft, [n.id]: e.target.value })}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #E2E8F0', minHeight: 60 }}
              />
              <Button onClick={() => publicarResposta(n.id)} style={{ alignSelf: 'flex-start' }}>
                Enviar resposta
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
