# Automatización n8n — TechSupply SCM

Este directorio contiene el workflow de notificaciones logísticas del módulo **Outbound** de TechSupply SCM.

## 1. Estructura

```text
n8n/
├── README.md
└── workflows/
    └── techsupply-notificaciones-logisticas.json
```

## 2. Workflow incluido

**Nombre:** `TechSupply - Notificaciones logísticas`

El workflow recibe eventos del backend mediante un Webhook HTTP, los clasifica con un nodo Switch, prepara correos HTML con identidad visual de TechSupply SCM y los envía mediante SMTP.

Flujo principal:

```text
Webhook
  → Switch
  → Preparar notificaciones
  → Enviar notificación TechSupply
```

## 3. Eventos soportados

El workflow procesa los siguientes eventos:

- `JORNADA_CREADA`
- `JORNADA_INICIADA`
- `DESPACHO_ENTREGADO`
- `DESPACHO_NO_ENTREGADO`
- `JORNADA_FINALIZADA`

### Comportamiento por evento

| Evento | Notificación |
|---|---|
| `JORNADA_CREADA` | Envía al buzón administrativo un resumen de la planificación generada. |
| `JORNADA_INICIADA` | Envía un aviso administrativo y una notificación simulada por cliente involucrado. |
| `DESPACHO_ENTREGADO` | Envía una notificación simulada al cliente asociado al despacho. |
| `DESPACHO_NO_ENTREGADO` | Envía una notificación simulada al cliente asociado al despacho. |
| `JORNADA_FINALIZADA` | Envía al buzón administrativo un resumen de cierre de la jornada. |

## 4. Modo de demostración

Los clientes del dataset utilizan correos ficticios. Para evitar rebotes o envíos a terceros, todos los mensajes se entregan físicamente a un único buzón de demostración.

El correo original almacenado para cada cliente se conserva en:

- El asunto del mensaje.
- El bloque **Simulación de destinatario** del cuerpo HTML.
- El campo interno `destinatario_previsto`.

De esta forma se demuestra el enrutamiento lógico sin depender de direcciones ficticias.

> Antes de usar el workflow fuera del entorno de demostración, sustituya el destinatario fijo del nodo Code por una configuración externa o por el correo real del cliente.

## 5. Importación

1. Inicie n8n.
2. Abra el proyecto donde se administrará la automatización.
3. Seleccione la opción para importar un workflow desde archivo.
4. Importe:

```text
workflows/techsupply-notificaciones-logisticas.json
```

5. Abra el nodo **Enviar notificación TechSupply**.
6. Cree o seleccione una credencial SMTP válida.
7. Verifique el remitente y el buzón de demostración.
8. Guarde y publique el workflow.

## 6. Credencial SMTP

El archivo JSON exportado contiene una referencia a una credencial llamada:

```text
SMTP account
```

La contraseña SMTP no forma parte del repositorio. Cada instalación de n8n debe crear su propia credencial y asociarla manualmente al nodo de envío.

Para Gmail se recomienda:

```text
Host: smtp.gmail.com
Puerto: 465
SSL/TLS: activado
Usuario: cuenta Gmail completa
Contraseña: contraseña de aplicación de Google
```

No utilice la contraseña normal de Gmail.

## 7. Webhook

### Método

```text
POST
```

### Ruta

```text
techsupply-notificaciones
```

### URL local de producción

```text
http://localhost:5678/webhook/techsupply-notificaciones
```

### URL local de prueba

```text
http://localhost:5678/webhook-test/techsupply-notificaciones
```

La URL con `/webhook-test/` solo funciona mientras el nodo Webhook está en modo **Listen for test event**. El backend debe utilizar la URL de producción cuando el workflow esté publicado.

## 8. Configuración del backend

Variables recomendadas en `.env`:

```env
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook/techsupply-notificaciones
N8N_TIMEOUT_MS=3000
N8N_BATCH_WINDOW_MS=150
N8N_DEMO_MODE=true
```

No almacene en `.env` del backend:

- Contraseñas SMTP.
- Contraseñas de aplicación.
- Contraseña de acceso a n8n.
- Tokens o secretos de correo.

Las credenciales de envío se administran exclusivamente dentro de n8n.

## 9. Contrato esperado

Ejemplo general:

```json
{
  "evento": "JORNADA_INICIADA",
  "fecha_evento": "2026-07-30T18:00:00.000Z",
  "modo_demo": true,
  "datos": {
    "jornada": {},
    "despachos": []
  }
}
```

El nodo Code admite el cuerpo directamente o dentro de `body`, por lo que puede procesar tanto ejecuciones provenientes del Webhook como datos de prueba internos.

Para las notificaciones de clientes, cada despacho debe incluir información equivalente a:

```json
{
  "pedido": {
    "codigo": "PED-00025",
    "cliente": {
      "id": 8,
      "nombre": "Cliente de demostración",
      "correo": "cliente@correo-ficticio.com"
    }
  }
}
```

## 10. Prueba manual

Con n8n levantado y el workflow publicado:

```powershell
$body = @{
  evento = "JORNADA_CREADA"
  fecha_evento = (Get-Date).ToString("o")
  modo_demo = $true
  datos = @{
    jornadas = @(
      @{
        codigo = "JR-00015"
        total_pedidos = 7
        total_puntos = 6
      }
    )
    resumen = @{
      total_jornadas = 1
      pedidos_asignados = 7
      sin_asignar = 0
    }
  }
} | ConvertTo-Json -Depth 8

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5678/webhook/techsupply-notificaciones" `
  -ContentType "application/json" `
  -Body $body
```

Resultado esperado:

```text
Webhook
→ Switch
→ Preparar notificaciones
→ Enviar notificación TechSupply
```

El correo debe aparecer en el buzón de demostración.

## 11. Operación local

Levante n8n en una terminal independiente:

```powershell
npx n8n
```

Mantenga esa terminal abierta mientras el backend esté enviando eventos.

Distribución recomendada:

```text
Terminal 1: npm run dev
Terminal 2: npx n8n
```

## 12. Seguridad y portabilidad

El workflow exportado:

- No contiene la contraseña SMTP en texto plano.
- No contiene la contraseña del usuario administrador de n8n.
- Sí contiene referencias internas de n8n, como identificadores de workflow, nodos, Webhook y credencial.
- Sí contiene el correo usado como buzón de demostración.

Al importar el archivo en otra instancia:

1. Cree una credencial SMTP nueva.
2. Asígnela al nodo de envío.
3. Revise el remitente y el destinatario de demostración.
4. Publique una nueva versión.
5. Actualice `N8N_WEBHOOK_URL` si cambia el host o la ruta.

## 13. Alcance

La automatización complementa el flujo logístico, pero no controla transacciones ni reglas de negocio. Un fallo de n8n o del correo no debe revertir:

- La creación de una jornada.
- El inicio de una ruta.
- La entrega o no entrega de un despacho.
- La finalización de una jornada.

El backend conserva la responsabilidad operativa; n8n actúa como capa de automatización y notificación.

