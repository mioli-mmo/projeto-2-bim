# Etapa 5 - gRPC

## Objetivo

Validar tickets via gRPC usando duas linguagens.

## Arquitetura

Cliente Node.js -> gRPC -> Servidor Python

Gateway REST -> Cliente gRPC Node.js -> Servidor gRPC Python -> Front-end

## Backlog

- Definir contrato proto
- Implementar servidor gRPC em Python
- Implementar cliente gRPC em Node.js
- Documentar e testar

## Testes manuais

1) Gerar stubs no servidor:

python -m grpc_tools.protoc -I ../proto \
  --python_out=. --grpc_python_out=. ../proto/checkin.proto

2) Subir servidor:

python server.py

3) Rodar cliente:

node client.js

4) Validar pelo front:

- Suba o Gateway e o front-end
- Use o painel "Validar ticket (gRPC)"
