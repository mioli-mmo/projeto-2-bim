import os
from concurrent import futures

import grpc

import checkin_pb2
import checkin_pb2_grpc


class TicketService(checkin_pb2_grpc.TicketServiceServicer):
    def ValidateTicket(self, request, context):
        valid = request.ticketId.startswith("TCK-") and request.eventId != ""
        if valid:
            message = f"Ticket {request.ticketId} valido para {request.eventId}"
        else:
            message = f"Ticket {request.ticketId} invalido"
        return checkin_pb2.TicketReply(valid=valid, message=message)


def serve():
    port = os.environ.get("GRPC_PORT", "50051")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    checkin_pb2_grpc.add_TicketServiceServicer_to_server(TicketService(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"grpc server listening on {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
