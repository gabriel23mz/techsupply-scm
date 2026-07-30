import argparse
import sys
import statistics
import time
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from algoritmo import metaheuristica_jornada as mj
from algoritmo.grafo import construir_grafo


def make_payload(
    pedidos_n,
    camiones_n,
    destinos_unicos=None,
    semilla=42,
    benchmark=True,
):
    destinos_unicos = destinos_unicos or pedidos_n
    bodega = {
        "id": 1,
        "nombre": "Bodega",
        "latitud": -2.10,
        "longitud": -79.90,
    }
    pedidos = []

    for indice in range(pedidos_n):
        destino = 2 + (indice % destinos_unicos)
        pedidos.append({
            "pedido_id": 100 + indice,
            "cliente_id": 200 + indice,
            "cliente": f"Cliente {indice}",
            "destino_id": destino,
            "ubicacion": f"Destino {destino}",
            "latitud": -2.10 + destino * 0.001,
            "longitud": -79.90 + destino * 0.001,
            "fecha_entrega": None,
        })

    capacidad = max(
        1,
        (pedidos_n + camiones_n - 1) // camiones_n,
    )

    camiones = [
        {
            "id": 10 + indice,
            "codigo": f"CAM-{indice}",
            "placa": f"P{indice}",
            "capacidad": capacidad,
        }
        for indice in range(camiones_n)
    ]

    nodos = [
        1,
        *sorted({
            pedido["destino_id"]
            for pedido in pedidos
        }),
    ]

    rutas = [
        {
            "origen": origen,
            "destino": destino,
            "distancia": float(abs(destino - origen) + 1),
        }
        for posicion, origen in enumerate(nodos)
        for destino in nodos[posicion + 1:]
    ]

    payload = {
        "bodega": bodega,
        "pedidos": pedidos,
        "camiones": camiones,
        "velocidad_kmh": 40,
        "semilla": semilla,
        "benchmark": benchmark,
    }

    return payload, construir_grafo(rutas)


def medir(
    nombre,
    pedidos,
    camiones,
    destinos=None,
    repeticiones=3,
):
    payload, grafo = make_payload(
        pedidos,
        camiones,
        destinos_unicos=destinos,
    )
    tiempos = []

    def fake_osrm(puntos):
        return [
            [
                punto["latitud"],
                punto["longitud"],
            ]
            for punto in puntos
        ]

    with patch(
        "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
        side_effect=fake_osrm,
    ):
        mj.generar_jornada(payload, grafo)

        for _ in range(repeticiones):
            inicio = time.perf_counter()
            resultado = mj.generar_jornada(
                payload,
                grafo,
            )
            tiempos.append(time.perf_counter() - inicio)

    distancia = sum(
        jornada["distancia_total_km"]
        for jornada in resultado["jornadas"]
    )
    duracion_maxima = max(
        (
            jornada["tiempo_estimado_min"]
            + jornada["capacidad_utilizada"] * 10
        ) * 1.15
        for jornada in resultado["jornadas"]
    ) if resultado["jornadas"] else 0

    perfil = resultado.get("perfil", {})

    print(
        "|".join([
            nombre,
            f"min={min(tiempos):.4f}",
            f"mediana={statistics.median(tiempos):.4f}",
            f"max={max(tiempos):.4f}",
            f"astar={perfil.get('astar_ejecuciones', 0)}",
            f"osrm={perfil.get('osrm_llamadas', 0)}",
            f"iteraciones={perfil.get('aco_iteraciones', 0)}",
            f"soluciones={perfil.get('aco_soluciones_evaluadas', 0)}",
            f"objetivo={perfil.get('camiones_objetivo', 0)}",
            f"jornadas={len(resultado['jornadas'])}",
            f"no_asignados={len(resultado['pedidos_no_asignados'])}",
            f"distancia={distancia:.2f}",
            f"duracion_max={duracion_maxima:.2f}",
        ]),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--repeticiones",
        type=int,
        default=3,
    )
    args = parser.parse_args()

    escenarios = [
        ("pequeno", 5, 1, None),
        ("medio", 14, 3, None),
        ("ampliado", 30, 5, None),
        ("repetidos", 14, 3, 4),
    ]

    for nombre, pedidos, camiones, destinos in escenarios:
        medir(
            nombre,
            pedidos,
            camiones,
            destinos=destinos,
            repeticiones=args.repeticiones,
        )


if __name__ == "__main__":
    main()
