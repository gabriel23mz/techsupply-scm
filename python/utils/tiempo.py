from math import ceil


VELOCIDAD_PROMEDIO_KMH = 50


def calcular_tiempo_estimado(
    distancia_km: float,
) -> int:
    """
    Calcula el tiempo estimado de recorrido en minutos.
    """

    horas = distancia_km / VELOCIDAD_PROMEDIO_KMH

    minutos = horas * 60

    return ceil(minutos)

