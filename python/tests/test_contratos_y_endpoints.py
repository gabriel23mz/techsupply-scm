import unittest
from unittest.mock import patch

from pydantic import ValidationError

from app import calcular, generar
from modelos.contratos import SolicitudJornada, SolicitudRuta


class ContratosYEndpointsTests(unittest.TestCase):
    def test_solicitud_ruta_valida_y_endpoint_directo(self):
        solicitud = SolicitudRuta(
            origenId=1,
            destinoId=3,
            rutas=[
                {"origen": 1, "destino": 2, "distancia": 4.5},
                {"origen": 2, "destino": 3, "distancia": 3.5},
            ],
        )

        respuesta = calcular(solicitud)

        self.assertEqual(respuesta["ruta"], [1, 2, 3])
        self.assertEqual(respuesta["distancia_total"], 8.0)
        self.assertIsInstance(respuesta["tiempo_estimado"], int)

    def test_solicitud_ruta_incompleta_falla_validacion_pydantic(self):
        with self.assertRaises(ValidationError):
            SolicitudRuta(origenId=1, destinoId=2)

    def test_distancia_invalida_por_tipo_falla_pero_distancia_negativa_se_acepta(self):
        with self.assertRaises(ValidationError):
            SolicitudRuta(
                origenId=1,
                destinoId=2,
                rutas=[{"origen": 1, "destino": 2, "distancia": "abc"}],
            )

        solicitud = SolicitudRuta(
            origenId=1,
            destinoId=2,
            rutas=[{"origen": 1, "destino": 2, "distancia": -5}],
        )
        self.assertEqual(solicitud.rutas[0].distancia, -5)

    def test_coordenadas_fuera_de_rango_se_aceptan_actualmente(self):
        solicitud = SolicitudJornada(
            bodega={
                "id": 1,
                "nombre": "Bodega",
                "latitud": 999,
                "longitud": -999,
            },
            camiones=[
                {"id": 10, "codigo": "CAM-010", "placa": "AAA-010", "capacidad": 1},
            ],
            pedidos=[
                {
                    "pedido_id": 1,
                    "cliente_id": 2,
                    "cliente": "Cliente",
                    "destino_id": 3,
                    "ubicacion": "Ubicación",
                    "latitud": 999,
                    "longitud": -999,
                    "fecha_entrega": None,
                },
            ],
            grafo=[
                {"origen": 1, "destino": 3, "distancia": 10},
            ],
        )

        self.assertEqual(solicitud.bodega.latitud, 999)
        self.assertEqual(solicitud.pedidos[0].longitud, -999)

    def test_endpoint_jornada_directo_usa_contrato_actual_sin_osrm_real(self):
        solicitud = SolicitudJornada(
            bodega={
                "id": 1,
                "nombre": "Bodega",
                "latitud": -2.1,
                "longitud": -79.9,
            },
            camiones=[
                {"id": 10, "codigo": "CAM-010", "placa": "AAA-010", "capacidad": 1},
            ],
            pedidos=[
                {
                    "pedido_id": 1,
                    "cliente_id": 2,
                    "cliente": "Cliente",
                    "destino_id": 3,
                    "ubicacion": "Ubicación",
                    "latitud": -2.08,
                    "longitud": -79.88,
                    "fecha_entrega": None,
                },
            ],
            grafo=[
                {"origen": 1, "destino": 3, "distancia": 10},
            ],
        )

        with patch(
            "algoritmo.metaheuristica_jornada.obtener_geometria_osrm",
            side_effect=Exception("OSRM simulado no disponible"),
        ):
            respuesta = generar(solicitud)

        self.assertEqual(respuesta["pedidos_no_asignados"], [])
        self.assertEqual(respuesta["jornadas"][0]["camion_id"], 10)


if __name__ == "__main__":
    unittest.main()
