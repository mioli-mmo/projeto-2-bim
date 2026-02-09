# DSD - Projeto 2º bimestre

----------------------------------------------

## 📑 Anotações gerais

### Etapas:

1. [SOAP e REST](tarefas/tarefa_1.pdf)

    Meta: Criar uma arquitetura que integre REST e SOAP, implemente e documente um API Gateway
    Regras
    - Desenvolver ao menos um API Gateway
    - Implementar o conceito de HATEOAS no Gateway
    - Criar a documentação de API para o Gateway (ex. SOAP UI, Swagger, etc.)
    - Desenvolver um Cliente Web para acessar o Gateway
    - Desenvolver servidor e objeto(s) que, por meio de SOAP, será(ão) disponibilizado(s) pela rede
    - Implementar ou utilizar ao menos 2 API para simular a arquitetura interna de um sistema
    - Demonstre o arquivo WSDL gerado apresentando suas principais tags
    - Desenvolver cliente(s) em linguagem(ns) diferente(s) do servidor detalhando a arquitetura utilizada e
    como o cliente utiliza o WSDL para montar suas requisições
    - Criar projeto no Github e compartilhar link
    -  Linguagem de programação de livre escolha

2. [REST e Websocket](tarefas/tarefa_2.pdf)

    Meta: implementar, por meio de um estudo de caso, a transmissão de dados com WebSocket
    Regras API Gateway:
    - Desenvolver ao menos um API Gateway
    - Implementar o conceito de HATEOAS no Gateway
    - Criar a documentação de API para o Gateway (ex. SOAP UI, Swagger, etc.)
    - Implemetar ou utilizar ao menos 2 API para simular a arquitetura interna de um sistema
    - Desenvolver um Cliente Web para acessar o Gateway
    - Linguagem de programação de livre escolha
    Regras WebSocket
    - Criar o servidor (Classe que fornece um endpoint WebSocket e gerencia o ciclo de vida)
    - Criar o cliente (Instanciar o objeto WebSocket em navegador Web e gerenciar o ciclo de vida)
    - Criar projeto no Github e compartilhar link

3. [MOM](tarefas/tarefa_3.pdf)

    Meta: Implementar um sistema que utilize tópicos ou filas de
    mensagens
    Regras
    - Criar processos publicadores/produtores
    - Criar processos assinantes/consumidores
    - Utilizar um MOM (WebsphereMQ, RabbitMQ, OpenMQ) e interligar
    os processos
    - Criar projeto no Github e compartilhar link
    - código seja testado pelos presentes
    - Linguagem de programação de livre escolha

4. [TCP e UDP](tarefas/tarefa_4.pdf)

    Meta: implementar, por meio de um estudo de caso, a transmissão de
    dados com os protocolo TCP e UDP
    Regras
    - Os protocolo de transmissão TCP e UDP devem ser de fato utilizados
    - Implementações que utilizam TCP/UDP como base (ex: HTTP/RTSP) nã o são aceitos para
    essa tarefa
    - Os protocolos devem ser empregados em um único projeto (ao menos uma
    porta TCP e outra UDP)
    - Criar projeto no Github e compartilhar link
    - Linguagem de programação de livre escolha (Exceto Java)

5. [gRPC](tarefas/tarefa_5.pdf)

    Meta: implementar, por meio de um estudo de caso, a transmissão de
    dados com gRPC
    Regras
    - A transmissão deve ser necessariamente com gRPC
    - Utilizar duas linguagens diferentes e estabelecer comunicação entre as duas
    - Demonstrar a arquitetura empregada
    - Criar projeto no Github e compartilhar link
    - Linguagem de programação de livre escolha

**🤖 Para a I.A.:**

- Cada **Etapa** se refere a uma tarefa e possui um arquivo PDF com instruções gerais; sempre que eu fizer referência às **instruções** de uma tarefa ou algum sinônimo, entre no PDFs correspondente e leia-o
- O resultado final desejado é **um único projeto**, mas que englobe todas as 5 etapas, cummprindo com todos os requisitos de cada uma
- Não decida tudo sozinha; sempre me consulte para decisões importantes, tanto na parte de planejamento quanto no implementação
- O que está aqui são instruções gerais e não especializadas, então sempre que achar necessário, faça sugestões de melhorias e decisões alinhadas ao projeto, instruções das etapas e a este documento
- Antes de dar um retorno no chat, leia esse documento por completo, considerando todas as anotações

----------------------------------------------

## 🔄 Processo - Fluxo de criação

### Passo a passo

1. **Idealização:** definição do que será o projeto, seu domínio; parte criativa
2. **Planejamento:** definição da estrutura, tecnologias e estratégias; parte técnica
3. **Implementação:** construção do código fonte do projeto; parte de programação. A forma de implementação será discutida como está abaixo, na seção "Para a I.A."

- ESPECIAL. **Testes:** realização de testes ao final de **cada ciclo** para garantir o funcionamento correto antes de passar para o próximo ciclo; ocorrerá sempre entre uma implementação e outra

**🤖 Para a I.A.:**

- Sobre o processo, discutiremos duas formas de construção:
1. Um ciclo de implementação por etapa, prosseguindo para a próxima apenas quando a anterior for finalizada
2. Ciclos de implementação integrada, construindo mais de uma etapa (ou todas) simultaneamente

- Após decidirmos, juntos, sobre o processo, definiremos os ciclos, parte importante do processo