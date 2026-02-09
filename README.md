# DSD - Sistema de Gestão de Eventos

Projeto desenvolvido para a disciplina de Desenvolvimento de Sistemas Distribuídos (DSD) do curso TADS, integrando 5 tecnologias de comunicação distribuída em um único sistema coeso.

---

## 1. Visão Geral

### Ideia

Sistema de gestão de eventos com fluxo completo: clientes compram ingressos, administradores aprovam/recusam, e na portaria a entrada é validada. Cada etapa utiliza uma tecnologia de comunicação diferente.

### Resumo do Fluxo

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Cliente   │───▶│   Gateway   │───▶│   Serviços  │───▶│    Admin    │
│  (Vue.js)   │◀───│  (Node.js)  │◀───│   REST/SOAP │◀───│   (Vue.js)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                 │                   │                  │
       │    WebSocket    │                   │                  │
       └─────────────────┼───────────────────┼──────────────────┘
                         │                   │
                    ┌────▼────┐         ┌────▼────┐
                    │ RabbitMQ│         │  gRPC   │
                    │  (MOM)  │         │ Python  │
                    └─────────┘         └─────────┘
```

1. **Cliente** vê eventos e compra ingressos (status `pending`)
2. **Admin** aprova/recusa ingressos (status `approved`/`rejected`)
3. **Notificações** em tempo real via WebSocket
4. **Portaria** valida entrada via gRPC
5. **Telemetria** TCP/UDP

### Tech Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Vue 3 + Vite |
| API Gateway | Node.js + Express |
| REST Services | Node.js + Express |
| SOAP Service | Python 3.11 + Spyne |
| WebSocket | ws (Node.js) |
| Message Queue | RabbitMQ + amqplib |
| TCP/UDP | Node.js net + dgram |
| gRPC | Python (servidor) + Node.js (cliente) |

---

## 2. Relação Funcionalidade-Tarefa

### Etapa 1: SOAP e REST

**Requisitos atendidos:**
- ✅ API Gateway centralizado (porta 4000)
- ✅ HATEOAS implementado em todos os endpoints
- ✅ Documentação OpenAPI (`gateway/openapi.yaml`)
- ✅ Cliente Web Vue consumindo Gateway
- ✅ Servidor SOAP Python com WSDL exposto
- ✅ 2 APIs REST internas (eventos e check-ins)
- ✅ Cliente SOAP no Gateway (linguagem diferente do servidor)

**Como funciona:**
- Gateway expõe `/api` com links HATEOAS para navegação
- Endpoint `/api/legacy/events/{id}` chama SOAP Python via cliente `soap` do Node.js
- WSDL disponível em `http://localhost:5000/?wsdl`

---

### Etapa 2: WebSocket

**Requisitos atendidos:**
- ✅ Servidor WebSocket gerenciando ciclo de vida
- ✅ Cliente WebSocket no navegador com reconexão automática
- ✅ Mensagens JSON estruturadas por tipo

**Como funciona:**
- Gateway cria servidor WebSocket em `ws://localhost:4000/ws/checkins`
- Frontend conecta automaticamente e recebe eventos:
  - `ticket_purchased`: novo ingresso comprado
  - `checkin_updated`: ingresso aprovado/recusado
  - `event_created`: novo evento criado
  - `tcp_udp`: telemetria recebida

---

### Etapa 3: MOM (Message-Oriented Middleware)

**Requisitos atendidos:**
- ✅ RabbitMQ como broker de mensagens
- ✅ Processo publicador (Gateway)
- ✅ Processo assinante/consumidor (`mom-notify`)
- ✅ Filas duráveis para persistência

**Como funciona:**
- Gateway publica em filas:
  - `events.created`: quando evento é criado
  - `checkins.updated`: quando check-in muda de status
- Consumidor `mom-notify` processa mensagens e loga no console

---

### Etapa 4: TCP e UDP

**Requisitos atendidos:**
- ✅ Servidor UDP (porta 7001) e TCP (porta 7002)
- ✅ Protocolos nativos (não HTTP)
- ✅ Ambos em um único projeto
- ✅ Linguagem diferente de Java (Node.js)

**Como funciona:**
- Serviço `tcp-udp` escuta em ambas as portas
- Simula leitores de QR code enviando telemetria
- Mensagens são encaminhadas ao Gateway via HTTP
- Gateway faz broadcast via WebSocket para o painel admin

**Teste manual:**
```bash
# UDP
echo "QR_SCAN evt-1 Maria" | nc -u localhost 7001

# TCP
echo "QR_SCAN evt-2 Joao" | nc localhost 7002
```

---

### Etapa 5: gRPC

**Requisitos atendidos:**
- ✅ Comunicação via gRPC obrigatória
- ✅ Duas linguagens: Python (servidor) e Node.js (cliente)
- ✅ Arquivo `.proto` definindo contrato

**Como funciona:**
- Servidor Python (`services/grpc/server`) implementa `EntryService`
- Gateway Node.js conecta como cliente gRPC
- Endpoint `/api/entry/validate` busca check-in e valida entrada:
  - `approved` → entrada liberada
  - `pending` → entrada negada (aguardando aprovação)
  - `rejected` → entrada negada (recusado)

**Arquivo Proto:**
```protobuf
service EntryService {
  rpc ValidateEntry (EntryRequest) returns (EntryReply);
}
```

---

## 3. Configuração do Ambiente

### Pré-requisitos

- **Node.js** 18+ (recomendado: 20.x)
- **Python** 3.11.x (versões acimas podem apresentar incompatibilidade)
- **RabbitMQ** instalado e rodando
- **Git**

### Instalar RabbitMQ (Ubuntu/Debian)

```bash
sudo apt-get install rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server

# Habilitar interface web (opcional)
sudo rabbitmq-plugins enable rabbitmq_management
# Acesse: http://localhost:15672 (guest/guest)
```

### Criar ambiente virtual Python

```bash
cd /caminho/para/projeto-2-bim
python3.11 -m venv .venv311
source .venv311/bin/activate
pip install spyne lxml grpcio grpcio-tools
```

### Instalar dependências Node.js

```bash
# Gateway
cd gateway && npm install

# Serviços REST
cd ../services/rest-events && npm install
cd ../rest-checkins && npm install

# MOM Consumer
cd ../mom-notify && npm install

# TCP/UDP
cd ../tcp-udp && npm install

# Frontend
cd ../../web && npm install
```

### Gerar stubs gRPC Python

```bash
cd services/grpc/server
source ../../../.venv311/bin/activate
python -m grpc_tools.protoc -I../proto --python_out=. --grpc_python_out=. ../proto/checkin.proto
```

---

## 4. Como Rodar o Projeto

### Iniciar todos os serviços

```bash
./scripts/start-all.sh
```

Abre 8 terminais com cada serviço:
1. REST Events (porta 4001)
2. REST Check-ins (porta 4002)
3. SOAP Legacy (porta 5000)
4. Gateway (porta 4000)
5. MOM Notify (consumidor RabbitMQ)
6. TCP/UDP (portas 7001/7002)
7. gRPC Server (porta 50051)
8. Frontend Vue (porta 5173)

### Parar todos os serviços

```bash
./scripts/stop-all.sh
```

### URLs do Sistema

| Serviço | URL |
|---------|-----|
| Cliente (Vue) | http://localhost:5173/cliente |
| Admin (Vue) | http://localhost:5173/admin |
| API Gateway | http://localhost:4000/api |
| SOAP WSDL | http://localhost:5000/?wsdl |
| RabbitMQ UI | http://localhost:15672 |
| WebSocket | ws://localhost:4000/ws/checkins |

### Fluxo de Teste Completo

1. Acesse `/cliente`, preencha seu nome e compre um ingresso
2. Veja a notificação aparecer no painel de notificações
3. Acesse `/admin`, veja o ingresso pendente
4. Aprove o ingresso
5. Veja a notificação em ambas as abas (cliente e admin)
6. Em admin, selecione o ingresso aprovado e clique "Validar entrada"
7. Veja "Entrada liberada" (gRPC funcionando)
8. Teste telemetria TCP/UDP:
   ```bash
   echo "QR_SCAN evt-1 Visitante" | nc -u localhost 7001
   ```
9. Veja a mensagem aparecer no painel de Telemetria

---

## Estrutura do Projeto

```
projeto-2-bim/
├── gateway/                 # API Gateway (Node.js)
│   ├── src/server.js
│   └── openapi.yaml        # Documentação Swagger
├── services/
│   ├── rest-events/        # REST API de eventos
│   ├── rest-checkins/      # REST API de check-ins
│   ├── soap-legacy/        # Servidor SOAP (Python)
│   ├── mom-notify/         # Consumidor RabbitMQ
│   ├── tcp-udp/            # Servidor TCP/UDP
│   └── grpc/
│       ├── proto/          # Definição .proto
│       └── server/         # Servidor gRPC (Python)
├── web/                    # Frontend Vue
│   └── src/
│       ├── views/          # ClienteView, AdminView
│       └── composables/    # useGateway.js
├── scripts/
│   ├── start-all.sh        # Inicia tudo
│   └── stop-all.sh         # Para tudo
└── doc/
    └── anotacoes.md        # Notas do projeto
```

---