// pages/mensagens.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import styled from 'styled-components';
import { FaRegHeart, FaTrash, FaPaperPlane, FaReply } from 'react-icons/fa';
import { theme } from '../styles/theme';

/* -------------------------------------------------------------------------- */
/* Helpers de data                                                             */
/* -------------------------------------------------------------------------- */

/** Converte qualquer valor vindo do Firestore em `Date` ou devolve `null`.  */
function safeToDate(d: any): Date | null {
  if (!d) return null;                        // ainda null
  if (typeof d === 'number') return new Date(d);
  if ('toDate' in d) return d.toDate();       // Timestamp
  if ('seconds' in d) return new Date(d.seconds * 1000);
  return null;
}

/** Retorna string “há 2 minutos”, “há 3 dias”…  */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `há ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

/* -------------------------------------------------------------------------- */
/* Tipagens                                                                    */
/* -------------------------------------------------------------------------- */

interface Mensagem {
  id: string;
  texto: string;
  uid: string;
  autor: string;
  photoURL?: string | null;
  data: any;                // Timestamp ou null
  likes: number;
  likedBy?: string[];
  parentId?: string;
}

/* -------------------------------------------------------------------------- */
/* Styled-components (iguais ao seu código original)                           */
/* -------------------------------------------------------------------------- */

const Container = styled.div`
  display: flex;
  justify-content: center;
  padding: ${theme.spacing.lg};
  background: ${theme.colors.background};
  min-height: 100vh;
  @media (max-width: 600px) { padding: ${theme.spacing.md}; }
`;
const Timeline = styled.div`
  width: 100%;
  max-width: 600px;
`;
const TweetBox = styled.form`
  background: white;
  padding: ${theme.spacing.lg};
  border-radius: ${theme.rounded.md};
  box-shadow: ${theme.shadows.sm};
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  @media (max-width: 600px) {
    flex-direction: column;
    padding: ${theme.spacing.md};
    gap: ${theme.spacing.sm};
  }
`;
const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  @media (max-width: 600px) { width: 36px; height: 36px; }
`;
const TweetInput = styled.textarea`
  flex: 1;
  border: none;
  resize: none;
  outline: none;
  font-size: 16px;
  font-family: ${theme.fonts.body};
  border-radius: 8px;
  padding: 8px;
  background: ${theme.colors.cardBg};
  @media (max-width: 600px) { font-size: 14px; padding: 6px; }
`;
const TweetButton = styled.button`
  background: ${theme.colors.primary};
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  @media (max-width: 600px) { align-self: flex-end; padding: 6px 12px; font-size: 14px; }
`;
const ReplyBox = styled.form`
  background: #f5f8fa;
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.rounded.sm};
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};
  margin-left: ${theme.spacing.xl};
  @media (max-width: 600px) { margin-left: ${theme.spacing.md}; padding: ${theme.spacing.sm}; }
`;
const ReplyInput = styled.textarea`
  flex: 1;
  border: 1px solid #E6ECF0;
  border-radius: 8px;
  padding: 6px;
  font-size: 14px;
  background: white;
  @media (max-width: 600px) { font-size: 12px; }
`;
const TweetList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;
const TweetItem = styled.li`
  background: white;
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid #e6ecf0;
  display: flex;
  gap: ${theme.spacing.md};
  @media (max-width: 600px) { flex-direction: column; padding: ${theme.spacing.md}; gap: ${theme.spacing.sm}; }
`;
const TweetContent = styled.div` flex: 1; `;
const TweetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
  > strong { font-weight: 700; }
  > span { color: ${theme.colors.text.secondary}; font-size: 14px; margin-left: 8px; }
  @media (max-width: 600px) { flex-direction: column; align-items: flex-start; > span { margin-left: 0; font-size: 12px; }}
`;
const TweetText = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  @media (max-width: 600px) { font-size: 14px; }
`;
const TweetActions = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  margin-top: ${theme.spacing.sm};
  color: ${theme.colors.text.secondary};
  @media (max-width: 600px) { gap: ${theme.spacing.md}; font-size: 14px; }
`;
const ToggleReplies = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  cursor: pointer;
  font-size: 14px;
  padding: ${theme.spacing.sm} 0;
  margin-left: ${theme.spacing.xl};
  &:hover { text-decoration: underline; }
`;
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  &:hover { color: ${theme.colors.primary}; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

/* -------------------------------------------------------------------------- */
/* Componente principal                                                        */
/* -------------------------------------------------------------------------- */

export default function MensagensPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Stream em tempo real */
  useEffect(() => {
    const offAuth = onAuthStateChanged(auth, user => {
      if (!user) { router.replace('/login'); return; }
      const q = query(collection(db, 'mensagens'), orderBy('data', 'desc'));
      const offSnap = onSnapshot(q, snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Mensagem[];
        setMensagens(list);
        setLoading(false);
      });
      return offSnap;
    });
    return offAuth;
  }, [router]);

  /* Enviar mensagem ou resposta */
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser; if (!user) return;

    if (replyTo ? !replyText.trim() : !texto.trim()) return;

    await addDoc(collection(db, 'mensagens'), {
      texto: replyTo ? replyText.trim() : texto.trim(),
      uid: user.uid,
      autor: user.displayName || user.email,
      photoURL: user.photoURL || null,
      data: serverTimestamp(),
      likes: 0,
      likedBy: [],
      ...(replyTo ? { parentId: replyTo } : {}),
    });

    if (replyTo) { setReplyText(''); setReplyTo(null); }
    else { setTexto(''); inputRef.current?.focus(); }
  };

  /* Curtir / excluir */
  const handleLike = async (id: string) => {
    const user = auth.currentUser; if (!user) return;
    const msg = mensagens.find(m => m.id === id);
    if (msg?.likedBy?.includes(user.uid)) return;
    await updateDoc(doc(db, 'mensagens', id), { likes: increment(1), likedBy: arrayUnion(user.uid) });
  };
  const handleDelete = async (id: string, uid: string) => {
    const user = auth.currentUser; if (!user || user.uid !== uid) return;
    if (confirm('Deseja realmente deletar esta mensagem?')) await deleteDoc(doc(db, 'mensagens', id));
  };

  if (loading) return null;

  return (
    <Layout>
      <Container>
        <Timeline>
          {/* Composer */}
          <TweetBox onSubmit={enviar}>
            <Avatar src={auth.currentUser?.photoURL || '/icons/icon-192x192.png'} alt="avatar" />
            <TweetInput
              ref={inputRef}
              rows={3}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="O que está acontecendo?"
            />
            <TweetButton type="submit" disabled={!texto.trim()}>
              <FaPaperPlane />
            </TweetButton>
          </TweetBox>

          {/* Mensagens */}
          <TweetList>
            {mensagens.filter(m => !m.parentId).map(m => {
              const tsDate = safeToDate(m.data);
              const userId = auth.currentUser?.uid;
              const liked = m.likedBy?.includes(userId || '');
              const replies = mensagens.filter(r => r.parentId === m.id);
              const isOpen = expanded.includes(m.id);

              return (
                <React.Fragment key={m.id}>
                  <TweetItem>
                    <Avatar src={m.photoURL || '/icons/icon-192x192.png'} alt="avatar" />
                    <TweetContent>
                      <TweetHeader>
                        <strong>{m.autor}</strong>
                        {tsDate && <span>{timeAgo(tsDate)}</span>}
                      </TweetHeader>

                      <TweetText>{m.texto}</TweetText>

                      <TweetActions>
                        <ActionButton onClick={() => handleLike(m.id)} disabled={liked}>
                          <FaRegHeart /> {m.likes}
                        </ActionButton>
                        <ActionButton onClick={() => setReplyTo(m.id)}>
                          <FaReply /> Responder
                        </ActionButton>
                        {userId === m.uid && (
                          <ActionButton onClick={() => handleDelete(m.id, m.uid)}>
                            <FaTrash />
                          </ActionButton>
                        )}
                      </TweetActions>

                      {replies.length > 0 && (
                        <ToggleReplies onClick={() => setExpanded(prev => prev.includes(m.id)
                          ? prev.filter(x => x !== m.id)
                          : [...prev, m.id])}>
                          {isOpen ? `Ocultar respostas (${replies.length})` : `Ver respostas (${replies.length})`}
                        </ToggleReplies>
                      )}

                      {/* Respostas */}
                      {isOpen && replies.map(r => {
                        const rDate = safeToDate(r.data);
                        const rLiked = r.likedBy?.includes(userId || '');
                        return (
                          <TweetItem key={r.id} style={{ marginLeft: theme.spacing.xl, background: '#f9f9f9' }}>
                            <Avatar src={r.photoURL || '/icons/icon-192x192.png'} alt="avatar" />
                            <TweetContent>
                              <TweetHeader>
                                <strong>{r.autor}</strong>
                                {rDate && <span>{timeAgo(rDate)}</span>}
                              </TweetHeader>

                              <TweetText>{r.texto}</TweetText>

                              <TweetActions>
                                <ActionButton onClick={() => handleLike(r.id)} disabled={rLiked}>
                                  <FaRegHeart /> {r.likes}
                                </ActionButton>
                                {userId === r.uid && (
                                  <ActionButton onClick={() => handleDelete(r.id, r.uid)}>
                                    <FaTrash />
                                  </ActionButton>
                                )}
                              </TweetActions>
                            </TweetContent>
                          </TweetItem>
                        );
                      })}

                      {/* Caixa de resposta inline */}
                      {replyTo === m.id && (
                        <ReplyBox onSubmit={enviar}>
                          <ReplyInput
                            rows={2}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Escreva sua resposta…"
                          />
                          <TweetButton type="submit" disabled={!replyText.trim()}>
                            <FaPaperPlane />
                          </TweetButton>
                          <TweetButton type="button" onClick={() => { setReplyTo(null); setReplyText(''); }}>
                            &times;
                          </TweetButton>
                        </ReplyBox>
                      )}
                    </TweetContent>
                  </TweetItem>
                </React.Fragment>
              );
            })}
          </TweetList>
        </Timeline>
      </Container>
    </Layout>
  );
}
