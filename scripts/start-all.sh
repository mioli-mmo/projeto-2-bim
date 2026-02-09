#!/bin/bash

# Script para iniciar todos os serviços do projeto DSD
# Uso: ./scripts/start-all.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_ACTIVATE="$ROOT_DIR/.venv311/bin/activate"

echo "🚀 Iniciando todos os serviços..."
echo "📁 Diretório raiz: $ROOT_DIR"
echo ""

# Função para abrir terminal com comando
open_terminal() {
  local title="$1"
  local cmd="$2"
  gnome-terminal --title="$title" -- bash -c "$cmd; exec bash" 2>/dev/null || \
  xterm -T "$title" -e "$cmd; bash" 2>/dev/null || \
  konsole --new-tab -p tabtitle="$title" -e bash -c "$cmd; exec bash" 2>/dev/null || \
  echo "⚠️  Não foi possível abrir terminal para: $title"
}

# 1. REST Events (porta 4001)
echo "📦 Iniciando REST Events (4001)..."
open_terminal "REST-Events" "cd $ROOT_DIR/services/rest-events && npm start"

sleep 1

# 2. REST Check-ins (porta 4002)
echo "📦 Iniciando REST Check-ins (4002)..."
open_terminal "REST-Checkins" "cd $ROOT_DIR/services/rest-checkins && npm start"

sleep 1

# 3. SOAP Legacy (porta 5000)
echo "🧼 Iniciando SOAP Legacy (5000)..."
open_terminal "SOAP-Legacy" "cd $ROOT_DIR/services/soap-legacy && source $VENV_ACTIVATE && python app.py"

sleep 1

# 4. RabbitMQ Consumer
echo "🐰 Iniciando MOM Notify..."
open_terminal "MOM-Notify" "cd $ROOT_DIR/services/mom-notify && npm start"

sleep 1

# 5. TCP/UDP Server (portas 7001/7002)
echo "📡 Iniciando TCP/UDP Server (7001/7002)..."
open_terminal "TCP-UDP" "cd $ROOT_DIR/services/tcp-udp && npm start"

sleep 1

# 6. gRPC Server (porta 50051)
echo "⚡ Iniciando gRPC Server (50051)..."
open_terminal "gRPC-Server" "cd $ROOT_DIR/services/grpc/server && source $VENV_ACTIVATE && python server.py"

sleep 1

# 7. Gateway (porta 4000)
echo "🌐 Iniciando Gateway (4000)..."
open_terminal "Gateway" "cd $ROOT_DIR/gateway && npm start"

sleep 2

# 8. Frontend Vue (porta 5173)
echo "🎨 Iniciando Frontend Vue (5173)..."
open_terminal "Frontend" "cd $ROOT_DIR/web && npm run dev"

echo ""
echo "✅ Todos os serviços iniciados!"
echo ""
echo "📍 URLs:"
echo "   Cliente: http://localhost:5173/cliente"
echo "   Admin:   http://localhost:5173/admin"
echo "   Gateway: http://localhost:4000/api"
echo "   Swagger: http://localhost:4000/api (ver openapi.yaml)"
echo ""
