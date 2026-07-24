import math
import unittest
from unittest.mock import patch

from algoritmo.astar import calcular_ruta
from algoritmo.colonia_hormigas_cvrp import (
    ant_colony_cvrp,
    agrupar_pedidos_por_destino,
)
from algoritmo.grafo import construir_grafo
from algoritmo.metaheuristica_jornada import generar_jornada


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

    def test_origen_inexistente_expone_keyerror_actual(self):
        grafo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 4},
        ])

        with self.assertRaises(KeyError):
            calcular_ruta(grafo, 99, 2)

    def test_distancia_cero_y_negativa_se_aceptan_actualmente(self):
        grafo_cero = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": 0},
        ])
        self.assertEqual(calcular_ruta(grafo_cero, 1, 2), ([1, 2], 0.0))

        grafo_negativo = construir_grafo([
            {"origen": 1, "destino": 2, "distancia": -3},
        ])
        self.assertEqual(calcular_ruta(grafo_negativo, 1, 2), ([1, 2], -3.0))


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
        with self.assertRaisesRegex(Exception, "velocidad"):
            generar_jornada(
                {
                    "bodega": self.bodega,
                    "pedidos": [pedido(1, 2)],
                    "camiones": self.camiones,
                    "velocidad_kmh": 0,
                },
                self.grafo,
            )


if __name__ == "__main__":
    unittest.main()
