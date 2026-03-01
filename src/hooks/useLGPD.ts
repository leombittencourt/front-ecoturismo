import { useAuth } from '@/contexts/AuthContext';

/**
 * LGPD hook — controls PII visibility based on user role.
 * 
 * - admin: full access to PII
 * - balneario: can see PII for their atrativo's reservas only
 * - prefeitura: NO access to PII (nome, CPF, email) — only aggregated/anonymized data
 * - publico: can see their own data only (via token lookup)
 */
export function useLGPD() {
  const { user, hasRole } = useAuth();

  const canSeePII = hasRole(['admin', 'balneario']);
  const isPrefeitura = hasRole(['prefeitura']);
  const isBalneario = hasRole(['balneario']);
  const isAdmin = hasRole(['admin']);

  /** Mask a name for LGPD compliance: "Ana Silva" → "A** S***" */
  const maskName = (name: string): string => {
    if (canSeePII) return name;
    return name
      .split(' ')
      .map(part => part.charAt(0) + '*'.repeat(Math.max(2, part.length - 1)))
      .join(' ');
  };

  /** Mask email: "ana@email.com" → "a***@e***.com" */
  const maskEmail = (email: string): string => {
    if (canSeePII) return email;
    const [local, domain] = email.split('@');
    if (!domain) return '***@***.***';
    const domParts = domain.split('.');
    return `${local.charAt(0)}***@${domParts[0].charAt(0)}***.${domParts.slice(1).join('.')}`;
  };

  /** Mask CPF: "123.456.789-00" → "***.456.***-**" */
  const maskCPF = (cpf: string): string => {
    if (canSeePII) return cpf;
    const digits = cpf.replace(/\D/g, '');
    if (digits.length < 11) return '***.***.***-**';
    return `***.${digits.substring(3, 6)}.***-**`;
  };

  /** Get the atrativo_id filter for the current user (balneário only sees their own) */
  const atrativoFilter = isBalneario ? user?.atrativoId : undefined;

  return {
    canSeePII,
    isPrefeitura,
    isBalneario,
    isAdmin,
    maskName,
    maskEmail,
    maskCPF,
    atrativoFilter,
  };
}
