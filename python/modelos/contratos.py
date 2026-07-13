from pydantic import BaseModel


class RutaEntrada(BaseModel):
    origen: int
    destino: int
    distancia: float


class SolicitudRuta(BaseModel):
    origenId: int
    destinoId: int
    rutas: list[RutaEntrada]



class BodegaEntrada(BaseModel):
    id: int
    nombre: str
    latitud: float
    longitud: float


class CamionEntrada(BaseModel):
    id: int
    codigo: str
    placa: str
    capacidad: int | None = None


class PedidoJornadaEntrada(BaseModel):
    pedido_id: int
    cliente_id: int
    cliente: str
    destino_id: int
    ubicacion: str
    latitud: float
    longitud: float
    fecha_entrega: str | None = None


class SolicitudJornada(BaseModel):
    bodega: BodegaEntrada
    camiones: list[CamionEntrada]
    pedidos: list[PedidoJornadaEntrada]
    grafo: list[RutaEntrada]
    velocidad_kmh: float = 40

