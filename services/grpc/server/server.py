import os
from concurrent import futures

import grpc

import checkin_pb2
import checkin_pb2_grpc


class EntryService(checkin_pb2_grpc.EntryServiceServicer):
    def ValidateEntry(self, request, context):
        checkin_id = request.checkinId
        status = request.status
        attendee = request.attendeeName
        event_id = request.eventId

        # Regras de validação de entrada
        if not checkin_id:
            return checkin_pb2.EntryReply(
                allowed=False,
                message="Entrada negada",
                reason="ID do ingresso nao informado"
            )

        if status == "approved":
            return checkin_pb2.EntryReply(
                allowed=True,
                message=f"Entrada liberada para {attendee}",
                reason=f"Ingresso {checkin_id} aprovado para evento {event_id}"
            )
        elif status == "pending":
            return checkin_pb2.EntryReply(
                allowed=False,
                message="Entrada negada",
                reason=f"Ingresso {checkin_id} ainda pendente de aprovacao"
            )
        elif status == "rejected":
            return checkin_pb2.EntryReply(
                allowed=False,
                message="Entrada negada",
                reason=f"Ingresso {checkin_id} foi recusado"
            )
        else:
            return checkin_pb2.EntryReply(
                allowed=False,
                message="Entrada negada",
                reason=f"Status desconhecido: {status}"
            )


def serve():
    port = os.environ.get("GRPC_PORT", "50051")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    checkin_pb2_grpc.add_EntryServiceServicer_to_server(EntryService(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"grpc server listening on {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
