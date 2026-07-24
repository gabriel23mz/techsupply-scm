from typing import Any
import math

from errores import LogisticaError
from modelos.tipos import Grafo


def _validar_nodo(valor: Any, nombre: str) -> int:
    try:
        nodo = int(valor)
    except (TypeError, ValueError):
        raise LogisticaError(
            "INVALID_INPUT",
            f"{nombre} debe ser un entero",
            {nombre: valor},
        )

    if nodo <= 0:
        raise LogisticaError(
            "INVALID_INPUT",
            f"{nombre} debe ser positivo",
            {nombre: valor},
        )

    return nodo


def _validar_distancia(valor: Any) -> float:
    try:
        distancia = float(valor)
    except (TypeError, ValueError):
        raise LogisticaError(
            "INVALID_DISTANCE",
            "La distancia debe ser numerica",
            {"distancia": valor},
        )

    if not math.isfinite(distancia) or distancia <= 0:
        raise LogisticaError(
            "INVALID_DISTANCE",
            "La distancia debe ser finita y mayor que cero",
            {"distancia": valor},
        )

    return distancia


def construir_grafo(rutas: list[dict[str, Any]]) -> Grafo:
    """
    Construye un grafo representado mediante una lista de adyacencia.

    Cada ruta recibida se considera bidireccional, por lo que se agrega
    una arista en ambos sentidos.

    Args:
        rutas: Lista de rutas recibidas desde Node.js.

    Returns:
        Un diccionario donde la clave es el identificador de un nodo y
        el valor es la lista de sus vecinos junto con la distancia.
    """

    grafo: Grafo = {}

    for ruta in rutas:
        origen = _validar_nodo(ruta.get("origen"), "origen")
        destino = _validar_nodo(ruta.get("destino"), "destino")
        distancia = _validar_distancia(
            ruta.get("distancia", ruta.get("distancia_km")),
        )

        # Garantizar que ambos nodos existan en el grafo.
        grafo.setdefault(origen, [])
        grafo.setdefault(destino, [])

        # Agregar la conexión en ambos sentidos.
        grafo[origen].append((destino, distancia))
        grafo[destino].append((origen, distancia))

    return grafo
