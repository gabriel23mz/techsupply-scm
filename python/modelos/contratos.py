import math

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


def validar_entero_positivo(valor, campo):
    try:
        numero = int(valor)
    except (TypeError, ValueError):
        raise ValueError(f"{campo} debe ser entero")

    if numero <= 0:
        raise ValueError(f"{campo} debe ser positivo")

    return numero


def validar_numero_finito(valor, campo):
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        raise ValueError(f"{campo} debe ser numerico")

    if not math.isfinite(numero):
        raise ValueError(f"{campo} debe ser finito")

    return numero


def validar_latitud(valor):
    numero = validar_numero_finito(valor, "latitud")

    if not -90 <= numero <= 90:
        raise ValueError("latitud debe estar entre -90 y 90")

    return numero


def validar_longitud(valor):
    numero = validar_numero_finito(valor, "longitud")

    if not -180 <= numero <= 180:
        raise ValueError("longitud debe estar entre -180 y 180")

    return numero


class RutaEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    origen: int
    destino: int
    distancia: float

    @field_validator("origen", "destino", mode="before")
    @classmethod
    def validar_ids(cls, valor, info):
        return validar_entero_positivo(valor, info.field_name)

    @field_validator("distancia", mode="before")
    @classmethod
    def validar_distancia(cls, valor):
        distancia = validar_numero_finito(valor, "distancia")

        if distancia <= 0:
            raise ValueError("distancia debe ser mayor que cero")

        return distancia


class SolicitudRuta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    origenId: int
    destinoId: int
    rutas: list[RutaEntrada]

    @field_validator("origenId", "destinoId", mode="before")
    @classmethod
    def validar_ids(cls, valor, info):
        return validar_entero_positivo(valor, info.field_name)



class BodegaEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    nombre: str
    latitud: float
    longitud: float

    @field_validator("id", mode="before")
    @classmethod
    def validar_id(cls, valor):
        return validar_entero_positivo(valor, "id")

    @field_validator("latitud", mode="before")
    @classmethod
    def validar_lat(cls, valor):
        return validar_latitud(valor)

    @field_validator("longitud", mode="before")
    @classmethod
    def validar_lon(cls, valor):
        return validar_longitud(valor)


class CamionEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    codigo: str
    placa: str
    capacidad: int | None = None

    @field_validator("id", mode="before")
    @classmethod
    def validar_id(cls, valor):
        return validar_entero_positivo(valor, "id")

    @field_validator("capacidad", mode="before")
    @classmethod
    def validar_capacidad(cls, valor):
        capacidad = validar_entero_positivo(valor, "capacidad")
        return capacidad


class PedidoJornadaEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pedido_id: int
    cliente_id: int
    cliente: str
    destino_id: int
    ubicacion: str
    latitud: float
    longitud: float
    fecha_entrega: str | None = None

    @field_validator("pedido_id", "cliente_id", "destino_id", mode="before")
    @classmethod
    def validar_ids(cls, valor, info):
        return validar_entero_positivo(valor, info.field_name)

    @field_validator("latitud", mode="before")
    @classmethod
    def validar_lat(cls, valor):
        return validar_latitud(valor)

    @field_validator("longitud", mode="before")
    @classmethod
    def validar_lon(cls, valor):
        return validar_longitud(valor)


class AcoConfigEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    num_hormigas: int | None = None
    iteraciones: int | None = None
    iteraciones_sin_mejora: int | None = None
    alfa: float | None = None
    beta: float | None = None
    evaporacion: float | None = None
    q: float | None = None
    semilla: int | None = None

    @field_validator(
        "num_hormigas",
        "iteraciones",
        "iteraciones_sin_mejora",
        mode="before",
    )
    @classmethod
    def validar_enteros(cls, valor, info):
        if valor is None:
            return valor

        return validar_entero_positivo(valor, info.field_name)

    @field_validator("alfa", "beta", "q", mode="before")
    @classmethod
    def validar_positivos(cls, valor, info):
        if valor is None:
            return valor

        numero = validar_numero_finito(valor, info.field_name)

        if numero <= 0:
            raise ValueError(f"{info.field_name} debe ser mayor que cero")

        return numero

    @field_validator("evaporacion", mode="before")
    @classmethod
    def validar_evaporacion(cls, valor):
        if valor is None:
            return valor

        numero = validar_numero_finito(valor, "evaporacion")

        if not 0 < numero < 1:
            raise ValueError("evaporacion debe estar entre 0 y 1")

        return numero


class SolicitudJornada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bodega: BodegaEntrada
    camiones: list[CamionEntrada]
    pedidos: list[PedidoJornadaEntrada]
    grafo: list[RutaEntrada]
    velocidad_kmh: float = 40
    semilla: int | None = None
    benchmark: bool = False
    aco: AcoConfigEntrada | None = None

    @field_validator("velocidad_kmh", mode="before")
    @classmethod
    def validar_velocidad(cls, valor):
        velocidad = validar_numero_finito(valor, "velocidad_kmh")

        if velocidad <= 0:
            raise ValueError("velocidad_kmh debe ser mayor que cero")

        return velocidad

    @field_validator("semilla", mode="before")
    @classmethod
    def validar_semilla(cls, valor):
        if valor is None:
            return valor

        return validar_entero_positivo(valor, "semilla")

    @model_validator(mode="after")
    def validar_unicidad(self):
        pedido_ids = [
            pedido.pedido_id
            for pedido in self.pedidos
        ]

        if len(pedido_ids) != len(set(pedido_ids)):
            raise ValueError("pedido_id duplicado")

        camion_ids = [
            camion.id
            for camion in self.camiones
        ]

        if len(camion_ids) != len(set(camion_ids)):
            raise ValueError("camion id duplicado")

        return self

