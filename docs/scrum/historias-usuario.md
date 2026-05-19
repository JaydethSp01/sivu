# Historias de usuario — SIVU

Historias de usuario detalladas del producto, con criterios de aceptación en formato **Gherkin (Given / When / Then)**. Cubren los cuatro roles funcionales (ADMIN, COORDINADOR, ESTUDIANTE, EMPRESA) y el rol técnico MCP_AGENT.

Formato:

> **Como** `<rol>` **quiero** `<acción>` **para** `<beneficio>`.

---

## US-001 — Registro de usuario

**Como** visitante de la plataforma
**quiero** registrarme con email institucional y contraseña
**para** acceder a SIVU según el rol que me corresponda.

**Épica:** EP-01 · **Prioridad:** Must · **SP:** 3 · **Sprint:** 1

### Criterios de aceptación

```gherkin
Escenario: Registro exitoso con datos válidos
  Given que estoy en la pantalla de registro
  And no existe ningún usuario con el email "kelly@est.uempresarial.edu.co"
  When envío POST /api/v1/auth/register con email "kelly@est.uempresarial.edu.co", password "Estudiante123*" y rol "ESTUDIANTE"
  Then el sistema responde HTTP 201
  And en MongoDB existe un documento en "users" con el email indicado y el password hasheado con BCrypt

Escenario: Registro con email duplicado
  Given que ya existe un usuario con email "kelly@est.uempresarial.edu.co"
  When envío POST /api/v1/auth/register con ese mismo email
  Then el sistema responde HTTP 409
  And el cuerpo contiene "email ya registrado"

Escenario: Password débil
  Given un payload de registro con password "1234"
  When envío POST /api/v1/auth/register
  Then el sistema responde HTTP 400
  And el cuerpo describe el requisito de complejidad (mínimo 8 caracteres, una mayúscula, un número y un símbolo)
```

---

## US-002 — Login con JWT

**Como** usuario registrado
**quiero** iniciar sesión con email y contraseña
**para** obtener un JWT que me permita consumir la API.

**Épica:** EP-01 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 1

### Criterios de aceptación

```gherkin
Escenario: Login exitoso
  Given un usuario "coord@uempresarial.edu.co" con password "Coord123*" y rol COORDINADOR
  When envío POST /api/v1/auth/login con esas credenciales
  Then el sistema responde HTTP 200
  And el cuerpo contiene un campo "accessToken" tipo JWT con claim "role" igual a "COORDINADOR" y "exp" a 1 hora

Escenario: Login con credenciales inválidas
  Given un usuario existente
  When envío POST /api/v1/auth/login con password incorrecto
  Then el sistema responde HTTP 401
  And no se devuelve ningún token
```

---

## US-004 — Control de acceso por rol

**Como** administrador de la plataforma
**quiero** que cada endpoint exija un rol específico
**para** garantizar que sólo los usuarios autorizados acceden a cada recurso.

**Épica:** EP-01 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 1

### Criterios de aceptación

```gherkin
Escenario: Estudiante intenta crear una vacante
  Given un usuario con rol ESTUDIANTE y JWT válido
  When envía POST /api/v1/vacantes
  Then el sistema responde HTTP 403

Escenario: Empresa crea una vacante
  Given un usuario con rol EMPRESA y JWT válido
  When envía POST /api/v1/vacantes con un payload válido
  Then el sistema responde HTTP 201

Escenario: Petición sin JWT
  Given una petición sin header Authorization
  When se invoca cualquier endpoint bajo /api/v1/ excepto auth
  Then el sistema responde HTTP 401
```

---

## US-005 — CRUD de Estudiantes (coordinador)

**Como** coordinador de prácticas
**quiero** crear, listar, actualizar y eliminar estudiantes
**para** mantener actualizado el padrón de candidatos a prácticas.

**Épica:** EP-02 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 1

### Criterios de aceptación

```gherkin
Escenario: Crear estudiante
  Given un JWT con rol COORDINADOR
  When envío POST /api/v1/estudiantes con un cuerpo válido (documento, nombre, programa, semestre, promedio)
  Then el sistema responde HTTP 201 con el id generado
  And el estudiante queda persistido en PostgreSQL

Escenario: Listar estudiantes paginados
  Given que existen 25 estudiantes
  When envío GET /api/v1/estudiantes?page=0&size=10
  Then el sistema responde HTTP 200
  And el cuerpo contiene 10 elementos y los campos de paginación (totalElements=25, totalPages=3)

Escenario: Actualizar estudiante inexistente
  Given que no existe un estudiante con id 9999
  When envío PUT /api/v1/estudiantes/9999
  Then el sistema responde HTTP 404
```

---

## US-007 — Publicación de vacante (empresa)

**Como** usuario EMPRESA
**quiero** publicar una vacante de práctica profesional
**para** recibir postulaciones de estudiantes elegibles.

**Épica:** EP-02 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 1

### Criterios de aceptación

```gherkin
Escenario: Publicación exitosa
  Given un JWT con rol EMPRESA asociado a la empresa "Coally"
  When envío POST /api/v1/vacantes con titulo "Practicante Backend", programa "Ingeniería de Sistemas", cupos 2, fecha_inicio "2026-06-15"
  Then el sistema responde HTTP 201
  And la vacante queda en estado "ACTIVA"

Escenario: Empresa intenta publicar vacante para otra empresa
  Given un JWT con rol EMPRESA cuyo empresaId es 1
  When envío POST /api/v1/vacantes con empresaId 2
  Then el sistema responde HTTP 403
```

---

## US-008 — Postulación a vacante (estudiante)

**Como** estudiante
**quiero** postularme a una vacante activa
**para** ser considerado en el proceso de selección.

**Épica:** EP-02 · **Prioridad:** Must · **SP:** 5 (3 entregados en Sprint 1 + 2 carry over Sprint 2)

### Criterios de aceptación

```gherkin
Escenario: Postulación válida
  Given un JWT con rol ESTUDIANTE
  And una vacante 42 en estado "ACTIVA" con cupos disponibles
  When envío POST /api/v1/postulaciones con vacanteId 42
  Then el sistema responde HTTP 201
  And la postulación queda en estado "CREADA"

Escenario: Vacante cerrada
  Given una vacante 42 en estado "CERRADA"
  When envío POST /api/v1/postulaciones con vacanteId 42
  Then el sistema responde HTTP 409
  And el cuerpo describe "vacante no disponible"

Escenario: Estudiante ya postulado a la misma vacante
  Given que el estudiante ya tiene una postulación a la vacante 42 en estado distinto a "RECHAZADA"
  When envío POST /api/v1/postulaciones con vacanteId 42
  Then el sistema responde HTTP 409
```

---

## US-011 — Validación documental automática (coordinador)

**Como** coordinador
**quiero** que SIVU valide automáticamente los documentos subidos por el estudiante
**para** evitar la revisión manual de cada caso.

**Épica:** EP-03 · **Prioridad:** Must · **SP:** 8 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Estudiante con todos los documentos válidos
  Given un estudiante con documentos HOJA_VIDA (PDF, 800 KB), CERTIFICADO_NOTAS (PDF, 1.2 MB), ARL (PDF, 300 KB) y EPS (PDF, 250 KB)
  When envío POST /api/v1/automatizacion/validar-documentos/{estudianteId}
  Then el sistema responde HTTP 200 con resultado "APROBADO"
  And la postulación asociada (si existe) cambia a estado "DOCUMENTOS_VALIDADOS"

Escenario: Falta un documento obligatorio
  Given un estudiante sin documento ARL cargado
  When envío POST /api/v1/automatizacion/validar-documentos/{estudianteId}
  Then el sistema responde HTTP 200 con resultado "RECHAZADO"
  And la lista de causas incluye "ARL faltante"

Escenario: Documento excede el tamaño permitido
  Given un documento HOJA_VIDA de 12 MB
  When ejecuto la validación
  Then el sistema marca el documento como "RECHAZADO" con causa "tamaño > 5MB"
```

---

## US-013 — Matching automático (coordinador)

**Como** coordinador
**quiero** ver un ranking automático de estudiantes para cada vacante
**para** priorizar los candidatos con mejor perfil.

**Épica:** EP-03 · **Prioridad:** Must · **SP:** 8 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Ranking con score
  Given una vacante 42 para programa "Ingeniería de Sistemas"
  And 5 estudiantes postulados con promedios 4.5, 4.2, 3.9, 3.7, 3.5
  When envío POST /api/v1/automatizacion/matching/42
  Then el sistema responde HTTP 200
  And el cuerpo es una lista ordenada descendentemente por "score"
  And cada elemento contiene estudianteId, score, desglose {promedio, programa, disponibilidad}

Escenario: Vacante sin postulados
  Given una vacante 99 sin postulaciones
  When ejecuto el matching
  Then el sistema responde HTTP 200 con lista vacía
```

---

## US-014 — Generación PDF de formalización (coordinador)

**Como** coordinador
**quiero** generar el documento de formalización en PDF a partir de los datos de la postulación
**para** evitar errores de captura manual al redactarlo en Word.

**Épica:** EP-03 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Generación exitosa
  Given una postulación 100 en estado "APROBADA" con estudiante, vacante, empresa y convenio asociados
  When envío POST /api/v1/automatizacion/formalizar/100
  Then el sistema responde HTTP 200 con Content-Type "application/pdf"
  And el PDF contiene los datos del estudiante, empresa, vacante y firmas
  And el archivo queda almacenado en ./data/formalizaciones/100.pdf

Escenario: Postulación no aprobada
  Given una postulación 100 en estado "RECHAZADA"
  When envío POST /api/v1/automatizacion/formalizar/100
  Then el sistema responde HTTP 409
```

---

## US-015 — Notificación por email (estudiante)

**Como** estudiante
**quiero** recibir un email cada vez que cambia el estado de mi proceso
**para** estar informado sin tener que escribir al coordinador.

**Épica:** EP-03 · **Prioridad:** Must · **SP:** 3 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Notificación al cambiar a APROBADA
  Given una postulación 100 del estudiante "kelly@est.uempresarial.edu.co" en estado "EN_REVISION"
  When un coordinador actualiza el estado a "APROBADA" vía PATCH /api/v1/postulaciones/100/estado
  Then se envía un email al estudiante con asunto "Postulación aprobada"
  And el email es visible en MailHog UI (http://localhost:8025)

Escenario: Notificación al rechazar documentos
  Given una postulación con validación documental "RECHAZADO"
  When se ejecuta la validación
  Then el estudiante recibe un email con la lista de causas y un enlace al dashboard
```

---

## US-016 — Dashboard de seguimiento "tipo pedido" (estudiante)

**Como** estudiante
**quiero** ver mi proceso de vinculación como un timeline de pasos
**para** saber en qué etapa estoy sin tener que preguntar.

**Épica:** EP-04 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Estudiante con proceso en curso
  Given un estudiante autenticado con una postulación en estado "DOCUMENTOS_VALIDADOS"
  When abre la página /mi-proceso
  Then ve un timeline con los pasos: "Registro", "Documentos cargados", "Validación documental", "Verificación académica", "Matching", "Formalización"
  And los pasos completados aparecen marcados; el paso actual aparece resaltado
  And el frontend consume GET /api/v1/postulaciones/me

Escenario: Estudiante sin postulación
  Given un estudiante sin postulación activa
  When abre /mi-proceso
  Then ve un estado vacío con CTA "Explorar vacantes"
```

---

## US-018 — MCP server: listar estudiantes pendientes (MCP_AGENT)

**Como** MCP_AGENT (agente de IA que consume el sistema vía protocolo MCP)
**quiero** invocar una herramienta `listar_estudiantes_pendientes_validacion`
**para** responder en lenguaje natural al coordinador sobre qué estudiantes faltan por validar.

**Épica:** EP-05 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Tool registrada y llamable
  Given el servidor MCP corriendo en stdio
  When un cliente MCP lista las tools disponibles
  Then la respuesta incluye "listar_estudiantes_pendientes_validacion" con su JSON Schema

Escenario: Consulta exitosa con resultados
  Given que existen 4 estudiantes con documentos en estado "PENDIENTE_VALIDACION"
  When un cliente MCP invoca la tool sin parámetros
  Then la tool autentica como rol MCP_AGENT, llama GET /api/v1/estudiantes?estadoDocs=PENDIENTE
  And devuelve un arreglo JSON con 4 objetos {id, nombre, programa, fechaCargaDocs}

Escenario: Backend caído
  Given el backend devuelve 503
  When la tool se invoca
  Then la tool responde con error MCP "backend_no_disponible" sin lanzar excepción no controlada
```

---

## US-021 — MCP tool revisar logs de pipeline (MCP_AGENT)

**Como** MCP_AGENT
**quiero** invocar `revisar_logs_pipeline`
**para** poder responder al equipo si el último build de GitHub Actions falló y por qué.

**Épica:** EP-05 · **Prioridad:** Should · **SP:** 3 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Último workflow exitoso
  Given el último workflow "ci.yml" de la rama main terminó "success"
  When un cliente MCP invoca revisar_logs_pipeline sin parámetros
  Then la tool responde con {workflow:"ci.yml", status:"success", conclusion:"success", run_url:"..."}

Escenario: Workflow fallido
  Given el último workflow terminó "failure" en el job "unit-tests"
  When un cliente MCP invoca revisar_logs_pipeline
  Then la tool responde con {status:"completed", conclusion:"failure", failing_job:"unit-tests", run_url:"..."}
```

---

## US-024 — Tests contractuales en CI (QA)

**Como** QA
**quiero** ejecutar la colección Postman con Newman en cada PR
**para** detectar rupturas de contrato antes de mergear.

**Épica:** EP-06 · **Prioridad:** Must · **SP:** 3 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: PR con cambios que rompen contrato
  Given una PR donde se renombra el campo "promedio" a "gpa" en /api/v1/estudiantes
  When el pipeline corre el stage "api-tests" con newman
  Then la corrida falla
  And el status check de GitHub queda en rojo
  And el PR no se puede mergear

Escenario: PR limpia
  Given una PR sin cambios incompatibles
  When corre el stage "api-tests"
  Then la corrida termina verde con 0 fallos
```

---

## US-029 — Pipeline CD con docker-compose (DevOps)

**Como** DevOps
**quiero** que tras mergear a `main` el pipeline construya las imágenes y levante `docker-compose` en el ambiente de demo
**para** que cualquier evaluador vea siempre la última versión funcionando localmente.

**Épica:** EP-07 · **Prioridad:** Must · **SP:** 5 · **Sprint:** 2

### Criterios de aceptación

```gherkin
Escenario: Despliegue exitoso
  Given un merge a main que pasó ci.yml
  When se dispara el workflow cd.yml
  Then se construyen y publican imágenes "backend", "frontend", "mcp-server" en GHCR
  And en el self-hosted runner se ejecuta "docker compose pull && docker compose up -d"
  And el smoke test "curl http://localhost:8080/actuator/health" devuelve 200 "UP"

Escenario: Smoke test falla
  Given que tras "docker compose up -d" el health no devuelve UP en 60 s
  When termina el job "deploy-demo"
  Then el job se marca como failed
  And se ejecuta el step "docker compose logs" para diagnóstico
```

---

## Resumen de cobertura por rol

| Rol | Historias asociadas |
|---|---|
| ADMIN | US-004 (acceso global), US-027 (Quality Gate) |
| COORDINADOR | US-005, US-006, US-010, US-011, US-012, US-013, US-014, US-017 |
| ESTUDIANTE | US-001, US-008, US-009, US-015, US-016 |
| EMPRESA | US-007 |
| MCP_AGENT | US-018, US-019, US-020, US-021 |
| DEVOPS / QA (transversal) | US-022, US-023, US-024, US-025, US-026, US-028, US-029, US-030 |
