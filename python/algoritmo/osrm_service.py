import requests

from errores import LogisticaError


OSRM_BASE_URL = "https://router.project-osrm.org"
OSRM_TIMEOUT_SECONDS = 5


def validar_coordenada(punto):
    try:
        latitud = float(punto["latitud"])
        longitud = float(punto["longitud"])
    except (KeyError, TypeError, ValueError):
        raise LogisticaError(
            "INVALID_COORDINATES",
            "Las coordenadas deben contener latitud y longitud numericas",
            {"punto": punto},
        )

    if not (-90 <= latitud <= 90) or not (-180 <= longitud <= 180):
        raise LogisticaError(
            "INVALID_COORDINATES",
            "Las coordenadas estan fuera de rango",
            {"latitud": latitud, "longitud": longitud},
        )

    return latitud, longitud


def obtener_geometria_osrm(puntos, timeout=OSRM_TIMEOUT_SECONDS):
    """
    puntos:
    [
      {"latitud": -1.05, "longitud": -80.45},
      {"latitud": -0.92, "longitud": -80.44}
    ]
    """

    if len(puntos) < 2:
        raise LogisticaError(
            "INVALID_COORDINATES",
            "Se requieren al menos dos puntos para OSRM",
        )

    puntos_validados = [
        validar_coordenada(punto)
        for punto in puntos
    ]

    coordenadas = ";".join([
        f"{longitud},{latitud}"
        for latitud, longitud in puntos_validados
    ])

    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/{coordenadas}"
        "?overview=full&geometries=geojson"
    )

    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        data = response.json()
    except requests.Timeout as error:
        raise LogisticaError(
            "OSRM_TIMEOUT",
            "OSRM excedio el tiempo de espera",
        ) from error
    except requests.ConnectionError as error:
        raise LogisticaError(
            "OSRM_UNAVAILABLE",
            "OSRM no esta disponible",
        ) from error
    except requests.RequestException as error:
        raise LogisticaError(
            "OSRM_UNAVAILABLE",
            "OSRM devolvio un error HTTP",
        ) from error
    except ValueError as error:
        raise LogisticaError(
            "OSRM_UNAVAILABLE",
            "OSRM devolvio una respuesta no JSON",
        ) from error

    if data.get("code") != "Ok" or not data.get("routes"):
        raise LogisticaError(
            "ROUTE_NOT_FOUND",
            "OSRM no pudo calcular la geometria real de la ruta",
            {"osrm_code": data.get("code")},
        )

    try:
        coordenadas_geojson = data["routes"][0]["geometry"]["coordinates"]
    except (KeyError, TypeError, IndexError) as error:
        raise LogisticaError(
            "OSRM_UNAVAILABLE",
            "OSRM devolvio una geometria incompleta",
        ) from error

    if not coordenadas_geojson:
        raise LogisticaError(
            "OSRM_UNAVAILABLE",
            "OSRM devolvio una geometria vacia",
        )

    # OSRM/GeoJSON devuelve [longitud, latitud].
    # Leaflet necesita [latitud, longitud].
    return [
        [latitud, longitud]
        for longitud, latitud in coordenadas_geojson
    ]

