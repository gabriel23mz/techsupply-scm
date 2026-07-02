from typing import TypeAlias


# Alias de tipos para mejorar la legibilidad.

NodoId: TypeAlias = int
Distancia: TypeAlias = float

Arista: TypeAlias = tuple[NodoId, Distancia]
Grafo: TypeAlias = dict[NodoId, list[Arista]]
