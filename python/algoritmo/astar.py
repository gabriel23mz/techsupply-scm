from heapq import heappush, heappop
import math

from algoritmo.heuristica import heuristica
from errores import LogisticaError
from modelos.tipos import Grafo, NodoId
from utils.reconstruccion import reconstruir_camino


def calcular_ruta(
    grafo: Grafo,
    origen: NodoId,
    destino: NodoId,
) -> tuple[list[NodoId], float]:
    """
    Calcula la ruta óptima entre dos nodos utilizando el algoritmo A*.

    Args:
        grafo: Grafo representado como lista de adyacencia.
        origen: Nodo de origen.
        destino: Nodo de destino.

    Returns:
        Una tupla con la ruta óptima y la distancia total.
    """

    if not grafo:
      raise LogisticaError(
        "DISCONNECTED_GRAPH",
        "El grafo no contiene rutas disponibles",
      )

    if origen == destino:
      if origen not in grafo:
        raise LogisticaError(
          "NODE_NOT_FOUND",
          "El nodo de origen no existe en el grafo",
          {"origen": origen},
        )

      return [origen], 0.0

    if origen not in grafo:
      raise LogisticaError(
        "NODE_NOT_FOUND",
        "El nodo de origen no existe en el grafo",
        {"origen": origen},
      )

    if destino not in grafo:
      raise LogisticaError(
        "NODE_NOT_FOUND",
        "El nodo de destino no existe en el grafo",
        {"destino": destino},
      )

    # Cola de prioridad (open set)
    open_set: list[tuple[float, NodoId]] = []

    # Nodos completamente procesados
    closed_set: set[NodoId] = set()

    # Nodo padre utilizado para reconstruir el camino
    came_from: dict[NodoId, NodoId] = {}

    # Costo real desde el origen
    g_score = {
        nodo: float("inf")
        for nodo in grafo
    }

    # Prioridad total (g + h)
    f_score = {
        nodo: float("inf")
        for nodo in grafo
    }

    # Inicialización del nodo de origen
    g_score[origen] = 0.0
    f_score[origen] = heuristica(origen, destino)

    # Agregar el origen al conjunto abierto
    heappush(open_set, (f_score[origen], origen))

    while open_set:

        # Obtener el nodo con menor prioridad
        _, actual = heappop(open_set)

        if actual in closed_set:
            continue
        
        # Si llegamos al destino, reconstruimos el camino
        if actual == destino:
            ruta = reconstruir_camino(came_from, destino)
            return ruta, g_score[destino]

        # Explorar vecinos
        for vecino, distancia in grafo.get(actual, []):

            if vecino not in grafo:
                raise LogisticaError(
                    "NODE_NOT_FOUND",
                    "Una arista apunta a un nodo inexistente",
                    {"nodo": vecino},
                )

            if (
                not isinstance(distancia, (int, float)) or
                not math.isfinite(float(distancia)) or
                float(distancia) <= 0
            ):
                raise LogisticaError(
                    "INVALID_DISTANCE",
                    "El grafo contiene una distancia invalida",
                    {
                        "origen": actual,
                        "destino": vecino,
                        "distancia": distancia,
                    },
                )

            # Si el vecino ya fue procesado, lo ignoramos
            if vecino in closed_set:
                continue

            nuevo_g = g_score[actual] + distancia

            if nuevo_g < g_score[vecino]:

                came_from[vecino] = actual
                g_score[vecino] = nuevo_g
                f_score[vecino] = (
                    nuevo_g +
                    heuristica(vecino, destino)
                )

                heappush(
                    open_set,
                    (f_score[vecino], vecino)
                )

        # El nodo actual ya fue procesado completamente
        closed_set.add(actual)


    # No existe una ruta entre origen y destino
    return [], 0.0

