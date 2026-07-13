# Diseños

## Dashboard
```
Diseña una interfaz web profesional para el Dashboard de un sistema llamado TechSupply SCM.

Contexto:
TechSupply SCM es un sistema de gestión logística de salida para una distribuidora de productos tecnológicos. El Dashboard es la pantalla inicial del operador y debe ofrecer una visión general del estado actual de la operación logística.

Objetivo de la pantalla:
Mostrar indicadores operativos resumidos y accesos rápidos a los módulos principales del sistema. Esta pantalla no permite crear, editar ni eliminar datos; solo supervisar y navegar.

Estilo visual:
- Diseño limpio, moderno, profesional y empresarial.
- Inspirado en plataformas SaaS y paneles administrativos modernos.
- Mucho espacio en blanco.
- Tarjetas con bordes suaves y sombras sutiles.
- Esquinas redondeadas.
- Interfaz clara para uso operativo durante varias horas.
- No usar estilo futurista exagerado ni colores neón.

Paleta de colores:
- Primario: #1E3A8A
- Primario hover/acento: #2563EB
- Primario claro: #60A5FA
- Fondo general: #F8FAFC
- Superficie/tarjetas: #FFFFFF
- Bordes: #E5E7EB
- Texto principal: #1F2937
- Texto secundario: #6B7280
- Éxito: #22C55E
- Advertencia: #F59E0B
- Error: #EF4444
- Información: #0EA5E9

Estructura general:
La pantalla debe tener un layout de aplicación empresarial con:
1. Sidebar lateral izquierdo.
2. Barra superior o encabezado interno.
3. Área principal del Dashboard.

Sidebar:
Debe mostrar el nombre del sistema “TechSupply SCM” y navegación hacia:
- Dashboard
- Clientes
- Pedidos
- Ubicaciones
- Rutas
- Centro Logístico
- Despachos

El ítem Dashboard debe aparecer activo.

Encabezado del Dashboard:
Debe incluir:
- Título: “Dashboard”
- Subtítulo: “Resumen general de la operación logística”
- Un pequeño texto de contexto como “Vista operativa del módulo Outbound”
- Opcionalmente un botón secundario o visual para “Actualizar datos”, sin hacerlo dominante.

Indicadores principales:
Crear tarjetas de métricas en la parte superior. Cada tarjeta debe incluir:
- Ícono representativo
- Nombre del indicador
- Valor grande
- Descripción breve o estado

Indicadores requeridos:
1. Pedidos pendientes
2. Listos para despacho
3. Despachos activos
4. Entregados hoy

Indicadores secundarios:
Agregar una segunda fila o sección menos dominante con:
- Clientes registrados
- Ubicaciones registradas
- Rutas configuradas

Accesos rápidos:
Crear una sección llamada “Accesos rápidos” con tarjetas o botones grandes para:
- Gestión de Clientes
- Gestión de Pedidos
- Gestión de Ubicaciones
- Gestión de Rutas
- Centro de Operaciones Logísticas

Cada acceso debe tener:
- Ícono
- Título
- Descripción corta
- Apariencia clicable

Contenido visual adicional:
Puedes incluir una sección pequeña llamada “Estado operativo” o “Resumen de jornada” que muestre visualmente el flujo:
Pedidos registrados → Preparación → Listos para despacho → Despacho activo → Entregado

Restricciones:
- No incluir login.
- No incluir gráficos complejos.
- No incluir tablas grandes.
- No incluir formularios.
- No incluir funcionalidades de edición.
- No sobrecargar la pantalla.
- Priorizar claridad, lectura rápida y navegación.

Resultado esperado:
Una interfaz de Dashboard lista para ser usada como base visual del frontend React de TechSupply SCM.
```

---

## Gestión de Pedidos

```

Diseña la interfaz de la pantalla "Gestión de Pedidos" para TechSupply SCM.

IMPORTANTE

Esta pantalla pertenece al mismo sistema que el Dashboard previamente diseñado.

Debe conservar exactamente el mismo sistema de diseño ya establecido.

No modificar:

- Sidebar
- Topbar
- Footer
- Paleta de colores
- Tipografía
- Espaciados
- Bordes
- Sombras
- Estilo de botones
- Estilo de tarjetas
- Iconografía

La nueva pantalla debe sentirse como parte de la misma aplicación.

------------------------------------------------------------

Contexto

TechSupply SCM es un sistema de gestión logística Outbound para una distribuidora de productos tecnológicos.

El módulo Gestión de Pedidos constituye el punto de partida del proceso logístico.

Aquí únicamente se administra la información general del pedido.

Los productos se registrarán posteriormente en un Workspace independiente.

------------------------------------------------------------

Objetivo de la pantalla

Permitir al operador:

• Consultar pedidos
• Buscar pedidos
• Filtrar pedidos
• Editar pedidos
• Desactivar pedidos
• Acceder al Workspace de Detalles del Pedido

Esta pantalla NO crea productos.

Esta pantalla NO administra inventario.

Debe centrarse exclusivamente en la gestión administrativa de los pedidos.

------------------------------------------------------------

Encabezado

Mantener el mismo Topbar.

Contenido:

Título

Gestión de Pedidos

Subtítulo

Administración del ciclo de vida de los pedidos.

------------------------------------------------------------

Barra de herramientas

Ubicar una barra de acciones encima de la tabla.

Debe contener:

• Botón primario
Nuevo Pedido

• Campo de búsqueda

Buscar pedido...

• Selector por estado

Todos

Pendiente

Preparando

Listo para despacho

En despacho

Entregado

• Botón secundario

Limpiar filtros

La barra debe verse compacta y profesional.

------------------------------------------------------------

Indicadores rápidos

Sobre la tabla mostrar cuatro pequeños indicadores.

Pedidos pendientes

Preparando

Listos para despacho

Entregados

No deben competir visualmente con el Dashboard.

Solo sirven como referencia rápida.

------------------------------------------------------------

Tabla principal

La tabla debe ocupar la mayor parte de la pantalla.

Debe transmitir productividad.

Columnas:

N°

Pedido

Cliente

Vendedor

Fecha

Estado

Total

Acciones

Las filas deben ser limpias y fáciles de leer.

Utilizar mucho espacio en blanco.

------------------------------------------------------------

Estados

Representar mediante badges.

Pendiente

Preparando

Listo para despacho

En despacho

Entregado

Los colores deben seguir la identidad visual del sistema.

------------------------------------------------------------

Acciones

Cada fila debe incluir botones con iconos.

Editar

Workspace

Desactivar

El botón Workspace debe destacar ligeramente respecto a las demás acciones.

------------------------------------------------------------

Flujo operativo

En la parte superior derecha agregar una pequeña tarjeta.

Título:

Flujo del Pedido

Mostrar visualmente:

Cliente

↓

Pedido

↓

Workspace

↓

Despacho

↓

Entrega

Debe ser muy minimalista.

------------------------------------------------------------

Paginación

En la parte inferior incluir:

Selector de registros por página.

Información:

Mostrando 1–10 de 254 pedidos.

Controles modernos de paginación.

------------------------------------------------------------

No diseñar

No crear formularios.

No crear modales.

No crear ventanas emergentes.

No diseñar el Workspace.

No mostrar productos del pedido.

------------------------------------------------------------

Experiencia de usuario

La tabla debe ser el elemento dominante.

La navegación debe ser muy rápida.

La pantalla debe sentirse como una herramienta empresarial utilizada diariamente por operadores logísticos.

------------------------------------------------------------

Resultado esperado

Una interfaz completamente coherente con el Dashboard existente, lista para ser transformada posteriormente en componentes React reutilizables.

```


## Emergente 1

```

Diseña la interfaz de la pantalla "Nuevo Pedido" para TechSupply SCM.

IMPORTANTE

Esta pantalla pertenece al mismo sistema ya diseñado.

Debe conservar exactamente:

- Sidebar
- Topbar
- Footer
- Paleta de colores
- Tipografía
- Espaciados
- Bordes
- Sombras
- Estilo de botones
- Estilo de tarjetas
- Iconografía

No reinventar el diseño.

------------------------------------------------------------

Contexto

TechSupply SCM es un sistema de gestión logística Outbound.

La pantalla Nuevo Pedido inicia el flujo comercial y logístico del sistema.

En esta pantalla solo se registra la información general del pedido.

Los productos NO se agregan aquí.

Los productos se agregarán después en el Workspace de Detalles del Pedido.

------------------------------------------------------------

Objetivo

Permitir al operador crear un nuevo pedido seleccionando el cliente y registrando observaciones generales.

Después de guardar, el sistema redirigirá automáticamente al Workspace de Detalles del Pedido.

------------------------------------------------------------

Encabezado

Mantener el mismo Topbar.

Contenido:

Título:

Nuevo Pedido

Subtítulo:

Registro inicial del pedido antes de agregar productos.

------------------------------------------------------------

Estructura de la pantalla

Diseñar una pantalla limpia y enfocada.

Debe tener una tarjeta principal de formulario.

También puede tener una tarjeta lateral informativa del flujo.

Distribución sugerida:

Columna principal:
Formulario Nuevo Pedido

Columna lateral:
Resumen del flujo operativo

------------------------------------------------------------

Formulario

Campos:

1. Cliente

Tipo:
Select o buscador de clientes

Placeholder:
Seleccionar cliente

Debe verse como un campo importante.

2. Fecha del pedido

No editable.

Mostrar:
Fecha generada automáticamente por el sistema.

Ejemplo:
Hoy, 05 de julio de 2026

3. Responsable

No editable.

Mostrar:
Usuario actual autenticado.

Ejemplo:
Admin Usuario

4. Observaciones

Tipo:
Textarea

Placeholder:
Agregar observaciones generales del pedido...

------------------------------------------------------------

Acciones

Botones al final del formulario:

Cancelar

Guardar Pedido

El botón Guardar Pedido debe ser primario y dominante.

El botón Cancelar debe ser secundario.

------------------------------------------------------------

Tarjeta lateral

Título:
Continuidad del proceso

Mostrar visualmente:

Crear Pedido
↓
Toast de confirmación
↓
Workspace de Detalles
↓
Agregar productos
↓
Pedido listo para despacho

Incluir una pequeña nota:

"Los productos se registrarán en el Workspace después de guardar el pedido."

------------------------------------------------------------

Restricciones

No incluir productos.

No incluir tabla.

No incluir modal.

No incluir selector de vendedor.

No permitir editar la fecha.

No crear gráficos complejos.

No sobrecargar la pantalla.

------------------------------------------------------------

Experiencia de usuario

La pantalla debe sentirse como el inicio de un proceso guiado.

Debe ser simple, clara y profesional.

El operador debe entender que crear el pedido es solo el primer paso antes de agregar productos.

------------------------------------------------------------

Resultado esperado

Una interfaz coherente con Dashboard y Gestión de Pedidos, lista para convertirse en componentes React reutilizables.

```

## Workspace

```

Diseña la interfaz de la pantalla "Workspace de Detalles de Pedido" para TechSupply SCM.

IMPORTANTE

Esta pantalla pertenece al mismo sistema previamente diseñado.

Debe conservar exactamente:

- Sidebar
- Topbar
- Footer
- Paleta de colores
- Tipografía
- Espaciados
- Bordes
- Sombras
- Estilo de botones
- Estilo de tarjetas
- Iconografía
- Identidad visual del Dashboard, Gestión de Pedidos y Nuevo Pedido

No modificar el diseño general del sistema.

La interfaz debe sentirse como una continuación natural del flujo existente.

------------------------------------------------------------

Contexto

TechSupply SCM es un sistema de gestión logística Outbound para una distribuidora de productos tecnológicos.

El Workspace de Detalles de Pedido constituye el núcleo operativo del proceso comercial.

Aquí el operador construye completamente el contenido del pedido incorporando los productos que posteriormente serán preparados y despachados.

Esta pantalla NO administra información general del pedido.

Esta pantalla NO administra clientes.

Esta pantalla NO ejecuta procesos logísticos.

Su responsabilidad es administrar exclusivamente los productos asociados al pedido.

------------------------------------------------------------

Objetivo

Permitir al operador completar la construcción del pedido desde una única pantalla de trabajo.

El operador debe poder:

- consultar productos;
- agregar nuevos productos;
- modificar únicamente la cantidad;
- eliminar productos;
- visualizar el resumen actualizado del pedido;
- guardar el avance del trabajo;
- finalizar el pedido cuando esté completamente preparado.

Toda la experiencia debe desarrollarse sin abandonar el Workspace.

------------------------------------------------------------

Concepto del Workspace

Esta pantalla NO es un CRUD tradicional.

Debe transmitir la sensación de un entorno de trabajo continuo.

Toda la edición ocurre dentro de una única pantalla.

Cada modificación debe reflejarse inmediatamente en la interfaz.

El operador puede permanecer aquí durante varios minutos preparando un pedido completo.

------------------------------------------------------------

Estados del pedido

El pedido llega inicialmente al Workspace con estado:

PENDIENTE

Mientras el pedido permanezca en este estado el operador puede comenzar a incorporar productos.

Debe existir un botón:

Guardar cambios

Su comportamiento esperado es:

- almacenar toda la información del Workspace;
- si el pedido estaba en estado PENDIENTE, cambiarlo automáticamente a PREPARANDO;
- si ya estaba en PREPARANDO, simplemente guardar el avance manteniendo ese estado.

El estado PREPARANDO representa que el pedido aún continúa en construcción y podrá abrirse nuevamente para seguir trabajando.

Debe existir una segunda acción principal:

Finalizar Pedido

Su comportamiento esperado es:

- validar que el pedido esté listo;
- cambiar el estado a LISTO PARA DESPACHO;
- cerrar la edición del Workspace;
- impedir modificaciones posteriores;
- dejar el pedido disponible para el Centro de Operaciones Logísticas.

Visualmente debe quedar muy clara la diferencia entre ambas acciones.

Guardar cambios

→ Guarda el avance y mantiene el pedido editable.

Finalizar Pedido

→ Cierra definitivamente la edición y libera el pedido para despacho.

------------------------------------------------------------

Encabezado del Workspace

Mantener el mismo Topbar del sistema.

Dentro del contenido principal mostrar un encabezado propio del pedido.

Debe incluir:

- Número del pedido
- Cliente
- Responsable
- Fecha
- Estado actual mediante un Badge
- Texto descriptivo:

"Construcción del pedido antes del proceso logístico."

------------------------------------------------------------

Distribución general

Organizar la pantalla en tres zonas claramente diferenciadas.

1. Encabezado del pedido.

2. Workspace principal.

3. Barra inferior de acciones.

La distribución debe ser similar a:

Encabezado del Pedido

Panel Resumen | Área Principal de Trabajo

Barra inferior

------------------------------------------------------------

Panel Resumen

Ubicar un panel lateral izquierdo.

Debe permanecer visible durante toda la edición.

Mostrar:

Cliente

Estado

Cantidad de productos

Cantidad total de unidades

Total del pedido

Debajo incluir un pequeño flujo visual:

Pedido

↓

Workspace

↓

Listo para despacho

↓

Centro Logístico

↓

Despacho

Este flujo debe ser muy limpio y discreto.

------------------------------------------------------------

Área principal

Debe ocupar aproximadamente el 70 % del espacio disponible.

Debe contener:

- Tabla de productos.
- Formulario integrado.
- Mensaje informativo sobre el guardado.

------------------------------------------------------------

Tabla de productos

Diseñar una tabla moderna y profesional.

Columnas:

Producto

Cantidad

Precio Unitario

Subtotal

Acciones

Acciones por fila:

Editar cantidad

Eliminar producto

Las acciones deben ser pequeñas y elegantes.

------------------------------------------------------------

Formulario integrado

Ubicar inmediatamente debajo de la tabla.

Debe formar parte del Workspace.

Nunca abrir un modal.

Campos:

Producto

Select con buscador.

Cantidad

Input numérico.

Precio Unitario

Solo lectura.

Debe cargarse automáticamente al seleccionar el producto.

Subtotal estimado

Solo lectura.

Debe actualizarse automáticamente.

Botones:

Guardar Producto

Cancelar

Cuando el usuario edite un producto, el formulario debe indicar claramente que está trabajando en modo edición.

------------------------------------------------------------

Persistencia

Mostrar un pequeño mensaje informativo.

Ejemplo:

"Cada producto agregado o editado se almacena inmediatamente en el sistema."

No utilizar colores de advertencia.

Debe parecer una ayuda del sistema.

------------------------------------------------------------

Barra inferior de acciones

Ubicar una barra fija al final del Workspace.

Izquierda:

Volver al listado

Derecha:

Guardar cambios

Finalizar Pedido

Guardar cambios debe ser un botón secundario.

Finalizar Pedido debe ser el botón principal de la pantalla.

Debajo del botón principal agregar un pequeño texto de ayuda.

Ejemplo:

"Finalizar marcará el pedido como LISTO PARA DESPACHO."

------------------------------------------------------------

Restricciones

No utilizar ventanas modales.

No crear pantallas adicionales.

No permitir editar cliente.

No permitir editar responsable.

No permitir editar fecha.

No incluir funcionalidades de despacho.

No incluir mapas.

No incluir cálculo de rutas.

No incluir información ajena al pedido.

No sobrecargar visualmente la interfaz.

------------------------------------------------------------

Experiencia de usuario

La pantalla debe transmitir continuidad, productividad y control.

El operador debe sentir que está trabajando dentro de un Workspace profesional.

Toda la información importante debe permanecer visible.

La edición debe sentirse fluida.

El resumen debe actualizarse visualmente.

La diferencia entre Guardar cambios y Finalizar Pedido debe ser evidente.

------------------------------------------------------------

Resultado esperado

Diseñar el Workspace principal de TechSupply SCM listo para convertirse posteriormente en componentes React reutilizables, manteniendo la misma identidad visual de todas las pantallas anteriores y priorizando la productividad del operador durante la preparación del pedido.

```

## Logistica

```

Diseña la interfaz del módulo "Centro de Operaciones Logísticas" para TechSupply SCM.

IMPORTANTE

Esta pantalla pertenece al mismo sistema previamente diseñado.

Debe conservar exactamente:

- Sidebar
- Topbar
- Footer
- Paleta de colores
- Tipografía
- Espaciados
- Bordes
- Sombras
- Estilo de botones
- Estilo de tablas
- Estilo de badges
- Iconografía
- Identidad visual del Dashboard, Gestión de Pedidos, Nuevo Pedido y Workspace

No reinventar el diseño general.

La pantalla debe sentirse como la etapa final natural del flujo:

Dashboard
→ Gestión de Pedidos
→ Workspace de Detalles
→ Pedido listo para despacho
→ Centro de Operaciones Logísticas
→ Despacho

------------------------------------------------------------

Contexto

TechSupply SCM es un sistema de gestión logística Outbound para una distribuidora de productos tecnológicos.

El Centro de Operaciones Logísticas representa la etapa donde el operador inicia y supervisa la distribución de pedidos preparados.

En este módulo el operador no calcula rutas, no ejecuta algoritmos manualmente y no conoce los procesos internos del backend.

El backend se encarga de:

- validar el pedido;
- crear el despacho;
- calcular la ruta óptima;
- actualizar estados;
- devolver el resumen de la operación.

El frontend únicamente:

- muestra información;
- permite seleccionar acciones;
- envía solicitudes;
- muestra estados de carga;
- presenta resultados;
- actualiza la interfaz.

------------------------------------------------------------

Objetivo de la pantalla

Permitir al operador:

- consultar pedidos disponibles para despacho;
- crear nuevos despachos;
- consultar despachos registrados;
- visualizar el estado operativo de cada despacho;
- ejecutar acciones según el estado;
- revisar el resumen generado por el backend.

------------------------------------------------------------

Estructura general

Diseñar una pantalla principal con dos vistas internas mediante tabs o pestañas:

1. Pedidos Disponibles
2. Gestión de Despachos

La pestaña activa inicial debe ser:

Pedidos Disponibles

Ambas vistas deben compartir la misma estructura visual:

- Encabezado del módulo
- Indicadores resumidos
- Barra de búsqueda y filtros
- Tabla principal
- Paginación o estado del listado

------------------------------------------------------------

Encabezado del módulo

Mostrar dentro del contenido principal:

Título:

Centro de Operaciones Logísticas

Subtítulo:

Administra la creación y seguimiento de despachos del módulo Outbound.

Agregar un pequeño texto de contexto:

Planificación logística gestionada por backend.

Puede incluir un botón secundario:

Actualizar datos

------------------------------------------------------------

Indicadores superiores

Mostrar cuatro tarjetas pequeñas de resumen operativo:

1. Pedidos listos para despacho
2. Despachos creados
3. Despachos en tránsito
4. Entregados

Deben ser más discretas que las tarjetas del Dashboard.

Usar íconos logísticos:

- caja lista
- camión
- ruta
- check de entrega

------------------------------------------------------------

Vista 1: Pedidos Disponibles

Objetivo:

Mostrar únicamente pedidos que ya están en estado LISTO PARA DESPACHO y pueden iniciar distribución.

Barra de acciones:

- Buscador: "Buscar pedido o cliente..."
- Filtro de estado: "Listos para despacho"
- Botón: "Actualizar"

Tabla de pedidos disponibles:

Columnas:

- Pedido
- Cliente
- Fecha
- Productos
- Total
- Estado
- Acción

Cada fila debe tener una única acción principal:

Crear Despacho

El botón Crear Despacho debe destacar, pero sin ser demasiado agresivo.

Cuando el usuario presione Crear Despacho, la interfaz debe sugerir visualmente:

- estado de carga;
- botón deshabilitado;
- texto tipo "Planificando ruta...";
- spinner pequeño.

No crear una pantalla nueva para este proceso.

------------------------------------------------------------

Estado vacío

Diseñar también un estado vacío elegante para cuando no existan pedidos disponibles.

Texto:

No existen pedidos disponibles para iniciar un despacho.

Subtexto:

Cuando un pedido sea marcado como listo para despacho aparecerá en esta sección.

Debe incluir un ícono de caja o camión en estilo suave.

------------------------------------------------------------

Resultado de creación de despacho

Después de crear un despacho, el sistema debe mostrar un cuadro de resumen o panel informativo.

Puede ser un modal elegante o una tarjeta destacada.

Título:

Despacho generado correctamente

Datos a mostrar:

- Número de despacho
- Pedido asociado
- Cliente
- Ruta asignada
- Distancia total estimada
- Estado inicial: CREADO

Botón:

Aceptar

Importante:

El botón Aceptar solo cierra el resumen.
No debe parecer que ejecuta una nueva operación.

------------------------------------------------------------

Vista 2: Gestión de Despachos

Objetivo:

Permitir consultar y administrar los despachos registrados.

Barra de acciones:

- Buscador: "Buscar despacho, pedido o cliente..."
- Filtro por estado:
  - Todos
  - Creado
  - En tránsito
  - Entregado
  - Cancelado
- Botón Actualizar

Tabla de despachos:

Columnas:

- Despacho
- Pedido
- Cliente
- Fecha
- Ruta asignada
- Estado
- Acciones

Estados del despacho mediante badges:

CREADO
EN TRÁNSITO
ENTREGADO
CANCELADO

Colores sugeridos:

- CREADO: azul / información
- EN TRÁNSITO: amarillo / advertencia
- ENTREGADO: verde / éxito
- CANCELADO: rojo / error

------------------------------------------------------------

Acciones por despacho

Las acciones deben depender visualmente del estado.

Para estado CREADO:

- Ver resumen
- Iniciar despacho
- Cancelar

Para estado EN TRÁNSITO:

- Ver resumen
- Marcar entregado

Para estado ENTREGADO:

- Ver resumen

Para estado CANCELADO:

- Ver resumen

Mostrar las acciones como botones pequeños con íconos, discretos y profesionales.

No mostrar acciones que no correspondan al estado.

------------------------------------------------------------

Resumen del despacho

Diseñar un resumen visual para consultar información del despacho.

Debe incluir:

- Número de despacho
- Pedido asociado
- Cliente
- Ruta asignada
- Distancia total
- Estado actual
- Fecha de creación

También puede incluir una pequeña línea visual del flujo:

Creado
→ En tránsito
→ Entregado

Si está cancelado, mostrarlo como estado final alternativo.

------------------------------------------------------------

Experiencia de usuario

La pantalla debe sentirse como una estación de trabajo logística.

Debe ser clara, rápida y orientada a procesos.

El operador debe poder:

- identificar pedidos listos;
- crear despachos con una sola acción;
- ver el resultado sin conocer detalles técnicos;
- dar seguimiento a despachos existentes;
- actuar solo cuando el estado lo permita.

Evitar saturar la interfaz.

La tabla debe ser el elemento principal.

Los indicadores ayudan, pero no deben dominar la pantalla.

------------------------------------------------------------

Restricciones

No incluir mapas.

No incluir cálculo manual de rutas.

No mostrar detalles técnicos del algoritmo A*.

No mostrar código ni estructuras JSON.

No incluir formularios largos.

No incluir edición manual de rutas.

No crear pantallas adicionales.

No cambiar Sidebar, Topbar ni Footer.

No agregar módulos nuevos al menú.

------------------------------------------------------------

Microinteracciones esperadas

Incluir visualmente:

- spinner pequeño durante Crear Despacho;
- botones deshabilitados durante procesamiento;
- badges claros de estado;
- resumen posterior a la creación;
- confirmación visual de acciones críticas;
- estados vacíos elegantes.

------------------------------------------------------------

Resultado esperado

Una interfaz profesional, empresarial y coherente con el resto de TechSupply SCM.

Debe quedar lista para ser transformada posteriormente en componentes React reutilizables dentro del módulo logistica.

La pantalla debe representar claramente el flujo:

Pedidos disponibles
→ Crear despacho
→ Backend planifica logística
→ Mostrar resumen
→ Gestión y seguimiento del despacho

```

## Despachos

```

Diseña la interfaz del módulo "Despachos" para TechSupply SCM.

IMPORTANTE

Esta pantalla pertenece al mismo sistema previamente diseñado.

Debe conservar exactamente:

- Sidebar
- Topbar
- Footer
- Paleta de colores
- Tipografía
- Componentes
- Tablas
- Badges
- Botones
- Espaciados
- Sombras
- Bordes

No modificar la identidad visual del sistema.

------------------------------------------------------------

Contexto

TechSupply SCM administra la logística de salida de una distribuidora de productos tecnológicos.

El módulo Centro de Operaciones Logísticas es el encargado de crear y administrar los despachos activos.

Este módulo "Despachos" NO ejecuta operaciones logísticas.

Su objetivo es servir como centro de consulta, seguimiento e historial de todos los despachos registrados.

Debe sentirse como una pantalla administrativa y de consulta.

------------------------------------------------------------

Objetivo

Permitir consultar cualquier despacho registrado.

El operador podrá:

- buscar despachos;
- revisar información completa;
- consultar estados;
- visualizar la ruta utilizada;
- revisar tiempos estimados;
- consultar historial.

La pantalla prioriza la lectura y el seguimiento de la operación.

------------------------------------------------------------

Encabezado

Título:

Despachos

Subtítulo:

Consulta y seguimiento histórico de los despachos registrados.

Texto de apoyo:

Todos los despachos generados por el Centro de Operaciones Logísticas se encuentran disponibles para consulta.

Botón secundario:

Actualizar

------------------------------------------------------------

Indicadores superiores

Mostrar cuatro tarjetas pequeñas:

Despachos registrados

Pendientes

En tránsito

Entregados

No deben dominar la pantalla.

------------------------------------------------------------

Barra de herramientas

Buscador:

Buscar despacho, pedido o cliente...

Filtros:

Estado

Todos

Pendiente

En tránsito

Entregado

Cancelado

Rango de fechas

Hoy

Esta semana

Este mes

Personalizado

Botón:

Actualizar

------------------------------------------------------------

Tabla principal

Columnas

Despacho

Pedido

Cliente

Fecha de creación

Ruta

Distancia

Tiempo estimado

Estado

Acciones

------------------------------------------------------------

Estados

Utilizar badges consistentes con el resto del sistema.

Pendiente

Azul

En tránsito

Amarillo

Entregado

Verde

Cancelado

Rojo

------------------------------------------------------------

Acciones

Esta pantalla NO administra el despacho.

Solo consulta información.

Mostrar únicamente:

Ver resumen

Ver ruta

Si el despacho aún está activo:

Ir al Centro Logístico

Este botón representa un acceso rápido al módulo operativo.

No incluir:

Cancelar

Iniciar ruta

Entregar

Esas operaciones pertenecen exclusivamente al Centro de Operaciones Logísticas.

------------------------------------------------------------

Modal Ver Resumen

Mostrar:

Número del despacho

Pedido asociado

Cliente

Responsable

Fecha

Estado

Distancia

Tiempo estimado

Ruta utilizada

Resumen visual del flujo:

Pendiente

↓

En tránsito

↓

Entregado

Si el despacho fue cancelado, mostrar Cancelado como estado final.

------------------------------------------------------------

Modal Ver Ruta

Mostrar una representación sencilla de la ruta.

No utilizar mapas.

Representar el recorrido mediante tarjetas conectadas por flechas.

Ejemplo:

Bodega Central

↓

Portoviejo

↓

Santa Ana

↓

Cliente

Cada punto debe mostrarse como una tarjeta pequeña.

------------------------------------------------------------

Estado vacío

Cuando no existan despachos.

Mostrar un diseño elegante.

Texto:

No existen despachos registrados.

Subtexto:

Los despachos creados desde el Centro de Operaciones Logísticas aparecerán aquí automáticamente.

------------------------------------------------------------

Experiencia

Debe sentirse como un historial administrativo.

Mucho espacio en blanco.

Tabla protagonista.

Lectura rápida.

Consulta sencilla.

No saturar.

No mostrar gráficos.

No mostrar mapas.

No mostrar formularios.

------------------------------------------------------------

Resultado esperado

Una pantalla profesional orientada a consulta, auditoría y seguimiento histórico de los despachos del sistema, complementando al Centro de Operaciones Logísticas sin duplicar responsabilidades.

```



frontend/src/modules/rutas/
├── components/
│   ├── RutasBanner.jsx
│   ├── RutasMetrics.jsx
│   ├── RutasTabs.jsx
│   │
│   ├── mapa/
│   │   ├── MapaGeneralJornadas.jsx
│   │   ├── JornadasMapaPanel.jsx
│   │   ├── JornadaMapaCard.jsx
│   │   └── MapaGeneralLegend.jsx
│   │
│   ├── catalogo/
│   │   ├── RutasToolbar.jsx
│   │   ├── RutasTable.jsx
│   │   ├── RutaFormModal.jsx
│   │   └── RutaDetailModal.jsx
│   │
│   └── camiones/
│       ├── CamionesMetrics.jsx
│       ├── CamionesToolbar.jsx
│       ├── CamionesTable.jsx
│       └── CamionResumenModal.jsx
│
├── pages/
│   └── RutasPage.jsx
│
├── services/
│   └── rutas.service.js
│
└── rutas.css






---

## Rutas

Diseña la interfaz completa del módulo "Rutas" para TechSupply SCM.

IMPORTANTE

Esta pantalla pertenece al mismo sistema previamente diseñado.

Debe conservar exactamente:

- Sidebar
- Topbar
- Footer
- Paleta de colores
- Tipografía
- Componentes
- Tablas
- Badges
- Botones
- Espaciados
- Sombras
- Bordes
- Densidad visual
- Estilo SaaS empresarial

No modificar la identidad visual del sistema.

No crear una interfaz aislada.

Debe sentirse como una evolución natural de las pantallas ya diseñadas para:

- Dashboard
- Pedidos
- Workspace de Pedido
- Centro de Operaciones Logísticas
- Detalle de Jornada
- Despachos

------------------------------------------------------------

Contexto

TechSupply SCM administra la logística de salida de una distribuidora de productos tecnológicos.

El módulo "Rutas" funciona como centro de visualización geográfica y consulta de infraestructura logística.

Este módulo no genera jornadas.

Este módulo no ejecuta entregas.

Este módulo no cambia el estado operativo de pedidos o despachos.

La generación, inicio, avance y finalización de jornadas pertenece exclusivamente al Centro de Operaciones Logísticas.

El módulo Rutas debe permitir:

- visualizar todas las jornadas sobre un mapa general;
- consultar recorridos activos y planificados;
- revisar la posición actual de los camiones;
- consultar el catálogo de conexiones entre ubicaciones;
- consultar la disponibilidad y capacidad de los camiones.

------------------------------------------------------------

Objetivo principal

Crear una pantalla profesional de monitoreo logístico con tres pestañas internas:

1. Mapa general
2. Catálogo de rutas
3. Camiones

La pestaña activa por defecto debe ser:

Mapa general

------------------------------------------------------------

Encabezado superior

No incluir un encabezado grande ni redundante si el Topbar ya muestra el nombre del módulo.

Mostrar únicamente una franja informativa compacta.

Contenido:

Icono relacionado con ubicación, monitoreo o ruta.

Título:

Monitoreo logístico y red de rutas

Texto:

Visualiza las jornadas, recorridos, ubicaciones y camiones disponibles dentro de la operación Outbound.

Badge pequeño:

Monitoreo en tiempo real

La franja debe ser elegante, horizontal, poco alta y consistente con el banner de inteligencia logística utilizado en el Centro de Operaciones.

------------------------------------------------------------

Indicadores superiores

Mostrar cuatro tarjetas compactas.

Usar el mismo estilo horizontal de tarjetas ya utilizado en el sistema:

- icono a la izquierda;
- texto y valor a la derecha;
- baja altura;
- distribución uniforme.

Indicadores:

Jornadas visibles

Camiones en ruta

Camiones en bodega

Rutas registradas

No deben dominar la pantalla.

------------------------------------------------------------

Pestañas internas

Mostrar tres pestañas:

Mapa general

Catálogo de rutas

Camiones

Cada pestaña debe tener:

- icono;
- texto;
- contador cuando corresponda;
- estado activo claramente visible;
- mismo patrón visual utilizado en el Centro de Operaciones Logísticas.

------------------------------------------------------------

PESTAÑA 1

Mapa general

------------------------------------------------------------

Objetivo

Mostrar todas las jornadas activas y planificadas sobre un mapa general.

Debe permitir identificar rápidamente:

- bodega central;
- rutas asignadas;
- camiones;
- puntos de entrega;
- recorrido completado;
- recorrido pendiente;
- estado de cada jornada.

------------------------------------------------------------

Distribución principal

Usar una composición de dos columnas.

Columna izquierda:

Mapa general.

Debe ocupar aproximadamente entre 65 % y 70 % del ancho.

Columna derecha:

Panel de jornadas.

Debe ocupar aproximadamente entre 30 % y 35 % del ancho.

La altura visual debe ser equilibrada.

El mapa debe ser el elemento protagonista.

------------------------------------------------------------

Mapa general

Mostrar un mapa grande con:

- bodega central;
- todas las jornadas PLANIFICADAS;
- todas las jornadas EN RUTA;
- ruta de cada camión;
- posición actual de cada camión;
- puntos de entrega;
- recorrido completado;
- recorrido pendiente.

La ruta completada debe mostrarse con línea sólida.

La ruta pendiente debe mostrarse con línea punteada.

Cada jornada puede usar una variación visual distinta, pero debe mantenerse dentro de la identidad del sistema.

No utilizar colores neón.

No saturar el mapa.

------------------------------------------------------------

Marcadores del mapa

Bodega:

Marcador claramente identificable.

Camión:

Marcador con icono de camión.

Punto de entrega:

Marcador numerado según el orden de entrega.

Punto completado:

Mostrar check.

Punto actual:

Mostrar énfasis visual.

Punto pendiente:

Mostrar estilo neutro.

------------------------------------------------------------

Interacción del mapa

Al seleccionar una jornada en el panel lateral:

- resaltar su ruta;
- reducir visualmente el protagonismo de las demás;
- centrar el mapa sobre esa jornada;
- mostrar sus puntos de entrega;
- mostrar la posición actual del camión.

Al seleccionar un camión:

Mostrar una pequeña tarjeta o popup con:

- código del camión;
- placa;
- estado;
- jornada asociada;
- punto actual;
- pedidos pendientes;
- distancia restante;
- botón "Ver jornada".

El botón "Ver jornada" debe navegar al detalle operativo de la jornada.

------------------------------------------------------------

Leyenda del mapa

Mostrar una leyenda compacta.

Elementos:

- recorrido completado;
- recorrido pendiente;
- bodega;
- camión;
- punto de entrega;
- punto actual;
- punto completado.

Debe ubicarse dentro de una franja inferior del mapa o como panel flotante discreto.

------------------------------------------------------------

Panel lateral de jornadas

Encabezado:

Jornadas activas

Subtexto:

Seguimiento de recorridos planificados y en ejecución.

Controles:

- buscador;
- filtro por estado;
- botón actualizar.

Buscador:

Buscar jornada, camión o ubicación...

Filtros:

Todas

Planificadas

En ruta

Finalizadas

La vista principal puede mostrar solo PLANIFICADA y EN RUTA, pero debe existir el filtro para consulta.

------------------------------------------------------------

Tarjeta de jornada

Cada jornada debe mostrarse como una tarjeta compacta.

Contenido:

Código de jornada

Camión

Placa

Estado

Cantidad de despachos

Cantidad de puntos

Distancia total

Tiempo estimado

Punto actual

Progreso

Mostrar una barra de progreso pequeña.

Ejemplo:

JR-00003

CAM-003 · MAB-1003

EN RUTA

4 despachos · 3 puntos

Punto actual: 2

Progreso: 50 %

Acciones:

- Centrar en mapa
- Ver jornada

No incluir:

- Iniciar
- Avanzar
- Finalizar
- Entregar
- No entregado
- Recalcular

Esas acciones pertenecen al Centro de Operaciones Logísticas.

------------------------------------------------------------

Estados visuales

PLANIFICADA

Badge informativo.

EN RUTA

Badge de advertencia o actividad.

FINALIZADA

Badge de éxito.

CANCELADA

Badge de error.

------------------------------------------------------------

Estado vacío del mapa

Cuando no existan jornadas activas:

Mostrar el mapa con la bodega central.

Mostrar una tarjeta informativa:

No existen jornadas activas.

Subtexto:

Las jornadas planificadas o en ruta aparecerán aquí automáticamente.

Botón:

Ir al Centro Logístico

------------------------------------------------------------

Error del mapa

Diseñar un estado alternativo cuando el mapa no pueda cargarse.

Mostrar:

Icono de mapa no disponible.

Título:

No fue posible cargar el mapa.

Texto:

Puedes continuar consultando las jornadas desde el panel lateral.

Botón:

Reintentar

No dejar la pantalla en blanco.

------------------------------------------------------------

PESTAÑA 2

Catálogo de rutas

------------------------------------------------------------

Objetivo

Administrar y consultar las conexiones registradas entre ubicaciones.

Este catálogo representa la red logística base utilizada por el backend y el algoritmo de optimización.

No mostrar jornadas en esta pestaña.

------------------------------------------------------------

Barra de herramientas

Buscador:

Buscar origen, destino o distancia...

Filtros:

Origen

Destino

Estado

Botón principal:

Nueva ruta

Botón secundario:

Actualizar

------------------------------------------------------------

Tabla principal

Columnas:

Ruta

Origen

Destino

Distancia

Estado

Fecha de registro

Acciones

Ejemplo:

RUT-0001

Bodega Central Calceta

Chone

74,50 km

Activa

11/07/2026

------------------------------------------------------------

Acciones de tabla

Mostrar:

- Ver detalle
- Editar
- Desactivar

No eliminar físicamente.

Usar confirmación antes de desactivar.

------------------------------------------------------------

Modal Nueva Ruta

Campos:

Ubicación de origen

Ubicación de destino

Distancia en kilómetros

Estado

Validaciones visuales:

- origen obligatorio;
- destino obligatorio;
- origen y destino no pueden ser iguales;
- distancia mayor a cero.

Botones:

Cancelar

Guardar ruta

------------------------------------------------------------

Modal Editar Ruta

Mostrar los mismos campos.

Botones:

Cancelar

Guardar cambios

------------------------------------------------------------

Modal Ver Detalle

Mostrar:

Código

Origen

Destino

Distancia

Estado

Fecha de creación

Fecha de actualización

No utilizar mapa.

Mostrar una representación sencilla:

Origen

flecha

Destino

------------------------------------------------------------

Confirmación Desactivar Ruta

Utilizar el mismo patrón visual de ConfirmDialog utilizado en el sistema.

Contenido:

Título:

Desactivar ruta

Mensaje:

La ruta dejará de estar disponible para nuevas planificaciones, pero se conservará en el historial.

Botones:

Cancelar

Desactivar

Variant:

warning o danger

------------------------------------------------------------

Estado vacío del catálogo

Título:

No existen rutas registradas.

Subtexto:

Las conexiones entre ubicaciones aparecerán aquí.

Botón:

Registrar primera ruta

------------------------------------------------------------

PESTAÑA 3

Camiones

------------------------------------------------------------

Objetivo

Consultar los camiones disponibles dentro de la operación logística.

Esta pestaña es únicamente informativa.

No crear camiones.

No editar camiones.

No eliminar camiones.

No mostrar formularios.

------------------------------------------------------------

Barra de herramientas

Buscador:

Buscar camión, placa o estado...

Filtros:

Estado

Todos

En bodega

Asignado

En ruta

Fuera de servicio

Capacidad

Todos

Con capacidad disponible

Capacidad completa

Botón:

Actualizar

------------------------------------------------------------

Indicadores de la pestaña

Mostrar tres tarjetas compactas:

Camiones registrados

Disponibles en bodega

En ruta

Capacidad total disponible

------------------------------------------------------------

Tabla de camiones

Columnas:

Camión

Placa

Capacidad máxima

Pedidos asignados

Capacidad disponible

Estado

Jornada asociada

Última actualización

Acciones

------------------------------------------------------------

Ejemplo de fila

CAM-001

MAB-1001

5 pedidos

5 asignados

0 disponibles

PLANIFICADA

JR-00001

Hace 2 minutos

------------------------------------------------------------

Estados de camión

EN_BODEGA

Badge de éxito o disponibilidad.

ASIGNADO

Badge informativo.

EN_RUTA

Badge de advertencia.

FUERA_DE_SERVICIO

Badge de error.

------------------------------------------------------------

Capacidad

Mostrar una barra de capacidad pequeña.

Ejemplo:

3 de 5 pedidos

60 %

Si está lleno:

Mostrar badge:

Capacidad completa

Si tiene espacio:

Mostrar:

2 espacios disponibles

------------------------------------------------------------

Acciones de camiones

Mostrar únicamente:

- Ver resumen
- Ver jornada asociada
- Centrar en mapa

"Ver jornada asociada" solo aparece si existe una jornada.

"Centrar en mapa" cambia a la pestaña Mapa general y enfoca el camión.

No incluir:

- Crear camión
- Editar camión
- Eliminar camión
- Cambiar estado manualmente
- Asignar pedidos manualmente

------------------------------------------------------------

Modal Ver Resumen de Camión

Mostrar:

Código

Placa

Capacidad máxima

Pedidos asignados

Capacidad disponible

Estado

Jornada asociada

Fecha de última actualización

Resumen de ocupación

Representación visual:

Capacidad utilizada

Capacidad disponible

Si tiene jornada:

Mostrar botón:

Ver jornada

------------------------------------------------------------

Estado vacío de camiones

Título:

No existen camiones registrados.

Subtexto:

Los camiones configurados en el sistema aparecerán aquí para consulta.

No mostrar botón de creación.

------------------------------------------------------------

Diálogos y mensajes

Utilizar el mismo sistema visual ya existente.

ConfirmDialog para:

- desactivar ruta;
- abandonar un formulario con cambios;
- guardar cambios importantes si fuera necesario.

Mensajes temporales laterales para:

- ruta creada;
- ruta actualizada;
- ruta desactivada;
- datos actualizados;
- error al cargar;
- error al guardar.

Los mensajes temporales deben aparecer en la esquina superior derecha.

No utilizar alertas nativas del navegador.

No utilizar window.alert.

No utilizar window.confirm.

------------------------------------------------------------

Experiencia general

La pantalla debe sentirse como un centro de monitoreo y consulta.

El mapa debe ser protagonista en la primera pestaña.

La tabla debe ser protagonista en la segunda pestaña.

La disponibilidad y capacidad deben ser protagonistas en la tercera pestaña.

Usar mucho espacio en blanco.

Mantener lectura rápida.

No saturar.

No mezclar acciones operativas con acciones administrativas.

No duplicar funciones del Centro Logístico.

------------------------------------------------------------

Comportamiento responsive

En pantallas medianas:

- el mapa ocupa todo el ancho;
- el panel de jornadas pasa debajo.

En pantallas pequeñas:

- las tarjetas se apilan;
- las pestañas pueden desplazarse horizontalmente;
- las tablas usan scroll horizontal;
- los filtros se apilan;
- los modales ocupan casi todo el ancho;
- el mapa conserva una altura suficiente.

------------------------------------------------------------

Resultado esperado

Una pantalla profesional con tres pestañas claramente diferenciadas:

Mapa general

Para monitoreo visual de jornadas y camiones.

Catálogo de rutas

Para administración de conexiones entre ubicaciones.

Camiones

Para consulta de disponibilidad, capacidad y jornada asociada.

El módulo debe complementar al Centro de Operaciones Logísticas sin duplicar sus responsabilidades.



---

## Ubicaciones

Diseña la interfaz del módulo "Ubicaciones" para TechSupply SCM.

IMPORTANTE

Esta pantalla pertenece al mismo sistema previamente diseñado.

Debe conservar exactamente:

- Sidebar
- Topbar
- Footer
- Paleta de colores
- Tipografía
- Componentes
- Botones
- Tarjetas
- Tablas
- Espaciados
- Sombras
- Bordes

No modificar la identidad visual del sistema.

------------------------------------------------------------

Contexto

Las ubicaciones representan los nodos logísticos del sistema.

Cada ubicación corresponde únicamente al punto central de un cantón o ciudad.

No se registran calles.

No se registran barrios.

No se registran direcciones específicas.

Las ubicaciones sirven como base para:

- Clientes
- Rutas
- Optimización logística
- Jornadas
- Despachos
- Visualización en mapas

Por ello deben mantenerse consistentes y libres de duplicados.

------------------------------------------------------------

Objetivo

Administrar el catálogo oficial de ubicaciones utilizadas por todo el sistema.

El operador podrá:

- consultar ubicaciones;
- crear nuevas;
- editar información;
- desactivar ubicaciones;
- visualizar su posición en un mapa;
- verificar rápidamente si una ubicación ya existe.

------------------------------------------------------------

Eliminar el título principal.

El Topbar ya mostrará:

Ubicaciones

Subtítulo:

Administración de nodos geográficos utilizados por el sistema logístico.

------------------------------------------------------------

Indicadores superiores

Mostrar cuatro tarjetas pequeñas.

Ubicaciones registradas

Ubicaciones activas

Rutas asociadas

Clientes asociados

Las tarjetas deben ocupar poco espacio.

------------------------------------------------------------

Pestañas

La pantalla tendrá dos pestañas.

------------------------------------------------------------

Pestaña 1

Catálogo

------------------------------------------------------------

Mostrar:

Buscador

Buscar ubicación...

Filtro

Estado

Todos

Activa

Inactiva

Botones

Actualizar

Nueva ubicación

------------------------------------------------------------

Tabla

Columnas

Nombre

Latitud

Longitud

Clientes asociados

Rutas asociadas

Estado

Acciones

------------------------------------------------------------

Acciones

Ver detalle

Editar

Desactivar

------------------------------------------------------------

Modal Nueva ubicación

Diseño moderno.

Formulario dividido en dos columnas.

------------------------------------------------------------

Columna izquierda

Nombre del cantón

Provincia

Observaciones (opcional)

------------------------------------------------------------

Columna derecha

Mapa interactivo.

El usuario NO escribe latitud ni longitud.

El mapa contiene un marcador arrastrable.

Cuando el usuario mueve el marcador, las coordenadas se actualizan automáticamente.

Debajo del mapa mostrar:

Latitud

Longitud

Como campos de solo lectura.

------------------------------------------------------------

Ayuda visual

Debajo del mapa mostrar un mensaje:

Seleccione el punto central del cantón.

No registre barrios, calles o direcciones específicas.

------------------------------------------------------------

Validaciones

No permitir guardar:

• nombres repetidos

• coordenadas muy cercanas a otra ubicación

• marcador sin seleccionar

Mostrar mensajes claros.

------------------------------------------------------------

Modal Editar

Igual al de creación.

Permitir mover el marcador.

Actualizar automáticamente las coordenadas.

------------------------------------------------------------

Modal Detalle

Mostrar:

Nombre

Provincia

Estado

Latitud

Longitud

Clientes relacionados

Rutas relacionadas

Mapa pequeño únicamente para consulta.

No editable.

------------------------------------------------------------

Pestaña 2

Mapa general

------------------------------------------------------------

Mostrar un mapa ocupando casi todo el ancho disponible.

Sobre el mapa representar todas las ubicaciones registradas.

Cada ubicación debe tener un marcador elegante.

Al seleccionar un marcador:

Mostrar un pequeño popup con:

Nombre

Provincia

Clientes asociados

Rutas asociadas

Botón

Ver detalle

------------------------------------------------------------

Panel lateral

A la izquierda del mapa mostrar una lista compacta.

Cada fila contiene:

Nombre

Provincia

Cantidad de clientes

Cantidad de rutas

Estado

Al hacer clic:

El mapa debe centrarse automáticamente en esa ubicación.

------------------------------------------------------------

Controles del mapa

Botón:

Centrar todas las ubicaciones

Botón:

Mi ubicación (solo visual)

Botón:

Actualizar

------------------------------------------------------------

Estado vacío

Si no existen ubicaciones.

Mostrar una ilustración sencilla.

Texto:

No existen ubicaciones registradas.

Subtexto:

Agregue el primer nodo geográfico para comenzar a construir la red logística.

------------------------------------------------------------

Experiencia

La pantalla debe sentirse muy visual.

El mapa debe ser protagonista.

Mucho espacio en blanco.

Interfaz limpia.

Minimalista.

Corporativa.

No utilizar gráficos.

No utilizar estadísticas complejas.

El mapa debe transmitir claramente que todas las operaciones logísticas parten de estas ubicaciones.

------------------------------------------------------------

Resultado esperado

Una pantalla profesional para administrar los nodos geográficos del sistema, donde la captura de coordenadas sea sencilla mediante un mapa interactivo y todas las ubicaciones puedan visualizarse de forma global.

