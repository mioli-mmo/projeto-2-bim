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