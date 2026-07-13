# 08. Diseño del Servicio de Cálculo de Rutas (Algoritmo A*)

## 1. Objetivo

Este documento define el diseño técnico del módulo encargado de calcular la ruta óptima para los despachos del proyecto **TechSupply Outbound**.

El objetivo del módulo es exponer un servicio HTTP que reciba desde Node.js la información necesaria para construir un grafo en memoria, ejecutar el algoritmo A* y devolver la mejor ruta entre dos ubicaciones mediante un contrato JSON.

Este módulo constituye la única responsabilidad del componente desarrollado en Python y forma parte de la arquitectura definida en el documento **07. Contrato de Arquitectura Interna de los Servicios**.

---

# 2. Responsabilidad del módulo

El módulo de Python será responsable exclusivamente de:

- Construir el grafo en memoria.
- Ejecutar el algoritmo A*.
- Calcular la mejor ruta.
- Calcular la distancia total recorrida.
- Estimar el tiempo de recorrido.
- Devolver el resultado a Node.js.
- Exponer una API HTTP para el cálculo de rutas.

El módulo **no debe**:

- Acceder a MySQL.
- Utilizar Sequelize.
- Consultar pedidos.
- Consultar clientes.
- Conocer la lógica de negocio del sistema.
- Conocer Express o la lógica del backend de Node.js.

Toda la información necesaria será proporcionada por Node.js mediante estructuras JSON.

---

# 3. Estructura del módulo

Se propone la siguiente estructura de carpetas.

```text
python/

│
├── app.py
├── requirements.txt
│
├── algoritmo/
│     ├── astar.py
│     ├── grafo.py
│     └── heuristica.py
│
├── modelos/
│     ├── contrato.py
│     ├── nodo.py
│     └── tipos.py
│
└── utils/
      └── reconstruccion.py
```

Cada archivo tendrá una responsabilidad específica.

### app.py

Expone un endpoint HTTP que recibe solicitudes desde `python.service.js`, construye el grafo, ejecuta el algoritmo A* y devuelve el resultado utilizando el contrato JSON definido por la arquitectura del sistema.

---

### grafo.py

Construye el grafo completamente en memoria a partir de las rutas recibidas.

---

### astar.py

Implementa el algoritmo A*.

---

### heuristica.py

Contiene la función heurística utilizada durante la búsqueda.

---

### reconstruccion.py

Reconstruye la ruta óptima utilizando la estructura `cameFrom`.

---

# 4. Contrato de Entrada

Node.js enviará un único objeto JSON.

La comunicación entre Node.js y Python se realiza mediante HTTP.

El servicio `python.service.js` actúa como adaptador entre ambos componentes, siendo el único responsable de consumir la API del módulo de Python.

```json
{
  "origenId": 1,
  "destinoId": 10,
  "rutas": [
    {
      "origen": 1,
      "destino": 2,
      "distancia": 14
    },
    {
      "origen": 2,
      "destino": 5,
      "distancia": 8
    }
  ]
}
```

---

## origenId

Identificador de la ubicación de origen.

---

## destinoId

Identificador de la ubicación destino.

---

## rutas

Lista completa de conexiones existentes en la base de datos.

Cada conexión representa una arista del grafo.

---

# 5. Construcción del Grafo

El grafo será construido completamente en memoria.

Cada ubicación representa un nodo.

Cada registro de la tabla **Ruta** representa una arista ponderada.

Ejemplo.

```text
Calceta -----14----- Tosagua
    |
    |
    10
    |
Portoviejo
```

Internamente se representará mediante una lista de adyacencia.

Ejemplo.

```text
1

↓

[(2,14),(3,10)]
```

donde

```
(origen)

↓

[(destino, distancia)]
```

Esta representación permite recorrer únicamente los vecinos de cada nodo, reduciendo el consumo de memoria y mejorando la eficiencia del algoritmo.

---

# 6. Heurística

Durante el desarrollo del MVP no se dispone de coordenadas geográficas reales de las ubicaciones.

Por esta razón se utilizará una **heurística nula**.

```text
h(n) = 0
```

Esta decisión convierte el algoritmo A* en un comportamiento equivalente al algoritmo de Dijkstra, garantizando igualmente la obtención de la ruta óptima.

La arquitectura permitirá reemplazar esta heurística por una distancia geográfica (por ejemplo, Haversine) cuando las ubicaciones dispongan de coordenadas GPS, sin modificar el resto del algoritmo.

---

# 7. Flujo de Ejecución

El cálculo de una ruta seguirá el siguiente flujo.

```text
Express

↓

logistica.service.js

↓

python.service.js

↓

HTTP

↓

Servicio Python (FastAPI)

↓

Construye el grafo

↓

Ejecuta A*

↓

Reconstruye el camino

↓

Calcula distancia total

↓

Calcula tiempo estimado

↓

Respuesta JSON

↓

python.service.js

↓

logistica.service.js

↓

Persistencia del despacho
```

---

# 8. Contrato de Salida

El algoritmo devolverá siempre un objeto JSON.

El servicio responderá con un objeto JSON utilizando el protocolo HTTP.

```json
{
  "ruta": [
    1,
    3,
    7,
    10
  ],
  "distancia_total": 84.3,
  "tiempo_estimado": 97
}
```

---

## ruta

Lista ordenada de identificadores de las ubicaciones que conforman el camino óptimo.

---

## distancia_total

Suma de todas las distancias recorridas.

---

## tiempo_estimado

Tiempo estimado de recorrido expresado en minutos.

Durante el MVP este valor podrá calcularse utilizando una velocidad promedio constante.

---

# 9. Complejidad

Utilizando una cola de prioridad (Priority Queue):

Construcción del grafo

```text
O(E)
```

Algoritmo A*

```text
O((V + E) log V)
```

Reconstrucción del camino

```text
O(V)
```

Memoria

```text
O(V + E)
```

donde

- V = número de ubicaciones
- E = número de rutas

---

# 10. Fundamentos del Algoritmo A*

Aunque A* suele percibirse como un algoritmo complejo, su funcionamiento se basa en mantener actualizadas cinco estructuras principales durante la búsqueda.

Comprender el propósito de cada una facilita tanto la implementación como el mantenimiento del algoritmo.

## Open Set

Es el conjunto de nodos descubiertos que aún no han sido explorados completamente.

Representa las posibles alternativas que el algoritmo puede evaluar a continuación.

En cada iteración se selecciona el nodo con el menor valor de `fScore`.

---

## Closed Set

Contiene los nodos que ya fueron procesados completamente.

Una vez que un nodo pasa al `closedSet`, no vuelve a evaluarse, evitando cálculos repetidos.

---

## gScore

Representa el costo real acumulado desde el nodo de origen hasta cada nodo descubierto.

Por ejemplo:

```text
Calceta → Tosagua = 12 km

gScore[Tosagua] = 12
```

Este valor siempre corresponde a la distancia efectivamente recorrida.

---

## Heurística h(n)

La heurística estima el costo restante hasta el destino.

Durante el MVP se utilizará:

```text
h(n)=0
```

Por lo tanto, el algoritmo se comportará como Dijkstra.

En versiones futuras podrá reemplazarse por una heurística basada en coordenadas geográficas sin modificar la arquitectura.

---

## fScore

Es el criterio utilizado para decidir cuál nodo explorar primero.

Se calcula mediante:

```text
f(n)=g(n)+h(n)
```

El algoritmo siempre selecciona el nodo cuyo `fScore` sea menor.

---

## cameFrom

Durante la búsqueda no se almacena el camino completo.

Únicamente se registra desde qué nodo se llegó a cada nodo.

Ejemplo:

```text
Tosagua ← Calceta

Chone ← Tosagua
```

Cuando el destino es encontrado, esta estructura permite reconstruir la ruta óptima recorriendo los padres en sentido inverso.

---

# 11. Resumen del Funcionamiento

El algoritmo ejecutará las siguientes etapas:

1. Construir el grafo a partir de las rutas recibidas.
2. Inicializar `openSet`, `closedSet`, `gScore`, `fScore` y `cameFrom`.
3. Seleccionar iterativamente el nodo con menor `fScore`.
4. Actualizar los costos de sus vecinos.
5. Finalizar cuando el destino sea extraído del `openSet`.
6. Reconstruir la ruta utilizando `cameFrom`.
7. Calcular la distancia total y el tiempo estimado.
8. Responder la solicitud HTTP con el resultado en formato JSON.

---

# 12. Consideraciones Finales

La arquitectura del proyecto mantiene una separación estricta de responsabilidades entre Node.js y Python.

El backend desarrollado en Node.js continúa siendo responsable de la lógica de negocio, la persistencia de la información, la validación de reglas del dominio y la orquestación del proceso logístico.

Por su parte, el módulo desarrollado en Python se limita exclusivamente al cálculo de rutas mediante el algoritmo A*, exponiendo una interfaz HTTP consumida por `python.service.js`, el cual actúa como adaptador entre ambos entornos.

Esta separación evita dependencias directas entre las tecnologías utilizadas y permite evolucionar cada componente de forma independiente.

Gracias a esta arquitectura será posible incorporar futuras mejoras, como nuevas heurísticas, algoritmos alternativos de búsqueda, optimizaciones de rendimiento o incluso el despliegue del servicio de cálculo de rutas en un proceso o servidor independiente, sin requerir modificaciones en la lógica de negocio implementada en Node.js.



