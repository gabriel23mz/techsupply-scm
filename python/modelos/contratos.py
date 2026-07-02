from pydantic import BaseModel


class RutaEntrada(BaseModel):
    origen: int
    destino: int
    distancia: float


class SolicitudRuta(BaseModel):
    origenId: int
    destinoId: int
    rutas: list[RutaEntrada]

