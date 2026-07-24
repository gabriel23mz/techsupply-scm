"""
Servicio de optimización logística de TechSupply SCM Outbound.

La API expone dos capacidades independientes:

1. Cálculo de una ruta individual mediante A* con heurística nula.
2. Generación de múltiples jornadas de reparto mediante una
   metaheurística de colonia de hormigas para un problema CVRP.

El servicio recibe toda la información desde el backend Node.js,
construye el grafo en memoria y devuelve resultados en formato JSON.
No accede directamente a la base de datos ni persiste información.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from algoritmo.astar import calcular_ruta
from algoritmo.grafo import construir_grafo
from errores import LogisticaError, error_response
from modelos.contratos import SolicitudRuta, SolicitudJornada
from algoritmo.metaheuristica_jornada import generar_jornada
from utils.tiempo import calcular_tiempo_estimado


app = FastAPI(
    title="TechSupply Outbound - Route Service",
    version="2.0.0",
)


@app.exception_handler(LogisticaError)
async def manejar_error_logistico(
    _request: Request,
    error: LogisticaError,
):
    return JSONResponse(
        status_code=error.status_code,
        content=error_response(error),
    )


@app.exception_handler(RequestValidationError)
async def manejar_error_validacion(
    _request: Request,
    error: RequestValidationError,
):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "INVALID_INPUT",
                "message": "Payload invalido",
                "details": {
                    "errors": error.errors(),
                },
            },
        },
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

    if not ruta:
        raise LogisticaError(
            "ROUTE_NOT_FOUND",
            "No existe una ruta entre el origen y el destino",
            {
                "origen": datos.origenId,
                "destino": datos.destinoId,
            },
        )

    # Devolver el resultado utilizando el contrato definido para Node.js.
    return {
        "ruta": ruta,
        "distancia_total": distancia,
        "tiempo_estimado": calcular_tiempo_estimado(
            distancia,
        ),
    }


@app.post("/api/jornadas/generar")
def generar(datos: SolicitudJornada) -> dict:
    rutas = [
        ruta.model_dump()
        for ruta in datos.grafo
    ]

    grafo = construir_grafo(rutas)

    payload = datos.model_dump()

    return generar_jornada(payload, grafo)
    

