import {
  ROLES,
} from './permissions';

const COMMON_GOOD_PRACTICES = [
  'Mantén actualizada la información antes de tomar una decisión operativa.',
  'Utiliza las acciones visibles para tu rol y evita compartir sesiones de acceso.',
  'Confirma los cambios importantes y revisa las alertas antes de cerrar una tarea.',
];

export const ROLE_EXPERIENCE = Object.freeze({
  [ROLES.ADMIN]: Object.freeze({
    dashboardTitle: 'Dashboard administrativo',
    dashboardDescription: 'Visión integral del ciclo comercial, bodega y distribución outbound.',
    eyebrow: 'Control general',
    focusTitle: 'Supervisión transversal del outbound',
    focusDescription:
      'Consulta el estado de cada etapa, identifica bloqueos y accede a los módulos que requieren atención.',
    icon: 'bi-shield-check',
    tone: 'primary',
    workflowTitle: 'Cadena operativa supervisada',
    workflowDescription: 'El administrador observa el flujo completo sin reemplazar el trabajo de cada área.',
    workflow: [
      { icon: 'bi-people', label: 'Ventas', detail: 'Clientes y pedidos' },
      { icon: 'bi-box-seam', label: 'Bodega', detail: 'Preparación y carga' },
      { icon: 'bi-truck', label: 'Logística', detail: 'Jornadas y entregas' },
    ],
    modules: [
      'clientes',
      'pedidos',
      'bodega-preparacion',
      'bodega-cargas',
      'jornadas',
      'despachos',
      'camiones',
      'choferes',
      'rutas',
      'ubicaciones',
      'usuarios',
    ],
    objective: 'Supervisar el funcionamiento global del módulo Outbound y resolver excepciones entre áreas.',
    responsibilities: [
      'Revisar indicadores y alertas de todas las etapas.',
      'Garantizar que usuarios y áreas trabajen con el alcance correcto.',
      'Dar seguimiento a pedidos, jornadas y novedades de entrega.',
    ],
    goodPractices: COMMON_GOOD_PRACTICES,
  }),
  [ROLES.VENTAS]: Object.freeze({
    dashboardTitle: 'Dashboard de ventas',
    dashboardDescription: 'Seguimiento de clientes y pedidos propios dentro del flujo outbound.',
    eyebrow: 'Operación comercial',
    focusTitle: 'Convierte solicitudes en pedidos listos para operar',
    focusDescription:
      'Prioriza pedidos pendientes, revisa su avance y mantén actualizados los datos comerciales y de destino.',
    icon: 'bi-graph-up-arrow',
    tone: 'info',
    workflowTitle: 'Flujo comercial',
    workflowDescription: 'El dashboard resume únicamente los pedidos creados desde tu cuenta.',
    workflow: [
      { icon: 'bi-person-plus', label: 'Cliente', detail: 'Datos y ubicación' },
      { icon: 'bi-receipt', label: 'Pedido', detail: 'Productos y total' },
      { icon: 'bi-send-check', label: 'Preparación', detail: 'Envío a bodega' },
    ],
    modules: ['clientes', 'pedidos', 'ubicaciones'],
    objective: 'Registrar y acompañar pedidos comerciales hasta que sean entregados o requieran reprogramación.',
    responsibilities: [
      'Mantener clientes y destinos correctamente registrados.',
      'Crear pedidos completos y enviarlos a preparación.',
      'Consultar cambios de estado y novedades de sus propios pedidos.',
    ],
    goodPractices: COMMON_GOOD_PRACTICES,
  }),
  [ROLES.BODEGA]: Object.freeze({
    dashboardTitle: 'Dashboard de bodega',
    dashboardDescription: 'Prioridades de preparación física y carga de jornadas planificadas.',
    eyebrow: 'Ejecución en bodega',
    focusTitle: 'Prepara y carga sin romper la trazabilidad',
    focusDescription:
      'Atiende primero los pedidos y jornadas pendientes, verificando cantidades antes de confirmar cada cierre.',
    icon: 'bi-boxes',
    tone: 'warning',
    workflowTitle: 'Flujo físico',
    workflowDescription: 'Cada confirmación habilita la siguiente etapa del reparto.',
    workflow: [
      { icon: 'bi-box-seam', label: 'Preparar', detail: 'Validar productos' },
      { icon: 'bi-clipboard2-check', label: 'Comprobar', detail: 'Cerrar cajas' },
      { icon: 'bi-truck-flatbed', label: 'Cargar', detail: 'Confirmar jornada' },
    ],
    modules: ['bodega-preparacion', 'bodega-cargas'],
    objective: 'Completar la preparación física y confirmar la carga de los despachos asignados.',
    responsibilities: [
      'Verificar productos y cantidades de cada pedido.',
      'Cerrar la preparación únicamente cuando todo esté completo.',
      'Registrar y confirmar la carga correspondiente a cada jornada.',
    ],
    goodPractices: COMMON_GOOD_PRACTICES,
  }),
  [ROLES.LOGISTICA]: Object.freeze({
    dashboardTitle: 'Dashboard logístico',
    dashboardDescription: 'Planificación, recursos disponibles y seguimiento de la distribución.',
    eyebrow: 'Control de distribución',
    focusTitle: 'Coordina recursos, rutas y entregas',
    focusDescription:
      'Usa los pedidos listos, la disponibilidad de flota y las alertas para mantener jornadas ejecutables y controladas.',
    icon: 'bi-diagram-3',
    tone: 'success',
    workflowTitle: 'Flujo de distribución',
    workflowDescription: 'La planificación conecta pedidos preparados con camiones y choferes disponibles.',
    workflow: [
      { icon: 'bi-calendar2-week', label: 'Planificar', detail: 'Generar jornadas' },
      { icon: 'bi-person-vcard', label: 'Asignar', detail: 'Camión y chofer' },
      { icon: 'bi-geo-alt', label: 'Supervisar', detail: 'Ruta y despachos' },
    ],
    modules: [
      'jornadas',
      'despachos',
      'camiones',
      'choferes',
      'rutas',
      'ubicaciones',
      'clientes',
    ],
    objective: 'Planificar jornadas viables y supervisar la ejecución de entregas outbound.',
    responsibilities: [
      'Generar y revisar jornadas con recursos disponibles.',
      'Mantener camiones, choferes, rutas y ubicaciones operativas.',
      'Dar seguimiento a despachos no entregados y jornadas en ruta.',
    ],
    goodPractices: COMMON_GOOD_PRACTICES,
  }),
  [ROLES.CHOFER]: Object.freeze({
    dashboardTitle: 'Dashboard del chofer',
    dashboardDescription: 'Estado de la jornada asignada y próximas acciones de reparto.',
    eyebrow: 'Ejecución en carretera',
    focusTitle: 'Tu jornada, en el orden correcto',
    focusDescription:
      'Consulta el recorrido asignado, trabaja únicamente el punto actual y registra cada resultado antes de avanzar.',
    icon: 'bi-geo-alt-fill',
    tone: 'info',
    workflowTitle: 'Secuencia de reparto',
    workflowDescription: 'Las acciones se habilitan según el estado real de tu jornada.',
    workflow: [
      { icon: 'bi-play-circle', label: 'Iniciar', detail: 'Confirmar salida' },
      { icon: 'bi-check2-square', label: 'Registrar', detail: 'Entregas del punto' },
      { icon: 'bi-flag', label: 'Finalizar', detail: 'Cerrar recorrido' },
    ],
    modules: ['mi-jornada'],
    objective: 'Completar la jornada asignada respetando el orden de puntos y registrando cada entrega.',
    responsibilities: [
      'Revisar el mapa y la secuencia antes de iniciar.',
      'Registrar entregas o novedades del punto activo.',
      'Avanzar y finalizar únicamente cuando el sistema lo permita.',
    ],
    goodPractices: [
      ...COMMON_GOOD_PRACTICES,
      'No operes una jornada distinta de la asignada a tu perfil.',
    ],
  }),
  [ROLES.COMPRAS]: Object.freeze({
    dashboardTitle: 'Dashboard de compras',
    dashboardDescription: 'Indicadores informativos del dominio inbound sin módulos operativos habilitados.',
    eyebrow: 'Alcance inbound',
    focusTitle: 'Vista informativa de abastecimiento',
    focusDescription:
      'TechSupply reconoce tu rol y presenta sus indicadores, pero los módulos de compras no forman parte del alcance Outbound implementado.',
    icon: 'bi-bag-check',
    tone: 'warning',
    workflowTitle: 'Alcance de esta implementación',
    workflowDescription: 'El dashboard es informativo y no habilita operaciones incompletas ni enlaces vacíos.',
    workflow: [
      { icon: 'bi-bar-chart', label: 'Consultar', detail: 'Indicadores disponibles' },
      { icon: 'bi-info-circle', label: 'Comprender', detail: 'Alcance del sistema' },
      { icon: 'bi-life-preserver', label: 'Orientarse', detail: 'Centro de ayuda' },
    ],
    modules: [],
    objective: 'Consultar indicadores de abastecimiento sin acceder a funcionalidades inbound aún no implementadas.',
    responsibilities: [
      'Interpretar los indicadores únicamente como información de contexto.',
      'No ejecutar procesos de compras fuera del sistema implementado.',
      'Consultar el Centro de ayuda para conocer el alcance disponible.',
    ],
    goodPractices: COMMON_GOOD_PRACTICES,
    scopeNotice: 'Los módulos Productos, Categorías y Órdenes de compra pertenecen al dominio Inbound y no están implementados en esta entrega Outbound.',
  }),
});

const DEFAULT_EXPERIENCE = Object.freeze({
  dashboardTitle: 'Dashboard',
  dashboardDescription: 'Resumen operativo disponible para la sesión actual.',
  eyebrow: 'Información de sesión',
  focusTitle: 'Bienvenido a TechSupply SCM',
  focusDescription: 'Consulta los accesos habilitados para tu cuenta.',
  icon: 'bi-grid-1x2-fill',
  tone: 'primary',
  workflowTitle: 'Uso del sistema',
  workflowDescription: 'Trabaja únicamente con las opciones visibles para tu sesión.',
  workflow: [],
  modules: [],
  objective: 'Consultar la información autorizada para la sesión actual.',
  responsibilities: [],
  goodPractices: COMMON_GOOD_PRACTICES,
});

export function getRoleExperience(role) {
  return ROLE_EXPERIENCE[role] ?? DEFAULT_EXPERIENCE;
}
