import math
from datetime import datetime, timedelta

from algoritmo.astar import calcular_ruta
from algoritmo.colonia_hormigas_cvrp import (
    ant_colony_cvrp,
)
from algoritmo.osrm_service import (
    obtener_geometria_osrm,
)


def distancia_entre(
    grafo,
    origen,
    destino,
):
    if int(origen) == int(destino):
        return [int(origen)], 0.0

    ruta, distancia = calcular_ruta(
        grafo,
        int(origen),
        int(destino),
    )

    if not ruta:
        return [], float("inf")

    return ruta, float(distancia)


def construir_geometria_y_tramos(
    bodega,
    destinos_ordenados,
):
    """
    Construye la geometría real tramo por tramo mediante OSRM.

    Retorna:
    - geometria: secuencia completa [latitud, longitud]
    - tramos: índices exactos donde inicia y termina cada tramo
    """

    bodega_normalizada = {
        "id": int(bodega["id"]),
        "nombre": bodega["nombre"],
        "latitud": float(bodega["latitud"]),
        "longitud": float(bodega["longitud"]),
    }

    puntos_ruta = [bodega_normalizada]

    for destino in destinos_ordenados:
        puntos_ruta.append({
            "id": int(destino["destino_id"]),
            "nombre": destino["ubicacion"],
            "latitud": float(destino["latitud"]),
            "longitud": float(destino["longitud"]),
        })

    # La jornada siempre termina regresando a bodega.
    puntos_ruta.append(bodega_normalizada)

    geometria_completa = []
    tramos = []

    for indice in range(len(puntos_ruta) - 1):
        origen = puntos_ruta[indice]
        destino = puntos_ruta[indice + 1]

        try:
            geometria_tramo = obtener_geometria_osrm([
                origen,
                destino,
            ])
        except Exception:
            geometria_tramo = [
                [
                    float(origen["latitud"]),
                    float(origen["longitud"]),
                ],
                [
                    float(destino["latitud"]),
                    float(destino["longitud"]),
                ],
            ]

        if not geometria_tramo:
            raise Exception(
                f'No se obtuvo geometría entre '
                f'{origen["nombre"]} y {destino["nombre"]}'
            )

        if not geometria_completa:
            desde_indice = 0
            geometria_completa.extend(geometria_tramo)
        else:
            # El último punto acumulado ya es el origen
            # del siguiente tramo.
            desde_indice = len(geometria_completa) - 1

            # Evita duplicar el punto de conexión.
            geometria_completa.extend(
                geometria_tramo[1:]
            )

        hasta_indice = len(geometria_completa) - 1

        es_retorno = indice == len(puntos_ruta) - 2

        tramos.append({
            "orden": None if es_retorno else indice + 1,
            "tipo": (
                "RETORNO_BODEGA"
                if es_retorno
                else "ENTREGA"
            ),
            "desde": {
                "id": origen["id"],
                "nombre": origen["nombre"],
            },
            "hasta": {
                "id": destino["id"],
                "nombre": destino["nombre"],
            },
            "desde_indice": desde_indice,
            "hasta_indice": hasta_indice,
        })

    return {
        "geometria": geometria_completa,
        "tramos": tramos,
    }


def ordenar_pedidos_segun_destinos(
    pedidos,
    destinos_ordenados,
):
    pedidos_por_destino = {}

    for pedido in pedidos:
        destino_id = int(
            pedido["destino_id"]
        )

        pedidos_por_destino.setdefault(
            destino_id,
            [],
        )

        pedidos_por_destino[
            destino_id
        ].append(pedido)

    pedidos_ordenados = []

    for destino in destinos_ordenados:
        destino_id = int(
            destino["destino_id"]
        )

        pedidos_destino = (
            pedidos_por_destino.get(
                destino_id,
                [],
            )
        )

        pedidos_destino.sort(
            key=lambda pedido: int(
                pedido["pedido_id"]
            )
        )

        pedidos_ordenados.extend(
            pedidos_destino
        )

    return pedidos_ordenados


def generar_jornada_individual(
    asignacion,
    bodega,
    grafo,
    velocidad_kmh,
):
    camion = asignacion["camion"]

    destinos_ordenados = asignacion[
        "destinos_ordenados"
    ]

    pedidos_ordenados = (
        ordenar_pedidos_segun_destinos(
            asignacion["pedidos"],
            destinos_ordenados,
        )
    )

    if not pedidos_ordenados:
        return None

    orden_por_destino = {
        int(destino["destino_id"]): indice + 1
        for indice, destino in enumerate(
            destinos_ordenados
        )
    }

    distancia_total = 0.0
    entregas = []

    tiempo_base = datetime.now()

    origen_actual = {
        "id": int(bodega["id"]),
        "nombre": bodega["nombre"],
        "latitud": float(
            bodega["latitud"]
        ),
        "longitud": float(
            bodega["longitud"]
        ),
    }

    actual_id = int(bodega["id"])

    for pedido in pedidos_ordenados:
        destino_id = int(
            pedido["destino_id"]
        )

        ruta_nodos, distancia_tramo = (
            distancia_entre(
                grafo,
                actual_id,
                destino_id,
            )
        )

        if math.isinf(distancia_tramo):
            raise Exception(
                "No existe una ruta entre "
                f"{actual_id} y {destino_id}"
            )

        distancia_total += distancia_tramo

        tiempo_acumulado = round(
            (
                distancia_total
                / velocidad_kmh
            )
            * 60
        )

        fecha_estimada = (
            tiempo_base
            + timedelta(
                minutes=tiempo_acumulado
            )
        )

        destino_actual = {
            "id": destino_id,
            "nombre": pedido["ubicacion"],
            "latitud": float(
                pedido["latitud"]
            ),
            "longitud": float(
                pedido["longitud"]
            ),
        }

        entregas.append({
            "pedido_id": pedido["pedido_id"],
            "orden_entrega": (
                orden_por_destino[
                    destino_id
                ]
            ),
            "ruta_parcial": {
                "desde": origen_actual,
                "hasta": destino_actual,
                "ruta_nodos": ruta_nodos,
                "geometria": [
                    [
                        origen_actual[
                            "latitud"
                        ],
                        origen_actual[
                            "longitud"
                        ],
                    ],
                    [
                        destino_actual[
                            "latitud"
                        ],
                        destino_actual[
                            "longitud"
                        ],
                    ],
                ],
            },
            "distancia_acumulada_km": round(
                distancia_total,
                2,
            ),
            "tiempo_acumulado_min": (
                tiempo_acumulado
            ),
            "fecha_estimada_entrega": (
                fecha_estimada.isoformat()
            ),
        })

        # Solo cambia el origen físico cuando cambia
        # realmente la ubicación.
        origen_actual = destino_actual
        actual_id = destino_id

    ultimo_destino = int(
        destinos_ordenados[-1][
            "destino_id"
        ]
    )

    _, distancia_regreso = distancia_entre(
        grafo,
        ultimo_destino,
        int(bodega["id"]),
    )

    if math.isinf(distancia_regreso):
        raise Exception(
            "No existe ruta de regreso "
            "hacia la bodega"
        )

    distancia_total += distancia_regreso

    tiempo_total = round(
        (
            distancia_total
            / velocidad_kmh
        )
        * 60
    )

    puntos = []

    for pedido in pedidos_ordenados:
        destino_id = int(
            pedido["destino_id"]
        )

        puntos.append({
            "orden": (
                orden_por_destino[
                    destino_id
                ]
            ),
            "pedido_id": pedido[
                "pedido_id"
            ],
            "cliente_id": pedido[
                "cliente_id"
            ],
            "cliente": pedido[
                "cliente"
            ],
            "destino_id": destino_id,
            "ubicacion": pedido[
                "ubicacion"
            ],
            "latitud": float(
                pedido["latitud"]
            ),
            "longitud": float(
                pedido["longitud"]
            ),
            "estado": "PENDIENTE",
        })

    puntos.sort(
        key=lambda punto: (
            int(punto["orden"]),
            int(punto["pedido_id"]),
        )
    )

    mapa_ruta = construir_geometria_y_tramos(
        bodega,
        destinos_ordenados,
    )

    return {
        "camion_id": camion["id"],
        "capacidad_camion": int(
            camion["capacidad"]
        ),
        "capacidad_utilizada": len(
            pedidos_ordenados
        ),
        "ruta_general": {
            "bodega": bodega,
            "puntos": puntos,
            "geometria": mapa_ruta["geometria"],
            "tramos": mapa_ruta["tramos"],
        },
        "distancia_total_km": round(
            distancia_total,
            2,
        ),
        "tiempo_estimado_min": (
            tiempo_total
        ),
        "entregas": entregas,
    }


def generar_jornada(datos, grafo):
    bodega = datos["bodega"]
    pedidos = datos["pedidos"]
    camiones = datos["camiones"]

    velocidad_kmh = float(
        datos.get(
            "velocidad_kmh",
            40,
        )
    )

    if velocidad_kmh <= 0:
        raise Exception(
            "La velocidad debe ser mayor a cero"
        )

    if not pedidos:
        return {
            "jornadas": [],
            "pedidos_no_asignados": [],
        }

    if not camiones:
        return {
            "jornadas": [],
            "pedidos_no_asignados": [
                pedido["pedido_id"]
                for pedido in pedidos
            ],
        }

    solucion = ant_colony_cvrp(
        grafo=grafo,
        bodega_id=int(bodega["id"]),
        pedidos=pedidos,
        camiones=camiones,
        distancia_entre=distancia_entre,
    )

    jornadas = []

    for asignacion in solucion[
        "asignaciones"
    ]:
        jornada = generar_jornada_individual(
            asignacion=asignacion,
            bodega=bodega,
            grafo=grafo,
            velocidad_kmh=velocidad_kmh,
        )

        if jornada is not None:
            jornadas.append(jornada)

    pedidos_no_asignados = [
        pedido["pedido_id"]
        for pedido in solucion[
            "pedidos_no_asignados"
        ]
    ]

    return {
        "jornadas": jornadas,
        "pedidos_no_asignados": (
            pedidos_no_asignados
        ),
    }

    