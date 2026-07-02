from __future__ import annotations

from dataclasses import dataclass
from modelos.tipos import NodoId


@dataclass(slots=True)
class Nodo:
    """
    Representa el estado de un nodo durante la ejecución del algoritmo A*.

    Attributes:
        id: Identificador único del nodo.
        g: Costo acumulado desde el origen.
        h: Estimación del costo restante hasta el destino.
        f: Prioridad del nodo (g + h).
        padre: Nodo anterior en el camino óptimo.
    """

    id: NodoId
    g: float = float("inf")
    h: float = 0.0
    f: float = float("inf")
    padre: NodoId | None = None

