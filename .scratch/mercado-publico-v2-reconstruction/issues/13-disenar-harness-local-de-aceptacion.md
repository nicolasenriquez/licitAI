# Diseñar el harness local de aceptación

Type: grilling
Status: resolved
Blocked by: 06, 07, 10, 11, 12

## Question

¿Qué entorno local reproducible, datos, identidades, escenarios y gates de
Playwright demostrarán que la experiencia funciona sin acceso cloud?

## Decision record expected

- Compose desechable y estrategia de datos representativos V2.
- Provisioner idempotente de analista y operador con secretos por entorno.
- Login, deep links y `storageState` fuera de artefactos versionados.
- Matriz de viewports, light/dark, estados, teclado, zoom, reduced motion y Axe.
- Capturas, DOM/CSS, consola, red GraphQL y umbrales de rendimiento.
- Política de actualización y revisión de baselines visuales.
- Gate futuro para cloud cuando exista autoridad.

## Answer

Decisión humana confirmada. La aceptación local es un harness reproducible,
autenticado y desechable; demuestra el producto completo sin autoridad cloud.

- Cada ejecución parte de un proyecto Compose limpio con almacenamiento aislado.
  Un manifest versionado describe fixtures V2 representativos y sanitizados:
  Activas, Historial, población vacía, carga, fallo, disponibilidad parcial y
  datos ausentes. El provisioner los introduce por el seam de `SyncRun` y la
  normalización real; no inserta proyecciones directamente en la base de datos.
- El mismo provisioner es idempotente: prepara workspace, alcance y las dos
  identidades desechables. `analista` sólo lee; `operador` accede al Centro de
  control. Credenciales llegan exclusivamente por variables de entorno local y
  no viven en fixtures, repo ni artefactos.
- Playwright inicia sesión por UI real con cada identidad. Cubre las rutas
  profundas de Activas, Historial, Compradores y, sólo como operador, Centro de
  control; verifica que URL, filtros, cursor y panel lateral restauren estado.
  `storageState` se regenera por ejecución, queda ignorado por Git y no se
  comparte como secreto.
- La matriz obligatoria corre desktop 1440, laptop 1280 y móvil 390, en light y
  dark, para carga, vacío, error, parcial y poblado. Incluye flujo de teclado,
  200 % zoom, `prefers-reduced-motion` y Axe. Las aserciones usan roles y texto
  visible antes que detalles internos.
- Cada caso preserva captura y trace Playwright. Falla si hay error de consola,
  operación GraphQL inesperada, llamada del navegador al proveedor o violación
  DOM/accesibilidad. Los umbrales locales de rendimiento detectan regresiones
  comparables; no declaran SLA ni rendimiento cloud.
- Baselines visuales sólo existen para rutas estables y se versionan junto al
  test. Todo cambio exige diff revisado por humano, motivo explícito y repetición
  de la matriz viewport/tema; nunca se acepta una actualización ciega.
- Cloud es gate posterior y separado: no bloquea aceptación local. Sólo nace
  tras aportar URL, identidad, autorización y datos permitidos; entonces repite
  un smoke autenticado sin versionar secretos ni evidencia sensible.
