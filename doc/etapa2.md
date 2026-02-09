# Etapa 2 - REST e WebSocket

## Objetivo

Implementar comunicacao em tempo real via WebSocket para alertas de check-in.

## Backlog

- Expor endpoint WebSocket no Gateway
- Emitir check-ins em tempo real no Gateway
- Criar cliente WebSocket no Vue exibindo alertas ao vivo
- Atualizar documentacao da etapa

## Testes manuais

- Conectar no WebSocket em ws://localhost:4000/ws/checkins
- Realizar check-in via Gateway e validar push no cliente
- Validar que o cliente Vue exibe alertas de check-in em tempo real

## Como rodar (resumo)

1. Subir REST Events (porta 4001)
2. Subir REST Check-ins (porta 4002)
3. Subir SOAP Legacy (porta 5000)
4. Subir Gateway (porta 4000)
5. Subir Vue (porta 5173)

## Comando de teste rapido

curl -s -X POST http://localhost:4000/api/checkins \
	-H "Content-Type: application/json" \
	-d '{"eventId":"evt-1","attendeeName":"Ana"}'
