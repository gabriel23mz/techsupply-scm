import requests


OSRM_BASE_URL = "https://router.project-osrm.org"


def obtener_geometria_osrm(puntos):
    """
    puntos:
    [
      {"latitud": -1.05, "longitud": -80.45},
      {"latitud": -0.92, "longitud": -80.44}
    ]
    """

    if len(puntos) < 2:
        return []

    coordenadas = ";".join([
        f'{punto["longitud"]},{punto["latitud"]}'
        for punto in puntos
    ])

    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/{coordenadas}"
        "?overview=full&geometries=geojson"
    )

    response = requests.get(url, timeout=10)
    response.raise_for_status()

    data = response.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        raise Exception("OSRM no pudo calcular la geometría real de la ruta")

    coordenadas_geojson = data["routes"][0]["geometry"]["coordinates"]

    # OSRM/GeoJSON devuelve [longitud, latitud].
    # Leaflet necesita [latitud, longitud].
    return [
        [latitud, longitud]
        for longitud, latitud in coordenadas_geojson
    ]

