# ============================================================
# Dockerfile — EcoTurismo.API (.NET 8)
# ============================================================
# Build: docker build -t ecoturismo-api .
# Run:   docker run -p 5000:8080 ecoturismo-api
# ============================================================

# ─── Stage 1: Build ───
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar csproj e restaurar dependências (cache de camadas)
COPY EcoTurismo.API.csproj ./
RUN dotnet restore

# Copiar código e publicar
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# ─── Stage 2: Runtime ───
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Variáveis de ambiente padrão
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Criar usuário não-root
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "EcoTurismo.API.dll"]
