# 🚀 Guia de Migração: Supabase → Backend .NET

## Passo a Passo

### Passo 1: Criar o projeto .NET
```bash
dotnet new webapi -n EcoTurismo.API --use-controllers
cd EcoTurismo.API

# Dependências
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package Swashbuckle.AspNetCore
```

### Passo 2: Configurar o banco
1. Executar `01-sql-ddl.sql` no SQL Server
2. Configurar `appsettings.json` com a connection string
3. Criar migration inicial:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Passo 3: Copiar os arquivos
Copie os arquivos `.cs` da pasta `docs/backend-dotnet/` para a estrutura
do projeto conforme indicado nos cabeçalhos de cada arquivo:
- `02-enums.cs` → arquivos separados em `Enums/`
- `03-models.cs` → arquivos separados em `Models/`
- `04-dtos.cs` → arquivos separados em `DTOs/`
- `05-dbcontext.cs` → `Data/EcoTurismoDbContext.cs`
- `06-services.cs` → arquivos separados em `Services/`
- `07-controllers.cs` → arquivos separados em `Controllers/`
- `08-program.cs` → `Program.cs`

### Passo 4: Criar usuários de teste
```sql
-- Gere o hash com BCrypt no C# ou use uma ferramenta online
-- Exemplo: BCrypt.Net.BCrypt.HashPassword("senha123")
INSERT INTO profiles (id, nome, email, role, municipio_id, password_hash)
VALUES
  (NEWID(), 'Carlos Admin', 'admin@eco.gov.br', 'admin', NULL,
   '$2a$11$...hash...'),
  (NEWID(), 'Maria Gestora', 'prefeitura@eco.gov.br', 'prefeitura', NULL,
   '$2a$11$...hash...');
```

### Passo 5: Testar
```bash
dotnet run
# Acessar: https://localhost:5001/swagger
```

### Passo 6: Integrar o frontend
1. Adicionar variável de ambiente no `.env` (ou no build):
   ```
   VITE_API_URL=https://seu-backend.com/api
   ```
2. Substituir `src/services/api.ts` pelo conteúdo de `09-frontend-consumer.ts`
3. Substituir `src/contexts/AuthContext.tsx` pelo conteúdo de `10-auth-context-dotnet.tsx`
4. Remover as dependências de mock (`src/data/mock-data.ts` pode ser excluído)
5. Remover imports do Supabase client dos componentes que usam a API

### Passo 7: Ajustar hooks que usam Supabase direto
Os seguintes hooks/componentes acessam o Supabase diretamente e precisam
ser migrados para usar `src/services/api.ts`:
- `src/hooks/useQuiosques.ts` → usar `fetchQuiosques()`, `criarQuiosque()`, etc
- `src/hooks/useConfiguracoes.ts` → usar `fetchConfiguracoes()`, `atualizarConfiguracoes()`
- `src/components/BannerCarousel.tsx` → usar `fetchBanners()`
- `src/pages/Parametros.tsx` → usar funções do api.ts para banners e logos

## Checklist de Migração

- [ ] Backend .NET rodando com Swagger
- [ ] Banco SQL Server criado com todas as tabelas
- [ ] JWT funcionando (login retorna token)
- [ ] CORS configurado para a URL do frontend
- [ ] `src/services/api.ts` substituído pelo consumer .NET
- [ ] `src/contexts/AuthContext.tsx` substituído pela versão .NET
- [ ] Hooks migrados (useQuiosques, useConfiguracoes)
- [ ] Componentes migrados (BannerCarousel, Parametros)
- [ ] Upload de imagens implementado (banners, logos)
- [ ] Testes end-to-end realizados
- [ ] Mock data removido

## Notas Importantes

1. **Upload de arquivos**: No backend .NET, implemente endpoints separados
   para upload (`POST /api/upload/banner`, `POST /api/upload/logo`) que
   salvem no Azure Blob Storage ou sistema de arquivos local.

2. **Realtime**: O Supabase Realtime não estará disponível. Use **SignalR**
   para funcionalidades em tempo real (ex: atualização de status de quiosques).

3. **Senhas**: O Supabase Auth gerenciava senhas. No .NET, use BCrypt
   (já incluído nas dependências). Nunca armazene senhas em texto puro.

4. **CORS**: Configure corretamente para produção, restringindo a origem
   ao domínio do frontend.

5. **Compatibilidade de nomes**: Os DTOs usam camelCase (padrão JSON do .NET)
   para manter compatibilidade com o frontend TypeScript.
