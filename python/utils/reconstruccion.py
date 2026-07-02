from modelos.tipos import NodoId


def reconstruir_camino(
    came_from: dict[NodoId, NodoId],
    destino: NodoId
) -> list[NodoId]:
    """
    Reconstruye el camino óptimo desde el origen hasta el destino.

    Args:
        came_from:
            Diccionario que indica desde qué nodo se alcanzó cada nodo.

        destino:
            Nodo destino alcanzado por el algoritmo.

    Returns:
        Lista ordenada desde el origen hasta el destino.
    """

    camino: list[NodoId] = [destino]
    actual = destino

    while actual in came_from:
        actual = came_from[actual]
        camino.append(actual)

    camino.reverse()

    return camino

