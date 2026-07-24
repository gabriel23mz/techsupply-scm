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


def construir_geometria_y_tramos(
    bodega,
    destinos_ordenados,
    cache_osrm=None,
    perfil=None,
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
    cache_osrm = cache_osrm if cache_osrm is not None else {}

    for indice in range(len(puntos_ruta) - 1):
        origen = puntos_ruta[indice]
        destino = puntos_ruta[indice + 1]
        cache_key = (
            round(float(origen["latitud"]), 7),
            round(float(origen["longitud"]), 7),
            round(float(destino["latitud"]), 7),
            round(float(destino["longitud"]), 7),
        )

        try:
            if cache_key in cache_osrm:
                geometria_tramo = cache_osrm[cache_key]
            else:
                geometria_tramo = obtener_geometria_osrm([
                    origen,
                    destino,
                ])
                cache_osrm[cache_key] = geometria_tramo

                if perfil is not None:
                    perfil["osrm_llamadas"] += 1
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
        alfa=aco_config.get("alfa", 1.0),
        beta=aco_config.get("beta", 3.0),
        evaporacion=aco_config.get("evaporacion", 0.35),
        q=aco_config.get("q", 100.0),
        semilla=(
            aco_config.get("semilla") or
            datos.get("semilla")
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

    
