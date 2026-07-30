import math
import time
from datetime import datetime, timedelta

from algoritmo.astar import calcular_ruta
from algoritmo.colonia_hormigas_cvrp import (
    ant_colony_cvrp,
)
from algoritmo.osrm_service import (
    obtener_geometria_osrm,
)
from errores import LogisticaError


def crear_perfil():
    return {
        "astar_ejecuciones": 0,
        "osrm_llamadas": 0,
        "matriz_pares": 0,
        "destinos_unicos": 0,
        "pedidos_total": 0,
        "aco_soluciones_evaluadas": 0,
        "camiones_objetivo": 0,
        "duracion_base_estimada_min": 0,
    }


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


def construir_matriz_distancias(
    grafo,
    nodos_relevantes,
    perfil=None,
):
    nodos = sorted(
        {
            int(nodo)
            for nodo in nodos_relevantes
        }
    )

    matriz = {
        nodo: {}
        for nodo in nodos
    }

    caminos = {}

    for origen in nodos:
        matriz[origen][origen] = 0.0
        caminos[(origen, origen)] = [origen]

    for indice, origen in enumerate(nodos):
        for destino in nodos[indice + 1:]:
            try:
                ruta, distancia = calcular_ruta(
                    grafo,
                    origen,
                    destino,
                )

                if perfil is not None:
                    perfil["astar_ejecuciones"] += 1

                if not ruta:
                    distancia = float("inf")
            except LogisticaError as error:
                if error.code in {
                    "ROUTE_NOT_FOUND",
                    "DISCONNECTED_GRAPH",
                    "NODE_NOT_FOUND",
                }:
                    ruta = []
                    distancia = float("inf")
                else:
                    raise

            matriz[origen][destino] = float(distancia)
            matriz[destino][origen] = float(distancia)
            caminos[(origen, destino)] = ruta
            caminos[(destino, origen)] = list(reversed(ruta))

    if perfil is not None:
        perfil["matriz_pares"] = (
            len(nodos) * (len(nodos) - 1)
        ) // 2

    return matriz, caminos


def distancia_entre_matriz(
    matriz,
    caminos,
):
    def resolver(_grafo, origen, destino):
        origen = int(origen)
        destino = int(destino)

        distancia = matriz.get(
            origen,
            {},
        ).get(
            destino,
            float("inf"),
        )

        ruta = caminos.get(
            (origen, destino),
            [],
        )

        return ruta, distancia

    return resolver


def filtrar_pedidos_alcanzables(
    pedidos,
    bodega_id,
    matriz,
):
    alcanzables = []
    no_asignados = []

    for pedido in pedidos:
        destino_id = int(
            pedido["destino_id"]
        )

        distancia_ida = matriz.get(
            int(bodega_id),
            {},
        ).get(
            destino_id,
            float("inf"),
        )

        distancia_vuelta = matriz.get(
            destino_id,
            {},
        ).get(
            int(bodega_id),
            float("inf"),
        )

        if (
            math.isfinite(distancia_ida) and
            math.isfinite(distancia_vuelta)
        ):
            alcanzables.append(pedido)
        else:
            no_asignados.append({
                "pedido_id": pedido["pedido_id"],
                "motivo": "DESTINO_NO_ALCANZABLE",
            })

    return alcanzables, no_asignados


def _distancia_coordenadas_cuadrada(coordenada, punto):
    return (
        float(coordenada[0]) - float(punto["latitud"])
    ) ** 2 + (
        float(coordenada[1]) - float(punto["longitud"])
    ) ** 2


def _indice_waypoint_mas_cercano(
    geometria,
    punto,
    indice_desde,
):
    """Busca el waypoint respetando el avance de la geometría."""

    mejor_indice = indice_desde
    mejor_distancia = float("inf")

    for indice in range(indice_desde, len(geometria)):
        distancia = _distancia_coordenadas_cuadrada(
            geometria[indice],
            punto,
        )

        if distancia < mejor_distancia:
            mejor_distancia = distancia
            mejor_indice = indice

            if distancia <= 1e-14:
                break

    return mejor_indice


def construir_geometria_y_tramos(
    bodega,
    destinos_ordenados,
    cache_osrm=None,
    perfil=None,
):
    """
    Construye toda la geometría de una jornada con una sola llamada OSRM.

    Esto evita una petición de red por tramo. Los límites de cada tramo se
    recuperan buscando de forma monotónica cada waypoint dentro de la
    geometría devuelta. Si OSRM falla, se usa la polilínea directa de los
    waypoints, preservando el contrato y evitando bloquear la planificación.
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

    puntos_ruta.append(bodega_normalizada)
    cache_osrm = cache_osrm if cache_osrm is not None else {}
    cache_key = tuple(
        (
            round(float(punto["latitud"]), 7),
            round(float(punto["longitud"]), 7),
        )
        for punto in puntos_ruta
    )

    try:
        if cache_key in cache_osrm:
            geometria_completa = cache_osrm[cache_key]
        else:
            geometria_completa = obtener_geometria_osrm(
                puntos_ruta,
            )
            cache_osrm[cache_key] = geometria_completa

            if perfil is not None:
                perfil["osrm_llamadas"] += 1
    except Exception:
        geometria_completa = [
            [
                float(punto["latitud"]),
                float(punto["longitud"]),
            ]
            for punto in puntos_ruta
        ]

    if not geometria_completa:
        raise Exception(
            "No se obtuvo geometría para la jornada planificada"
        )

    indices_waypoints = [0]
    indice_busqueda = 0

    for punto in puntos_ruta[1:]:
        indice_busqueda = _indice_waypoint_mas_cercano(
            geometria_completa,
            punto,
            indice_busqueda,
        )
        indices_waypoints.append(indice_busqueda)

    # OSRM debe terminar en el último waypoint. Se fuerza el último índice
    # para evitar que la bodega inicial sea elegida al buscar el retorno.
    indices_waypoints[-1] = len(geometria_completa) - 1

    tramos = []

    for indice in range(len(puntos_ruta) - 1):
        origen = puntos_ruta[indice]
        destino = puntos_ruta[indice + 1]
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
            "desde_indice": indices_waypoints[indice],
            "hasta_indice": indices_waypoints[indice + 1],
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
    matriz,
    caminos,
    velocidad_kmh,
    cache_osrm=None,
    perfil=None,
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
            distancia_entre_matriz(
                matriz,
                caminos,
            )(
                None,
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

    _, distancia_regreso = distancia_entre_matriz(
        matriz,
        caminos,
    )(
        None,
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
        cache_osrm=cache_osrm,
        perfil=perfil,
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
    perfil = crear_perfil()
    inicio_total = time.perf_counter()
    bodega = datos["bodega"]
    pedidos = datos["pedidos"]
    camiones = datos["camiones"]
    perfil["pedidos_total"] = len(pedidos)

    velocidad_kmh = float(
        datos.get(
            "velocidad_kmh",
            40,
        )
    )

    if velocidad_kmh <= 0 or not math.isfinite(velocidad_kmh):
        raise LogisticaError(
            "INVALID_INPUT",
            "La velocidad debe ser mayor a cero",
            {"velocidad_kmh": velocidad_kmh},
        )

    if not pedidos:
        resultado = {
            "jornadas": [],
            "pedidos_no_asignados": [],
        }

        if datos.get("benchmark"):
            resultado["perfil"] = perfil

        return resultado

    if not camiones:
        resultado = {
            "jornadas": [],
            "pedidos_no_asignados": [
                pedido["pedido_id"]
                for pedido in pedidos
            ],
        }

        if datos.get("benchmark"):
            resultado["perfil"] = perfil

        return resultado

    destinos_unicos = sorted({
        int(pedido["destino_id"])
        for pedido in pedidos
    })
    perfil["destinos_unicos"] = len(destinos_unicos)

    matriz, caminos = construir_matriz_distancias(
        grafo,
        [
            int(bodega["id"]),
            *destinos_unicos,
        ],
        perfil=perfil,
    )

    pedidos_alcanzables, no_asignados_detalle = (
        filtrar_pedidos_alcanzables(
            pedidos,
            int(bodega["id"]),
            matriz,
        )
    )

    if not pedidos_alcanzables:
        resultado = {
            "jornadas": [],
            "pedidos_no_asignados": [
                item["pedido_id"]
                for item in no_asignados_detalle
            ],
            "pedidos_no_asignados_detalle":
                no_asignados_detalle,
        }

        if datos.get("benchmark"):
            perfil["tiempo_total"] = (
                time.perf_counter() - inicio_total
            )
            resultado["perfil"] = perfil

        return resultado

    distancia_cache = distancia_entre_matriz(
        matriz,
        caminos,
    )

    aco_config = datos.get("aco") or {}
    max_jornada_min = int(
        datos.get("max_jornada_min", 600)
    )
    tiempo_servicio_por_entrega_min = float(
        datos.get(
            "tiempo_servicio_por_entrega_min",
            10,
        )
    )
    margen_operativo_porcentaje = float(
        datos.get(
            "margen_operativo_porcentaje",
            15,
        )
    )

    solucion = ant_colony_cvrp(
        grafo=grafo,
        bodega_id=int(bodega["id"]),
        pedidos=pedidos_alcanzables,
        camiones=camiones,
        distancia_entre=distancia_cache,
        num_hormigas=aco_config.get("num_hormigas"),
        iteraciones=aco_config.get("iteraciones"),
        iteraciones_sin_mejora=aco_config.get(
            "iteraciones_sin_mejora",
        ),
        alfa=aco_config.get("alfa") or 1.0,
        beta=aco_config.get("beta") or 3.0,
        evaporacion=(
            aco_config.get("evaporacion") or 0.35
        ),
        q=aco_config.get("q") or 100.0,
        semilla=(
            aco_config.get("semilla") or
            datos.get("semilla")
        ),
        max_segundos=(
            aco_config.get("max_segundos") or 0.25
        ),
        velocidad_kmh=velocidad_kmh,
        max_jornada_min=max_jornada_min,
        tiempo_servicio_por_entrega_min=(
            tiempo_servicio_por_entrega_min
        ),
        margen_operativo_porcentaje=(
            margen_operativo_porcentaje
        ),
        perfil=perfil,
    )

    jornadas = []
    cache_osrm = {}

    for asignacion in solucion[
        "asignaciones"
    ]:
        jornada = generar_jornada_individual(
            asignacion=asignacion,
            bodega=bodega,
            matriz=matriz,
            caminos=caminos,
            velocidad_kmh=velocidad_kmh,
            cache_osrm=cache_osrm,
            perfil=perfil,
        )

        if jornada is not None:
            jornadas.append(jornada)

    pedidos_no_asignados = [
        pedido["pedido_id"]
        for pedido in solucion[
            "pedidos_no_asignados"
        ]
    ]

    pedidos_no_asignados.extend(
        item["pedido_id"]
        for item in no_asignados_detalle
    )

    pedidos_no_asignados = list(dict.fromkeys(
        pedidos_no_asignados,
    ))

    resultado = {
        "jornadas": jornadas,
        "pedidos_no_asignados": (
            pedidos_no_asignados
        ),
        "pedidos_no_asignados_detalle":
            no_asignados_detalle,
    }

    if datos.get("benchmark"):
        perfil["tiempo_total"] = (
            time.perf_counter() - inicio_total
        )
        resultado["perfil"] = perfil

    return resultado
