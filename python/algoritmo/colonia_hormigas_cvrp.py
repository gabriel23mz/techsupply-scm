import math
import random
import time
from collections import defaultdict


PENALIZACION_ARISTA_REPETIDA = 25
PENALIZACION_DESTINO_DIVIDIDO = 100
PENALIZACION_PEDIDO_NO_ASIGNADO = 10_000
DEFAULT_NUM_HORMIGAS_MIN = 8
DEFAULT_NUM_HORMIGAS_MAX = 25
DEFAULT_ITERACIONES_MIN = 18
DEFAULT_ITERACIONES_MAX = 70
DEFAULT_ITERACIONES_SIN_MEJORA = 12


def obtener_distancia(
    grafo,
    origen,
    destino,
    distancia_entre,
):
    if int(origen) == int(destino):
        return 0.0

    _, distancia = distancia_entre(
        grafo,
        int(origen),
        int(destino),
    )

    if math.isinf(distancia):
        return float("inf")

    return float(distancia)


def agrupar_pedidos_por_destino(pedidos):
    grupos = {}

    for pedido in pedidos:
        destino_id = int(pedido["destino_id"])

        if destino_id not in grupos:
            grupos[destino_id] = {
                "destino_id": destino_id,
                "ubicacion": pedido["ubicacion"],
                "latitud": float(pedido["latitud"]),
                "longitud": float(pedido["longitud"]),
                "pedidos": [],
                "demanda": 0,
            }

        grupos[destino_id]["pedidos"].append(pedido)
        grupos[destino_id]["demanda"] += 1

    return list(grupos.values())


def validar_camiones(camiones):
    camiones_validos = []

    for camion in camiones:
        capacidad = camion.get("capacidad")

        if capacidad is None:
            continue

        capacidad = int(capacidad)

        if capacidad <= 0:
            continue

        camiones_validos.append({
            **camion,
            "capacidad": capacidad,
        })

    if not camiones_validos:
        raise Exception(
            "No existen camiones con capacidad válida"
        )

    return camiones_validos


def fragmentar_grupos(grupos, capacidad_maxima):
    """
    Una ubicación se conserva completa siempre que sea posible.

    Solo se divide cuando la cantidad de pedidos de esa ubicación
    supera la capacidad máxima de cualquier camión.
    """

    fragmentos = []

    for grupo in grupos:
        pedidos = grupo["pedidos"]

        if len(pedidos) <= capacidad_maxima:
            fragmentos.append({
                **grupo,
                "fragmento_id": (
                    f'{grupo["destino_id"]}-1'
                ),
            })
            continue

        numero_fragmento = 1

        for indice in range(
            0,
            len(pedidos),
            capacidad_maxima,
        ):
            pedidos_fragmento = pedidos[
                indice:indice + capacidad_maxima
            ]

            fragmentos.append({
                **grupo,
                "pedidos": pedidos_fragmento,
                "demanda": len(pedidos_fragmento),
                "fragmento_id": (
                    f'{grupo["destino_id"]}-'
                    f'{numero_fragmento}'
                ),
            })

            numero_fragmento += 1

    return fragmentos


def seleccionar_elemento_ponderado(candidatos, rng):
    suma = sum(
        peso
        for _, peso in candidatos
        if peso > 0
    )

    if suma <= 0:
        return rng.choice(
            [elemento for elemento, _ in candidatos]
        )

    valor = rng.uniform(0, suma)
    acumulado = 0

    for elemento, peso in candidatos:
        acumulado += max(peso, 0)

        if acumulado >= valor:
            return elemento

    return candidatos[-1][0]


def construir_solucion_hormiga(
    grafo,
    bodega_id,
    grupos,
    camiones,
    distancia_entre,
    feromonas,
    alfa,
    beta,
    rng,
    camiones_ordenados=None,
):
    pendientes = [grupo.copy() for grupo in grupos]

    asignaciones = []
    aristas_usadas_globalmente = defaultdict(int)

    if camiones_ordenados is None:
        # Los camiones con mayor capacidad se consideran primero.
        camiones_ordenados = sorted(
            camiones,
            key=lambda camion: int(camion["capacidad"]),
            reverse=True,
        )

    for camion in camiones_ordenados:
        capacidad = int(camion["capacidad"])
        capacidad_restante = capacidad

        pedidos_asignados = []
        destinos_ordenados = []
        destinos_en_camion = set()

        actual = int(bodega_id)

        while pendientes:
            candidatos_factibles = [
                grupo
                for grupo in pendientes
                if int(grupo["demanda"])
                <= capacidad_restante
            ]

            if not candidatos_factibles:
                break

            candidatos_ponderados = []

            for grupo in candidatos_factibles:
                destino = int(grupo["destino_id"])

                distancia = obtener_distancia(
                    grafo,
                    actual,
                    destino,
                    distancia_entre,
                )

                if math.isinf(distancia):
                    peso = 0
                else:
                    clave_feromona = (
                        int(camion["id"]),
                        actual,
                        destino,
                    )

                    feromona = feromonas.get(
                        clave_feromona,
                        1.0,
                    )

                    # Si ya estamos en el destino, favorecemos
                    # añadir el resto de pedidos del mismo lugar.
                    if distancia == 0:
                        visibilidad = 10.0
                    else:
                        visibilidad = 1.0 / distancia

                    clave_arista = tuple(
                        sorted((actual, destino))
                    )

                    repeticiones = (
                        aristas_usadas_globalmente[
                            clave_arista
                        ]
                    )

                    penalizacion_solapamiento = (
                        1.0 / (1.0 + repeticiones)
                    )

                    # Favorece mantener juntos los pedidos
                    # de una misma ubicación.
                    bono_mismo_destino = (
                        2.0
                        if destino in destinos_en_camion
                        else 1.0
                    )

                    peso = (
                        (feromona ** alfa)
                        * (visibilidad ** beta)
                        * penalizacion_solapamiento
                        * bono_mismo_destino
                    )

                candidatos_ponderados.append(
                    (grupo, peso)
                )

            seleccionado = seleccionar_elemento_ponderado(
                candidatos_ponderados,
                rng,
            )

            destino = int(
                seleccionado["destino_id"]
            )

            pedidos_asignados.extend(
                seleccionado["pedidos"]
            )

            if destino not in destinos_en_camion:
                destinos_ordenados.append({
                    "destino_id": destino,
                    "ubicacion": seleccionado["ubicacion"],
                    "latitud": seleccionado["latitud"],
                    "longitud": seleccionado["longitud"],
                })

                destinos_en_camion.add(destino)

            capacidad_restante -= int(
                seleccionado["demanda"]
            )

            if actual != destino:
                clave_arista = tuple(
                    sorted((actual, destino))
                )

                aristas_usadas_globalmente[
                    clave_arista
                ] += 1

            actual = destino
            pendientes.remove(seleccionado)

        if pedidos_asignados:
            asignaciones.append({
                "camion": camion,
                "pedidos": pedidos_asignados,
                "destinos_ordenados": destinos_ordenados,
                "capacidad_utilizada": len(
                    pedidos_asignados
                ),
                "capacidad_disponible": capacidad_restante,
            })

    pedidos_no_asignados = []

    for grupo in pendientes:
        pedidos_no_asignados.extend(
            grupo["pedidos"]
        )

    return {
        "asignaciones": asignaciones,
        "pedidos_no_asignados": pedidos_no_asignados,
    }


def obtener_aristas_asignacion(
    bodega_id,
    destinos_ordenados,
):
    aristas = []
    actual = int(bodega_id)

    for destino in destinos_ordenados:
        destino_id = int(destino["destino_id"])

        if actual != destino_id:
            aristas.append(
                tuple(sorted((actual, destino_id)))
            )

        actual = destino_id

    if destinos_ordenados and actual != int(bodega_id):
        aristas.append(
            tuple(sorted((actual, int(bodega_id))))
        )

    return aristas


def calcular_distancia_asignacion(
    grafo,
    bodega_id,
    destinos_ordenados,
    distancia_entre,
):
    if not destinos_ordenados:
        return 0.0

    total = 0.0
    actual = int(bodega_id)

    for destino in destinos_ordenados:
        destino_id = int(destino["destino_id"])

        distancia = obtener_distancia(
            grafo,
            actual,
            destino_id,
            distancia_entre,
        )

        if math.isinf(distancia):
            return float("inf")

        total += distancia
        actual = destino_id

    regreso = obtener_distancia(
        grafo,
        actual,
        int(bodega_id),
        distancia_entre,
    )

    if math.isinf(regreso):
        return float("inf")

    return total + regreso


def calcular_costo_solucion(
    solucion,
    grafo,
    bodega_id,
    distancia_entre,
):
    distancia_total = 0.0

    conteo_aristas = defaultdict(int)
    conteo_destinos = defaultdict(int)

    for asignacion in solucion["asignaciones"]:
        destinos = asignacion["destinos_ordenados"]

        distancia = calcular_distancia_asignacion(
            grafo,
            bodega_id,
            destinos,
            distancia_entre,
        )

        if math.isinf(distancia):
            return float("inf")

        distancia_total += distancia

        for arista in obtener_aristas_asignacion(
            bodega_id,
            destinos,
        ):
            conteo_aristas[arista] += 1

        for destino in destinos:
            conteo_destinos[
                int(destino["destino_id"])
            ] += 1

    aristas_repetidas = sum(
        cantidad - 1
        for cantidad in conteo_aristas.values()
        if cantidad > 1
    )

    destinos_divididos = sum(
        cantidad - 1
        for cantidad in conteo_destinos.values()
        if cantidad > 1
    )

    no_asignados = len(
        solucion["pedidos_no_asignados"]
    )

    return (
        distancia_total
        + (
            aristas_repetidas
            * PENALIZACION_ARISTA_REPETIDA
        )
        + (
            destinos_divididos
            * PENALIZACION_DESTINO_DIVIDIDO
        )
        + (
            no_asignados
            * PENALIZACION_PEDIDO_NO_ASIGNADO
        )
    )


def resolver_parametros(
    total_destinos,
    num_hormigas=None,
    iteraciones=None,
    iteraciones_sin_mejora=None,
):
    hormigas_default = min(
        DEFAULT_NUM_HORMIGAS_MAX,
        max(
            DEFAULT_NUM_HORMIGAS_MIN,
            total_destinos * 2,
        ),
    )

    iteraciones_default = min(
        DEFAULT_ITERACIONES_MAX,
        max(
            DEFAULT_ITERACIONES_MIN,
            total_destinos * 4,
        ),
    )

    return {
        "num_hormigas": int(num_hormigas or hormigas_default),
        "iteraciones": int(iteraciones or iteraciones_default),
        "iteraciones_sin_mejora": int(
            iteraciones_sin_mejora or
            DEFAULT_ITERACIONES_SIN_MEJORA
        ),
    }


def evaporar_feromonas(
    feromonas,
    evaporacion,
):
    for clave in list(feromonas.keys()):
        feromonas[clave] *= (
            1.0 - evaporacion
        )

        # Evita que la feromona llegue a cero.
        feromonas[clave] = max(
            feromonas[clave],
            0.0001,
        )


def depositar_feromonas(
    solucion,
    costo,
    feromonas,
    bodega_id,
    q,
):
    if math.isinf(costo) or costo <= 0:
        return

    deposito = q / costo

    for asignacion in solucion["asignaciones"]:
        camion_id = int(
            asignacion["camion"]["id"]
        )

        actual = int(bodega_id)

        for destino in asignacion[
            "destinos_ordenados"
        ]:
            destino_id = int(
                destino["destino_id"]
            )

            clave = (
                camion_id,
                actual,
                destino_id,
            )

            feromonas[clave] = (
                feromonas.get(clave, 1.0)
                + deposito
            )

            actual = destino_id

        if actual != int(bodega_id):
            clave_regreso = (
                camion_id,
                actual,
                int(bodega_id),
            )

            feromonas[clave_regreso] = (
                feromonas.get(
                    clave_regreso,
                    1.0,
                )
                + deposito
            )


def ant_colony_cvrp(  
    grafo,
    bodega_id,
    pedidos,
    camiones,
    distancia_entre,
    num_hormigas=25,
    iteraciones=70,
    alfa=1.0,
    beta=3.0,
    evaporacion=0.35,
    q=100.0,
    semilla=None,
    iteraciones_sin_mejora=None,
    max_segundos=None,
    perfil=None,
):
    if not pedidos:
        return {
            "asignaciones": [],
            "pedidos_no_asignados": [],
        }

    camiones_validos = validar_camiones(
        camiones
    )

    capacidad_maxima = max(
        int(camion["capacidad"])
        for camion in camiones_validos
    )

    grupos = agrupar_pedidos_por_destino(
        pedidos
    )

    grupos = fragmentar_grupos(
        grupos,
        capacidad_maxima,
    )

    parametros = resolver_parametros(
        total_destinos=len(grupos),
        num_hormigas=num_hormigas,
        iteraciones=iteraciones,
        iteraciones_sin_mejora=iteraciones_sin_mejora,
    )

    num_hormigas = parametros["num_hormigas"]
    iteraciones = parametros["iteraciones"]
    iteraciones_sin_mejora = parametros[
        "iteraciones_sin_mejora"
    ]

    rng = random.Random(semilla)
    camiones_ordenados = sorted(
        camiones_validos,
        key=lambda camion: int(camion["capacidad"]),
        reverse=True,
    )

    feromonas = {}

    mejor_solucion = None
    mejor_costo = float("inf")
    sin_mejora = 0
    iteraciones_ejecutadas = 0
    inicio = time.perf_counter()

    for _ in range(iteraciones):
        soluciones_iteracion = []
        iteraciones_ejecutadas += 1

        for _ in range(num_hormigas):
            solucion = construir_solucion_hormiga(
                grafo=grafo,
                bodega_id=int(bodega_id),
                grupos=grupos,
                camiones=camiones_validos,
                distancia_entre=distancia_entre,
                feromonas=feromonas,
                alfa=alfa,
                beta=beta,
                rng=rng,
                camiones_ordenados=camiones_ordenados,
            )

            costo = calcular_costo_solucion(
                solucion=solucion,
                grafo=grafo,
                bodega_id=int(bodega_id),
                distancia_entre=distancia_entre,
            )

            soluciones_iteracion.append(
                (solucion, costo)
            )

            if costo < mejor_costo:
                mejor_costo = costo
                mejor_solucion = solucion
                sin_mejora = 0

        evaporar_feromonas(
            feromonas,
            evaporacion,
        )

        soluciones_ordenadas = sorted(
            soluciones_iteracion,
            key=lambda item: item[1],
        )

        # Refuerza las mejores soluciones de cada iteración.
        for solucion, costo in soluciones_ordenadas[:5]:
            depositar_feromonas(
                solucion=solucion,
                costo=costo,
                feromonas=feromonas,
                bodega_id=int(bodega_id),
                q=q,
            )

        if mejor_solucion is not None:
            sin_mejora += 1

        if sin_mejora >= iteraciones_sin_mejora:
            break

        if (
            max_segundos is not None and
            time.perf_counter() - inicio >= max_segundos
        ):
            break

    if mejor_solucion is None:
        raise Exception(
            "La colonia de hormigas CVRP no pudo "
            "construir una solución válida"
        )

    if perfil is not None:
        perfil["aco_iteraciones"] = iteraciones_ejecutadas
        perfil["aco_hormigas"] = num_hormigas
        perfil["aco_mejor_costo"] = mejor_costo

    return mejor_solucion

