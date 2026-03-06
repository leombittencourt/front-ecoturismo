import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PaginationControls from '@/components/PaginationControls';
import { Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import {
  apiClient,
  type Atrativo,
  type AtualizarUsuarioRequest,
  type CriarUsuarioRequest,
  type Municipio,
  type RoleOption,
  type UsuarioSistema,
} from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';
import { ITEMS_PER_PAGE } from '@/constants/pagination';

type FormState = {
  nome: string;
  email: string;
  password: string;
  roleId: string;
  municipioId: string;
  atrativoId: string;
  telefone: string;
  cpf: string;
};

const INITIAL_FORM: FormState = {
  nome: '',
  email: '',
  password: '',
  roleId: '',
  municipioId: '',
  atrativoId: '',
  telefone: '',
  cpf: '',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isBalnearioRole(role: RoleOption | undefined): boolean {
  if (!role) return false;
  const nome = normalizeText(role.nome);
  const descricao = normalizeText(role.descricao ?? '');
  return nome.includes('balneario') || descricao.includes('balneario');
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function mapUsuarioToForm(user: UsuarioSistema): FormState {
  return {
    nome: user.nome ?? '',
    email: user.email ?? '',
    password: '',
    roleId: user.roleId ?? '',
    municipioId: user.municipioId ?? '',
    atrativoId: user.atrativoId ?? '',
    telefone: user.telefone ?? '',
    cpf: user.cpf ?? '',
  };
}

export default function Usuarios() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAtrativos, setLoadingAtrativos] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [atrativos, setAtrativos] = useState<Atrativo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const selectedRole = useMemo(() => roles.find((r) => r.id === form.roleId), [roles, form.roleId]);
  const roleIsBalneario = isBalnearioRole(selectedRole);

  const loadUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const data = await apiClient.listarUsuarios({ page: currentPage, pageSize: ITEMS_PER_PAGE });
      setUsuarios(data.items ?? []);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (error) {
      setUsuarios([]);
      setTotalItems(0);
      setTotalPages(1);
      toast({
        title: 'Erro ao carregar usuarios',
        description: getErrorMessage(error, 'Nao foi possivel carregar os usuarios.'),
        variant: 'destructive',
      });
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        setLoadingInitial(true);
        const [municipiosData, rolesData] = await Promise.all([
          apiClient.listarMunicipios(),
          apiClient.listarRoles(),
        ]);
        if (!active) return;
        setMunicipios(municipiosData ?? []);
        setRoles(rolesData ?? []);
      } catch (error) {
        if (!active) return;
        toast({
          title: 'Erro ao carregar dados',
          description: getErrorMessage(error, 'Nao foi possivel carregar municipios e perfis.'),
          variant: 'destructive',
        });
      } finally {
        if (active) setLoadingInitial(false);
      }
    };

    void loadInitial();
    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    void loadUsuarios();
  }, [currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!roleIsBalneario) {
      setAtrativos([]);
      setForm((prev) => ({ ...prev, atrativoId: '' }));
      return;
    }

    const municipioId = form.municipioId.trim();
    if (!municipioId) {
      setAtrativos([]);
      setForm((prev) => ({ ...prev, atrativoId: '' }));
      return;
    }

    let active = true;
    const loadAtrativos = async () => {
      try {
        setLoadingAtrativos(true);
        const data = await apiClient.listarAtrativos({ MunicipioId: municipioId, page: 1, pageSize: 500 });
        if (!active) return;
        const ativos = (data.items ?? []).filter((a) => a.status === 'ativo');
        setAtrativos(ativos);
      } catch (error) {
        if (!active) return;
        setAtrativos([]);
        toast({
          title: 'Erro ao carregar atrativos',
          description: getErrorMessage(error, 'Nao foi possivel carregar os atrativos do municipio.'),
          variant: 'destructive',
        });
      } finally {
        if (active) setLoadingAtrativos(false);
      }
    };

    void loadAtrativos();
    return () => {
      active = false;
    };
  }, [form.municipioId, roleIsBalneario, toast]);

  const onChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setAtrativos([]);
    setEditingUserId(null);
  };

  const validateForm = (): boolean => {
    if (!form.nome.trim() || !form.email.trim() || !form.roleId) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Preencha nome, email e perfil.',
        variant: 'destructive',
      });
      return false;
    }

    if (!editingUserId && !form.password.trim()) {
      toast({
        title: 'Senha obrigatoria',
        description: 'Informe a senha para criar um novo usuario.',
        variant: 'destructive',
      });
      return false;
    }

    if (roleIsBalneario && !form.atrativoId) {
      toast({
        title: 'Atrativo obrigatorio',
        description: 'Para perfil balneario, selecione um atrativo.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      if (editingUserId) {
        const payload: AtualizarUsuarioRequest = {
          Nome: form.nome.trim(),
          Email: form.email.trim(),
          RoleId: form.roleId,
          MunicipioId: form.municipioId || null,
          AtrativoId: roleIsBalneario ? (form.atrativoId || null) : null,
          Telefone: form.telefone.trim() || null,
          Cpf: form.cpf.trim() || null,
          ...(form.password.trim() ? { Password: form.password } : {}),
        };

        await apiClient.atualizarUsuario(editingUserId, payload);
        toast({ title: 'Usuario atualizado com sucesso' });
      } else {
        const payload: CriarUsuarioRequest = {
          Nome: form.nome.trim(),
          Email: form.email.trim(),
          Password: form.password,
          RoleId: form.roleId,
          MunicipioId: form.municipioId || null,
          AtrativoId: roleIsBalneario ? (form.atrativoId || null) : null,
          Telefone: form.telefone.trim() || null,
          Cpf: form.cpf.trim() || null,
        };

        await apiClient.criarUsuario(payload);
        toast({ title: 'Usuario criado com sucesso' });
      }

      resetForm();
      await loadUsuarios();
    } catch (error) {
      toast({
        title: editingUserId ? 'Erro ao atualizar usuario' : 'Erro ao criar usuario',
        description: getErrorMessage(error, 'Nao foi possivel salvar o usuario.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (user: UsuarioSistema) => {
    try {
      setLoadingEdit(true);
      const detalhado = await apiClient.obterUsuario(user.id);
      setEditingUserId(detalhado.id);
      setForm(mapUsuarioToForm(detalhado));
    } catch (error) {
      toast({
        title: 'Erro ao carregar usuario',
        description: getErrorMessage(error, 'Nao foi possivel carregar os dados completos para edicao.'),
        variant: 'destructive',
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (user: UsuarioSistema) => {
    const confirmed = window.confirm(`Deseja realmente excluir o usuario "${user.nome}"?`);
    if (!confirmed) return;

    try {
      await apiClient.excluirUsuario(user.id);
      toast({ title: 'Usuario removido com sucesso' });
      if (editingUserId === user.id) resetForm();
      await loadUsuarios();
    } catch (error) {
      toast({
        title: 'Erro ao excluir usuario',
        description: getErrorMessage(error, 'Nao foi possivel excluir o usuario.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Cadastro de Usuarios</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> {editingUserId ? 'Editar Usuario' : 'Novo Usuario'}
          </CardTitle>
          <CardDescription>
            Perfis e municipios carregados do backend. Para perfil balneario, o atrativo e obrigatorio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => onChange('nome', e.target.value)} placeholder="Nome completo" />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} placeholder="email@dominio.com" />
            </div>

            <div className="space-y-2">
              <Label>Senha {editingUserId ? '(opcional na edicao)' : '*'}</Label>
              <Input type="password" value={form.password} onChange={(e) => onChange('password', e.target.value)} placeholder="Senha de acesso" />
            </div>

            <div className="space-y-2">
              <Label>Perfil (Role) *</Label>
              <Select value={form.roleId} onValueChange={(v) => onChange('roleId', v)} disabled={loadingInitial}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingInitial ? 'Carregando perfis...' : 'Selecione um perfil'} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Municipio</Label>
              <Select value={form.municipioId} onValueChange={(v) => onChange('municipioId', v)} disabled={loadingInitial}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingInitial ? 'Carregando municipios...' : 'Selecione um municipio'} />
                </SelectTrigger>
                <SelectContent>
                  {municipios.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} {m.uf ? `- ${m.uf}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Atrativo {roleIsBalneario ? '*' : '(opcional)'}</Label>
              <Select
                value={form.atrativoId}
                onValueChange={(v) => onChange('atrativoId', v)}
                disabled={!roleIsBalneario || !form.municipioId || loadingAtrativos}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !roleIsBalneario
                        ? 'Disponivel apenas para perfil balneario'
                        : !form.municipioId
                          ? 'Selecione primeiro o municipio'
                          : loadingAtrativos
                            ? 'Carregando atrativos...'
                            : 'Selecione um atrativo'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {atrativos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => onChange('telefone', e.target.value)} placeholder="(67) 99999-9999" />
            </div>

            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={(e) => onChange('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" onClick={handleSave} disabled={saving || loadingInitial || loadingEdit}>
              {saving ? 'Salvando...' : loadingEdit ? 'Carregando...' : editingUserId ? 'Atualizar Usuario' : 'Cadastrar Usuario'}
            </Button>
            {editingUserId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar Edicao
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Users className="h-5 w-5" /> Usuarios Cadastrados
          </CardTitle>
          <CardDescription>Listagem com acoes de edicao e exclusao.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsuarios ? (
            <p className="text-sm text-muted-foreground">Carregando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuario cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {usuarios.map((u) => (
                <div key={u.id} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {u.roleNome && <Badge variant="secondary">{u.roleNome}</Badge>}
                        {u.municipioNome && <Badge variant="outline">{u.municipioNome}</Badge>}
                        {u.atrativoNome && <Badge variant="outline">{u.atrativoNome}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(u)} disabled={loadingEdit}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(u)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <PaginationControls
                currentPage={currentPage}
                pageSize={ITEMS_PER_PAGE}
                totalItems={totalItems}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemLabel="usuarios"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
