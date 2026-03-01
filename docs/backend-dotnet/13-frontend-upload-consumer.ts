// ============================================================
// Upload Consumer — Funções para o frontend React
// ============================================================
// Adicione estas funções ao src/services/api.ts
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('eco_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Tipos ───

export interface UploadResult {
  url: string;
  fileName: string;
  container: string;
  sizeBytes: number;
}

export interface BannerUploadResult {
  banner: {
    id: string;
    titulo: string | null;
    subtitulo: string | null;
    imagemUrl: string;
    link: string | null;
    ordem: number;
    ativo: boolean;
  };
  upload: UploadResult;
}

export interface MunicipioLogoResult {
  municipioId: string;
  logoUrl: string;
  upload: UploadResult;
}

export interface AtrativoImagemResult {
  atrativoId: string;
  imagemUrl: string;
  upload: UploadResult;
}

// ─── Upload genérico ───

export async function uploadImagem(
  container: 'banners' | 'logos' | 'atrativos',
  file: File,
  subfolder?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const query = subfolder ? `?subfolder=${encodeURIComponent(subfolder)}` : '';

  const res = await fetch(`${API_BASE}/uploads/${container}${query}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Erro no upload: HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Upload + criar banner ───

export async function uploadBanner(
  file: File,
  dados?: {
    titulo?: string;
    subtitulo?: string;
    link?: string;
    ordem?: number;
    ativo?: boolean;
  }
): Promise<BannerUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (dados?.titulo) formData.append('titulo', dados.titulo);
  if (dados?.subtitulo) formData.append('subtitulo', dados.subtitulo);
  if (dados?.link) formData.append('link', dados.link);
  if (dados?.ordem !== undefined) formData.append('ordem', String(dados.ordem));
  if (dados?.ativo !== undefined) formData.append('ativo', String(dados.ativo));

  const res = await fetch(`${API_BASE}/uploads/banners/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Erro no upload do banner: HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Upload logo do município ───

export async function uploadLogoMunicipio(
  municipioId: string,
  file: File
): Promise<MunicipioLogoResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/uploads/logos/municipio/${municipioId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Erro no upload da logo: HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Upload imagem do atrativo ───

export async function uploadImagemAtrativo(
  atrativoId: string,
  file: File
): Promise<AtrativoImagemResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/uploads/atrativos/${atrativoId}/imagem`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Erro no upload da imagem: HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Deletar imagem ───

export async function deletarImagem(url: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/uploads?url=${encodeURIComponent(url)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(`Erro ao deletar imagem: HTTP ${res.status}`);
  }
}

// ─── Hook React para upload com progresso (opcional) ───

/*
import { useState, useCallback } from 'react';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    container: 'banners' | 'logos' | 'atrativos',
    file: File,
    subfolder?: string
  ) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validação client-side
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Arquivo excede o limite de 5MB.');
      }

      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowed.includes(ext)) {
        throw new Error(`Extensão '${ext}' não permitida.`);
      }

      setProgress(30);
      const result = await uploadImagem(container, file, subfolder);
      setProgress(100);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, progress, error };
}
*/
