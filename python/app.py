"""
Punto de entrada del servicio de cálculo de rutas.

Este módulo expone una API HTTP utilizando FastAPI para permitir que
el backend Node.js solicite el cálculo de rutas óptimas mediante el
algoritmo A*.

Responsabilidades:
    - Recibir el contrato de entrada enviado por Node.js.
    - Construir el grafo en memoria.
    - Ejecutar el algoritmo A*.
    - Calcular el tiempo estimado de recorrido.
    - Devolver el resultado en formato JSON.

Este módulo no implementa lógica de negocio ni acceso a bases de datos.
Toda la información necesaria es proporcionada por Node.js.
"""

from fastapi import FastAPI

from algoritmo.astar import calcular_ruta
from algoritmo.grafo import construir_grafo
from modelos.contratos import SolicitudRuta
from utils.tiempo import calcular_tiempo_estimado


app = FastAPI(
    title="TechSupply Outbound - Route Service",
    version="1.0.0",
)


@app.post("/api/rutas/calcular")
def calcular(datos: SolicitudRuta) -> dict:
    """
    Calcula la ruta óptima entre dos ubicaciones.

    Recibe el contrato enviado por Node.js, construye el grafo en memoria,
    ejecuta el algoritmo A* y devuelve la ruta óptima junto con la
    distancia total y el tiempo estimado de recorrido.

    Args:
        datos: Contrato de entrada con el origen, destino y la lista
            completa de rutas disponibles.

    Returns:
        Un objeto JSON con la siguiente estructura:

        {
            "ruta": [...],
            "distancia_total": float,
            "tiempo_estimado": int
        }
    """

    # Convertir los modelos Pydantic a diccionarios.
    rutas = [
        ruta.model_dump()
        for ruta in datos.rutas
    ]

    # Construir el grafo en memoria.
    grafo = construir_grafo(rutas)

    # Ejecutar el algoritmo A*.
    ruta, distancia = calcular_ruta(
        grafo,
        datos.origenId,
        datos.destinoId,
    )

    # Devolver el resultado utilizando el contrato definido para Node.js.
    return {
        "ruta": ruta,
        "distancia_total": distancia,
        "tiempo_estimado": calcular_tiempo_estimado(
            distancia,
        ),
    }
