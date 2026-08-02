import math
import random
import time
import copy
from collections import defaultdict


PENALIZACION_ARISTA_REPETIDA = 25
PENALIZACION_DESTINO_DIVIDIDO = 100
PENALIZACION_PEDIDO_NO_ASIGNADO = 10_000
DEFAULT_NUM_HORMIGAS_MIN = 8
DEFAULT_NUM_HORMIGAS_MAX = 25
DEFAULT_ITERACIONES_MIN = 18
DEFAULT_ITERACIONES_MAX = 70
DEFAULT_ITERACIONES_SIN_MEJORA = 10
DEFAULT_MAX_JORNADA_MIN = 600
DEFAULT_TIEMPO_SERVICIO_MIN = 10
DEFAULT_MARGEN_OPERATIVO_PORCENTAJE = 15
DEFAULT_MAX_SEGUNDOS_ACO = 0.25
MAX_SOLUCIONES_ACO = 500
PENALIZACION_EXCESO_JORNADA = 12
PENALIZACION_DESBALANCE = 0.35
PENALIZACION_MAKESPAN = 0.55
PENALIZACION_CAMION_OBJETIVO_FALTANTE = 5_000
PENALIZACION_VEHICULO_ABIERTO = 2_500
PENALIZACION_BAJA_OCUPACION = 800
PENALIZACION_DISPERSION = 0.45
PENALIZACION_JORNADA_EXTENSA = 0.25
UMBRAL_BAJA_OCUPACION = 0.50
MULTI_START_MAX_REINICIOS = 3
BUSQUEDA_LOCAL_MAX_PASADAS = 3


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


def calcular_duracion_operativa_min(
    distancia_km,
    velocidad_kmh,
    total_entregas,
    tiempo_servicio_por_entrega_min,
    margen_operativo_porcentaje,
):
    tiempo_viaje = (
        float(distancia_km)
        / float(velocidad_kmh)
    ) * 60
    tiempo_servicio = (
        int(total_entregas)
        * float(tiempo_servicio_por_entrega_min)
    )
    margen = 1 + (
        float(margen_operativo_porcentaje)
        / 100
    )

    return (
        tiempo_viaje + tiempo_servicio
    ) * margen


def estimar_distancia_ruta_unica(
    grafo,
    bodega_id,
    grupos,
    distancia_entre,
):
    destinos_pendientes = {
        int(grupo["destino_id"])
        for grupo in grupos
    }
    actual = int(bodega_id)
    total = 0.0

    while destinos_pendientes:
        candidatos = []

        for destino in destinos_pendientes:
            distancia = obtener_distancia(
                grafo,
                actual,
                destino,
                distancia_entre,
            )

            if math.isfinite(distancia):
                candidatos.append((distancia, destino))

        if not candidatos:
            return float("inf")

        distancia, destino = min(candidatos)
        total += distancia
        actual = destino
        destinos_pendientes.remove(destino)

    regreso = obtener_distancia(
        grafo,
        actual,
        int(bodega_id),
        distancia_entre,
    )

    if math.isinf(regreso):
        return float("inf")

    return total + regreso


def calcular_camiones_objetivo(
    grafo,
    bodega_id,
    grupos,
    camiones,
    distancia_entre,
    velocidad_kmh,
    max_jornada_min,
    tiempo_servicio_por_entrega_min,
    margen_operativo_porcentaje,
):
    camiones_ordenados = sorted(
        camiones,
        key=lambda camion: (
            -int(camion["capacidad"]),
            int(camion["id"]),
        ),
    )
    total_demanda = sum(
        int(grupo["demanda"])
        for grupo in grupos
    )
    maximo_util = min(
        len(camiones_ordenados),
        len(grupos),
        total_demanda,
    )

    acumulado = 0
    minimo_por_capacidad = 0

    for camion in camiones_ordenados:
        acumulado += int(camion["capacidad"])
        minimo_por_capacidad += 1

        if acumulado >= total_demanda:
            break

    distancia_base = estimar_distancia_ruta_unica(
        grafo,
        bodega_id,
        grupos,
        distancia_entre,
    )

    if math.isfinite(distancia_base):
        duracion_base = calcular_duracion_operativa_min(
            distancia_base,
            velocidad_kmh,
            total_demanda,
            tiempo_servicio_por_entrega_min,
            margen_operativo_porcentaje,
        )
    else:
        duracion_base = float("inf")

    if (
        math.isfinite(duracion_base)
        and float(max_jornada_min) > 0
    ):
        minimo_por_duracion = max(
            1,
            math.ceil(
                duracion_base
                / float(max_jornada_min)
            ),
        )
    else:
        minimo_por_duracion = maximo_util

    cantidad_objetivo = min(
        maximo_util,
        max(
            1,
            minimo_por_capacidad,
            minimo_por_duracion,
        ),
    )

    while (
        cantidad_objetivo < maximo_util
        and sum(
            int(camion["capacidad"])
            for camion in camiones_ordenados[
                :cantidad_objetivo
            ]
        ) < total_demanda
    ):
        cantidad_objetivo += 1

    return {
        "camiones": camiones_ordenados[
            :cantidad_objetivo
        ],
        "cantidad": cantidad_objetivo,
        "minimo_por_capacidad": minimo_por_capacidad,
        "maximo_operativo": cantidad_objetivo,
        "camiones_ordenados": camiones_ordenados,
        "distancia_base_km": distancia_base,
        "duracion_base_min": duracion_base,
    }


def calcular_objetivos_carga(
    total_demanda,
    camiones,
):
    restantes = int(total_demanda)
    objetivos = {}
    camiones_ascendentes = sorted(
        camiones,
        key=lambda camion: (
            int(camion["capacidad"]),
            int(camion["id"]),
        ),
    )

    for indice, camion in enumerate(
        camiones_ascendentes
    ):
        pendientes = len(camiones_ascendentes) - indice
        ideal = math.ceil(restantes / pendientes)
        objetivo = min(
            int(camion["capacidad"]),
            ideal,
        )
        objetivos[int(camion["id"])] = max(
            1,
            objetivo,
        )
        restantes -= objetivo

    return objetivos


def _crear_estado_camion(camion, objetivo):
    return {
        "camion": camion,
        "objetivo_carga": max(1, int(objetivo)),
        "capacidad_restante": int(camion["capacidad"]),
        "pedidos": [],
        "destinos_ordenados": [],
        "destinos": set(),
        "actual": None,
    }


def _asignar_grupo(
    estado,
    grupo,
    bodega_id,
    aristas_usadas_globalmente,
):
    destino = int(grupo["destino_id"])
    actual = (
        int(estado["actual"])
        if estado["actual"] is not None
        else int(bodega_id)
    )

    estado["pedidos"].extend(grupo["pedidos"])

    if destino not in estado["destinos"]:
        estado["destinos_ordenados"].append({
            "destino_id": destino,
            "ubicacion": grupo["ubicacion"],
            "latitud": grupo["latitud"],
            "longitud": grupo["longitud"],
        })
        estado["destinos"].add(destino)

    estado["capacidad_restante"] -= int(
        grupo["demanda"]
    )

    if actual != destino:
        aristas_usadas_globalmente[
            tuple(sorted((actual, destino)))
        ] += 1

    estado["actual"] = destino


def _conteo_camiones_factibles(grupo, estados):
    demanda = int(grupo["demanda"])

    return sum(
        1
        for estado in estados
        if demanda <= estado["capacidad_restante"]
    )


def _seleccionar_semilla(
    grafo,
    bodega_id,
    pendientes,
    estado,
    estados,
    semillas,
    distancia_entre,
    rng,
):
    candidatos = []

    for grupo in pendientes:
        demanda = int(grupo["demanda"])

        if demanda > estado["capacidad_restante"]:
            continue

        destino = int(grupo["destino_id"])

        if semillas:
            separacion = min(
                obtener_distancia(
                    grafo,
                    int(semilla["destino_id"]),
                    destino,
                    distancia_entre,
                )
                for semilla in semillas
            )
        else:
            separacion = obtener_distancia(
                grafo,
                int(bodega_id),
                destino,
                distancia_entre,
            )

        if not math.isfinite(separacion):
            continue

        factibles = max(
            1,
            _conteo_camiones_factibles(
                grupo,
                estados,
            ),
        )
        escasez = (
            len(estados) / factibles
        ) ** 2
        peso = (
            (separacion + 1.0)
            * (1.0 + demanda)
            * escasez
        )
        candidatos.append((grupo, peso))

    if not candidatos:
        return None

    return seleccionar_elemento_ponderado(
        candidatos,
        rng,
    )


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
    objetivos_carga=None,
    velocidad_kmh=40,
    max_jornada_min=DEFAULT_MAX_JORNADA_MIN,
    tiempo_servicio_por_entrega_min=(
        DEFAULT_TIEMPO_SERVICIO_MIN
    ),
    margen_operativo_porcentaje=(
        DEFAULT_MARGEN_OPERATIVO_PORCENTAJE
    ),
):
    pendientes = [grupo.copy() for grupo in grupos]
    aristas_usadas_globalmente = defaultdict(int)
    objetivos_carga = objetivos_carga or {}
    estados = [
        _crear_estado_camion(
            camion,
            objetivos_carga.get(
                int(camion["id"]),
                int(camion["capacidad"]),
            ),
        )
        for camion in camiones
    ]

    # Una semilla geográficamente separada por camión evita
    # que toda la demanda termine concentrada en una sola ruta.
    semillas = []

    for estado in estados:
        if not pendientes:
            break

        semilla = _seleccionar_semilla(
            grafo,
            bodega_id,
            pendientes,
            estado,
            estados,
            semillas,
            distancia_entre,
            rng,
        )

        if semilla is None:
            continue

        _asignar_grupo(
            estado,
            semilla,
            bodega_id,
            aristas_usadas_globalmente,
        )
        semillas.append(semilla)
        pendientes.remove(semilla)

    while pendientes:
        estados_factibles = []

        for estado in estados:
            candidatos = [
                grupo
                for grupo in pendientes
                if int(grupo["demanda"])
                <= estado["capacidad_restante"]
            ]

            if candidatos:
                carga = len(estado["pedidos"])
                distancia_actual = calcular_distancia_asignacion(
                    grafo,
                    bodega_id,
                    estado["destinos_ordenados"],
                    distancia_entre,
                )
                duracion_actual = calcular_duracion_operativa_min(
                    distancia_actual,
                    velocidad_kmh,
                    carga,
                    tiempo_servicio_por_entrega_min,
                    margen_operativo_porcentaje,
                )
                ratio_duracion = (
                    duracion_actual / float(max_jornada_min)
                    if float(max_jornada_min) > 0
                    else duracion_actual
                )
                ratio_carga = (
                    carga / estado["objetivo_carga"]
                )
                prioridad = (
                    ratio_duracion
                    + ratio_carga * 0.15
                )
                estados_factibles.append(
                    (estado, candidatos, prioridad)
                )

        if not estados_factibles:
            break

        ratio_minimo = min(
            item[2]
            for item in estados_factibles
        )
        estados_equilibrados = [
            item
            for item in estados_factibles
            if item[2] <= ratio_minimo + 0.20
        ]
        estado, candidatos_factibles, _ = rng.choice(
            estados_equilibrados
        )
        actual = (
            int(estado["actual"])
            if estado["actual"] is not None
            else int(bodega_id)
        )
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
                    int(estado["camion"]["id"]),
                    actual,
                    destino,
                )
                feromona = feromonas.get(
                    clave_feromona,
                    1.0,
                )
                visibilidad = (
                    10.0
                    if distancia == 0
                    else 1.0 / distancia
                )
                repeticiones = aristas_usadas_globalmente[
                    tuple(sorted((actual, destino)))
                ]
                penalizacion_solapamiento = (
                    1.0 / (1.0 + repeticiones)
                )
                factibles = max(
                    1,
                    _conteo_camiones_factibles(
                        grupo,
                        estados,
                    ),
                )
                bono_escasez = (
                    len(estados) / factibles
                )
                carga_proyectada = (
                    len(estado["pedidos"])
                    + int(grupo["demanda"])
                )
                exceso_objetivo = max(
                    0,
                    carga_proyectada
                    - estado["objetivo_carga"],
                )
                penalizacion_balance = (
                    1.0 / (1.0 + exceso_objetivo)
                )
                bono_mismo_destino = (
                    2.0
                    if destino in estado["destinos"]
                    else 1.0
                )
                peso = (
                    (feromona ** alfa)
                    * (visibilidad ** beta)
                    * penalizacion_solapamiento
                    * bono_escasez
                    * penalizacion_balance
                    * bono_mismo_destino
                )

            candidatos_ponderados.append(
                (grupo, peso)
            )

        seleccionado = seleccionar_elemento_ponderado(
            candidatos_ponderados,
            rng,
        )
        _asignar_grupo(
            estado,
            seleccionado,
            bodega_id,
            aristas_usadas_globalmente,
        )
        pendientes.remove(seleccionado)

    asignaciones = []

    for estado in estados:
        if not estado["pedidos"]:
            continue

        asignaciones.append({
            "camion": estado["camion"],
            "pedidos": estado["pedidos"],
            "destinos_ordenados": estado[
                "destinos_ordenados"
            ],
            "capacidad_utilizada": len(
                estado["pedidos"]
            ),
            "capacidad_disponible": estado[
                "capacidad_restante"
            ],
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


def calcular_dispersion_asignacion(
    grafo,
    destinos_ordenados,
    distancia_entre,
):
    destinos = [
        int(destino["destino_id"])
        for destino in destinos_ordenados
    ]

    if len(destinos) < 2:
        return 0.0

    dispersion = 0.0

    for indice, origen in enumerate(destinos):
        for destino in destinos[indice + 1:]:
            distancia = obtener_distancia(
                grafo,
                origen,
                destino,
                distancia_entre,
            )

            if math.isinf(distancia):
                return float("inf")

            dispersion = max(
                dispersion,
                distancia,
            )

    return dispersion


def calcular_metricas_solucion(
    solucion,
    grafo,
    bodega_id,
    distancia_entre,
    velocidad_kmh=40,
    max_jornada_min=DEFAULT_MAX_JORNADA_MIN,
    tiempo_servicio_por_entrega_min=(
        DEFAULT_TIEMPO_SERVICIO_MIN
    ),
    margen_operativo_porcentaje=(
        DEFAULT_MARGEN_OPERATIVO_PORCENTAJE
    ),
):
    distancia_total = 0.0
    distancia_maxima = 0.0
    dispersion_maxima = 0.0
    dispersion_total = 0.0
    duraciones = []
    violaciones_capacidad = 0
    exceso_capacidad = 0
    baja_ocupacion = 0
    pedidos_asignados = []

    for asignacion in solucion["asignaciones"]:
        pedidos = asignacion["pedidos"]
        capacidad = int(asignacion["camion"]["capacidad"])
        utilizados = len(pedidos)

        pedidos_asignados.extend(
            int(pedido["pedido_id"])
            for pedido in pedidos
        )

        if utilizados > capacidad:
            violaciones_capacidad += 1
            exceso_capacidad += utilizados - capacidad

        if (
            capacidad > 0 and
            utilizados / capacidad < UMBRAL_BAJA_OCUPACION
        ):
            baja_ocupacion += 1

        distancia = calcular_distancia_asignacion(
            grafo,
            bodega_id,
            asignacion["destinos_ordenados"],
            distancia_entre,
        )

        if math.isinf(distancia):
            return {
                "clave": (
                    float("inf"),
                ),
                "costo": float("inf"),
                "invalida": True,
            }

        dispersion = calcular_dispersion_asignacion(
            grafo,
            asignacion["destinos_ordenados"],
            distancia_entre,
        )

        if math.isinf(dispersion):
            return {
                "clave": (
                    float("inf"),
                ),
                "costo": float("inf"),
                "invalida": True,
            }

        distancia_total += distancia
        distancia_maxima = max(
            distancia_maxima,
            distancia,
        )
        dispersion_maxima = max(
            dispersion_maxima,
            dispersion,
        )
        dispersion_total += dispersion

        duraciones.append(
            calcular_duracion_operativa_min(
                distancia,
                velocidad_kmh,
                utilizados,
                tiempo_servicio_por_entrega_min,
                margen_operativo_porcentaje,
            )
        )

    duplicados = (
        len(pedidos_asignados)
        - len(set(pedidos_asignados))
    )
    no_asignados = len(
        solucion["pedidos_no_asignados"]
    )
    excesos_duracion = [
        max(0.0, duracion - float(max_jornada_min))
        for duracion in duraciones
    ]
    violaciones_duracion = sum(
        1
        for exceso in excesos_duracion
        if exceso > 0
    )
    exceso_duracion_total = sum(excesos_duracion)
    desbalance = (
        max(duraciones) - min(duraciones)
        if len(duraciones) > 1
        else 0.0
    )

    clave = (
        duplicados,
        violaciones_capacidad,
        no_asignados,
        round(exceso_duracion_total, 6),
        violaciones_duracion,
        len(solucion["asignaciones"]),
        round(distancia_total, 6),
        round(distancia_maxima, 6),
        round(dispersion_maxima, 6),
        baja_ocupacion,
        round(desbalance, 6),
        round(exceso_capacidad, 6),
        round(dispersion_total, 6),
    )
    costo = (
        duplicados * 1_000_000_000
        + violaciones_capacidad * 100_000_000
        + no_asignados * PENALIZACION_PEDIDO_NO_ASIGNADO
        + violaciones_duracion * 1_000_000
        + exceso_duracion_total * PENALIZACION_EXCESO_JORNADA
        + len(solucion["asignaciones"])
        * PENALIZACION_VEHICULO_ABIERTO
        + distancia_total
        + distancia_maxima * PENALIZACION_JORNADA_EXTENSA
        + dispersion_maxima * PENALIZACION_DISPERSION
        + baja_ocupacion * PENALIZACION_BAJA_OCUPACION
        + desbalance * PENALIZACION_DESBALANCE
    )

    return {
        "clave": clave,
        "costo": costo,
        "invalida": False,
        "duplicados": duplicados,
        "violaciones_capacidad": violaciones_capacidad,
        "no_asignados": no_asignados,
        "violaciones_duracion": violaciones_duracion,
        "vehiculos": len(solucion["asignaciones"]),
        "distancia_total": distancia_total,
        "distancia_maxima": distancia_maxima,
        "dispersion_maxima": dispersion_maxima,
        "baja_ocupacion": baja_ocupacion,
        "desbalance": desbalance,
        "exceso_duracion_total": exceso_duracion_total,
    }


def solucion_es_mejor(
    candidata,
    referencia,
):
    if referencia is None:
        return True

    return candidata["clave"] < referencia["clave"]


def calcular_costo_solucion(
    solucion,
    grafo,
    bodega_id,
    distancia_entre,
    velocidad_kmh=40,
    max_jornada_min=DEFAULT_MAX_JORNADA_MIN,
    tiempo_servicio_por_entrega_min=(
        DEFAULT_TIEMPO_SERVICIO_MIN
    ),
    margen_operativo_porcentaje=(
        DEFAULT_MARGEN_OPERATIVO_PORCENTAJE
    ),
    camiones_objetivo=None,
):
    metricas = calcular_metricas_solucion(
        solucion,
        grafo,
        bodega_id,
        distancia_entre,
        velocidad_kmh,
        max_jornada_min,
        tiempo_servicio_por_entrega_min,
        margen_operativo_porcentaje,
    )

    if metricas["invalida"]:
        return float("inf")

    faltantes_objetivo = max(
        0,
        int(camiones_objetivo or 0)
        - metricas["vehiculos"],
    )

    return (
        metricas["costo"]
        + faltantes_objetivo
        * PENALIZACION_CAMION_OBJETIVO_FALTANTE
    )

    distancia_total = 0.0
    duraciones = []
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
        duraciones.append(
            calcular_duracion_operativa_min(
                distancia,
                velocidad_kmh,
                len(asignacion["pedidos"]),
                tiempo_servicio_por_entrega_min,
                margen_operativo_porcentaje,
            )
        )

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
    exceso_jornada = sum(
        max(0.0, duracion - float(max_jornada_min))
        for duracion in duraciones
    )
    makespan = max(duraciones, default=0.0)
    desbalance = (
        max(duraciones) - min(duraciones)
        if len(duraciones) > 1
        else 0.0
    )
    faltantes_objetivo = max(
        0,
        int(camiones_objetivo or 0)
        - len(solucion["asignaciones"]),
    )

    return (
        distancia_total
        + aristas_repetidas
        * PENALIZACION_ARISTA_REPETIDA
        + destinos_divididos
        * PENALIZACION_DESTINO_DIVIDIDO
        + no_asignados
        * PENALIZACION_PEDIDO_NO_ASIGNADO
        + exceso_jornada
        * PENALIZACION_EXCESO_JORNADA
        + makespan
        * PENALIZACION_MAKESPAN
        + desbalance
        * PENALIZACION_DESBALANCE
        + faltantes_objetivo
        * PENALIZACION_CAMION_OBJETIVO_FALTANTE
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
    hormigas = int(num_hormigas or hormigas_default)
    iteraciones_default = min(
        DEFAULT_ITERACIONES_MAX,
        max(
            DEFAULT_ITERACIONES_MIN,
            total_destinos * 4,
        ),
    )
    iteraciones_resueltas = int(
        iteraciones or iteraciones_default
    )
    iteraciones_resueltas = min(
        iteraciones_resueltas,
        max(1, MAX_SOLUCIONES_ACO // hormigas),
    )

    return {
        "num_hormigas": hormigas,
        "iteraciones": iteraciones_resueltas,
        "iteraciones_sin_mejora": int(
            iteraciones_sin_mejora
            or DEFAULT_ITERACIONES_SIN_MEJORA
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


def normalizar_solucion(solucion):
    solucion["asignaciones"] = [
        asignacion
        for asignacion in solucion["asignaciones"]
        if asignacion["pedidos"]
    ]

    for asignacion in solucion["asignaciones"]:
        capacidad = int(
            asignacion["camion"]["capacidad"]
        )
        asignacion["capacidad_utilizada"] = len(
            asignacion["pedidos"]
        )
        asignacion["capacidad_disponible"] = (
            capacidad - len(asignacion["pedidos"])
        )

    return solucion


def pedidos_por_destino_asignacion(asignacion):
    grupos = defaultdict(list)

    for pedido in asignacion["pedidos"]:
        grupos[int(pedido["destino_id"])].append(
            pedido
        )

    return grupos


def reconstruir_asignacion(
    asignacion,
    destinos_ordenados,
    grupos,
):
    pedidos = []

    for destino in destinos_ordenados:
        destino_id = int(destino["destino_id"])
        pedidos.extend(
            grupos.get(destino_id, [])
        )

    asignacion["destinos_ordenados"] = [
        destino
        for destino in destinos_ordenados
        if grupos.get(int(destino["destino_id"]))
    ]
    asignacion["pedidos"] = pedidos
    capacidad = int(
        asignacion["camion"]["capacidad"]
    )
    asignacion["capacidad_utilizada"] = len(pedidos)
    asignacion["capacidad_disponible"] = (
        capacidad - len(pedidos)
    )


def buscar_mejor_orden_destinos(
    asignacion,
    grafo,
    bodega_id,
    distancia_entre,
):
    destinos = asignacion["destinos_ordenados"]
    mejor = destinos
    mejor_distancia = calcular_distancia_asignacion(
        grafo,
        bodega_id,
        mejor,
        distancia_entre,
    )

    for indice in range(len(destinos)):
        destino = destinos[indice]
        restantes = (
            destinos[:indice]
            + destinos[indice + 1:]
        )

        for posicion in range(len(restantes) + 1):
            candidato = (
                restantes[:posicion]
                + [destino]
                + restantes[posicion:]
            )
            distancia = calcular_distancia_asignacion(
                grafo,
                bodega_id,
                candidato,
                distancia_entre,
            )

            if distancia < mejor_distancia:
                mejor = candidato
                mejor_distancia = distancia

    return mejor


def validar_movimiento_local(
    candidata,
    metricas_candidata,
    pedidos_base,
    no_asignados_base,
):
    if metricas_candidata["invalida"]:
        return False

    if (
        metricas_candidata["duplicados"] > 0 or
        metricas_candidata["violaciones_capacidad"] > 0
    ):
        return False

    asignados = [
        int(pedido["pedido_id"])
        for asignacion in candidata["asignaciones"]
        for pedido in asignacion["pedidos"]
    ]
    no_asignados = [
        int(pedido["pedido_id"])
        for pedido in candidata["pedidos_no_asignados"]
    ]

    return (
        len(asignados) == len(pedidos_base)
        and set(asignados) == pedidos_base
        and set(no_asignados) == no_asignados_base
    )


def intentar_aceptar_movimiento(
    candidata,
    mejor,
    metricas_mejor,
    pedidos_base,
    no_asignados_base,
    grafo,
    bodega_id,
    distancia_entre,
    velocidad_kmh,
    max_jornada_min,
    tiempo_servicio_por_entrega_min,
    margen_operativo_porcentaje,
):
    normalizar_solucion(candidata)
    metricas_candidata = calcular_metricas_solucion(
        candidata,
        grafo,
        bodega_id,
        distancia_entre,
        velocidad_kmh,
        max_jornada_min,
        tiempo_servicio_por_entrega_min,
        margen_operativo_porcentaje,
    )

    if not validar_movimiento_local(
        candidata,
        metricas_candidata,
        pedidos_base,
        no_asignados_base,
    ):
        return mejor, metricas_mejor, False

    if not solucion_es_mejor(
        metricas_candidata,
        metricas_mejor,
    ):
        return mejor, metricas_mejor, False

    return candidata, metricas_candidata, True


def aplicar_2opt_solucion(
    solucion,
    metricas_solucion,
    contexto,
):
    for indice_asignacion, asignacion in enumerate(
        solucion["asignaciones"]
    ):
        destinos = asignacion["destinos_ordenados"]

        if len(destinos) < 3:
            continue

        for inicio in range(len(destinos) - 1):
            for fin in range(inicio + 2, len(destinos) + 1):
                if (
                    contexto["deadline"] is not None
                    and time.perf_counter()
                    >= contexto["deadline"]
                ):
                    return solucion, metricas_solucion, False

                candidata = copy.deepcopy(solucion)
                asignacion_candidata = (
                    candidata["asignaciones"][
                        indice_asignacion
                    ]
                )
                grupos = pedidos_por_destino_asignacion(
                    asignacion_candidata
                )
                destinos_candidatos = (
                    asignacion_candidata[
                        "destinos_ordenados"
                    ][:inicio]
                    + list(reversed(
                        asignacion_candidata[
                            "destinos_ordenados"
                        ][inicio:fin]
                    ))
                    + asignacion_candidata[
                        "destinos_ordenados"
                    ][fin:]
                )
                reconstruir_asignacion(
                    asignacion_candidata,
                    destinos_candidatos,
                    grupos,
                )
                solucion, metricas_solucion, aceptado = (
                    intentar_aceptar_movimiento(
                        candidata,
                        solucion,
                        metricas_solucion,
                        **contexto["validacion"],
                    )
                )

                if aceptado:
                    return solucion, metricas_solucion, True

    return solucion, metricas_solucion, False


def aplicar_relocate_solucion(
    solucion,
    metricas_solucion,
    contexto,
):
    asignaciones = solucion["asignaciones"]

    for origen in asignaciones:
        for destino in origen["destinos_ordenados"]:
            for destino_asignacion in asignaciones:
                if (
                    origen["camion"]["id"]
                    == destino_asignacion["camion"]["id"]
                ):
                    continue

                if (
                    contexto["deadline"] is not None
                    and time.perf_counter()
                    >= contexto["deadline"]
                ):
                    return solucion, metricas_solucion, False

                destino_id = int(destino["destino_id"])
                grupos_origen = (
                    pedidos_por_destino_asignacion(origen)
                )
                demanda = len(
                    grupos_origen[destino_id]
                )

                if (
                    len(destino_asignacion["pedidos"])
                    + demanda
                    > int(destino_asignacion["camion"]["capacidad"])
                ):
                    continue

                for posicion in range(
                    len(destino_asignacion[
                        "destinos_ordenados"
                    ]) + 1
                ):
                    candidata = copy.deepcopy(solucion)
                    origen_candidato = next(
                        asignacion
                        for asignacion in candidata[
                            "asignaciones"
                        ]
                        if int(asignacion["camion"]["id"])
                        == int(origen["camion"]["id"])
                    )
                    destino_candidato = next(
                        asignacion
                        for asignacion in candidata[
                            "asignaciones"
                        ]
                        if int(asignacion["camion"]["id"])
                        == int(destino_asignacion[
                            "camion"
                        ]["id"])
                    )
                    grupos_origen_candidato = (
                        pedidos_por_destino_asignacion(
                            origen_candidato
                        )
                    )
                    grupos_destino_candidato = (
                        pedidos_por_destino_asignacion(
                            destino_candidato
                        )
                    )
                    grupo = grupos_origen_candidato.pop(
                        destino_id
                    )
                    destinos_origen = [
                        item
                        for item in origen_candidato[
                            "destinos_ordenados"
                        ]
                        if int(item["destino_id"])
                        != destino_id
                    ]
                    destinos_destino = [
                        item
                        for item in destino_candidato[
                            "destinos_ordenados"
                        ]
                        if int(item["destino_id"])
                        != destino_id
                    ]
                    grupos_destino_candidato[
                        destino_id
                    ].extend(grupo)
                    destinos_destino.insert(
                        min(posicion, len(destinos_destino)),
                        destino,
                    )
                    reconstruir_asignacion(
                        origen_candidato,
                        destinos_origen,
                        grupos_origen_candidato,
                    )
                    reconstruir_asignacion(
                        destino_candidato,
                        destinos_destino,
                        grupos_destino_candidato,
                    )
                    mejor_orden = buscar_mejor_orden_destinos(
                        destino_candidato,
                        contexto["validacion"]["grafo"],
                        contexto["validacion"]["bodega_id"],
                        contexto["validacion"]["distancia_entre"],
                    )
                    reconstruir_asignacion(
                        destino_candidato,
                        mejor_orden,
                        grupos_destino_candidato,
                    )
                    solucion, metricas_solucion, aceptado = (
                        intentar_aceptar_movimiento(
                            candidata,
                            solucion,
                            metricas_solucion,
                            **contexto["validacion"],
                        )
                    )

                    if aceptado:
                        return solucion, metricas_solucion, True

    return solucion, metricas_solucion, False


def aplicar_swap_solucion(
    solucion,
    metricas_solucion,
    contexto,
):
    asignaciones = solucion["asignaciones"]

    for indice_a, asignacion_a in enumerate(asignaciones):
        for asignacion_b in asignaciones[indice_a + 1:]:
            for destino_a in asignacion_a["destinos_ordenados"]:
                for destino_b in asignacion_b["destinos_ordenados"]:
                    if (
                        contexto["deadline"] is not None
                        and time.perf_counter()
                        >= contexto["deadline"]
                    ):
                        return solucion, metricas_solucion, False

                    destino_a_id = int(
                        destino_a["destino_id"]
                    )
                    destino_b_id = int(
                        destino_b["destino_id"]
                    )
                    grupos_a = pedidos_por_destino_asignacion(
                        asignacion_a
                    )
                    grupos_b = pedidos_por_destino_asignacion(
                        asignacion_b
                    )
                    demanda_a = len(grupos_a[destino_a_id])
                    demanda_b = len(grupos_b[destino_b_id])
                    carga_a = (
                        len(asignacion_a["pedidos"])
                        - demanda_a
                        + demanda_b
                    )
                    carga_b = (
                        len(asignacion_b["pedidos"])
                        - demanda_b
                        + demanda_a
                    )

                    if (
                        carga_a > int(asignacion_a[
                            "camion"
                        ]["capacidad"])
                        or carga_b > int(asignacion_b[
                            "camion"
                        ]["capacidad"])
                    ):
                        continue

                    candidata = copy.deepcopy(solucion)
                    candidata_a = next(
                        asignacion
                        for asignacion in candidata[
                            "asignaciones"
                        ]
                        if int(asignacion["camion"]["id"])
                        == int(asignacion_a["camion"]["id"])
                    )
                    candidata_b = next(
                        asignacion
                        for asignacion in candidata[
                            "asignaciones"
                        ]
                        if int(asignacion["camion"]["id"])
                        == int(asignacion_b["camion"]["id"])
                    )
                    grupos_candidata_a = (
                        pedidos_por_destino_asignacion(
                            candidata_a
                        )
                    )
                    grupos_candidata_b = (
                        pedidos_por_destino_asignacion(
                            candidata_b
                        )
                    )
                    grupo_a = grupos_candidata_a.pop(
                        destino_a_id
                    )
                    grupo_b = grupos_candidata_b.pop(
                        destino_b_id
                    )
                    grupos_candidata_a[
                        destino_b_id
                    ].extend(grupo_b)
                    grupos_candidata_b[
                        destino_a_id
                    ].extend(grupo_a)

                    destinos_a = [
                        destino_b
                        if int(item["destino_id"])
                        == destino_a_id
                        else item
                        for item in candidata_a[
                            "destinos_ordenados"
                        ]
                    ]
                    destinos_b = [
                        destino_a
                        if int(item["destino_id"])
                        == destino_b_id
                        else item
                        for item in candidata_b[
                            "destinos_ordenados"
                        ]
                    ]
                    reconstruir_asignacion(
                        candidata_a,
                        destinos_a,
                        grupos_candidata_a,
                    )
                    reconstruir_asignacion(
                        candidata_b,
                        destinos_b,
                        grupos_candidata_b,
                    )
                    mejor_a = buscar_mejor_orden_destinos(
                        candidata_a,
                        contexto["validacion"]["grafo"],
                        contexto["validacion"]["bodega_id"],
                        contexto["validacion"]["distancia_entre"],
                    )
                    mejor_b = buscar_mejor_orden_destinos(
                        candidata_b,
                        contexto["validacion"]["grafo"],
                        contexto["validacion"]["bodega_id"],
                        contexto["validacion"]["distancia_entre"],
                    )
                    reconstruir_asignacion(
                        candidata_a,
                        mejor_a,
                        grupos_candidata_a,
                    )
                    reconstruir_asignacion(
                        candidata_b,
                        mejor_b,
                        grupos_candidata_b,
                    )
                    solucion, metricas_solucion, aceptado = (
                        intentar_aceptar_movimiento(
                            candidata,
                            solucion,
                            metricas_solucion,
                            **contexto["validacion"],
                        )
                    )

                    if aceptado:
                        return solucion, metricas_solucion, True

    return solucion, metricas_solucion, False


def mejorar_solucion_busqueda_local(
    solucion,
    grafo,
    bodega_id,
    distancia_entre,
    velocidad_kmh,
    max_jornada_min,
    tiempo_servicio_por_entrega_min,
    margen_operativo_porcentaje,
    deadline=None,
):
    mejor = normalizar_solucion(
        copy.deepcopy(solucion)
    )
    metricas_mejor = calcular_metricas_solucion(
        mejor,
        grafo,
        bodega_id,
        distancia_entre,
        velocidad_kmh,
        max_jornada_min,
        tiempo_servicio_por_entrega_min,
        margen_operativo_porcentaje,
    )
    pedidos_base = {
        int(pedido["pedido_id"])
        for asignacion in mejor["asignaciones"]
        for pedido in asignacion["pedidos"]
    }
    no_asignados_base = {
        int(pedido["pedido_id"])
        for pedido in mejor["pedidos_no_asignados"]
    }
    contexto = {
        "deadline": deadline,
        "validacion": {
            "pedidos_base": pedidos_base,
            "no_asignados_base": no_asignados_base,
            "grafo": grafo,
            "bodega_id": bodega_id,
            "distancia_entre": distancia_entre,
            "velocidad_kmh": velocidad_kmh,
            "max_jornada_min": max_jornada_min,
            "tiempo_servicio_por_entrega_min":
                tiempo_servicio_por_entrega_min,
            "margen_operativo_porcentaje":
                margen_operativo_porcentaje,
        },
    }

    for _ in range(BUSQUEDA_LOCAL_MAX_PASADAS):
        if (
            deadline is not None and
            time.perf_counter() >= deadline
        ):
            break

        mejoro = False

        for operador in (
            aplicar_2opt_solucion,
            aplicar_swap_solucion,
            aplicar_relocate_solucion,
        ):
            mejor, metricas_mejor, aceptado = operador(
                mejor,
                metricas_mejor,
                contexto,
            )
            mejoro = mejoro or aceptado

            if aceptado:
                break

        if not mejoro:
            break

    return mejor, metricas_mejor


def ejecutar_aco_para_camiones(
    grafo,
    bodega_id,
    grupos,
    camiones_objetivo,
    distancia_entre,
    num_hormigas,
    iteraciones,
    iteraciones_sin_mejora,
    alfa,
    beta,
    evaporacion,
    q,
    semilla,
    deadline,
    velocidad_kmh,
    max_jornada_min,
    tiempo_servicio_por_entrega_min,
    margen_operativo_porcentaje,
):
    objetivos_carga = calcular_objetivos_carga(
        sum(int(grupo["demanda"]) for grupo in grupos),
        camiones_objetivo,
    )
    rng = random.Random(semilla)
    feromonas = {}
    mejor_solucion = None
    mejor_metricas = None
    mejor_costo = float("inf")
    sin_mejora = 0
    iteraciones_ejecutadas = 0
    soluciones_evaluadas = 0

    for _ in range(iteraciones):
        if (
            deadline is not None and
            time.perf_counter() >= deadline
        ):
            break

        soluciones_iteracion = []
        iteraciones_ejecutadas += 1
        mejoro_iteracion = False

        for _ in range(num_hormigas):
            if (
                deadline is not None and
                time.perf_counter() >= deadline
            ):
                break

            solucion = construir_solucion_hormiga(
                grafo=grafo,
                bodega_id=int(bodega_id),
                grupos=grupos,
                camiones=camiones_objetivo,
                distancia_entre=distancia_entre,
                feromonas=feromonas,
                alfa=alfa,
                beta=beta,
                rng=rng,
                objetivos_carga=objetivos_carga,
                velocidad_kmh=velocidad_kmh,
                max_jornada_min=max_jornada_min,
                tiempo_servicio_por_entrega_min=(
                    tiempo_servicio_por_entrega_min
                ),
                margen_operativo_porcentaje=(
                    margen_operativo_porcentaje
                ),
            )
            metricas = calcular_metricas_solucion(
                solucion,
                grafo,
                bodega_id,
                distancia_entre,
                velocidad_kmh,
                max_jornada_min,
                tiempo_servicio_por_entrega_min,
                margen_operativo_porcentaje,
            )
            costo = metricas["costo"]
            soluciones_evaluadas += 1
            soluciones_iteracion.append((solucion, costo))

            if solucion_es_mejor(
                metricas,
                mejor_metricas,
            ):
                mejor_solucion = solucion
                mejor_metricas = metricas
                mejor_costo = costo
                mejoro_iteracion = True

        evaporar_feromonas(feromonas, evaporacion)
        soluciones_ordenadas = sorted(
            soluciones_iteracion,
            key=lambda item: item[1],
        )

        for solucion, costo in soluciones_ordenadas[:5]:
            depositar_feromonas(
                solucion=solucion,
                costo=costo,
                feromonas=feromonas,
                bodega_id=int(bodega_id),
                q=q,
            )

        if mejoro_iteracion:
            sin_mejora = 0
        else:
            sin_mejora += 1

        if sin_mejora >= iteraciones_sin_mejora:
            break

    return {
        "solucion": mejor_solucion,
        "metricas": mejor_metricas,
        "costo": mejor_costo,
        "iteraciones": iteraciones_ejecutadas,
        "soluciones": soluciones_evaluadas,
    }


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
    max_segundos=DEFAULT_MAX_SEGUNDOS_ACO,
    velocidad_kmh=40,
    max_jornada_min=DEFAULT_MAX_JORNADA_MIN,
    tiempo_servicio_por_entrega_min=(
        DEFAULT_TIEMPO_SERVICIO_MIN
    ),
    margen_operativo_porcentaje=(
        DEFAULT_MARGEN_OPERATIVO_PORCENTAJE
    ),
    perfil=None,
):
    if not pedidos:
        return {
            "asignaciones": [],
            "pedidos_no_asignados": [],
        }

    camiones_validos = validar_camiones(camiones)
    capacidad_maxima = max(
        int(camion["capacidad"])
        for camion in camiones_validos
    )
    grupos = fragmentar_grupos(
        agrupar_pedidos_por_destino(pedidos),
        capacidad_maxima,
    )
    plan_camiones = calcular_camiones_objetivo(
        grafo,
        bodega_id,
        grupos,
        camiones_validos,
        distancia_entre,
        velocidad_kmh,
        max_jornada_min,
        tiempo_servicio_por_entrega_min,
        margen_operativo_porcentaje,
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
    mejor_solucion = None
    mejor_metricas = None
    mejor_costo = float("inf")
    iteraciones_ejecutadas = 0
    soluciones_evaluadas = 0
    inicio = time.perf_counter()
    deadline_total = (
        inicio + float(max_segundos)
        if max_segundos is not None
        else None
    )
    deadline_aco = (
        inicio + float(max_segundos) * 0.90
        if max_segundos is not None
        else None
    )
    minimo_k = max(
        1,
        int(plan_camiones["minimo_por_capacidad"]),
    )
    maximo_k = max(
        minimo_k,
        int(plan_camiones["maximo_operativo"]),
    )
    maximo_k = min(
        maximo_k,
        len(plan_camiones["camiones_ordenados"]),
    )
    candidatos_k = [
        maximo_k,
        *[
            cantidad
            for cantidad in range(minimo_k, maximo_k)
        ],
    ]
    reinicios = min(
        MULTI_START_MAX_REINICIOS,
        max(1, iteraciones),
    )
    iteraciones_por_intento = max(
        1,
        iteraciones // max(
            1,
            len(candidatos_k)
            if len(candidatos_k) > 1
            else reinicios,
        ),
    )
    rng_semillas = random.Random(semilla)

    for cantidad_camiones in candidatos_k:
        if (
            deadline_aco is not None and
            time.perf_counter() >= deadline_aco and
            mejor_solucion is not None
        ):
            break

        camiones_objetivo = (
            plan_camiones["camiones_ordenados"][
                :cantidad_camiones
            ]
        )

        for reinicio in range(reinicios):
            if (
                deadline_aco is not None and
                time.perf_counter() >= deadline_aco and
                mejor_solucion is not None
            ):
                break

            if (
                semilla is not None and
                cantidad_camiones == maximo_k and
                reinicio == 0
            ):
                semilla_interna = int(semilla)
            elif semilla is None:
                semilla_interna = None
            else:
                semilla_interna = (
                    int(semilla)
                    + rng_semillas.randint(1, 1_000_000)
                    + cantidad_camiones * 10_003
                    + reinicio * 97
                )

            intento = ejecutar_aco_para_camiones(
                grafo=grafo,
                bodega_id=bodega_id,
                grupos=grupos,
                camiones_objetivo=camiones_objetivo,
                distancia_entre=distancia_entre,
                num_hormigas=num_hormigas,
                iteraciones=iteraciones_por_intento,
                iteraciones_sin_mejora=iteraciones_sin_mejora,
                alfa=alfa,
                beta=beta,
                evaporacion=evaporacion,
                q=q,
                semilla=semilla_interna,
                deadline=deadline_aco,
                velocidad_kmh=velocidad_kmh,
                max_jornada_min=max_jornada_min,
                tiempo_servicio_por_entrega_min=(
                    tiempo_servicio_por_entrega_min
                ),
                margen_operativo_porcentaje=(
                    margen_operativo_porcentaje
                ),
            )
            iteraciones_ejecutadas += intento["iteraciones"]
            soluciones_evaluadas += intento["soluciones"]

            if intento["solucion"] is None:
                continue

            if solucion_es_mejor(
                intento["metricas"],
                mejor_metricas,
            ):
                mejor_solucion = intento["solucion"]
                mejor_metricas = intento["metricas"]
                mejor_costo = intento["costo"]

    if mejor_solucion is None:
        raise Exception(
            "La colonia de hormigas CVRP no pudo "
            "construir una solución válida"
        )

    solucion_mejorada, metricas_mejoradas = (
        mejorar_solucion_busqueda_local(
            mejor_solucion,
            grafo,
            bodega_id,
            distancia_entre,
            velocidad_kmh,
            max_jornada_min,
            tiempo_servicio_por_entrega_min,
            margen_operativo_porcentaje,
            deadline=deadline_total,
        )
    )

    if solucion_es_mejor(
        metricas_mejoradas,
        mejor_metricas,
    ):
        mejor_solucion = solucion_mejorada
        mejor_metricas = metricas_mejoradas
        mejor_costo = metricas_mejoradas["costo"]

    if perfil is not None:
        perfil["aco_iteraciones"] = iteraciones_ejecutadas
        perfil["aco_hormigas"] = num_hormigas
        perfil["aco_soluciones_evaluadas"] = soluciones_evaluadas
        perfil["aco_mejor_costo"] = mejor_costo
        perfil["camiones_objetivo"] = plan_camiones["cantidad"]
        perfil["duracion_base_estimada_min"] = (
            plan_camiones["duracion_base_min"]
        )

    return mejor_solucion

