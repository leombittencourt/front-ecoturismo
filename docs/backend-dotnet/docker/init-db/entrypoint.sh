#!/bin/bash
set -e

echo ">>> Iniciando SQL Server em background..."
/opt/mssql/bin/sqlservr &
MSSQL_PID=$!

echo ">>> Aguardando SQL Server ficar pronto (max 60s)..."
for i in $(seq 1 60); do
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" &>/dev/null && break
  sleep 1
done

# Verifica se banco já existe (idempotente)
DB_EXISTS=$(/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -h -1 -Q "SET NOCOUNT ON; SELECT DB_ID('EcoTurismo')" | tr -d '[:space:]')

if [ "$DB_EXISTS" = "NULL" ] || [ -z "$DB_EXISTS" ]; then
  echo ">>> Criando banco EcoTurismo e aplicando DDL..."
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "CREATE DATABASE EcoTurismo"
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d EcoTurismo -i /init-db/01-sql-ddl.sql
  echo ">>> Banco inicializado com sucesso!"
else
  echo ">>> Banco EcoTurismo já existe, pulando init."
fi

# Mantém SQL Server em foreground
wait $MSSQL_PID
