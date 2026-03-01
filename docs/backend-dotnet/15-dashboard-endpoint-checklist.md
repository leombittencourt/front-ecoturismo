# Dashboard endpoint - checklist de implementacao

## 1. Criar arquivos no backend
Use como base: `15-dashboard-endpoint-pronto.cs`

Crie:
- `Services/IDashboardService.cs`
- `Services/DashboardService.cs`
- `Controllers/DashboardController.cs`

## 2. Registrar o service no `Program.cs`
```csharp
builder.Services.AddScoped<IDashboardService, DashboardService>();
```

## 3. Confirmar DTOs
Garanta que `DTOs` ja contem:
- `DashboardDto`
- `DataPointDto`
- `OcupacaoBalnearioDto`
- `OrigemUfDto`
- `TopAtrativoDto`

## 4. Garantir autorizacao
O controller usa:
```csharp
[Authorize(Roles = "admin,prefeitura")]
```

Se quiser liberar para `balneario`, ajuste para:
```csharp
[Authorize(Roles = "admin,prefeitura,balneario")]
```

## 5. Teste rapido do endpoint
```bash
curl -X GET "https://SEU_BACKEND/api/dashboard?periodo=7d" \
  -H "Authorization: Bearer SEU_JWT" \
  -H "X-API-Key: 7K9xR2mP5wN8qL4jF6hD3sA1bV0cX7eY9tU2oI5rE8pW6nM3kJ1gH4fZ"
```

## 6. Contrato esperado pelo frontend
Resposta JSON deve conter:
- `visitantesHoje` (number)
- `visitantesTendencia` (`up|down|stable`)
- `permanenciaMedia` (number)
- `ocupacaoMedia` (number)
- `pressaoTuristica` (`baixa|moderada|alta|critica`)
- `visitantesPorDia[]` com `{ label, valor }`
- `ocupacaoPorBalneario[]` com `{ nome, ocupacao, capacidade }`
- `origemPorUF[]` com `{ uf, quantidade }`
- `evolucaoMensal[]` com `{ label, valor }`
- `topAtrativos[]` com `{ nome, visitantes, tendencia }`
