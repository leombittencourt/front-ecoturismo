INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES 
  ('cor_accent', '204 98% 37%', 'Cor de destaque (accent)'),
  ('cor_sidebar_bg', '120 20% 12%', 'Cor de fundo da sidebar'),
  ('cor_sucesso', '120 40% 44%', 'Cor de sucesso'),
  ('cor_warning', '45 100% 51%', 'Cor de aviso/warning')
ON CONFLICT (chave) DO NOTHING;