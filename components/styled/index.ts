// components/styled/index.ts
import styled from 'styled-components';
import { theme } from '../../styles/theme';

export const Card = styled.div`
  background: ${theme.colors.cardBg};
  border-radius: ${theme.rounded.lg};
  box-shadow: ${theme.shadows.md};
  padding: ${theme.spacing.lg};
  transition: transform ${theme.transitions.default}, box-shadow ${theme.transitions.default};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${theme.shadows.lg};
  }
`;

export const Button = styled.button`
  background: ${theme.colors.primary};
  color: ${theme.colors.text.inverse};
  border: none;
  border-radius: ${theme.rounded.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  font-family: ${theme.fonts.body};
  font-weight: 600;
  cursor: pointer;
  transition: background ${theme.transitions.fast}, transform ${theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  
  &:hover {
    background: ${theme.colors.secondary};
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid #E2E8F0;
  border-radius: ${theme.rounded.md};
  background: #F8FAFC;
  font-family: ${theme.fonts.body};
  transition: border ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid #E2E8F0;
  border-radius: ${theme.rounded.md};
  background: #F8FAFC;
  font-family: ${theme.fonts.body};
  min-height: 120px;
  resize: vertical;
  transition: border ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
  }
`;

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${theme.spacing.md};
`;

export const Heading = styled.h1`
  font-family: ${theme.fonts.heading};
  color: ${theme.colors.text.primary};
  font-weight: 700;
  margin-bottom: ${theme.spacing.lg};
`;

export const Text = styled.p`
  font-family: ${theme.fonts.body};
  color: ${theme.colors.text.secondary};
  line-height: 1.6;
`;
