// ============================================================
// EcoTurismo.API/Enums/
// ============================================================

// --- UserRole.cs ---
namespace EcoTurismo.API.Enums;

public enum UserRole
{
    Admin,
    Prefeitura,
    Balneario,
    Publico
}

// --- AtrativoTipo.cs ---
namespace EcoTurismo.API.Enums;

public enum AtrativoTipo
{
    Balneario,
    Cachoeira,
    Trilha,
    Parque,
    Camping
}

// --- AtrativoStatus.cs ---
namespace EcoTurismo.API.Enums;

public enum AtrativoStatus
{
    Ativo,
    Inativo,
    Manutencao
}

// --- QuiosqueStatus.cs ---
namespace EcoTurismo.API.Enums;

public enum QuiosqueStatus
{
    Disponivel,
    Reservado,
    Ocupado,
    Manutencao
}

// --- ReservaStatus.cs ---
namespace EcoTurismo.API.Enums;

public enum ReservaStatus
{
    Confirmada,
    Cancelada,
    Utilizada
}

// --- ReservaTipo.cs ---
namespace EcoTurismo.API.Enums;

public enum ReservaTipo
{
    DayUse,
    Camping
}
