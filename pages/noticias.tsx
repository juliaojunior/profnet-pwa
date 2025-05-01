// pages/noticias.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import styled from 'styled-components';
import { theme } from '../styles/theme';

interface Noticia {
  id: string;
  titulo: string;
  corpo: string;
  data: string;
}

// Container geral
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${theme.spacing.lg};
`;

// Cabeçalho centralizado
const Header = styled.header`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  h1 {
    font-family: ${theme.fonts.heading};
    font-size: 2rem;
    color: ${theme.colors.primary};
    margin-bottom: ${theme.spacing.sm};
  }
  p {
    color: ${theme.colors.text.secondary};
    font-size: 1rem;
  }
`;

// Grid de cards
const NewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${theme.spacing.lg};
`;

// Card de notícia
const NewsCard = styled.div`
  background: white;
  border-radius: ${theme.rounded.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${theme.shadows.lg};
  }
`;

const CardHeader = styled.div`
  background: ${theme.colors.primary};
  padding: ${theme.spacing.md};
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
`;

const CardBody = styled.div<{ expanded: boolean }>`
  flex: 1;
  padding: ${theme.spacing.md};
  p {
    margin: 0;
    color: ${theme.colors.text.primary};
    font-size: 0.95rem;
    line-height: 1.4;
    max-height: ${({ expanded }) => (expanded ? 'none' : '4.2rem')};
    overflow: ${({ expanded }) => (expanded ? 'visible' : 'hidden')};
    text-overflow: ellipsis;
    transition: max-height 0.3s ease;
  }
`;

const CardFooter = styled.div`
  padding: ${theme.spacing.md};
  border-top: 1px solid #e2e8f0;
  font-size: 0.85rem;
  color: ${theme.colors.text.secondary};
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  cursor: pointer;
  font-size: 0.9rem;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  align-self: flex-start;
  &:hover {
    text-decoration: underline;
  }
`;

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'noticias'), orderBy('data', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Noticia[];
      setNoticias(list);
    })();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Layout>
      <Container>
        <Header>
          <h1>Notícias</h1>
          <p>Fique por dentro das últimas atualizações educacionais</p>
        </Header>

        <NewsGrid>
          {noticias.map(n => {
            const isExpanded = expandedIds.includes(n.id);
            return (
              <NewsCard key={n.id}>
                <CardHeader>{n.titulo}</CardHeader>
                <CardBody expanded={isExpanded}>
                  <p>{n.corpo}</p>
                </CardBody>
                <CardFooter>{new Date(n.data).toLocaleDateString()}</CardFooter>
                <ExpandButton onClick={() => toggleExpand(n.id)}>
                  {isExpanded ? 'Ler menos' : 'Ler mais'}
                </ExpandButton>
              </NewsCard>
            );
          })}
        </NewsGrid>
      </Container>
    </Layout>
  );
}
