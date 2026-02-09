# gRPC Server (Python)

Servidor gRPC para validar tickets.

## Rodar

1) Gerar stubs:

python -m grpc_tools.protoc -I ../proto \
  --python_out=. --grpc_python_out=. ../proto/checkin.proto

2) Iniciar servidor:

python server.py

## Variaveis

- GRPC_PORT (default: 50051)
