# DSD - Projeto 2o bimestre

## Script de subida (exemplo)

```bash
#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Iniciando REST Events..."
(cd "$ROOT_DIR/services/rest-events" && npm start) &

echo "Iniciando REST Check-ins..."
(cd "$ROOT_DIR/services/rest-checkins" && npm start) &

echo "Iniciando SOAP Legacy (Python 3.11)..."
(
	cd "$ROOT_DIR"
	source .venv311/bin/activate
	cd services/soap-legacy
	python app.py
) &

echo "Iniciando Gateway..."
(cd "$ROOT_DIR/gateway" && npm start) &

echo "Iniciando Web (Vue)..."
(cd "$ROOT_DIR/web" && npm run dev) &

echo "Tudo iniciado. Para parar, use: kill 0"
wait
```

## URLs locais

- http://localhost:4000/api - API Gateway (HATEOAS)
- http://localhost:4000/api/events - REST eventos via Gateway
- http://localhost:4000/api/checkins - REST check-ins via Gateway
- http://localhost:4000/api/legacy/events/evt-1 - SOAP legado via Gateway
- ws://localhost:4000/ws/checkins - WebSocket de alertas de check-in
- http://localhost:5173 - Cliente Web (Vue)
- http://localhost:15672 - RabbitMQ Management (guest/guest)

## Script para criar evento

```bash
curl -s -X POST http://localhost:4000/api/events \
	-H "Content-Type: application/json" \
	-d '{"name":"Mini Conf","date":"2026-03-10","location":"Auditorio"}'
```