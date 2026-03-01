# 🔧 Guia de Integração: Backend .NET para EcoTurismo

## Índice
1. [Arquitetura](#arquitetura)
2. [Estrutura do Projeto .NET](#estrutura)
3. [SQL Server — DDL (Tabelas)](#sql)
4. [Models (Entities)](#models)
5. [DTOs (Data Transfer Objects)](#dtos)
6. [DbContext (Entity Framework)](#dbcontext)
7. [Services (Camada de Negócios)](#services)
8. [Controllers (API REST)](#controllers)
9. [Autenticação JWT](#auth)
10. [Consumer no Frontend (React)](#consumer)
11. [Passo a Passo de Deploy](#deploy)

---

## 1. Arquitetura <a name="arquitetura"></a>

```
┌─────────────────┐         ┌──────────────────────┐
│   Frontend      │  HTTP   │   Backend .NET 8     │
│   React + Vite  │◄───────►│   Web API            │
│                 │  JSON   │                      │
└─────────────────┘         │  ├─ Controllers      │
                            │  ├─ Services         │
                            │  ├─ Models/Entities  │
                            │  ├─ DTOs             │
                            │  └─ DbContext (EF)   │
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │   SQL Server / PG    │
                            └──────────────────────┘
```

### Endpoints planejados

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Autenticação → JWT |
| GET | `/api/municipios` | Listar municípios |
| GET | `/api/atrativos` | Listar atrativos |
| GET | `/api/atrativos/{id}` | Detalhe de atrativo |
| PUT | `/api/atrativos/{id}` | Atualizar atrativo |
| GET | `/api/reservas` | Listar reservas |
| POST | `/api/reservas` | Criar reserva |
| PUT | `/api/reservas/{id}/status` | Alterar status reserva |
| POST | `/api/validacoes` | Validar ticket |
| GET | `/api/quiosques?atrativoId=x` | Listar quiosques |
| POST | `/api/quiosques` | Criar quiosque |
| PUT | `/api/quiosques/{id}` | Atualizar quiosque |
| DELETE | `/api/quiosques/{id}` | Excluir quiosque |
| GET | `/api/banners` | Listar banners (filtro ativos) |
| GET | `/api/banners/{id}` | Detalhe de um banner |
| POST | `/api/banners` | Criar banner |
| PUT | `/api/banners/{id}` | Editar banner |
| PUT | `/api/banners/reorder` | Reordenar banners (batch) |
| DELETE | `/api/banners/{id}` | Excluir banner |
| GET | `/api/configuracoes` | Listar configs do sistema |
| PUT | `/api/configuracoes` | Atualizar configs (batch) |
| GET | `/api/dashboard?periodo=7d` | Dados do dashboard |
| GET | `/api/profiles/me` | Perfil do usuário logado |
| POST | `/api/uploads/{container}` | Upload genérico de imagem |
| POST | `/api/uploads/banners/create` | Upload + criar banner |
| POST | `/api/uploads/logos/municipio/{id}` | Upload + vincular logo |
| POST | `/api/uploads/atrativos/{id}/imagem` | Upload + vincular imagem |
| DELETE | `/api/uploads?url=...` | Deletar imagem do storage |

---

## 2. Estrutura do Projeto .NET <a name="estrutura"></a>

```
EcoTurismo.API/
├── Program.cs
├── appsettings.json
├── Controllers/
│   ├── AuthController.cs
│   ├── MunicipiosController.cs
│   ├── AtrativosController.cs
│   ├── ReservasController.cs
│   ├── ValidacoesController.cs
│   ├── QuiosquesController.cs
│   ├── BannersController.cs
│   ├── ConfiguracoesController.cs
│   ├── DashboardController.cs
│   └── ProfilesController.cs
├── Models/
│   ├── Municipio.cs
│   ├── Profile.cs
│   ├── Atrativo.cs
│   ├── Reserva.cs
│   ├── Validacao.cs
│   ├── Quiosque.cs
│   ├── Banner.cs
│   └── ConfiguracaoSistema.cs
├── DTOs/
│   ├── LoginRequest.cs
│   ├── LoginResponse.cs
│   ├── AtrativoDto.cs
│   ├── ReservaCreateDto.cs
│   ├── ReservaDto.cs
│   ├── QuiosqueDto.cs
│   ├── QuiosqueCreateDto.cs
│   ├── QuiosqueUpdateDto.cs
│   ├── BannerDto.cs
│   ├── ConfiguracaoUpdateDto.cs
│   └── DashboardDto.cs
├── Services/
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── IAtrativoService.cs
│   ├── AtrativoService.cs
│   ├── IReservaService.cs
│   ├── ReservaService.cs
│   ├── IQuiosqueService.cs
│   ├── QuiosqueService.cs
│   ├── IDashboardService.cs
│   └── DashboardService.cs
├── Data/
│   └── EcoTurismoDbContext.cs
├── Enums/
│   ├── AtrativoStatus.cs
│   ├── AtrativoTipo.cs
│   ├── QuiosqueStatus.cs
│   ├── ReservaStatus.cs
│   ├── ReservaTipo.cs
│   └── UserRole.cs
└── Middleware/
    └── JwtMiddleware.cs
```

Comando para criar:
```bash
dotnet new webapi -n EcoTurismo.API --use-controllers
cd EcoTurismo.API
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
```
