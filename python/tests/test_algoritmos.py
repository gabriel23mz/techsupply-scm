import math
import random
import time
import unittest
from unittest.mock import patch

from algoritmo.astar import calcular_ruta
from algoritmo.colonia_hormigas_cvrp import (
    ant_colony_cvrp,
    agrupar_pedidos_por_destino,
    seleccionar_elemento_ponderado,
)
from algoritmo.grafo import construir_grafo
from algoritmo.metaheuristica_jornada import (
    construir_matriz_distancias,
    generar_jornada,
)
from errores import LogisticaError


def pedido(pedido_id, destino_id=2, ubicacion="Cliente Norte"):
    return {
        "pedido_id": pedido_id,
        "cliente_id": pedido_id + 100,
        "cliente": f"Cliente {pedido_id}",
        "destino_id": destino_id,
        "ubicacion": ubicacion,
        "latitud": -2.08,
        "longitud": -79.88,
        "fecha_entrega": None,
    }


def distancia_entre_stub(grafo, origen, destino):
    if origen == destino:
        return [origen], 0.0

    ruta, distancia = calcular_ruta(grafo, origen, destino)
    if not ruta:
        return [], float("inf")

    return ruta, distancia


class GrafoYAStarTests(unittest.TestCase):
    def test_grafo_vacio(self):
        self.assertEqual(construir_grafo([]), {})

    def test_camino_valido_bidireccional(self):
        grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 4},
            {"origen": 2, "destino": 3, "distancia": 5},
        ])

        self.assertEqual(grafo[2], [(1, 4), (3, 5)])
        self.assertEqual(calcular_ruta(grafo, 1, 3), ([1, 2, 3], 9.0))

    def test_grafo_desconectado(self):
        grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 4},
            {"origen": 3, "destino": 4, "distancia": 5},
        ])

        self.assertEqual(calcular_ruta(grafo, 1, 4), ([], 0.0))

    def test_origen_inexistente_devuelve_error_controlado(self):
        grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 4},
        ])

        with self.assertRaisesRegex(
            LogisticaError,
            "origen no existe",
        ):
            calcular_ruta(grafo, 99, 2)

    def test_destino_inexistente_devuelve_error_controlado(self):
        grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 4},
        ])

        with self.assertRaisesRegex(
            LogisticaError,
            "destino no existe",
        ):
            calcular_ruta(grafo, 1, 99)

    def test_mismo_origen_destino(self):
        grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 4},
        ])

        self.assertEqual(calcular_ruta(grafo, 1, 1), ([1], 0.0))

    def test_distancia_cero_negativa_nan_e_infinita_se_rechazan(self):
        for distancia in [0, -3, math.nan, math.inf]:
            with self.subTest(distancia=distancia):
                with self.assertRaises(LogisticaError):
                    construir_grafo([
                        {"origen": 1, "destino": 2, "distancia": distancia},
                    ])

    def test_astar_rechaza_distancia_invalida_en_grafo_manual(self):
        with self.assertRaisesRegex(
            LogisticaError,
            "distancia invalida",
        ):
            calcular_ruta({1: [(2, -1)], 2: []}, 1, 2)


class MetaheuristicaTests(unittest.TestCase):
    def setUp(self):
        self.grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 6},
            {"origen": 1, "destino": 3, "distancia": 8},
            {"origen": 2, "destino": 3, "distancia": 2},
        ])
        self.bodega = {
            "id": 1,
            "nombre": "Bodega Central",
            "latitud": -2.1,
            "longitud": -79.9,
        }
        self.camiones = [
            {"id": 10, "codigo": "CAM-010", "placa": "AAA-010", "capacidad": 2},
        ]

    def test_agrupar_pedidos_repetidos_y_misma_ubicacion(self):
        grupos = agrupar_pedidos_por_destino([
            pedido(1, 2),
            pedido(1, 2),
            pedido(2, 2),
        ])

        self.assertEqual(len(grupos), 1)
        self.assertEqual(grupos[0]["demanda"], 3)

    def test_ausencia_de_pedidos_y_camiones(self):
        self.assertEqual(
            generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [],
                    "camiones": self.camiones,
                    "velocidad_kmh": 40,
                },
                self.grafo,
            ),
            {"jornadas": [], "pedidos_no_asignados": []},
        )

        self.assertEqual(
            generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [pedido(1)],
                    "camiones": [],
                    "velocidad_kmh": 40,
                },
                self.grafo,
            ),
            {"jornadas": [], "pedidos_no_asignados": [1]},
        )

    def test_camion_sin_capacidad_suficiente_identifica_no_asignados(self):
        solucion = ant_colony_cvrp(
            grafo=self.grafo,
            bodega_id=1,
            pedidos=[pedido(1, 2), pedido(2, 3)],
            camiones=[{"id": 10, "codigo": "CAM", "placa": "AAA", "capacidad": 1}],
            distancia_entre=distancia_entre_stub,
            num_hormigas=2,
            iteraciones=2,
        )

        asignados = sum(len(item["pedidos"]) for item in solucion["asignaciones"])
        self.assertEqual(asignados, 1)
        self.assertEqual(len(solucion["pedidos_no_asignados"]), 1)

    def test_jornada_valida_retorna_a_bodega_sin_osrm_real(self):
        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=Exception("OSRM simulado no disponible"),
        ):
            resultado = generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [pedido(1, 2)],
                    "camiones": self.camiones,
                    "velocidad_kmh": 40,
                },
                self.grafo,
            )

        self.assertEqual(resultado["pedidos_no_asignados"], [])
        jornada = resultado["jornadas"][0]
        self.assertEqual(jornada["entregas"][0]["orden_entrega"], 1)
        self.assertEqual(jornada["ruta_general"]["tramos"][-1]["tipo"], "RETORNO_BODEGA")
        self.assertGreater(jornada["distancia_total_km"], 0)

    def test_velocidad_invalida_falla_sin_llamadas_externas(self):
        with self.assertRaisesRegex(LogisticaError, "velocidad"):
            generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [pedido(1, 2)],
                    "camiones": self.camiones,
                    "velocidad_kmh": 0,
                },
                self.grafo,
            )

    def test_pedidos_no_alcanzables_se_clasifican_sin_romper_jornadas_validas(self):
        grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 6},
            {"origen": 50, "destino": 51, "distancia": 2},
        ])

        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=Exception("OSRM simulado no disponible"),
        ):
            resultado = generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [
                        pedido(1, 2),
                        pedido(2, 50, "Destino aislado"),
                    ],
                    "camiones": self.camiones,
                    "velocidad_kmh": 40,
                    "semilla": 123,
                },
                grafo,
            )

        self.assertEqual(resultado["pedidos_no_asignados"], [2])
        asignados = [
            entrega["pedido_id"]
            for jornada in resultado["jornadas"]
            for entrega in jornada["entregas"]
        ]
        self.assertEqual(asignados, [1])

    def test_misma_semilla_reproduce_resultado_y_capacidad(self):
        payload = {
            "bodega": self.bodega,
            "pedidos": [pedido(1, 2), pedido(2, 3)],
            "camiones": self.camiones,
            "velocidad_kmh": 40,
            "semilla": 42,
        }

        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=Exception("OSRM simulado no disponible"),
        ):
            primero = generar_jornada(payload, self.grafo)
            segundo = generar_jornada(payload, self.grafo)

        def firma(resultado):
            return [
                {
                    "camion_id": jornada["camion_id"],
                    "distancia_total_km": jornada["distancia_total_km"],
                    "entregas": [
                        (
                            entrega["pedido_id"],
                            entrega["orden_entrega"],
                        )
                        for entrega in jornada["entregas"]
                    ],
                }
                for jornada in resultado["jornadas"]
            ]

        self.assertEqual(firma(primero), firma(segundo))
        self.assertLessEqual(
            primero["jornadas"][0]["capacidad_utilizada"],
            primero["jornadas"][0]["capacidad_camion"],
        )

    def test_semillas_distintas_pueden_explorar_elecciones_distintas(self):
        candidatos = [
            ("A", 1),
            ("B", 1),
        ]

        self.assertNotEqual(
            seleccionar_elemento_ponderado(
                candidatos,
                random.Random(1),
            ),
            seleccionar_elemento_ponderado(
                candidatos,
                random.Random(5),
            ),
        )

    def test_matriz_evita_repetir_astar_para_el_mismo_par(self):
        with patch(
            "algoritmo.metaheuristica_jornada.calcular_ruta",
            wraps=calcular_ruta,
        ) as spy:
            matriz, caminos = construir_matriz_distancias(
                self.grafo,
                [1, 2, 3],
            )

        self.assertEqual(spy.call_count, 3)
        self.assertEqual(matriz[1][3], 8.0)
        self.assertEqual(caminos[(3, 1)], [3, 1])


    def test_planificacion_balancea_16_pedidos_sin_degradar_rendimiento(self):
        total_pedidos = 16
        pedidos = [
            {
                **pedido(
                    100 + indice,
                    2 + indice,
                    f"Destino {indice + 1}",
                ),
                "latitud": -1.0 + indice * 0.01,
                "longitud": -80.0 + indice * 0.01,
            }
            for indice in range(total_pedidos)
        ]
        nodos = [1, *range(2, total_pedidos + 2)]
        grafo = construir_grafo([
            {
                "origen": origen,
                "destino": destino,
                "distancia": float(
                    abs(destino - origen) * 30 + 10
                ),
            }
            for posicion, origen in enumerate(nodos)
            for destino in nodos[posicion + 1:]
        ])
        camiones = [
            {
                "id": 10,
                "codigo": "CAM-010",
                "placa": "AAA-010",
                "capacidad": 16,
            },
            {
                "id": 11,
                "codigo": "CAM-011",
                "placa": "AAA-011",
                "capacidad": 14,
            },
        ]

        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=lambda puntos: [
                [punto["latitud"], punto["longitud"]]
                for punto in puntos
            ],
        ):
            inicio = time.perf_counter()
            resultado = generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": pedidos,
                    "camiones": camiones,
                    "velocidad_kmh": 40,
                    "max_jornada_min": 600,
                    "tiempo_servicio_por_entrega_min": 10,
                    "margen_operativo_porcentaje": 15,
                    "semilla": 42,
                    "benchmark": True,
                },
                grafo,
            )
            duracion = time.perf_counter() - inicio

        cargas = sorted(
            jornada["capacidad_utilizada"]
            for jornada in resultado["jornadas"]
        )

        self.assertEqual(len(resultado["jornadas"]), 2)
        self.assertEqual(sum(cargas), total_pedidos)
        self.assertGreater(cargas[0], 0)
        self.assertLess(cargas[-1], total_pedidos)
        self.assertLessEqual(
            resultado["perfil"]["aco_soluciones_evaluadas"],
            500,
        )
        self.assertEqual(
            resultado["perfil"]["camiones_objetivo"],
            2,
        )
        self.assertLess(duracion, 0.75)

    def test_osrm_no_se_llama_dentro_de_aco_y_solo_para_jornada_final(self):
        llamadas_osrm = 0

        def fake_osrm(puntos):
            nonlocal llamadas_osrm
            llamadas_osrm += 1
            return [[p["latitud"], p["longitud"]] for p in puntos]

        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=fake_osrm,
        ):
            resultado = generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [pedido(1, 2), pedido(2, 3)],
                    "camiones": self.camiones,
                    "velocidad_kmh": 40,
                    "semilla": 7,
                    "aco": {
                        "num_hormigas": 4,
                        "iteraciones": 5,
                    },
                },
                self.grafo,
            )

        tramos_finales = sum(
            len(jornada["ruta_general"]["tramos"])
            for jornada in resultado["jornadas"]
        )

        self.assertLessEqual(llamadas_osrm, tramos_finales)


    def test_despachos_del_mismo_destino_comparten_orden(self):
        pedidos = [
            pedido(1, 2),
            pedido(2, 2),
            pedido(3, 3),
        ]

        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=lambda puntos: [
                [punto["latitud"], punto["longitud"]]
                for punto in puntos
            ],
        ):
            resultado = generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": pedidos,
                    "camiones": self.camiones,
                    "velocidad_kmh": 40,
                    "semilla": 11,
                },
                self.grafo,
            )

        entregas = [
            entrega
            for jornada in resultado["jornadas"]
            for entrega in jornada["entregas"]
        ]
        ordenes_destino_dos = {
            entrega["orden_entrega"]
            for entrega in entregas
            if entrega["ruta_parcial"]["hasta"]["id"] == 2
        }

        self.assertEqual(len(ordenes_destino_dos), 1)
        self.assertEqual(
            sum(
                1
                for entrega in entregas
                if entrega["ruta_parcial"]["hasta"]["id"] == 2
            ),
            2,
        )

    def test_osrm_se_consulta_una_vez_por_jornada_final(self):
        llamadas_osrm = 0

        def fake_osrm(puntos):
            nonlocal llamadas_osrm
            llamadas_osrm += 1
            return [
                [punto["latitud"], punto["longitud"]]
                for punto in puntos
            ]

        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=fake_osrm,
        ):
            resultado = generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [
                        pedido(1, 2),
                        pedido(2, 2),
                        pedido(3, 3),
                        pedido(4, 4),
                    ],
                    "camiones": self.camiones,
                    "velocidad_kmh": 40,
                    "semilla": 17,
                },
                self.grafo,
            )

        self.assertEqual(
            llamadas_osrm,
            len(resultado["jornadas"]),
        )


if __name__ == "__main__":
    unittest.main()
