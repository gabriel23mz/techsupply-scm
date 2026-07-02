from modelos.tipos import NodoId


def heuristica(actual: NodoId, destino: NodoId) -> float:
    """
    Calcula la estimación del costo restante entre dos nodos.

    Durante el MVP se utiliza una heurística nula, por lo que
    el algoritmo A* tiene un comportamiento equivalente al de Dijkstra.

    Args:
        actual: Identificador del nodo actual.
        destino: Identificador del nodo destino.

    Returns:
        Valor heurístico estimado.
    """

    return 0.0

