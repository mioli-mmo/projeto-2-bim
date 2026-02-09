#!/bin/bash

# Script para parar todos os serviços do projeto DSD
# Uso: ./scripts/stop-all.sh

echo "🛑 Parando todos os serviços..."

# Matar processos por porta
kill_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null && echo "   Porta $port encerrada (PID: $pid)"
  fi
}

kill_port 4000  # Gateway
kill_port 4001  # REST Events
kill_port 4002  # REST Checkins
kill_port 5000  # SOAP
kill_port 5173  # Frontend
kill_port 5174  # Frontend (alternativo)
kill_port 7001  # UDP
kill_port 7002  # TCP
kill_port 50051 # gRPC

# Matar processos Node.js do projeto
pkill -f "node.*rest-events" 2>/dev/null
pkill -f "node.*rest-checkins" 2>/dev/null
pkill -f "node.*gateway" 2>/dev/null
pkill -f "node.*mom-notify" 2>/dev/null
pkill -f "node.*tcp-udp" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Matar processos Python do projeto
pkill -f "python.*app.py" 2>/dev/null
pkill -f "python.*server.py" 2>/dev/null

echo "✅ Serviços encerrados!"
