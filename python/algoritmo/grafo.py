from typing import Any

from modelos.tipos import Grafo


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
        origen = ruta["origen"]
        destino = ruta["destino"]
        distancia = ruta.get("distancia", ruta.get("distancia_km"))

        # Garantizar que ambos nodos existan en el grafo.
        grafo.setdefault(origen, [])
        grafo.setdefault(destino, [])

        # Agregar la conexión en ambos sentidos.
        grafo[origen].append((destino, distancia))
        grafo[destino].append((origen, distancia))

    return grafo
