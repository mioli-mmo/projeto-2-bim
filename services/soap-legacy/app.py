from spyne import Application, rpc, ServiceBase, Unicode
from spyne.model.complex import ComplexModel
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from waitress import serve


class EventLegacy(ComplexModel):
    id = Unicode
    name = Unicode
    date = Unicode
    location = Unicode


EVENTS = {
    "evt-1": {
        "id": "evt-1",
        "name": "Tech Meetup",
        "date": "2026-02-20",
        "location": "Campus A",
    },
    "evt-2": {
        "id": "evt-2",
        "name": "Game Jam",
        "date": "2026-03-05",
        "location": "Lab B",
    },
}


class LegacyService(ServiceBase):
    @rpc(Unicode, _returns=EventLegacy)
    def GetEventLegacy(ctx, id):
        event = EVENTS.get(id)
        if not event:
            return EventLegacy(id=id, name="unknown", date="", location="")
        return EventLegacy(**event)


application = Application(
    [LegacyService],
    tns="http://legacy.events.soap",
    in_protocol=Soap11(validator="lxml"),
    out_protocol=Soap11(),
)

wsgi_application = WsgiApplication(application)


if __name__ == "__main__":
    serve(wsgi_application, host="0.0.0.0", port=5000)
