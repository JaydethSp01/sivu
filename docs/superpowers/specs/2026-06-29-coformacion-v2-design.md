# Replanteamiento SIVU — Módulo de Coformación v2

> Spec generado del análisis multi-agente contra el código real. Rama `reformulacion-v2`. **Aditivo: no se elimina nada; se cumple la guía del curso Y el v2.**

# Replanteamiento SIVU — Módulo Coformación v2

## 1. Resumen ejecutivo

El replanteamiento **no elimina nada de lo construido**: toma el módulo Coformación ya operativo (Plan de Actividades, Evaluaciones Tutor/Profesor, Actas, Plan de Mejora, Informe Final) y lo lleva a la versión v2 cerrando los gaps funcionales y, al mismo tiempo, satisfaciendo los 9 requisitos de la guía del curso **dentro del propio flujo de coformación**, no como anexos artificiales.

Tres líneas de trabajo conviven:

- **Cierre funcional v2**: flujo tripartito con comentarios y expediente automático (A01), PDF en columnas paralelas (A02), acceso externo del tutor empresarial sin cuenta institucional (A03), sistema de notas + flag Alto Impacto (A04), Expediente Digital Unificado (B01), prellenado de Actas (B02), módulo nuevo de Agendamiento Colaborativo (C01-C03) y la capa transversal de Notificaciones + cálculo automático de nota + PDFs oficiales (D01-D02 / RNF-01/03).
- **Integración de requisitos de guía como parte del producto**: la IA (sidecar + heurístico) asiste coherencia de PA, feedback de informe y resumen de evaluaciones; MCP expone el estado real de coformación (cortes, expediente, notas); las pruebas (JUnit/Newman/Cypress/K6), Sonar y CI/CD se extienden a cada módulo nuevo.
- **Consolidación de datos**: una sola migración mayor (V22) por área, sin tocar tablas existentes salvo ampliaciones de columna seguras, preservando datos legacy con valores por defecto.

Principio rector: **aditivo y retrocompatible**. Cada cambio de esquema usa columnas nuevas con default o ampliación de tipo (VARCHAR(20)→VARCHAR(30)); ningún borrado destructivo. El riesgo dominante es el N+1 del Expediente y el cálculo retroactivo de notas en convenios antiguos: ambos se mitigan con `@EntityGraph`, tablas de consolidación cacheadas y scripts de validación previa.

## 2. Mapeo guía ↔ v2

| # | Requisito de la guía | Dónde se cumple en v2 | Evidencia / artefacto |
|---|---|---|---|
| 1 | Backend Spring Boot 3 / Java 21 (arquitectura por feature) | Todos los módulos: nuevos paquetes `agendamiento/`, `expediente/`, `evaluacion/`; servicios y controllers REST por área | `co.uempresarial.sivu.*` (domain/service/web) |
| 2 | Frontend React + Vite + TS (shadcn) | Páginas v2: comentarios en PA, panel de notas, expediente con tabs, agendamiento, historial de notificaciones | `frontend/src/features/{expedientes,agendamiento-colaborativo,evaluaciones,...}` |
| 3 | Persistencia poliglota (Postgres + Mongo) | Postgres: V22 por área (comentarios, agendamiento, notas, expediente). Mongo: usuarios/roles (incl. acceso externo tutor) | `db/migration/V22*`, Usuario Mongo + token JWT externo |
| 4 | Seguridad, auth y roles (RBAC) | Rol TUTOR nuevo (A03), validación de identidad firmante (A01/A03), `@PreAuthorize` con SpEL en Expediente, token externo con expiración | `security/domain/Rol.java`, `verificarAcceso()`, login-tutor |
| 5 | Pruebas (unit + integración + E2E + carga) | JUnit5+Mockito por servicio, Newman por flujo, Cypress 06-08 (expediente/evaluaciones/cortes/agendamiento), K6 expediente-load | `backend/src/test/**`, `tests/{newman,cypress,k6}/` |
| 6 | SonarCloud / calidad | Cobertura ≥75-80% en clases nuevas; exclusiones DTO/config/mapper; strategy/template pattern en NotificacionService | `sonar-project.properties`, JaCoCo `jacoco.xml` |
| 7 | IA (sin API key, claude-agent-sdk) | `validarCoherenciaPa` (A01), feedback por sección Informe (A04), `POST /ia/evaluaciones/{id}/resumen`, sugerir-compromisos Actas | `ia-sidecar/` + `InformeIAService` fallback heurístico |
| 8 | MCP (consultar proceso de coformación) | 5 tools nuevos: `consultar_cortes_pendientes`, `obtener_expediente_estudiante`, `listar_notas_evaluaciones`, `consultar_plan_mejora`, `verificar_requisitos_cierre` | `mcp-server/src/tools/*` (9 existentes + 5) |
| 9 | CI/CD | `ci.yml` 7 jobs (backend→newman→cypress→docker→deploy); gate Sonar + E2E antes de deploy; nuevos tests en pipeline | `.github/workflows/ci.yml` |

## 3. Roadmap por fases (BI-01..BI-17)

Estimación relativa en **puntos** (1≈medio día, 3≈1-2 días, 5≈3-4 días, 8≈semana). Prioridad: P0 (base que otros dependen), P1 (core v2), P2 (mejora).

### Fase 1 — Cimientos transversales (desbloquea el resto)

| ID | Ítem | Área | Pts | Prio |
|----|------|------|-----|------|
| BI-01 | Capa Notificaciones + auditoría (`notificacion_auditoria`, métodos específicos, idempotencia) | D01/D02 | 8 | P0 |
| BI-02 | PDFs oficiales unificados (CertificadoPdfGenerator→PdfStyles, numeración de páginas en todos) | RNF-01 | 3 | P0 |
| BI-03 | Rol TUTOR + token de acceso externo + login-tutor (base de A03 y agendamiento) | A03 / Seguridad | 5 | P0 |

### Fase 2 — Flujos de evaluación v2

| ID | Ítem | Área | Pts | Prio |
|----|------|------|-----|------|
| BI-04 | PA flujo tripartito: comentarios, validación de identidad firmante, PDF→expediente al 3er firma | A01 | 8 | P1 |
| BI-05 | Evaluación Docente PDF en 2 columnas paralelas + validación antes de firmar + tests (cobertura 0→85%) | A02 | 5 | P1 |
| BI-06 | Evaluación Tutor: continuidad obligatoria + acceso externo por token + página `?token=` | A03 | 5 | P1 |
| BI-07 | Informe Final: notas tutor/profesor, promedio automático, validación ≥3.0, flag Alto Impacto en PDF | A04 | 5 | P1 |
| BI-08 | IA coherencia PA + feedback por sección Informe + resumen de evaluaciones (sidecar) | A01/A04/Guía#7 | 5 | P2 |

### Fase 3 — Cálculo de nota y consolidación

| ID | Ítem | Área | Pts | Prio |
|----|------|------|-----|------|
| BI-09 | EvaluacionTutorTrimestre con estructura de cortes C2 + bloqueo post-firma | RNF-03 | 3 | P1 |
| BI-10 | CorteCalculoService: nota final 25%+25%+50%, trazabilidad, bloqueo; `calificacion_calculada` | RNF-03 | 5 | P1 |
| BI-11 | Scheduler recordatorios (5 días cierre corte / 24h entrevista) + listeners de firma | D01/D02 | 5 | P2 |

### Fase 4 — Agendamiento Colaborativo (módulo nuevo)

| ID | Ítem | Área | Pts | Prio |
|----|------|------|-----|------|
| BI-12 | Disponibilidad docente: CRUD + validación de solapamiento (unique index parcial) | C01 | 5 | P1 |
| BI-13 | Agendamiento: proponer/aceptar/rechazar/contraoferta/confirmar; al confirmar genera ActaReunion | C02/C03 | 8 | P1 |
| BI-14 | Frontend agendamiento (calendario franjas libres/ocupadas, modales, responsive móvil RNF-02) | C01-C03 | 8 | P1 |
| BI-15 | Prellenado de Acta desde agendamiento + estadística de actas por trimestre | B02 | 3 | P2 |

### Fase 5 — Expediente y consulta integral

| ID | Ítem | Área | Pts | Prio |
|----|------|------|-----|------|
| BI-16 | Expediente Digital Unificado: endpoint agregador + tablas consolidadas + permisos SpEL + frontend con tabs + export ZIP cohorte | B01 | 8 | P1 |
| BI-17 | MCP tools de coformación (5 nuevos) + Cypress 06-08 + K6 expediente-load + ajuste Sonar/CI | B01/Guía#5,#8 | 5 | P2 |

**Secuencia recomendada:** F1 (BI-01→03) primero porque Notificaciones, PDFs y Rol TUTOR son dependencias de casi todo. F2 y F3 pueden avanzar en paralelo si dos personas. F4 depende de BI-03 (rol/token) y produce ActaReunion que alimenta B02. F5 cierra agregando todo y exponiéndolo vía MCP. Total ≈ 100 pts.

## 4. Cambios de modelo de datos consolidados (V22+)

Todas las áreas planificaron una "V22"; al ir a una sola línea de migraciones Flyway deben **renumerarse secuencialmente** (V22..V29) para evitar colisión. Propuesta:

| Migración | Tablas nuevas / cambios | Notas de seguridad |
|---|---|---|
| **V22 — PA flujo aprobación** | `plan_actividades_comentario` (autor_rol, observacion_tipo, mensaje); `plan_actividades` + `descripcion_rechazo`, `fecha_ultima_modificacion`, `documento_pdf_id`; `estado` VARCHAR(20)→(30) | Ampliación de tipo, no destructiva |
| **V23 — Evaluación Tutor acceso externo** | `evaluacion_tutor_trimestre` + `acceso_externo_token` UNIQUE, `fecha_token_generado/expira`; `continuidad_con_empresa` SET NOT NULL (con UPDATE previo a FALSE); índice parcial token | UPDATE de legacy NULL→FALSE antes del NOT NULL |
| **V24 — Informe Final notas/impacto** | `informe_final_pm` + `nota_tutor_acad`, `nota_tutor_emp`, `nota_promedio` (CHECK 0-5), `alto_impacto` BOOLEAN DEFAULT FALSE | Columnas con default; histórico queda NULL |
| **V25 — Evaluación Tutor cortes + bloqueo** | `evaluacion_tutor_trimestre` + campos `_c2`, `observaciones_c1/c2`, `fecha_c1/c2`, `bloqueado` (paridad con Profesor V11) | Aditivo |
| **V26 — Cálculo automático de notas** | `corte_trimestre` (numero_corte 1-3, fecha_limite, bloqueado); `calificacion_calculada` (pesos + nota_final + bloqueado); `convenios` + `calificacion_final_calculada`, `fecha_calculo_final` | Aditivo; flag distingue manual vs calculada |
| **V27 — Notificaciones** | `notificacion_auditoria` (tipo_evento, destinatario, enviado_exitoso, FKs documento/postulacion/convenio); UNIQUE (postulacion_id, tipo_evento, fecha_envio) para idempotencia | Constraint anti-spam |
| **V28 — Agendamiento Colaborativo** | `disponibilidad_docente` (+ unique index parcial `(tutor,fecha,hora_inicio,hora_fin) WHERE estado='ACTIVA'`); `agendamiento_colaborativo` (estados PROPUESTO..CANCELADO, FKs convenio/estudiante/tutor) | FK ON DELETE CASCADE/RESTRICT según relación |
| **V29 — Expediente / Actas** | `expediente_documento_estado` (UNIQUE trimestre+tipo); `expediente_nota_consolidada` (convenio UNIQUE, cache de promedios); opcional `acta_compromiso` (separar tema/compromiso/responsable) | Tablas de consolidación cacheadas para evitar N+1 |

**Decisiones de consolidación:**
- Para A02 la "V22 de índices/CHECK" es **opcional**: omitir salvo que haya bottleneck real (los campos C1/C2 ya existen desde V11).
- Expediente: preferir **tablas de consolidación cacheadas** (`expediente_nota_consolidada`) sobre vista materializada, recalculadas al firmar/calcular nota, para mantener el GET por debajo de 500 ms.
- Notas: una sola fuente de verdad de cálculo (`CorteCalculoService`); el frontend solo valida, no recalcula de forma divergente.
- Acceso externo tutor: token JWT con expiración corta (7 días) + logging de accesos; el tutor solo ve su trimestre (scoped query), nunca otros.

Dependencias de migración: V25/V26 antes de habilitar BI-09/BI-10; V28 antes de BI-12/13; V29 antes de BI-16. Cada una es Flyway forward-only, sin downtime, con datos legacy preservados por default o UPDATE previo.


---

# Anexo — Diseño detallado por requerimiento


## RF-A01 Plan de Actividades (GAC-FM-10) v2 - Flujo tripartita con comentarios y expediente

**Estado actual:** Backend: Entidad PlanActividades con firma boolean para estudiante/tutor/profesor + fechas TIMESTAMPTZ. EstadoPlanActividades enum: BORRADOR, ENVIADO_TUTOR, APROBADO_TUTOR, APROBADO_PROFESOR, RECHAZADO (ENVIADO_TUTOR definido pero no usado). Entidades PlanActividadesObjetivo y PlanActividadesMes con su lógica de CRUD. PlanActividadesService: guardar (idempotente), firmar (ParteFirmaTrimestre) -> cambio directo a APROBADO_PROFESOR al 3er firma, generarPdf() bajo demanda. PlanActividadesPdfGenerator: OpenPDF, formato GAC-FM-10 v2.0 oficial (info estudiante/empresa/profesor, objetivos, plan mensual, firmas), genera bajo demanda pero NO persiste. Controller REST: GET/PUT/PATCH /firmar/{parte}/GET /pdf. DTOs: PlanActividadesRequest y PlanActividadesResponse. Mapper: TrimestreMapper.toResponse. V7 migracion: plan_actividades (estado VARCHAR(20)), plan_actividades_objetivo, plan_actividades_mes, indices. NotificacionService existe pero NO integrado. Frontend: plan-actividades-page.tsx completa con edicion de escenario/descripcion/objetivo, CRUD objetivos (con carga predefinida para Ing. Software), CRUD plan mensual, seccion Firmas con 3 botones + AlertDialog confirmacion, descarga PDF bajo demanda. React Query para fetch/mutate. Sin comentarios en UI actual.


**Gap:** 1. Flujo de aprobacion tripartita con comentarios: tabla plan_actividades_comentario con autor_rol, tipo (FEEDBACK/RESPUESTA_APROBACION/RESPUESTA_RECHAZO), endpoint POST para agregar. 2. Guardado automatico del PDF en expediente (tabla documentos) cuando 3 firmas completadas. 3. Notificaciones al tutor academico y tutor empresarial cuando estudiante envía/firma. 4. Validacion de permisos: verificar que usuarioAutor del token JWT coincida con tutor/profesor del convenio en endpoint PATCH /firmar/{parte}. 5. Flujo real de estados: ENVIADO_TUTOR -> espera tutor -> APROBADO_TUTOR -> espera profesor -> APROBADO_PROFESOR. 6. Sello de tiempo criptografico en firmas (opcional v3). 7. IA en validacion de coherencia entre actividades y objetivos durante guardado. 8. UI con seccion de comentarios, validacion de rol, rechazo con observaciones vuelve a BORRADOR.


**Cambios backend:**
- 1. Nueva entidad PlanActividadesComentario: id, plan_actividades_id FK, autor_mongo_id, autor_nombre, autor_rol ENUM (ESTUDIANTE/TUTOR/PROFESOR/COORDINADOR/ADMIN), mensaje TEXT, observacion_tipo ENUM (FEEDBACK/RESPUESTA_APROBACION/RESPUESTA_RECHAZO/SISTEMA), created_at TIMESTAMPTZ. Indices: idx_pa_comentario_pa(plan_actividades_id)
- 2. Cambios PlanActividadesService.firmar(): agregar validacion de identidad (usuarioAutor debe coincidir con tutor/profesor del convenio), cuando 3 firmas -> llamar guardarPdfEnExpediente() y notificarFirmas()
- 3. Nuevo metodo guardarPdfEnExpediente(): generar PDF, crear Documento entity con tipo=PLAN_ACTIVIDADES, guardar en BD, vincular a plan_actividades.documento_pdf_id
- 4. Nuevo metodo agregarComentario(trimestreId, request, usuarioAutor): validar permisos por rol, crear PlanActividadesComentario, si tipo=RESPUESTA_RECHAZO -> cambiar estado a RECHAZADO + notificar estudiante, si tipo=RESPUESTA_APROBACION -> avanzar estado (ENVIADO_TUTOR->APROBADO_TUTOR), guardar + notificar
- 5. Nuevo metodo listarComentarios(trimestreId): devolver lista de PlanActividadesComentarioResponse ordenada por fecha
- 6. Cambios PlanActividadesController: agregar @PostMapping /comentarios, @GetMapping /comentarios, modificar @PatchMapping /firmar/{parte} para validar identidad
- 7. Nuevos DTOs: PlanActividadesComentarioRequest (mensaje STRING, tipo ENUM, razonRechazo STRING nullable), PlanActividadesComentarioResponse
- 8. Nueva Repository: PlanActividadesComentarioRepository extends JpaRepository con metodo List<PlanActividadesComentario> findByPlanActividadesIdOrderByCreatedAtAsc(Long id)
- 9. Integrar NotificacionService.enviarTexto() en metodos de firma y comentarios


**Cambios frontend:**
- 1. Nueva Card 'Comentarios del flujo de aprobacion' bajo seccion Firmas: lista de comentarios con autor, rol, fecha, tipo (color diferente si RESPUESTA_RECHAZO)
- 2. Form para agregar comentario visible si hasRole(TUTOR/PROFESOR/COORDINADOR/ADMIN) Y estado != APROBADO_PROFESOR: Textarea + 2 botones (Aprobar, Rechazar/Pedir revision)
- 3. Si tipo RESPUESTA_RECHAZO: mostrar Badge destructive, habilitar edicion nuevamente en formula de datos
- 4. Si estado APROBADO_PROFESOR: mostrar Badge verde, deshabilitar todos los botones de firma y edicion
- 5. Validacion visual en FirmaButton: si usuarioActual.id != tutor/profesor del convenio -> mostrar 'No eres X' en lugar de boton
- 6. React Query mutations: useMutation agregarComentario(msg, tipo) invalidando queryKey /trimestres/pa/{id}/comentarios y /trimestres/pa/{id}
- 7. Actualizar enum labels: APROBADO_PROFESOR_FINAL si se agrega


**Migración:** V22__plan_actividades_comentarios_y_flujo_aprobacion.sql: (1) CREATE TABLE plan_actividades_comentario (id BIGSERIAL PK, plan_actividades_id BIGINT FK NOT NULL, autor_mongo_id VARCHAR(36), autor_nombre VARCHAR(160) NOT NULL, autor_rol VARCHAR(20) NOT NULL CHECK (ESTUDIANTE/TUTOR/PROFESOR/COORDINADOR/ADMIN), mensaje TEXT NOT NULL, observacion_tipo VARCHAR(30) NOT NULL CHECK (FEEDBACK/RESPUESTA_APROBACION/RESPUESTA_RECHAZO/SISTEMA), created_at TIMESTAMPTZ DEFAULT now()), (2) CREATE INDEX idx_pa_comentario_pa ON plan_actividades_comentario(plan_actividades_id), (3) ALTER TABLE plan_actividades ALTER COLUMN estado TYPE VARCHAR(30), (4) Opcionalmente: ALTER TABLE plan_actividades ADD COLUMN descripcion_rechazo TEXT, ADD COLUMN fecha_ultima_modificacion TIMESTAMPTZ


**Pruebas:** Backend (JUnit): PlanActividadesServiceTest (testGuardarPACompleto, testFirmarSecuencia ESTUDIANTE->TUTOR->PROFESOR valida estados, testFirmarNoPermitido, testPDFGuardadoAlTercerFirma valida documento_pdf_id NOT NULL, testComentarioRechazo estado->BORRADOR, testComentarioAprobacionAvanza ENVIADO_TUTOR->APROBADO_TUTOR). PlanActividadesControllerTest (testAgregarComentarioSoloAutorizado solo TUTOR/PROFESOR, testFirmarValidaIdentidad usuarioAutor debe coincidir). Frontend (Cypress): plan-actividades.cy.ts (Caso 1: estudiante completa PA guardar, Caso 2: tutor revisa comenta aprueba, Caso 3: profesor revisa aprueba PDF generado, Caso 4: rechazo tutor estado RECHAZADO estudiante corrige, Caso 5: descarga PDF expediente). Newman (API): coleccion flujo tripartita completo validar estados en cada paso verificar PDF post-3 firmas


**Integra guía:** IA (ia-sidecar): Nuevo servicio PlanActividadesIaService con metodo validarCoherenciaPa(objetivos, actividadesPorMes) -> llama ia-sidecar endpoint POST /validar-pa-coherencia devuelve warnings si meses desalineados con objetivos (warning en frontend, no bloquea). MCP: Extender agente conversacional /mcp-server para consultar planes de actividades en lenguaje natural. Sonar: Coverage minimo 80% en PlanActividadesService nuevo codigo, 100% DTOs/mappers, sin nuevas vulnerabilidades OWASP. Tests: 3 happy paths + 2 negative paths en Cypress, JUnit con @Transactional para aislamiento


**Riesgo:** Carrera en firmas simultaneas dos firmas concurrentes podrian duplicar PDF: mitigacion @Transactional(isolation=SERIALIZABLE) en metodo firmar(). PDF muy grande OOM: limitar a 10 MB en PdfGenerator rechazar si excede. Email a tutor no configurado notificacion silenciosa: logs WARN si NotificacionService falla, behavior=graceful. Estudiante no envía a tutor manualmente flujo manual lento: UI muestra hint cuando guardar PA invitar a tutor. Identidad usuarioAutor no verificada alguien firma como tutor siendo estudiante: validar token JWT + tutor_academico_id == token.userId en BD. PDF generado vs guardado divergen usuario ve distinto: generar PDF solo cuando 3 firmen usar hash SHA256 para validar integridad


## RF-A02 Evaluación Docente (GAC-FM-1) · Cortes 1 y 2 en Columnas Paralelas

**Estado actual:** BACKEND (Sprint actual, V11 ya aplicada):
- Entidad: /backend/src/main/java/co/uempresarial/sivu/trimestre/domain/EvaluacionProfesorTrimestre.java
  * Campos C1 sin sufijo (capacidades, actitudes, etc.) + campos C2 (capacidades_c2, etc.)
  * Soporta notas ponderadas por corte (nota_ponderada, nota_ponderada_c2)
  * Fechas separadas (fecha_c1, fecha_c2) y observaciones (observaciones_c1, observaciones_c2)
  * Firmas digitales con sello de tiempo (fechaFirmaProfesor, fechaFirmaEstudiante)
- Servicio: /backend/src/main/java/co/uempresarial/sivu/trimestre/service/EvaluacionProfesorTrimestreService.java
  * Calcula nota ponderada automática: Capacidades 10% + Actitudes 10% + Aplicación 80% (20/50/10)
  * Guardar, obtener, firmar (PROFESOR/ESTUDIANTE)
- PDF Generator (ACTUAL - NO EN COLUMNAS PARALELAS): /backend/src/main/java/co/uempresarial/sivu/trimestre/pdf/EvaluacionProfesorPdfGenerator.java
  * Tabla 5-columna: # | Criterio | Concepto | 1ª Cal 25% | 2ª Cal 25% (HORIZONTAL)
  * Encabezado institucional con marca, código GAC-FM-1, versión 3
  * Notas ponderadas en fila adicional
  * Firmable PDF almacenado en documentoPdf
- Estilos compartidos: /backend/src/main/java/co/uempresarial/sivu/trimestre/pdf/PdfStyles.java
- Controller: /backend/src/main/java/co/uempresarial/sivu/trimestre/web/EvaluacionProfesorTrimestreController.java (GET/PUT/PATCH/PDF)
- DTOs: EvaluacionProfesorRequest/Response con campos C1 y C2
- Repository: EvaluacionProfesorTrimestreRepository
- Migraciones: V11__evaluacion_profesor_dos_cortes.sql (ya aplicada, última es V21)

FRONTEND:
- Página: /frontend/src/features/trimestres/evaluacion-profesor-page.tsx
  * Layout lado a lado (grid lg:grid-cols-2): CorteCard para C1 y C2
  * Entrada manual de notas 0-5, observaciones, fechas por corte
  * Cálculo automático de nota ponderada local
  * Descarga PDF, firmar (con AlertDialog confirmación)
  * Nota final = promedio de cortes con datos
- Componentes: CorteCard (componible), FirmaButton, Calif (input numérico)
- Consultas: GET /trimestres/{id}/evaluacion-profesor, PUT, PATCH /firmar/{parte}, GET /pdf

BD (PostgreSQL, V11):
- Tabla: evaluacion_profesor_trimestre con 34 columnas
  * Corte 1: capacidades, actitudes, aplicacion_desempeno, aplicacion_elaboracion_pem, aplicacion_sustentacion_pem, nota_ponderada, observaciones_c1, fecha_c1
  * Corte 2: capacidades_c2...nota_ponderada_c2, observaciones_c2, fecha_c2
  * Legacy para retrocompatibilidad: observaciones, fecha_elaboracion
  * Estado: firmado_profesor, firmado_estudiante, fecha_firma_profesor, fecha_firma_estudiante, nombres
  * Relación: ManyToOne a Documento (documentoPdf)

TESTING ACTUAL: Ninguno. No existen tests para EvaluacionProfesorTrimestreService ni PDF generator.



**Gap:** REQUERIMIENTO v2 (Evaluación Docente GAC-FM-1, Cortes 1 y 2 en COLUMNAS PARALELAS):

1. **LAYOUT PDF NO CUMPLE ESPECIFICACIÓN**
   - Actual: tabla horizontal (1 fila de criterios + 2 columnas numéricas en paralelo)
   - Requerido: **2 COLUMNAS SEPARADAS FÍSICAMENTE** en el documento
     * Columna izquierda: Corte 1 (encabezado, criterios, notas, observaciones, firma)
     * Columna derecha: Corte 2 (mismo contenido)
   - Efecto: mejor visualización y comparación lado a lado, cumplimiento GAC-FM-1 v3 oficial

2. **ENCABEZADO OFICIAL INCOMPLETO**
   - Actual: llama a encabezadoInstitucional() con código/versión/fecha
   - Requerido: encabezado **unificado para ambos cortes** (no duplicado)
     * Sección "Cortes 1 y 2 — 25% cada uno" clara
     * Notas parciales y nota final en sección diferenciada

3. **FALTA PRUEBAS UNITARIAS**
   - No existe: EvaluacionProfesorTrimestreServiceTest
   - No existe: EvaluacionProfesorPdfGeneratorTest
   - Requisito de guía: coverage ≥ 80% en servicios críticos + Sonar OK

4. **POTENCIAL MEJORA DB (V22)**
   - Actual: campos legacy en tabla (observaciones, fecha_elaboracion)
   - Opcional: index en (trimestre_id, fecha_c1, fecha_c2) para queries de trimestres activos

5. **VALIDACIÓN DE INTEGRIDAD**
   - Falta: garantizar que si se firma, no falte nota ponderada
   - Falta: impedir modificación de cortes ya firmados (read-only en BD)



**Cambios backend:**
- 1. REFACTORIZAR EvaluacionProfesorPdfGenerator.java
-    - Cambiar de tabla 5-col a layout 2-COLUMNAS PARALELAS (PdfPTable con 2 col para left/right)
-    - Encabezado ÚNICO (no duplicado) con 'GAC-FM-1 v3 · Evaluación en Dos Cortes'
-    - CORTE 1 (izq): Información + Criterios (1-3) + Notas parciales + Observaciones + Firma
-    - CORTE 2 (der): Mismo contenido, datos C2, observaciones_c2, firma (si aplica)
-    - Sección final ÚNICA: NOTA FINAL (promedio de ambos cortes)
-    - Método helper: crearCorteColumna(ev, esCorte1: boolean) → PdfPCell con todo el contenido del corte
- 
- 2. MEJORAR VALIDACIÓN EN EvaluacionProfesorTrimestreService.java
-    - En firmar(): validar que notaPonderada/notaPonderadaC2 exista antes de permitir firma
-    - Opcional: lanzar BusinessException si intenta firmar sin notas (ambos cortes sin llenar)
-    - Método: validateBeforeSign(EvaluacionProfesorTrimestre e, ParteFirmaTrimestre parte)
- 
- 3. CREAR tests: backend/src/test/java/co/uempresarial/sivu/trimestre/service/
-    - EvaluacionProfesorTrimestreServiceTest (calculo notas, guardar, firmar, obtener)
-    - Casos: guardar C1 solo, C1+C2, promedios, firma duplicada → exception, notes requeridas
- 
- 4. CREAR tests: backend/src/test/java/co/uempresarial/sivu/trimestre/pdf/
-    - EvaluacionProfesorPdfGeneratorTest (generación PDF, contenido, layout 2-col)
-    - Verificar: encabezado único, ambos cortes presentes, notas calculadas, firmas
- 
- 5. OPCIONAL V22 (Mejora DB):
-    - Crear /backend/src/main/resources/db/migration/V22__evaluacion_profesor_optimizaciones.sql
-    - Agregar INDEX: CREATE INDEX idx_eval_prof_trimestre_fechas ON evaluacion_profesor_trimestre(trimestre_id, fecha_c1, fecha_c2);
-    - Agregar CHECK: nota_ponderada NOT NULL si trimestre.estado = 'ACTIVO' (validación en BD si requiere)


**Cambios frontend:**
- 1. OPCIONAL: Mejorar visualización de nota final
-    - Componente Card con nota final más prominente (ya está en pantalla)
-    - Considerar agregar barra de progreso o ícono de cumplimiento si nota ≥ 3.0
- 
- 2. SIN CAMBIOS ESTRUCTURALES MAYORES
-    - evaluacion-profesor-page.tsx ya tiene layout grid 2-col que refleja ambos cortes
-    - Los inputs, cálculos y guardado ya están correctamente separados por corte
-    - La descarga PDF refresca al cambiar backend (sin acción adicional)


**Migración:** V22__evaluacion_profesor_optimizaciones.sql (OPCIONAL):
  - Índice en (trimestre_id, fecha_c1, fecha_c2) para queries de reportes por período
  - Índice en (firmado_profesor, firmado_estudiante) para dashboards de estado
  - Agregar CHECK constraint en nota_ponderada vs nota_ponderada_c2 (validación lógica)
  
Nota: Los campos ya existen en V11. Si no hay métricas de performance que justifiquen V22, puede omitirse.
Alternativamente, V22 puede incluir cambios en el esquema de firma (agregar timestamp por separado si requiere auditoría de cuándo se firmó cada corte).

Recomendación: crear V22 SOLO si el proyecto requiere auditoría detallada o hay bottleneck de queries.


**Pruebas:** [
  "UNITARIAS (JUnit 5 + Mockito, patrón existente en EvaluacionServiceTest):",
  "",
  "1. EvaluacionProfesorTrimestreServiceTest",
  "   @Test guardarCorte1SoloCalculaNotaPonderada()",
  "   @Test guardarCorte1YCorte2CalculaAmbaNotas()",
  "   @Test guardarConObservacionesSeparadasPorCorte()",
  "   @Test guardarCombertirLegacyObservacionesAlCorte1()",
  "   @Test firmarComoProfesorSinNotaPonderadaLanzaException()",
  "   @Test firmarDosVecesLanzaBusinessException()",
  "   @Test obtenerEntidadDevuelveResponseMapeado()",
  "   @Test generarPdfDevuelveByteArray()",
  "   Coverage: ≥ 85% (servicios críticos)",
  "",
  "2. EvaluacionProfesorPdfGeneratorTest",
  "   @Test generarPDFConDosCortesEnColumnaParalela()",
  "   @Test encabezadoUnicoConGACFM1Codigo()",
  "   @Test notaPonderadaCortada2Decimales()",
  "   @Test notaFinalPromedioCorrecto()",
  "   @Test siUnCorteEsNuloMuestraRayasEnLugarDeNota()",
  "   @Test firmasConFechaYHoraSelloDeTiempo()",
  "   Coverage: ≥ 80%",
  "",
  "INTEGRACIÓN (Newman, contra API real):",
  "  POST /api/v1/trimestres/{id}/evaluacion-profesor (guardar C1+C2)",
  "  GET  /api/v1/trimestres/{id}/evaluacion-profesor (obtener)",
  "  PATCH /api/v1/trimestres/{id}/evaluacion-profesor/firmar/PROFESOR",
  "  PATCH /api/v1/trimestres/{id}/evaluacion-profesor/firmar/ESTUDIANTE",
  "  GET  /api/v1/trimestres/{id}/evaluacion-profesor/pdf (descargar, verificar contenido)",
  "",
  "E2E (Cypress):",
  "  1. Ingresar notas corte 1 → guardar → verificar persistencia",
  "  2. Ingresar notas corte 2 → guardar → verificar nota final promediada",
  "  3. Descargar PDF → verificar layout 2-col, ambos cortes visibles",
  "  4. Firmar como profesor → verificar estado, sello de tiempo",
  "  5. Firmar como estudiante → verificar estado final, cambio UI",
  "",
  "SONAR:",
  "  - Cobertura mínima: 80% en trimestre/service y trimestre/pdf",
  "  - Code smells: 0 (refactor grandes métodos en PDF generator)",
  "  - Vulnerabilidades de seguridad: 0",
  "  - Hotspots: Revisar manejo de BigDecimal en cálculos (no hay riesgo, pero Sonar puede alertar)"
]


**Integra guía:** [
  "PRUEBAS (Requisito explícito del curso):",
  "  ✓ Unitarias JUnit 5 con Mockito (patrón existente en proyecto)",
  "  ✓ Coverage ≥ 80% en servicios críticos (EvaluacionProfesorTrimestreService)",
  "  ✓ Tests de integración Newman contra API",
  "  ✓ E2E Cypress para flujos de usuario (guardar, firmar, descargar)",
  "  ✓ Sonar Quality Gate: A (0 bugs, 0 vulnerabilidades, cobertura ≥ 80%)",
  "",
  "IA (Opcional para este RF):",
  "  - No aplica directamente a evaluación del profesor",
  "  - Si se requiere: podría agregar sugerencias de observaciones basadas en informe final",
  "  - Ejemplo: POST /ia/evaluacion-profesor/{id}/sugerir-observaciones (futuro)",
  "",
  "MCP (Model Context Protocol):",
  "  - Servidor MCP podría exponer: query evaluaciones por trimestre, estado de firmas",
  "  - Ejemplo tool: 'obtener_evaluacion_profesor' con parámetros (trimestre_id, con_pdf: bool)",
  "  - No es bloqueante para este RF, pero mejora UX de agentes internos",
  "",
  "CI/CD (Requisito):",
  "  - GitHub Actions: mvn verify (tests + JaCoCo) debe pasar antes de deploy",
  "  - Sonar scan en cada PR: quality gate obligatorio",
  "  - E2E en staging después de deploy (Cypress headless)",
  "  - Deploy a producción solo si tests + Sonar + E2E = OK"
]


**Riesgo:** [
  "ALTO: Cambio de layout PDF (CORRIGE REQUERIMIENTO)",
  "  - Impacto: Evaluaciones ya firmadas usan layout anterior (horizontal 5-col)",
  "  - Mitigación: Versión del PDF = 3 (ya en código), nuevo layout solo para nuevas evaluaciones",
  "  - Decisión: Mantener retrocompatibilidad con una flag `versionLayout` si requiere",
  "",
  "MEDIO: Validación de notas antes de firmar",
  "  - Impacto: Si se agrega validación 'notas obligatorias para firmar', se bloquea flujo anterior",
  "  - Mitigación: Hacer validación SOFT (warning, no exception) o solo en new enrollments",
  "",
  "BAJO: Cambios en tests",
  "  - Impacto: Cobertura actual = 0%, agregar tests requerirá refactor de servicio si hay acoplamiento",
  "  - Mitigación: Inyección de dependencias ya en lugar (Repository, Mapper, CurrentUserService)",
  "",
  "BAJO: Performance del PDF con 2 columnas",
  "  - Impacto: PDF más grande si hay más contenido en observaciones",
  "  - Mitigación: PdfStyles ya optimizado, OpenPDF es eficiente",
  "",
  "BAJO: Inconsistencia entre frontend y backend",
  "  - Actual: Frontend calcula nota local, backend calcula al guardar",
  "  - Riesgo: Si fórmula se desincroniza (cambio mal aplicado)",
  "  - Mitigación: Métodos `calcularNotaPonderadaCorte1/2` públicos en servicio, frontend puede validar"
]


## RF-A03 Evaluación Tutor (GAC-FM-9) Corte 3 — Acceso externo sin cuenta institucional + continuidad obligatoria

**Estado actual:** 
**Backend Spring Boot 3 (co.uempresarial.sivu.trimestre):**
- Entidad EvaluacionTutorTrimestre (/backend/src/main/java/co/uempresarial/sivu/trimestre/domain/EvaluacionTutorTrimestre.java): Campos completos (capacidades, actitudes, aplicacionDesempeno/Elaboracion/Sustentacion, notaPonderada, continuidadConEmpresa, observaciones, fechaElaboracion, firmadoTutor/Estudiante con timestamps)
- Servicio EvaluacionTutorTrimestreService (/backend/src/main/java/co/uempresarial/sivu/trimestre/service/EvaluacionTutorTrimestreService.java): Cálculo de nota automático (40% + 40% + 10% + 5% + 5% = 100%) en método estático calcularNotaPonderada(), firma de tutor/estudiante con sello temporal
- Controlador EvaluacionTutorTrimestreController (/backend/src/main/java/co/uempresarial/sivu/trimestre/web/EvaluacionTutorTrimestreController.java): Endpoints GET/PUT/PATCH/PDF con roles @PreAuthorize("hasAnyRole('EMPRESA','COORDINADOR','ADMIN')")
- DTOs EvaluacionTutorRequest/Response (/backend/src/main/java/co/uempresarial/sivu/trimestre/web/dto/): Todos los campos presentes, continuidadConEmpresa sin @NotNull
- PDF Generator EvaluacionTutorPdfGenerator (/backend/src/main/java/co/uempresarial/sivu/trimestre/pdf/EvaluacionTutorPdfGenerator.java): Genera formato GAC-FM-007 con escala, criterios, nota, continuidad, observaciones, firmas (estado pendiente/firmado)

**BD PostgreSQL (V7__trimestres_planes_actas_evaluaciones.sql):**
- Tabla evaluacion_tutor_trimestre: trimestre_id (UNIQUE), capacidades/actitudes/aplicacion_desempeno/elaboracion_pem/sustentacion_pem (NUMERIC 3,2), nota_ponderada, continuidad_con_empresa (BOOLEAN nullable), observaciones (TEXT), fecha_elaboracion (DATE), firmado_tutor/estudiante (BOOLEAN NOT NULL DEFAULT FALSE), documento_pdf_id (FK)
- Timestamps: created_at, updated_at (ambos TIMESTAMPTZ DEFAULT now())

**Frontend React+Vite+TS (trimestres/evaluacion-tutor-page.tsx):**
- Página completa con form de 5 inputs numéricos (0-5), radio buttons (SI/NO/Sin definir) para continuidad, textarea observaciones, date input fechaElaboracion
- Nota ponderada autocalculada en cliente (isomorphic con backend)
- Card de firmas con diálogos de confirmación para TUTOR y ESTUDIANTE
- Botones: Guardar, Firmar como Tutor/Estudiante, Descargar PDF
- SIN acceso seguro para tutores externos (solo usuarios autenticados con rol EMPRESA)

**Seguridad (security/domain/Rol.java):**
- Roles: ADMIN, COORDINADOR, ESTUDIANTE, EMPRESA, MCP_AGENT (NO existe TUTOR)
- Usuario en MongoDB con FK lógicos estudianteId/empresaId (sin integridad cross-DB)
- Tutores en tabla PostgreSQL (tutores.java) sin vinculación de usuario, solo Tutor.empresa_id

**Acceso actual:**
- Tutor empresarial NO puede acceder como usuario independiente (no tiene cuenta)
- Solo empresa (rol EMPRESA) o coordinadores pueden guardar evaluación
- Controlador: PUT requiere hasAnyRole('EMPRESA','COORDINADOR','ADMIN')



**Gap:** 
1. **Acceso externo del tutor empresarial**: RF requiere que tutor diligiencie sin cuenta institucional. Actualmente NO existe:
   - No hay rol TUTOR en el sistema
   - No hay endpoint de login para tutores
   - No hay mecanismo de enlace compartido o token externo
   - Tutor empresarial no es usuario, solo registro en tabla tutores

2. **Validación obligatoria de continuidad**: RF dice campo OBLIGATORIO, actualmente:
   - continuidadConEmpresa es Boolean nullable
   - En frontend: radio buttons SI/NO/Sin definir (3 opciones, no obligatorio)
   - En DTO: sin @NotNull
   - En DB: BOOLEAN sin constraint NOT NULL
   - Permite guardar con value = null

3. **Integridad de acceso**: Tutor debe ver/editar SOLO su evaluación (validación missing):
   - No hay check en controlador si usuario logueado es el tutor del trimestre
   - No hay segregación de datos por tutor en queries

4. **Firma digital**: Actualmente es flag boolean sin firma criptográfica:
   - PDF muestra "[ FIRMADO ]" solo si flag = true
   - No hay validación de identidad real
   - No hay certificado digital o sello electrónico
   - fechaFirma se registra pero sin autenticación fuerte

5. **Persistencia de acceso**: Sin token o PIN específico para tutor:
   - No hay forma segura de reutilizar enlace (tutor puede perder acceso)
   - No hay control de expiración de acceso

6. **Comunicación al tutor**: No existe mecanismo para notificar/enviar enlace al tutor

7. **Documentación de cambios**: No existe spec técnica del RF v2 en repo



**Cambios backend:**
- 1. Rol.java: Agregar enum TUTOR (o extender EMPRESA para permitir tutores como usuarios)
- 2. V22__evaluacion_tutor_acceso_externo.sql: (a) ALTER TABLE evaluacion_tutor_trimestre ADD COLUMN acceso_externo_token VARCHAR(255) UNIQUE; (b) ALTER TABLE evaluacion_tutor_trimestre ALTER COLUMN continuidad_con_empresa SET NOT NULL; (c) Posible: ADD tutor_id BIGINT REFERENCES tutores(id)
- 3. EvaluacionTutorRequest (DTO): Agregar @NotNull en continuidadConEmpresa, agregar @NotNull List<BigDecimal> capacidades/actitudes/aplicacionDesempeno/aplicacionElaboracionPem/aplicacionSustentacionPem para hacerlos obligatorios
- 4. EvaluacionTutorTrimestreService: (a) Validar en guardar() que todos los criterios sean no-null ANTES de calcular nota; (b) Método generarTokenExternoTutor(Long trimestreId, Long tutorId): genera JWT con sub=tutor_id, trimestre_id, exp=+7días; (c) Validar en guardar() que usuario es TUTOR del trimestre o tiene rol EMPRESA/COORDINADOR
- 5. EvaluacionTutorTrimestreController: (a) Cambiar @PreAuthorize PUT a: hasAnyRole('EMPRESA','COORDINADOR','ADMIN') OR (hasRole('TUTOR') AND es-su-tutor); (b) Agregar GET /api/v1/trimestres/{trimestreId}/evaluacion-tutor/acceso-externo/{token} (sin @PreAuthorize, valida token JWT); (c) Agregar POST /api/v1/trimestres/{trimestreId}/evaluacion-tutor/generar-enlace (solo COORDINADOR/ADMIN, devuelve URL compartible)
- 6. AuthService: Agregar método loginTutor(email, password) → crea Usuario con rol TUTOR si Tutor existe con ese email, O crear endpoint genérico para usuarios empresa/tutor
- 7. AuthController: Agregar POST /api/v1/auth/login-tutor (public) con email + PIN temporal (o referencia a tutor)
- 8. EvaluacionTutorPdfGenerator: (a) Mostrar 'Firmado el YYYY-MM-DD HH:mm' junto a [ FIRMADO ]; (b) Opcional: integrar QR con sello de tiempo
- 9. Mapper (TrimestreMapper): Agregar mapeo de EvaluacionTutorTrimestre a response con token para vista admin


**Cambios frontend:**
- 1. evaluacion-tutor-page.tsx: (a) Cambiar radio continuidad de 3 opciones (SI/NO/Sin definir) a 2 opciones (SI/NO) obligatorio; (b) Agregar validación: no permitir guardar sin completar continuidad; (c) Mostrar error toast si continuidad está vacío
- 2. Crear nueva página/modal tutor-login-page.tsx: Formulario email + PIN/contraseña específica del tutor (o usar login general)
- 3. Crear tutor-acceso-externo.tsx: Página protegida por token JWT en URL ?token=xxxxx, renderiza formulario evaluacion-tutor-page con datos pre-cargados
- 4. Agregar interceptor en API client: Si respuesta 401 en evaluacion-tutor y hay token en URL params, reintentar con Authorization header del token
- 5. Actualizar types.ts: Agregar ParteFirmaTrimestre = 'TUTOR' | 'ESTUDIANTE' (ya existe), agregar campo token en response
- 6. Agregar validación en guardar: Mostrar spinner, deshabilitar botones mientras se guarda
- 7. Actualizar PDF download: Mostrar nombre del tutor que firmó + fecha firma
- 8. Nav/Menu: Si usuario es TUTOR, mostrar solo 'Mis evaluaciones' (no acceso a otras)


**Migración:** V22__evaluacion_tutor_acceso_externo.sql:

```sql
-- V22 · Evaluación Tutor: acceso externo + continuidad obligatoria
-- Objetivo: Permitir tutores empresariales diligenciar evaluación sin cuenta institucional
-- RFC: RF-A03 (GAC-FM-9 corte 3)

-- 1. Hacer continuidad_con_empresa obligatoria
ALTER TABLE evaluacion_tutor_trimestre 
  ALTER COLUMN continuidad_con_empresa SET NOT NULL,
  ADD CONSTRAINT chk_continuidad_valido CHECK (continuidad_con_empresa IN (true, false));

-- 2. Agregar token de acceso externo para tutores sin cuenta
ALTER TABLE evaluacion_tutor_trimestre 
  ADD COLUMN acceso_externo_token VARCHAR(255) UNIQUE,
  ADD COLUMN fecha_token_generado TIMESTAMPTZ,
  ADD COLUMN fecha_token_expira TIMESTAMPTZ;

-- 3. Opcional: Vincular directamente tutor empresarial para integridad
-- ALTER TABLE evaluacion_tutor_trimestre 
--   ADD COLUMN tutor_empresarial_id BIGINT REFERENCES tutores(id) ON DELETE SET NULL;

-- 4. Índice para búsquedas rápidas de tokens
CREATE INDEX idx_et_acceso_token ON evaluacion_tutor_trimestre(acceso_externo_token) 
  WHERE acceso_externo_token IS NOT NULL;

-- 5. Data migration: Para evaluaciones existentes con continuidad NULL, asignar FALSE (sin continuidad)
UPDATE evaluacion_tutor_trimestre 
  SET continuidad_con_empresa = FALSE 
  WHERE continuidad_con_empresa IS NULL;
```

Notas:
- Cambio estructural: continuidad ahora REQUIRED en BD (puede romper datos legacy si existen con NULL)
- Token de acceso es VARCHAR(255) y UNIQUE para reutilización
- Expiración configurable (por defecto 7 días desde generación)
- Sin cambios en tablas existentes, solo adicionales



**Pruebas:** [
  "Unit Tests (co.uempresarial.sivu.trimestre.service.EvaluacionTutorTrimestreServiceTest):",
  "  - calcularNotaPonderada_con_todos_valores: Verifica 40+40+10+5+5",
  "  - calcularNotaPonderada_con_nulls: Verifica que null trata como 0",
  "  - guardar_requiere_continuidad_no_null: Espera excepción si continuidad = null",
  "  - guardar_valida_que_usuarios_sea_tutor: Mock CurrentUserService, verifica que usuario logueado es tutor del trimestre",
  "  - firmar_dos_veces_tutor_lanza_excepcion",
  "  - generarTokenExternoTutor_crea_jwt_valido: Token contiene sub=tutorId, trimestres=trimestreId",
  "",
  "Integration Tests (Newman):",
  "  - POST /api/v1/auth/login-tutor con email+PIN → devuelve JWT",
  "  - GET /api/v1/trimestres/{id}/evaluacion-tutor/acceso-externo/{token} → devuelve datos sin @PreAuthorize",
  "  - PUT evaluacion-tutor como TUTOR con token válido → guarda",
  "  - PUT evaluacion-tutor con continuidad=null → error 400",
  "  - PATCH /firmar/{TUTOR} como tutor logueado → firma registra timestamp",
  "  - GET /pdf como TUTOR → descarga PDF con datos",
  "",
  "E2E Tests (Cypress):",
  "  - Flujo tutor externo: Recibe enlace → accede sin login → diligencia → guarda → firma → descarga PDF",
  "  - Validación continuidad: Intenta guardar sin continuidad → error visible",
  "  - Protección de acceso: Tutor intenta ver evaluación de otro trimestre → error 403",
  "  - Expiración de token: Token expirado → redirect a login"
]


**Integra guía:** 
**IA (OpenAI/LLM si aplica):**
- NO aplica directamente, pero podría usarse en futuro para generar observaciones automáticas basadas en criterios diligenciados
- Posible: Agent en automatizacion/ que genera resumen de evaluación para reporte

**Sonar (Code Quality):**
- Agregar coverage >80% para EvaluacionTutorTrimestreService (actualmente calcularNotaPonderada es simple, agregar tests)
- Validar que ValidacionException sea consistent con proyecto
- Lint: No usar raw passwords en test (usar bcrypt/bcryptjs mock)

**MCP Agents:**
- Posible: Agent que envía enlace de acceso al tutor por email (integración con NotificacionService en automatizacion/)
- Posible: Agent que revisa evaluaciones completadas para aprobación docente

**Tests Framework:**
- Backend: JUnit 5 + Mockito (ya presente en proyecto)
- Frontend: Vitest/Jest + React Testing Library (verificar si proyecto ya usa)
- E2E: Cypress (agregar step para login sin UI si no existe)

**CI/CD:**
- Pipeline debe correr nuevos tests antes de merge
- Verificar cobertura Sonar >80% en trimestre/



**Riesgo:** [
  "ALTO - Seguridad de datos: Tutor externo accede a datos sensibles del estudiante (calificaciones, observaciones). Mitigación: (1) Token JWT con tiempo de expiración corto (7 días); (2) Validar que tutor solo ve SU trimestre/estudiante, no otros; (3) Logging de accesos externos; (4) Opcional: requerir confirmación en email antes de activar token",
  "",
  "MEDIO - Integridad de datos: Dos tutores intentan guardar/firmar simultáneamente. Mitigación: (1) Flag de firma en transacción DB; (2) Validar @Transactional(isolation=SERIALIZABLE); (3) Test de concurrencia",
  "",
  "MEDIO - Compatibilidad: Hacer continuidad obligatoria rompe datos legacy con NULL. Mitigación: (1) Migración V22 establece DEFAULT FALSE en datos existentes; (2) Comunicar cambio a equipos; (3) Backup antes de migración",
  "",
  "BAJO - Expiración de token: Si tutor no completa a tiempo, enlace vence. Mitigación: (1) UI muestra cuenta regresiva de expiración; (2) Permitir regenerar enlace (solo admin); (3) Almacenaje de fecha_token_expira en BD",
  "",
  "BAJO - Autenticación débil: Si PIN/contraseña del tutor es simple. Mitigación: (1) Usar OAuth corporativo si está disponible; (2) Si es PIN, enviar por email separado; (3) Requerir cambio de PIN en primer login",
  "",
  "BAJO - Documentación: RF v2 no está en spec técnica del proyecto. Mitigación: (1) Crear SPEC.md en branch feature; (2) Documentar en Confluence/Wiki"
]


## RF-A04 Informe Final (GTC-FM-16) + IA

**Estado actual:** BACKEND (Java 21, Spring Boot 3): Entidad InformeFinalPm con 12 secciones (resumenEjecutivo, contextualizacion, planteamientoProblema, marcoTeorico, objetivoGeneral, objetivosEspecificos, diagnostico, metodologia, propuestaSolucion, factibilidad, conclusiones, anexos). Carátula: tituloInforme, nivel (1-3), cargoTutorEmpresarial. Control de páginas (max 15). Firmas (estudiante, tutorAcad, tutorEmp). Estados: BORRADOR, ENTREGADO, APROBADO, RECHAZADO. Service: guardarBorrador, entregar (valida secciones mínimas y cuenta páginas reales con PdfReader), aprobar, rechazar, generarPdf. PDF Generator: carátula GTC-FM-16 oficial. Controller: GET/PUT /planes-mejora/{id}/informe-final, POST /informes-final-pm/{id}/entregar|aprobar|rechazar, GET /pdf. IA Service: análisis local heurístico (secciones vacías menos 60 palabras, validación de nivel/título/páginas) con fallback a sidecar Node. Migraciones: V9 creó tabla. V18 agregó titulo_informe, nivel, cargo_tutor_empresarial. FRONTEND (React 18): informe-final-pm-page.tsx con editor tabbed (6 tabs), 12 textareas de secciones obligatorias, validaciones (faltantes, páginas excedidas), botones (Guardar, Entregar, PDF, Revisar con IA, Aprobar/Rechazar si COORDINADOR). MCP Server: tool revisar_informe_final.


**Gap:** 1. Sistema de notas: FALTA columnas notaTutorAcad, notaTutorEmp (NUMERIC 0-5), notaPromedio (calculada). FALTA validación de nota mínima 3.0. FALTA endpoints para que docente/tutor registren notas. FALTA lógica de cálculo de promedio automático. 2. Flag Alto Impacto: FALTA columna altoImpacto (BOOLEAN). FALTA UI para editar flag. FALTA mostrar en PDF. 3. UI de notas: FALTA panel para que docente y tutor registren notas individuales (solo visible si es COORDINADOR o TUTOR). FALTA visualización de notas en estado ENTREGADO/APROBADO. 4. PDF mejorado: FALTA agregar sección de Notas y Evaluación al final. FALTA mostrar flag Alto Impacto en carátula. 5. IA mejorada: análisis heurístico ya existe pero es básico (solo cuenta palabras). FALTA análisis más profundo de calidad de contenido por sección. FALTA sugerencias personalizadas para cada sección. 6. Tests: FALTA tests unitarios para cálculo de promedio. FALTA tests para validación de nota mínima 3.0. FALTA tests integración de endpoints de notas. FALTA tests Newman para flujo completo entrega-notas-aprobación.


**Cambios backend:**
- 1. V22 Migration: ALTER TABLE informe_final_pm ADD COLUMN nota_tutor_acad NUMERIC(3,2) CHECK (nota_tutor_acad BETWEEN 0 AND 5), ADD COLUMN nota_tutor_emp NUMERIC(3,2) CHECK (nota_tutor_emp BETWEEN 0 AND 5), ADD COLUMN nota_promedio NUMERIC(3,2) CHECK (nota_promedio BETWEEN 0 AND 5), ADD COLUMN alto_impacto BOOLEAN NOT NULL DEFAULT FALSE.
- 2. InformeFinalPm entity: agregar notaTutorAcad, notaTutorEmp, notaPromedio, altoImpacto (fields privados con getters/setters).
- 3. InformeFinalPmRequest: agregar altoImpacto (Boolean), notaTutorAcad (Short), notaTutorEmp (Short).
- 4. InformeFinalPmResponse: agregar notaTutorAcad, notaTutorEmp, notaPromedio, altoImpacto.
- 5. InformeFinalPmService: nuevo método registrarNotaTutorAcad(Long id, Short nota) que valida nota >= 3.0, calcula promedio. Nuevo método registrarNotaTutorEmp(Long id, Short nota). Método setAltoImpacto(Long id, Boolean flag).
- 6. InformeFinalPmController: POST /api/v1/informes-final-pm/{id}/nota-tutor-acad {nota}, POST /api/v1/informes-final-pm/{id}/nota-tutor-emp {nota}, PUT /api/v1/informes-final-pm/{id}/alto-impacto {flag}.
- 7. InformeFinalPmPdfGenerator: agregar sección final 'Evaluación y Notas'. Mostrar 'ALTO IMPACTO' en carátula si flag es true.
- 8. InformeIAService: mejorar análisis heurístico con feedback por sección, detección de referencias APA7, sugerencias de mínimos de palabras por sección.


**Cambios frontend:**
- 1. informe-final-pm-page.tsx: agregar checkbox 'Alto Impacto'.
- 2. Agregar componente NotasPanel que se muestra si estado === ENTREGADO o APROBADO y userRole === COORDINADOR|TUTOR. Dos inputs numéricos (Nota Tutor Académico, Nota Tutor Empresarial) con validación 0-5 y mayor o igual a 3.0. Botón 'Guardar Nota'.
- 3. Integrar mutación useMutation para POST /informes-final-pm/{id}/nota-tutor-acad y POST /informes-final-pm/{id}/nota-tutor-emp.
- 4. Mostrar notas en Card de resumen (cuando ya están registradas).
- 5. Frontend types (lib/types.ts): actualizar InformeFinalPmResponse.
- 6. Validaciones client-side: rechazar notas menor a 3.0. Mostrar badge 'ALTO IMPACTO' si flag activo.
- 7. Mejorar FeedbackInformeIA Card: mostrar hallazgos con visual mejor (cards por sección, colores por severidad, expandibles).


**Migración:** V22__informe_final_notas_impacto.sql: ALTER TABLE informe_final_pm ADD COLUMN nota_tutor_acad NUMERIC(3,2) CHECK (nota_tutor_acad BETWEEN 0 AND 5), ADD COLUMN nota_tutor_emp NUMERIC(3,2) CHECK (nota_tutor_emp BETWEEN 0 AND 5), ADD COLUMN nota_promedio NUMERIC(3,2) CHECK (nota_promedio BETWEEN 0 AND 5), ADD COLUMN alto_impacto BOOLEAN NOT NULL DEFAULT FALSE;


**Pruebas:** Unitarias (JUnit 5 + Mockito): InformeFinalPmServiceTest.testCalcularPromedio_AmbasNotas(), testCalcularPromedio_UnaNota(), testCalcularPromedio_NotaMenorA3(), testValidarNotaMinima(). InformeFinalPmPdfGeneratorTest.testPdfConNotasYAltoImpacto(). Integración: InformeFinalPmControllerTest.testRegistrarNotaTutorAcad_Success(), testRegistrarNotaTutorAcad_MenorA3(), testRegistrarNotaTutorEmp(), testSetAltoImpacto(). Newman: flujo_entrega_notas_aprobacion.json (POST guardarBorrador -> POST entregar -> POST nota-tutor-acad -> POST nota-tutor-emp -> GET verificar promedio -> POST aprobar -> GET pdf). Cypress: informe-final-pm.cy.ts (llenar 12 secciones + alto-impacto -> guardar -> entregar -> panel notas si COORDINADOR -> ingresar notas -> verificar promedio). Target Sonar: mayor de 75% en informefinalpm.


**Integra guía:** Requisito #7 (IA): se reusan InformeIAService (análisis heurístico local) e IAController. Mejora: análisis más profundo con sugerencias por sección, detección de referencias APA7, feedback sobre estructura esperada. MCP server ya expone revisar_informe_final para Claude Desktop/Code. Requisito de tests: JUnit 5 (unitarias + integración) + Newman (flujo API) + Cypress (frontend). SonarCloud analiza cobertura (target mayor a 75%). Requisito de documentación: comentarios Javadoc en nuevos métodos, actualizar README.md con descripción de sistema de notas.


**Riesgo:** RIESGO BAJO. Cambios localizados al módulo informefinalpm (V22 es simple ALTER TABLE). No afecta otros módulos (nota mínima 3.0 es validación local). Compatibilidad: datos históricos tendrán nota_promedio NULL hasta que se registren notas. Fallback: si tutor no registra nota, aprobación no está bloqueada (solo nota es registrada, no es obligatoria para estado APROBADO). Testing mitiga riesgos. Deploy: V22 sin downtime, nuevas columnas con defaults.


## RF-B01: Expediente Digital Unificado

**Estado actual:** SIVU posee estructura package-by-feature. Entidades existentes: Estudiante (datos básicos: documento, programa, semestre, promedio), Convenio (OneToOne Postulacion, ManyToOne Estudiante/Empresa, estado BORRADOR/FIRMADO_*/ACTIVO/FINALIZADO, calificación final), Trimestre (1-3 por Convenio, estado ABIERTO/EN_CURSO/CERRADO, materia núcleo), Evaluaciones (tablas V7: evaluacion_tutor_trimestre y evaluacion_profesor_trimestre con notas componente/actitud/aplicación y firma), Documentos (Estudiante/Postulacion, estado RECIBIDO/VALIDADO/RECHAZADO), Plan Actividades (estado y firmas), Actas Reunión (número secuencial por trimestre, firmas), Plan Mejora, InformeFinalPm (OneToOne PlanMejora, estado BORRADOR/ENTREGADO, firmas tutor acad/empresarial/estudiante), Cohorte (semestre académico). Controllers: EstudianteController GET /api/v1/estudiantes/{id}, ConvenioController GET /api/v1/convenios/{id}, TrimestreController GET /api/v1/convenios/{convenioId}/trimestres. Frontend features: estudiantes/, convenios/, trimestres/, documentos/. Dashboard muestra convenio activo + trimestre actual. Archivos clave: backend/src/main/java/co/uempresarial/sivu/{estudiante|convenio|trimestre|evaluacion|documento|informefinalpm}/domain/ y /web/. Migraciones V1-V21 completas.


**Gap:** 1. Falta endpoint agregador GET /api/v1/expedientes/{estudianteId} que consolide: datos estudiante + convenio activo/históricos + trimestres con evaluaciones + plan actividades + actas + plan mejora + informe final + documentos por estado + notas por corte + nota final. 2. Falta tabla expediente_documento_estado (V22) para trackear estado de cada documento por trimestre (Pendiente/En revisión/Firmado/PDF generado). 3. Falta tabla expediente_nota_consolidada (V22) para cachear cálculo de promedios tutor/profesor/final. 4. Falta frontend page /expedientes/{estudianteId} que visualice expediente completo con tabs y descargas. 5. Falta endpoint GET /api/v1/cohortes/{cohorteId}/expedientes/export para descargar ZIP con todos los expedientes de una cohorte. 6. Falta lógica de cálculo de nota final (promedio tutor + profesor según pesos). 7. Falta permisos diferenciados: estudiante ve solo su expediente, docente ve de sus convenios, coordinador ve todos, empresa ve de sus practicantes. 8. Falta auditoria de cambios en expediente.


**Cambios backend:**
- 1. Nueva tabla V22 expediente_documento_estado: id BIGSERIAL PRIMARY KEY, trimestre_id BIGINT REFERENCES trimestre(id), tipo_documento VARCHAR(60), estado VARCHAR(20) DEFAULT 'PENDIENTE' [PENDIENTE|EN_REVISION|FIRMADO|PDF_GENERADO|RECHAZADO], fecha_esperada DATE, fecha_real TIMESTAMP, observaciones TEXT, created_at/updated_at TIMESTAMPTZ, UNIQUE (trimestre_id, tipo_documento), INDEX (trimestre_id)
- 2. Nueva tabla V22 expediente_nota_consolidada: id BIGSERIAL PRIMARY KEY, convenio_id BIGINT UNIQUE REFERENCES convenios(id), nota_tutor_promedio NUMERIC(3,2), nota_profesor_promedio NUMERIC(3,2), nota_final NUMERIC(3,2), numero_trimestres SMALLINT, created_at/updated_at TIMESTAMPTZ, INDEX (convenio_id)
- 3. Nuevo package backend/src/main/java/co/uempresarial/sivu/expediente/ con domain/persistence/service/web
- 4. Entidades JPA: ExpedienteDocumentoEstado, ExpedienteNotaConsolidada (mapeadas a V22)
- 5. Repository ExpedienteRepository con queries: findByEstudianteId, findByConvenioId, findByTrimestreId, con @EntityGraph para evitar N+1
- 6. Service ExpedienteService (inyecta ConvenioRepository, TrimestreRepository, EvaluacionRepository, DocumentoRepository, PlanActividadesRepository, ActaReunionRepository, PlanMejoraRepository, InformeFinalPmRepository, CurrentUserService) con métodos: obtenerExpedienteCompleto(estudianteId): ExpedienteResponse (con validación permisos), calcularNotaFinal(convenioId): BigDecimal (promedio tutor/profesor ponderado), actualizarEstadoDocumento(trimestreId, tipoDocumento, estado): void, exportarExpedientes(cohorteId): byte[] (ZIP), verificarAcceso(estudianteId, usuario): void throws AccessDeniedException
- 7. Controller ExpedienteController con endpoints: GET /api/v1/expedientes/{estudianteId} (PreAuthorize con SpEL), GET /api/v1/expedientes/{estudianteId}/notas, GET /api/v1/cohortes/{cohorteId}/expedientes/export (PreAuthorize COORDINADOR/ADMIN), GET /api/v1/expedientes/{estudianteId}/download-zip
- 8. DTOs: ExpedienteResponse record (estudiante:EstudianteResumen, convenioActivo:ConvenioResponse, conveniosPrevios:List<ConvenioResponse>, trimestres:List<TrimestreConsolidado>, evaluaciones:Map<Long,EvaluacionesConsolidadas>, documentos:Map<String,EstadoDocumento>, notasPorTrimestre:List<NotasTrimestre>, notaFinal:BigDecimal, actas:List<ActaResponse>, planMejora:PlanMejoraResponse, informe:InformeFinalResponse), EstadoDocumentoResponse (tipo, estado, fechaEsperada, fechaReal, observaciones), NotasConsolidadasResponse (notaTutor, notaProfesor, notaFinal, formulaCalculada)
- 9. Mapper MapStruct ExpedienteMapper con @Mapping para conversiones complejas
- 10. Tests: ExpedienteServiceTest (testObtenerExpediente_ExitoConDatos, testCalcularNotaFinal_DosTrimestres, testPermiso_EstudianteVeSoloPropio, testPermiso_CoordinadorVeTodos), ExpedienteControllerTest (testGET_401_SinAuth, testGET_403_OtroEstudiante, testGET_200_ConPermisos, testExport_403_Empresa, testResponseStructure_ContieneTrimestres)
- 11. Test de integración con @SpringBootTest
- 12. Optimización: agregar @EntityGraph en ConvenioRepository.findByEstudianteId(Long) con lazy load de todas las relaciones


**Cambios frontend:**
- 1. Nueva feature frontend/src/features/expedientes con estructura: pages/, components/, hooks/, types/
- 2. ExpedienteDetailPage (ruta /expedientes/:estudianteId): componente principal que: (a) obtiene ExpedienteResponse via useExpediente hook, (b) renderiza Tabs (Datos | Convenio | Trimestres | Evaluaciones | Documentos | Descargas), (c) permite descarga de ZIP, (d) muestra notas finales
- 3. Componentes reutilizables: EstudianteDataCard (nombre, documento, programa, semestre, promedio, email), ConvenioCard (numero, empresa, fecha inicio/fin, tutores, estado, calificación), TrimestreSummaryTable (tabla: numero | materia | estado | acciones), EvaluacionesPanel (dos columnas Tutor|Profesor con notas por componente, nota ponderada, estado firma, link PDF), DocumentoStateCard (por trimestre: tipo_documento -> estado badge con colores, fechas, observaciones), PlanActividadesCard (titulo, estado, fecha firma, link PDF), ActasReunionList (tabla: numero | fecha | tipo | asistentes | estado firmas | link PDF), PlanMejoraCard (numero, titulo, estado, link PDF), InformeFinalCard (titulo, nivel, estado, revisor, fechas, observaciones, link PDF), DescargarExpediente (botón descarga ZIP, muestra progreso/toast), NotasFinalesCard (columnas: nota_tutor, nota_profesor, promedio, nota_final con fórmula visible)
- 4. Hooks: useExpediente(estudianteId) -> useQuery GET /api/v1/expedientes/{estudianteId}, useDescargarExpediente(estudianteId) -> trigger descarga y toast, useAccesoExpediente(estudianteId) -> verifica permiso cliente-side
- 5. EstudianteSelectorModal: búsqueda por nombre/documento (COORDINADOR/ADMIN), navega a expediente
- 6. CohorteExportModal: selector cohorte, descarga ZIP de todos los expedientes, progress bar
- 7. Route en main router: /expedientes/:estudianteId -> ExpedienteDetailPage
- 8. Componentes de estado: BadgeEstadoDocumento (PENDIENTE=amber, EN_REVISION=blue, FIRMADO=green, RECHAZADO=red, PDF_GENERADO=emerald)
- 9. Integración con API client: requests GET /api/v1/expedientes/{id}, GET /api/v1/expedientes/{id}/download-zip, GET /api/v1/cohortes/{cohorteId}/expedientes/export
- 10. Accesibilidad: aria-labels, data-testid en componentes clave, responsive layout


**Migración:** V22__expediente_digital_unificado.sql con dos tablas: (1) expediente_documento_estado: id BIGSERIAL PK, trimestre_id BIGINT NOT NULL FK CASCADE, tipo_documento VARCHAR(60) NOT NULL, estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN 'PENDIENTE','EN_REVISION','FIRMADO','PDF_GENERADO','RECHAZADO'), fecha_esperada DATE, fecha_real TIMESTAMP, observaciones TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), CONSTRAINT uq_exp_doc UNIQUE (trimestre_id, tipo_documento), INDEX idx_exp_doc_trim (trimestre_id); (2) expediente_nota_consolidada: id BIGSERIAL PK, convenio_id BIGINT NOT NULL UNIQUE FK CASCADE, nota_tutor_promedio NUMERIC(3,2), nota_profesor_promedio NUMERIC(3,2), nota_final NUMERIC(3,2), numero_trimestres SMALLINT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), INDEX idx_exp_nota_conv (convenio_id). Ambas con created_at/updated_at para auditoría.


**Pruebas:** Unitarias JUnit 5: ExpedienteServiceTest::testObtenerExpedianteCompleto_VerificaDatos (mock repos, valida estructura), testCalcularNotaFinal_DosTrimestres (notas tutor=4.5, profesor=4.0, verifica promedio), testExportarExpedientes_GeneraZIP (verifica bytes y extensión), testVerificarAcceso_EstudianteVeSoloPropio (throws AccessDeniedException). Integración @SpringBootTest: ExpedienteControllerTest::testGET_SinAuth_401, testGET_OtroEstudiante_403, testGET_PropiaCuenta_200, testExportCohorte_403_Empresa, testResponseStructure (valida tipos DTO, trimestres no null, notas presentes). Frontend Cypress: cy visit /expedientes/1, cy get('[data-testid=estudiante-card]').contains('Kelly'), cy get('[data-testid=evaluaciones-panel]').contains('4.5'), cy get('[data-testid=descargar-zip]').click() intercept POST /download, cy visit /expedientes/2 (otro estudiante) debe 403 o redirect. Sonar: cobertura >80% ExpedienteService, sin N+1 (valida EXPLAIN PLAN), complejidad <10, sin secrets. Performance: carga expediente <500ms (cache nota_consolidada), export 50 estudiantes <3s (batch query, no loop).


**Integra guía:** IA (siguiendo guía IA del curso): Sidecar de IA en /ia-sidecar puede asistir en generar resumen ejecutivo del expediente o sugerencias de mejora basado en notas y observaciones. Integración con prompt que lee expediente y genera feedback. MCP (Model Context Protocol): Agente MCP puede acceder a /api/v1/expedientes/{id} con autenticación, permitiendo consultas naturales del tipo 'muestra expediente de Kelly' o 'cuál es la nota final de estudiante X'. Tests (guía de pruebas): cobertura >80%, test unitarios (sin BD), tests integración (con @SpringBootTest), E2E Cypress. Sonar (guía SonarQube): no technical debt, queries optimizadas (no N+1), complejidad ciclomática <10, 0 code smells, 0 security issues. CI/CD (requisito final): GitHub Actions ejecuta build -> tests -> sonar scan antes de merge a main, deploy automático a staging si pasa, deploy manual a producción.


**Riesgo:** ALTO - Consolidación de múltiples entidades (Convenio, Trimestre, Evaluacion, Documento, Plan, Acta, Informe) requiere queries complejas con riesgo de N+1. Mitigación: usar @EntityGraph en repositorios, cachear ExpedienteNotaConsolidada, test de performance con EXPLAIN PLAN. MEDIO - Lógica de permisos: estudiante solo ve su expediente, docente filtra por convenio asignado. Mitigación: PreAuthorize con SpEL (#estudianteId == authentication.principal.estudianteId), CurrentUserService valida acceso. MEDIO - Export cohorte >100 estudiantes puede timeout (API timeout por defecto 30s). Mitigación: implementar job asíncrono (Celery/queue) con notificación al completar, o dividir en chunks. BAJO - Migración V22 con nuevas tablas puede impacto en producción. Mitigación: test en stage con datos reales, tener rollback plan, usar transaction_isolation READ COMMITTED."


## RF-B02: Acta de Acompañamiento (GAC-FM-11) + prellenado automático

**Estado actual:** Backend: ActaReunion entity (id, trimestre_id, numero, fecha, hora, lugar, asunto, tipoReunion, momentoProceso, asistentesJson, observaciones, firmas). ActaTema (tema, observaciones, orden). Service CRUD completo. Controller REST. PDF Generator GAC-FM-11. Repository con countByTrimestreId(), existsByTrimestreIdAndMomentoProceso(). DTOs Request/Response. Frontend: form crear/editar (datos generales, asistentes dinamicos, temas dinamicos, firmas). Lista con tabla (numero, fecha, tipo, asunto, firmas, acciones PDF/delete). SQL V7 acta_reunion/acta_tema, V9 agrega momento_processo.


**Gap:** 1) Prellenado: NO existe Agendamiento. Falta endpoint crear acta desde agendamiento. 2) ActaTema.observaciones es generico, sin separacion explicita tema+compromisos. 3) Sin validacion: minimo 1 acta por corte/trimestre, sin validar 3 reuniones obligatorias (INICIO/MITAD/CIERRE). 4) Sin conteo: trimestre response no incluye totalActas. 5) Sin IA: no hay sugerencias de compromisos. 6) Sin tests: cero tests unitarios/integracion para actas.


**Cambios backend:**
- Crear tabla acta_compromiso en V22 si se requiere separacion explicita (id, acta_tema_id, descripcion, responsable, fecha_vencimiento)
- Endpoint POST /trimestres/{id}/actas/desde-agendamiento/{agendamientoId} que precargue datos
- Validacion en ActaReunionService: validarMinimosActasPorCorte() en cierre de trimestre
- Endpoint GET /trimestres/{id}/estadistica-actas que devuelva {totalActas, actas: [{numero, fecha, firmas}]}
- Mejorar PDF para resaltar seccion de compromisos con formateo diferente
- Tests unitarios: ActaReunionServiceTest (CRUD, firmas, validaciones)
- Tests integracion: ActaReunionControllerTest (endpoints GET/POST/PUT/DELETE/PDF)


**Cambios frontend:**
- Separar UI de ActaTema: tab o card con Tema | Compromisos (textarea) | Responsable (input)
- Mostrar badge de conteo total de actas en header de lista
- Agregar boton Prellenar desde Agendamiento si existe agenda pendiente
- Mejorar visualizacion de firmas con iconos y estados (Pendiente/Firmado)
- Validar antes guardar: fecha no puede ser futura, minimo un tema
- Toast de confirmacion antes eliminar acta


**Migración:** V22__acta_compromisos_y_validation.sql: crear tabla acta_compromiso (id PK, acta_tema_id FK, descripcion TEXT, responsable VARCHAR, fecha_vencimiento DATE, created_at, updated_at). Alternativa: agregar columnas en acta_tema (compromisos TEXT, responsable VARCHAR). Recomendacion: tabla separada para normalizacion y reutilizacion.


**Pruebas:** ["Unit: ActaReunionServiceTest crear/actualizar/obtener/listar/firmar/eliminar (mocks repository)", "Unit: ActaReunionValidationTest minimo 1 acta por trimestre", "Integration: ActaReunionControllerTest todos endpoints REST con @WebMvcTest", "Integration: ActaReunionPdfGeneratorTest validar estructura PDF y presencia de campos", "E2E (Cypress): crear acta > agregar asistentes/temas > guardar > firmar > descargar PDF", "Sonar: coverage minimo 80% en service y controller"]


**Integra guía:** 1) IA (sidecar): POST /ia/acta/{id}/sugerir-compromisos usa claude-agent-sdk sin API key para analizar temas y sugerir compromisos basado en contexto (empresa, estudiante, materia nucleo). 2) MCP: si hay servidor MCP con tools de actas, usarlo para prellenar desde agendamiento. 3) Tests: unit + integration coverage minimo 80% (SonarQube). 4) CI/CD: pipeline verde con tests + sonar antes merge a main. 5) Formularios: acta es parte de GAC-FM-11 formato oficial, requiere validacion de estructura.


**Riesgo:** ALTO: Prellenado depende de Agendamiento que NO existe (RFC futuro). MEDIO: Cambio en schema de acta_tema puede afectar datos existentes (necesita rollback plan). MEDIO: Validacion de minimos actas puede bloquear cierre de trimestre si no hay actas suficientes (comunicar a usuarios). BAJO: PDF generator cambios pueden causar timeout si hay muchos asistentes/temas (agregar paginacion si needed).


## RF-C01/C02/C03 - Agendamiento Colaborativo (Épica 8, MÓDULO NUEVO)

**Estado actual:** CONFIRMADO: NO existe módulo de agendamiento/calendario/disponibilidad en SIVU. Archivos relevantes: backend/src/main/java/co/uempresarial/sivu/tutor/ (Tutor.java con TipoTutor ACADEMICO/EMPRESARIAL); convenio/domain/Convenio.java (tutorAcademico, tutorEmpresarial); automatizacion/service/NotificacionService.java (async @Async, enviarTexto genérico); db/migration/V1-V21 (próxima V22); trimestre/domain/ActaReunion.java (documenta reuniones realizadas, no es agendamiento proactivo); frontend sin feature de agendamiento; Calendar.tsx existe pero sin uso. Modelo Tutor: id, tipo, nombres, apellidos, email, telefono, cargo, dependencia, empresa_id, estado.


**Gap:** 1. TABLA disponibilidad_docente: franjas (tutor_id FK, fecha, horaInicio, horaFin, modalidad PRESENCIAL|VIRTUAL, enlaceVirtual_nullable, estado ACTIVA|INACTIVA). 2. TABLA agendamiento_colaborativo: propuestas+respuestas (convenio_id FK, estudianteId FK, tutorId FK, estado PROPUESTO|ACEPTADO|RECHAZADO|CONTRAOFERTA|CONFIRMADO|CANCELADO, fechaPropuesta, fechaReunion, horaInicio, horaFin, modalidad, enlaceVirtual, observacionesEstudiante TEXT, observacionesTutor TEXT, fechaRespuesta, fechaConfirmacion). 3. Endpoints REST: CRUD disponibilidades, validar no solapar, obtener libres. 4. Endpoints agendamientos: POST/GET/PUT, PATCH aceptar/rechazar/contraoferta/confirmar. 5. Frontend feature /agendamiento-colaborativo. 6. NotificacionService: 4 métodos nuevos. 7. Al confirmar: rellenar ActaReunion (GAC-FM-11), guardar enlace videollamada en correos.


**Cambios backend:**
- backend/src/main/java/co/uempresarial/sivu/agendamiento/domain/DisponibilidadDocente.java: JPA entity (tutor_id FK, fecha DATE, horaInicio TIME, horaFin TIME, modalidad ENUM, enlaceVirtual VARCHAR 300, estado ENUM ACTIVA|INACTIVA, createdAt, updatedAt), unique constraint tutor_fecha_horario where estado=ACTIVA
- backend/src/main/java/co/uempresarial/sivu/agendamiento/domain/EstadoDisponibilidad.java: enum {ACTIVA, INACTIVA}
- backend/src/main/java/co/uempresarial/sivu/agendamiento/domain/ModalidadAgendamiento.java: enum {PRESENCIAL, VIRTUAL}
- backend/src/main/java/co/uempresarial/sivu/agendamiento/domain/AgendamientoColaborativo.java: JPA entity (convenio_id FK, estudianteId FK, tutorId FK, estado ENUM PROPUESTO|ACEPTADO|RECHAZADO|CONTRAOFERTA|CONFIRMADO|CANCELADO, fechaPropuesta, fechaReunion, horaInicio, horaFin, modalidad, enlaceVirtual, observacionesEstudiante, observacionesTutor, fechaRespuesta, fechaConfirmacion)
- backend/src/main/java/co/uempresarial/sivu/agendamiento/domain/EstadoAgendamiento.java: enum {PROPUESTO, ACEPTADO, RECHAZADO, CONTRAOFERTA, CONFIRMADO, CANCELADO}
- backend/src/main/java/co/uempresarial/sivu/agendamiento/persistence/DisponibilidadDocenteRepository.java: findByTutorIdAndFechaBetween, existsByTutorIdAndOverlap (custom query), deleteById
- backend/src/main/java/co/uempresarial/sivu/agendamiento/persistence/AgendamientoColaborativoRepository.java: findByConvenioId, findByTutorIdAndEstado, findByEstudianteIdAndEstado
- backend/src/main/java/co/uempresarial/sivu/agendamiento/service/DisponibilidadDocenteService.java: crear, actualizar, eliminar, obtenerPorId, obtenerLibres(tutorId, fecha), validarNoSolapar
- backend/src/main/java/co/uempresarial/sivu/agendamiento/service/AgendamientoService.java: proponer (valida franja libre), aceptar, rechazar, contraoferta, confirmar (crea ActaReunion, envía notificación), enviarNotificacionPropuesto|Aceptado|Rechazado|Contraoferta
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/DisponibilidadDocenteController.java: POST/GET/PUT/DELETE disponibilidades, GET /tutor/{id}/libres?fecha=, @PreAuthorize COORDINADOR|TUTOR_ACADEMICO
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/AgendamientoColaborativoController.java: POST proponer, GET listar, GET {id}, PATCH {id}/aceptar|rechazar|contraoferta|confirmar
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/dto/DisponibilidadDocenteRequest.java: tutorId, fecha, horaInicio, horaFin, modalidad, enlaceVirtual, estado
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/dto/DisponibilidadDocenteResponse.java: record con todos campos + tutorNombre, tutorEmail
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/dto/AgendamientoRequest.java: convenioId, fechaReunion, horaInicio, horaFin, modalidad, enlaceVirtual, observacionesEstudiante
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/dto/AgendamientoResponse.java: record completo con estudiante, tutor, estado
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/dto/RespuestaAgendamientoRequest.java: observaciones, nuevaFecha, nuevaHoraInicio/Fin para contraoferta
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/AgendamientoMapper.java: toEntity, toResponse
- backend/src/main/java/co/uempresarial/sivu/agendamiento/web/DisponibilidadMapper.java: toEntity, toResponse
- backend/src/main/java/co/uempresarial/sivu/automatizacion/service/NotificacionService.java: 4 métodos @Async nuevos enviarAgendamientoPropuesto|Aceptado|Rechazado|Contraoferta con detalles fecha, tutor, enlace


**Cambios frontend:**
- frontend/src/features/agendamiento-colaborativo/ (new directory)
- frontend/src/features/agendamiento-colaborativo/disponibilidades-docente-list-page.tsx: listar disponibilidades (solo tutor), tabla fecha|horario|modalidad|estado, botones editar/eliminar, crear nuevo en modal, calendario visual ocupadas vs libres
- frontend/src/features/agendamiento-colaborativo/disponibilidades-docente-form-page.tsx: form crear/editar (fecha datepicker, horaInicio/Fin time, modalidad select, enlaceVirtual textarea si VIRTUAL, estado toggle), validar horarios
- frontend/src/features/agendamiento-colaborativo/agendamiento-list-page.tsx: listar mis agendamientos (estudiante vs tutor), tabla estudiante|docente|fecha|estado, filtro por estado, botón proponer nuevo, responsive mobile
- frontend/src/features/agendamiento-colaborativo/agendamiento-form-page.tsx: proponer (select convenio, select docente, calendario con franjas LIBRES verde, select hora, modalidad, observaciones), validar franja libre
- frontend/src/features/agendamiento-colaborativo/agendamiento-detail-page.tsx: propuesta + respuesta tutor, botones aceptar|rechazar|contraoferta|confirmar según estado y rol, modales para respuestas
- frontend/src/features/agendamiento-colaborativo/components/calendario-disponibilidades.tsx: custom Calendar (react-day-picker base), mostrar franjas (rojo=ocupadas, verde=libres, gris=ninguna), toggle semanal/mensual
- frontend/src/features/agendamiento-colaborativo/components/modal-propuesta.tsx: modal proponer reunión (select convenio/docente, calendario, hora, modalidad, observaciones)
- frontend/src/features/agendamiento-colaborativo/components/modal-respuesta.tsx: modal responder (tabs Aceptar|Rechazar|Contraoferta con campos correspondientes)
- frontend/src/App.tsx: add lazy routes /agendamiento-colaborativo/disponibilidades, /agendamiento-colaborativo, /agendamiento-colaborativo/:id
- frontend/src/lib/types.ts: DisponibilidadDocente, AgendamientoColaborativo, EstadoAgendamiento, ModalidadAgendamiento interfaces
- frontend/src/components/layout/app-shell.tsx: agregar en sidebar menu si role=TUTOR_ACADEMICO|ESTUDIANTE
- RESPONSIVO MÓVIL (RNF-02): tablas scroll horizontal <768px, modales full-height mobile, botones >=48px, inputs >=16px font, touch targets >=44x44px, Cypress test mobile 375px/768px


**Migración:** V22__agendamiento_colaborativo.sql: CREATE TABLE disponibilidad_docente (id BIGSERIAL PRIMARY KEY, tutor_id BIGINT NOT NULL REFERENCES tutores(id) ON DELETE CASCADE, fecha DATE NOT NULL, hora_inicio TIME NOT NULL, hora_fin TIME NOT NULL, modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('PRESENCIAL','VIRTUAL')), enlace_virtual VARCHAR(300), estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA','INACTIVA')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE UNIQUE INDEX idx_disp_tutor_fecha_horario ON disponibilidad_docente(tutor_id, fecha, hora_inicio, hora_fin) WHERE estado='ACTIVA'; CREATE INDEX idx_disp_tutor_fecha ON disponibilidad_docente(tutor_id, fecha); CREATE TABLE agendamiento_colaborativo (id BIGSERIAL PRIMARY KEY, convenio_id BIGINT NOT NULL REFERENCES convenios(id) ON DELETE CASCADE, estudiante_id BIGINT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE, tutor_id BIGINT NOT NULL REFERENCES tutores(id) ON DELETE RESTRICT, estado VARCHAR(30) NOT NULL DEFAULT 'PROPUESTO' CHECK (estado IN ('PROPUESTO','ACEPTADO','RECHAZADO','CONTRAOFERTA','CONFIRMADO','CANCELADO')), fecha_propuesta TIMESTAMPTZ NOT NULL DEFAULT now(), fecha_reunion DATE NOT NULL, hora_inicio TIME NOT NULL, hora_fin TIME NOT NULL, modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('PRESENCIAL','VIRTUAL')), enlace_virtual VARCHAR(300), observaciones_estudiante TEXT, observaciones_tutor TEXT, fecha_respuesta TIMESTAMPTZ, fecha_confirmacion TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE INDEX idx_agend_convenio ON agendamiento_colaborativo(convenio_id); CREATE INDEX idx_agend_tutor_estado ON agendamiento_colaborativo(tutor_id, estado); CREATE INDEX idx_agend_estudiante_estado ON agendamiento_colaborativo(estudiante_id, estado);


**Pruebas:** UNITARIAS (JUnit 5 + Mockito): DisponibilidadDocenteServiceTest (crear, eliminar, validar solapamiento), AgendamientoServiceTest (proponer, aceptar, rechazar, contraoferta, confirmar), mappers. INTEGRACIÓN (Spring Boot Test): DisponibilidadDocenteRepositoryTest, AgendamientoRepositoryTest con @DataJpaTest. CONTROLLER (MockMvc): DisponibilidadDocenteControllerTest (CRUD, autorización), AgendamientoControllerTest (proponer, aceptar, rechazar, permisos). NEWMAN/POSTMAN: colección Agendamiento.postman_json (POST proponer, PATCH aceptar/rechazar/contraoferta/confirmar, flujo end-to-end), variables dinámicas. CYPRESS: disponibilidades-docente.cy.ts (crear/editar/eliminar, calendario), agendamiento-colaborativo.cy.ts (proponer desde franja libre, aceptar/rechazar, responsive mobile 375px/768px), a11y checks. SONAR: cobertura >= 80%, no blocker issues, <3% duplicación código.


**Integra guía:** TESTS: Cobertura >= 80% con JUnit + MockMvc + Cypress. SONAR: análisis automático en CI/CD, sin bugs críticos, deuda < 5 días. IA (MCP/Claude): generar boilerplate code (DTOs, mappers), validar lógica solapamiento. CODE REVIEW: antes de merge, verificar seguridad entrada, manejo excepciones. RNF-02 MÓVIL: tests Cypress en 375px (touch >= 44px, font >= 16px), table scroll horizontal, modal responsive. GAC-FM-11: al confirmar agendamiento, crear ActaReunion con numero auto-increment, fecha=fecha_reunion, tipo_reunion=SEGUIMIENTO, momento_proceso derivado del trimestre, asistentes_json con tutor_id + estudiante_id.


**Riesgo:** BAJO-MODERADO: 1) Solapamiento franjas: use unique index (tutor, fecha, hora_inicio, hora_fin) where estado=ACTIVA en BD + validación en servicio. 2) Concurrencia propuestas simultáneas: use @Transactional + FOR UPDATE lock. 3) Contraoferta infinita: limitar a 3 intentos o timeout 3 días. 4) Notificaciones fallidas: log warning no bloqueante, agregar retry/alertas. 5) Performance: paginar GET /disponibilidades/libres?fecha= si muchas franjas (limitar rango ±7 días). 6) Autorización: validar currentUser solo ve sus datos (scoped queries, PreAuthorize). 7) Solapamiento visual calendar: limitar granularidad a 15/30 min si franjas pequeñas.


## RF-D01/D02 Notificaciones + RNF-03 Cálculo Automático de Notas + RNF-01 PDFs Oficiales

**Estado actual:** 
**NotificacionService** (/home/jaydethsp/sivu/backend/src/main/java/co/uempresarial/sivu/automatizacion/service/NotificacionService.java):
- SimpleMailMessage (texto plano, sin HTML)
- 6 métodos específicos: enviarCambioEstadoPostulacion, enviarRecordatorioActualizarCv, enviarValidacionDocumento, enviarCertificadoEmitido, enviarFormalizacion, enviarTexto
- @Async("notificacionExecutor"), configuración app.mail.enabled/from
- SIN auditoría de notificaciones en BD
- SIN notificaciones para: envío plan, evaluaciones, firmado, recordatorios, agendamiento

**Evaluaciones y Calificaciones**:
- EvaluacionProfesorTrimestre: estructura de dos cortes (C1/C2 con sufijo _c1/_c2) desde V11 (/home/jaydethsp/sivu/backend/src/main/resources/db/migration/V11__evaluacion_profesor_dos_cortes.sql)
- EvaluacionTutorTrimestre: SIN estructura de cortes (solo notaPonderada)
- Convenio.calificacionFinal: asignación manual en ConvenioService.finalizar() SIN cálculo automático
- SIN tabla/modelo de Corte ni CalificacionCalculada
- SIN bloqueo de edición después de finalizar

**PDFs** (/home/jaydethsp/sivu/backend/src/main/java/co/uempresarial/sivu/trimestre/pdf/):
- PdfStyles.java: estándar institucional (logo, AZUL_UE #1B3380, ROJO_UE #E2173A, encabezadoInstitucional con código GAC-FM-*, versión, fecha, metadata)
- Generadores que sí usan PdfStyles: PlanActividadesPdfGenerator (GAC-FM-10), EvaluacionProfesorPdfGenerator, EvaluacionTutorPdfGenerator, ActaReunionPdfGenerator
- CertificadoPdfGenerator: ANTIGUO, NO usa PdfStyles (sin logo/código/versión/páginas)
- SIN numeración de páginas en ningún PDF

**Datos/Eventos**:
- PostulacionEvento: existe tabla (/home/jaydethsp/sivu/backend/src/main/java/co/uempresarial/sivu/postulacion/domain/PostulacionEvento.java) con tipoEvento, estadoAnterior, estadoNuevo, detalle, actor, ocurridoEn → REUTILIZABLE
- EstadoPostulacion: POSTULADA, EN_REVISION, ENTREVISTA_PROGRAMADA, ENTREVISTA_REALIZADA, PRESELECCIONADA, RECHAZADA, ACEPTADA, RETIRADA
- Entrevista: fechaProgramada, resultado (PENDIENTE), SIN notificación disparada
- Migraciones: V21 amplió postulaciones.estado a VARCHAR(30), V19 agregó vigencia a documentos



**Gap:** 
**RF-D01 Notificaciones flujo documental**:
- FALTA notificar: envío plan actividades, calificación de cada corte, firma de evaluaciones (tutor/profesor), recordatorio 5 días antes de cierre corte, expediente completo
- NO existe: tabla de auditoría de notificaciones, listeners de eventos de documento, scheduler de recordatorios

**RF-D02 Notificaciones agendamiento**:
- FALTA notificar: propuesta entrevista (específico), aceptación, rechazo, contraoferta, confirmación, recordatorio 24h, cancelación
- HOY solo: notificación genérica de cambio de postulación
- NO existe: métodos específicos para cada transición, recordatorio 24h

**RNF-03 Cálculo automático nota**:
- FALTA implementar: corte1=25% + corte2=25% + corte3=promedio(tutor+informe)=50%
- HOY: asignación manual de calificacionFinal sin cálculo
- NO existe: tabla CalificacionCalculada, CorteCalculoService, trazabilidad, bloqueo después de calcular
- EvaluacionTutorTrimestre: SIN estructura de cortes (SÍ la tiene EvaluacionProfesorTrimestre)

**RNF-01 PDFs oficiales**:
- CertificadoPdfGenerator: NO usa encabezadoInstitucional (SIN logo, código, versión, páginas)
- Otros generadores (Convenio, Formalizacion, HojaVida, CartaPresentacion): REVISAR si usan PdfStyles
- FALTA: numeración de páginas en todos, unificación de versiones



**Cambios backend:**
- Nueva tabla V22: notificacion_auditoria (id, fecha_envio, destinatario, tipo_evento, asunto, contenido_tipo, enviado_exitoso, error_mensaje, documento/postulacion/convenio_id, actor)
- Nueva tabla V22: corte_trimestre (id, trimestre_id, numero_corte 1-3, estado, fecha_limite, bloqueado)
- Nueva tabla V22: calificacion_calculada (id, convenio_id, fecha_calculo, corte1_nota/peso, corte2_nota/peso, corte3_tutor/informe/promedio/peso, nota_final_calculada, calculado_por, bloqueado)
- Modificar EvaluacionTutorTrimestre (V22): agregar capacidades_c2..nota_ponderada_c2, observaciones_c1/c2, fecha_c1/c2, bloqueado (como EvaluacionProfesorTrimestre V11)
- Modificar Convenio (V22): agregar calificacion_final_calculada (boolean), fecha_calculo_final (OffsetDateTime)
- NotificacionService: agregar métodos enviarPlanEnviado, enviarCalificacionCorte, enviarDocumentoFirmado, enviarRecordatorio5Dias, enviarExpedienteCompleto, enviarPropuestaEntrevista, enviarResultadoEntrevista, enviarRecordatorio24hEntrevista - todos guardan auditoría
- NotificacionAuditoriaService: persistir cada notificación enviada, búsqueda por tipo/fecha/destinatario
- CorteCalculoService: lógica corte1(25%) + corte2(25%) + corte3_promedio(50%), trazabilidad, bloqueo
- DocumentoEventListener: escuchar cambios de estado, dispara notificación al firmar
- EntrevistaNotificationService: propuesta, resultado, recordatorio 24h específicos
- NotificacionRecordatorioScheduler: @Scheduled para recordatorios 5 días y 24h
- CertificadoPdfGenerator: refactorizar para usar PdfStyles.encabezadoInstitucional()
- Otros PDFs (ConvenioPdfGenerator, FormalizacionPdfGenerator, HojaVidaPdfGenerator, CartaPresentacionPdfGenerator): unificar con PdfStyles + numeración de páginas
- Enum TipoEventoNotificacion: PLAN_ENVIADO, CORTE1_CALIFICADO, CORTE2_CALIFICADO, CORTE3_CALIFICADO, TUTOR_FIRMADO, PROFESOR_FIRMADO, RECORDATORIO_5_DIAS, EXPEDIENTE_COMPLETO, ENTREVISTA_PROPUESTA, ENTREVISTA_ACEPTADA, ENTREVISTA_RECHAZADA, RECORDATORIO_24H_ENTREVISTA


**Cambios frontend:**
- Página /notificaciones: historial con filtros (tipo_evento, fecha_rango, estado), paginación, vista detalle
- Componente CalificacionDesglose: muestra corte1 (25%), corte2 (25%), corte3_tutor + corte3_informe → promedio (50%), nota_final
- Página /convenio/{id}: agregar sección 'Cálculo de nota' con botón para recalcular (si no bloqueado), mostrar fecha_calculo_final, comparar calificacion_final vs calculada
- Panel /recordatorios: próximas entrevistas, cierres de cortes, muestra cuándo se enviará recordatorio
- Timeline en convenio: muestra eventos (plan enviado, cortes calificados, firmados, PDF generado) con timestamps
- Notificación in-app toast: al enviar plan, cambio en entrevista, recordatorios
- Badge contador de recordatorios pendientes en topbar


**Migración:** V22__notificaciones_y_calificaciones_automaticas.sql - Crear 3 tablas (notificacion_auditoria, corte_trimestre, calificacion_calculada), modificar EvaluacionTutorTrimestre (agregar C2 + bloqueado), modificar Convenio (agregar calificacion_final_calculada + fecha_calculo_final), crear índices en auditoría por fecha/tipo/destinatario


**Pruebas:** [
  "JUnit: NotificacionAuditoriaServiceTest (CRUD auditoría, búsqueda)",
  "JUnit: CorteCalculoServiceTest (fórmula 25+25+50, casos nulos, redondeos, bloqueo)",
  "JUnit: DocumentoEventListenerTest (dispara notificación al cambiar estado)",
  "JUnit: EntrevistaNotificationServiceTest (propuesta, resultado, recordatorio 24h)",
  "JUnit: NotificacionRecordatorioSchedulerTest (lógica 5 días/24h, idempotencia)",
  "JUnit: CertificadoPdfGeneratorTest (logo, código GAC-FM-*, versión, numeración páginas)",
  "Integration: flujo completo convenio→trimestres→evaluaciones→cálculo→certificado+notificaciones",
  "Integration: D01 flujo (plan→cortes→firmas→recordatorios)",
  "Integration: D02 flujo (postulación→entrevista programada→resultado→recordatorio 24h)",
  "Newman: POST convenio recibe email, PUT evaluación recibe email corte, GET /notificaciones filtra",
  "Cypress: usuario ve historial notificaciones, desglose de nota, recordatorios en timeline"
]


**Integra guía:** **IA**: CorteCalculoService + new endpoint /api/convenios/{id}/analisis-nota que usa Claude API para generar análisis automático de fortalezas/debilidades por corte + recomendaciones (guardaría en tabla calificacion_analisis_ia para auditoría). **MCP**: nuevos resource types sivu://convenio/{id}/notificaciones (list de notificaciones), sivu://corte/{corte_id}/evaluaciones, sivu://calificacion/{convenio_id}/desglose implementados en NotificacionMcpService. **Tests**: >=80% coverage JUnit en CorteCalculoService, NotificacionAuditoriaService; sonar: evitar switch largos (strategy pattern), sanitizar HTML emails. **Sonar**: Code smells en NotificacionService (múltiples métodos parecidos → template method pattern), security en destinatarios validados


**Riesgo:** **ALTO**: (1) Cálculo retroactivo - convenios existentes sin evaluaciones → calificacionFinal NULL → certificado falla. MITIGA: script de migración que valida y advierte. (2) Spam emails - si listener executa 2x, duplica notificaciones. MITIGA: tabla auditoría con constraint UNIQUE (postulacion_id, tipo_evento, fecha_envio) o idempotencia en servicio. (3) PDFs rotos - cambio CertificadoPdfGenerator puede alterar layout. MITIGA: QA visual exhaustiva, comparar antes/después de cambio. **MEDIO**: (4) Rendimiento scheduler - 1000+ convenios/recordatorios c/5min sobrecargan. MITIGA: Quartz job scheduler + batch processing. (5) Inconsistencia - agregar corte pero no actualizar EvaluacionTutorTrimestre. MITIGA: validaciones CorteCalculoService. (6) Retrocompatibilidad - clientes esperan calificacionFinal manual. MITIGA: field calificacion_final_calculada_automaticamente (boolean). **BAJO**: (7) app.mail.enabled=false en dev rompe builders. MITIGA: mock NotificacionService


## Mapeo Guía↔v2: IA, MCP, Pruebas, Sonar, CI/CD en SIVU

**Estado actual:** **Backend (Spring Boot 3 / Java 21, package-by-feature):**
- 31 repositorios (módulos: estudiante, postulacion, vacante, trimestre, convenio, informefinalpm, ia, etc.)
- 21 migraciones Flyway (V1-V21) en /backend/src/main/resources/db/migration/
- IAController + InformeIAService en /backend/src/main/java/co/uempresarial/sivu/ia/ — revisa informe final (local o vía sidecar)
- Trimestres/Cortes: TrimestreController + TrimestreService en /backend/src/main/java/co/uempresarial/sivu/trimestre/ (PA, Actas, PM, ET, EP)
- EvaluacionTutorTrimestreController, EvaluacionProfesorTrimestreController

**IA (Requisito #7):**
- IA sidecar (Node + Express en /ia-sidecar/) usa claude-agent-sdk sin API key
- InformeIAService intenta llamar sidecar; fallback a análisis heurístico local
- POST /api/v1/ia/informe-final/{informeId}/feedback
- MCP tool: revisar_informe_final (read-only, sin sidecar)

**MCP (Requisito #8, parcial):**
- 9 tools en /mcp-server/src/tools/:
  1. listar-vacantes-activas
  2. listar-estudiantes-pendientes-validacion
  3. consultar-estado-postulacion (postulacionId o estudianteId)
  4. estadisticas-proceso
  5. verificar-academico
  6. matching-estudiante-vacante
  7. asistente-tecnico
  8. revisar-logs-pipeline
  9. revisar-informe-final
- **NO EXISTEN** tools para: cortes/trimestres pendientes, expediente, notas de evaluación

**Pruebas (Requisito #5, parcial):**
- Newman: tests API en /tests/newman/ contra colección Postman
- Cypress E2E: 5 specs en /tests/cypress/cypress/e2e/ (auth, estudiantes, vacantes, postulacion-flujo, matching-tool)
- K6: tests de carga (login, vacantes, postulaciones) en /tests/k6/
- Backend unit: mvn verify en CI ejecuta JUnit 5 + Mockito
- **SonarCloud:** scan en ci.yml (backend + frontend + mcp-server)

**Sonar (Requisito #6):**
- sonar-project.properties configura: backend/src/main/java, frontend/src, mcp-server/src
- Exclusiones: **/dto/**, **/config/**, **/*Mapper*, SivuApplication.java, components/ui/**
- JaCoCo: coverage en backend/target/site/jacoco/jacoco.xml
- Frontend: LCOV en frontend/coverage/lcov.info
- **Ejecución:** mvn sonar:sonar en ci.yml si SONAR_TOKEN está set

**CI/CD (Requisito #9):**
- .github/workflows/ci.yml: 7 jobs
  - backend (build + test + JaCoCo + SonarCloud)
  - frontend (build)
  - mcp (build)
  - api-contract (Newman contra backend levantado)
  - e2e (Cypress contra backend + frontend)
  - docker (build images GHCR, solo main)
  - deploy (Render backend/sidecar, Vercel frontend, solo main)
- SeedBootstrap siembra usuarios demo automático en perfil docker

**Frontend (React 18 + Vite + TS):**
- Features en package-by-feature: /frontend/src/features/
- Módulos: auth, estudiantes, postulaciones, trimestres, convenios, documentos, plantillas, fabrica-soluciones
- Estado: TanStack Query + Zustand
- **NO EXISTE** feature para: expediente visual, notas agregadas, cortes pendientes del estudiante


**Gap:** **MCP Tools faltantes (Requisito #8 — consultar proceso de coformación):**
1. consultar_cortes_pendientes: estado de trimestres, fechas límite, documentos pendientes
2. obtener_expediente_estudiante: hoja de vida + documentos + decisiones de Coformación
3. listar_notas_evaluaciones: notas de tutor/profesor, promedio final por trimestre
4. consultar_plan_mejora: estado del PM, recomendaciones, IA feedback disponible
5. verificar_requisitos_cierre: checklists antes de emitir nota final

**Backend faltante (v2 Nueva Funcionalidad):**
1. ExpedienteController: GET /api/v1/estudiantes/{id}/expediente (agrupa HV + documentos + decisiones)
2. NotasEvaluacionController: GET /api/v1/trimestres/{id}/notas (agregación: tutor + profesor → nota final)
3. CortesPendientesService: lógica de "qué debe entregar el estudiante en cada corte"
4. ChecklistCierreService: validación de requisitos finales (todas evaluaciones, PM aprobado, informe, firma)
5. AnalyticsNotasController: reportes de desempeño por estudiante/empresa/período (para Analytics feature)

**Tests faltantes (Requisito #5):**
1. Newman: tests GET /api/v1/estudiantes/{id}/expediente, GET /api/v1/trimestres/{id}/notas
2. Cypress: spec para "Ver mi expediente" (estudiante), "Descargar expediente completo" (Coformación)
3. Cypress: spec para "Notas y evaluaciones" (visualizar notas de tutor/profesor, nota final)
4. Unit tests: ExpedienteService, NotasEvaluacionService, ChecklistCierreService
5. K6: load tests para GET expediente (lectura masiva por admins)

**BD (Migraciones) faltante:**
V22 (nueva): crear tablas si es necesario:
- expediente_vista_materializada (desnormalización para query rápida) O usar VIEW
- notas_evaluacion (agregación desnormalizada: trimestre_id, estudiante_id, nota_tutor, nota_profesor, nota_final)
- O simplemente calcular en memoria desde EvaluacionTutorTrimestre + EvaluacionProfesorTrimestre

**IA v2 (Requisito #7 — extensión):**
- Extender IA sidecar para generar feedback también sobre notas/evaluaciones
- Tool MCP: generar_resumen_evaluacion (usa claude-agent-sdk, sin API key)
- POST /api/v1/ia/evaluaciones/{trimestreId}/resumen


**Cambios backend:**
- 1. Crear /backend/src/main/java/co/uempresarial/sivu/expediente/ con: domain/Expediente.java, service/ExpedienteService.java, web/ExpedienteController.java, web/dto/ExpedienteDtos.java
- 2. Crear /backend/src/main/java/co/uempresarial/sivu/evaluacion/ con: service/NotasEvaluacionService.java (calcula nota final desde tutor+profesor), web/NotasEvaluacionController.java
- 3. Crear /backend/src/main/java/co/uempresarial/sivu/trimestre/service/CortesPendientesService.java (lógica de validación por fecha de corte)
- 4. Crear /backend/src/main/java/co/uempresarial/sivu/automatizacion/service/ChecklistCierreService.java (valida requisitos finales)
- 5. POST /api/v1/ia/evaluaciones/{trimestreId}/resumen (endpoint que llama IA sidecar para feedback de notas)
- 6. Extender ExpedienteService para agregar: hoja_vida (aprobada), documentos (por tipo), decisiones (rechazos/aprobaciones), timeline de eventos
- 7. Enriquecer TrimestreMapper con status de 'pendiente_pa', 'pendiente_acta_1', etc.
- 8. Agregar índices en tablas existentes para expediente: INDEX idx_estudiante_created_at, idx_trimestre_estado


**Cambios frontend:**
- 1. Crear /frontend/src/features/expediente/ con: pages/ExpedientePage.tsx, hooks/useExpediente.ts, components/ExpedienteTimeline.tsx, components/DocumentosAgregados.tsx
- 2. Crear /frontend/src/features/evaluaciones/ con: pages/NotasPage.tsx, hooks/useNotas.ts, components/TarjetaEvaluacion.tsx (tutor/profesor), components/NotaFinal.tsx
- 3. Crear /frontend/src/features/cortes/ con: pages/CortesPage.tsx, hooks/useCortesEstudiante.ts, components/CorteCard.tsx (estado, requisitos pendientes, enlace a documentos)
- 4. Componente IA feedback: /frontend/src/features/evaluaciones/components/FeedbackIAEvaluaciones.tsx (botón 'Revisar con IA', muestra markdown del sidecar)
- 5. En dashboard, agregar widget: 'Mi expediente' (resumen de estado + link), 'Cortes pendientes' (lista de vencimientos)
- 6. En AdminPanel/Coformación, agregar tab 'Expedientes' con búsqueda y filtros (estado, programa, empresa)
- 7. Actualizar navegación lateral: mostrar 'Expediente' + 'Evaluaciones' + 'Cortes' según rol (estudiante ve los suyos; coordinador ve todos)


**Migración:** V22__expediente_notas_evaluacion.sql (nuevas tablas):
```sql
-- Vista materializada o tabla desnormalizada para expediente
CREATE TABLE expediente_vista (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id BIGINT NOT NULL UNIQUE REFERENCES estudiantes(id) ON DELETE CASCADE,
    hoja_vida_id BIGINT REFERENCES hoja_vida(id),
    hoja_vida_estado VARCHAR(20),
    convenio_id BIGINT REFERENCES convenios(id),
    empresa_id BIGINT REFERENCES empresas(id),
    num_trimestres_activos SMALLINT,
    num_evaluaciones_completadas SMALLINT,
    nota_promedio_final NUMERIC(3,2),
    estado_general VARCHAR(20),
    última_actualización TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Desnormalización de notas para queries rápidas
CREATE TABLE notas_evaluacion (
    id BIGSERIAL PRIMARY KEY,
    trimestre_id BIGINT NOT NULL REFERENCES trimestre(id) ON DELETE CASCADE,
    estudiante_id BIGINT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    evaluacion_tutor_id BIGINT REFERENCES evaluacion_tutor_trimestre(id),
    evaluacion_profesor_id BIGINT REFERENCES evaluacion_profesor_trimestre(id),
    nota_tutor NUMERIC(3,2),
    nota_profesor NUMERIC(3,2),
    nota_final NUMERIC(3,2),
    estado_evaluacion VARCHAR(20),
    fecha_calculo TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_notas_trimestre_est UNIQUE (trimestre_id, estudiante_id)
);
CREATE INDEX idx_notas_estudiante ON notas_evaluacion(estudiante_id);
CREATE INDEX idx_notas_trimestre ON notas_evaluacion(trimestre_id);
```

O mantener normalizado sin V22 nueva, simplemente agregar vistas SQL si las queries son complejas.


**Pruebas:** [
  "Newman: tests/newman/ — agregar requests GET /api/v1/estudiantes/{id}/expediente, GET /api/v1/trimestres/{id}/notas, POST /api/v1/ia/evaluaciones/{id}/resumen",
  "Cypress: tests/cypress/cypress/e2e/06-expediente.cy.ts — estudiante ve expediente, descarga PDF, revisa timeline",
  "Cypress: tests/cypress/cypress/e2e/07-evaluaciones.cy.ts — coordinador ingresa notas, estudiante ve notas tutor/profesor, calcula nota final",
  "Cypress: tests/cypress/cypress/e2e/08-cortes.cy.ts — estudiante ve cortes pendientes, requisitos, recordatorios",
  "Unit: backend/src/test/java/co/uempresarial/sivu/expediente/ExpedienteServiceTest.java (mocking trimestres, documentos, hoja vida)",
  "Unit: backend/src/test/java/co/uempresarial/sivu/evaluacion/NotasEvaluacionServiceTest.java (cálculo de nota final, promedio)",
  "Unit: backend/src/test/java/co/uempresarial/sivu/automatizacion/ChecklistCierreServiceTest.java (validación de requisitos)",
  "K6: tests/k6/expediente-load.js — simular 100 estudiantes descargando expedientes simultáneamente",
  "Actualizar sonar-project.properties: agregar expediente/**, evaluacion/**, excluir nuevos DTOs si aplica"
]


**Integra guía:** **Requisito #7 (IA) → CUMPLIDO + EXTENDIDO:**
- Existe: revisar_informe_final (MCP tool, lee del sidecar o fallback heurístico)
- Extensión v2: generar_resumen_evaluacion (tool MCP nuevo: toma notas del trimestre → sidecar genera feedback sobre desempeño)
- Sidecar: agregar endpoint POST /summary (análisis de evaluaciones, recomendaciones de mejora)
- Sin API key: usa claude-agent-sdk (plan de Claude Code, autenticado vía CLAUDE_CODE_OAUTH_TOKEN)
- Evidencia en repo: /ia-sidecar/src/routes/summary.ts, endpoint documentado en POST /review y POST /summary

**Requisito #8 (MCP) → IMPLEMENTAR:**
- Herramientas actuales: 9 tools para postulación, vacantes, académico, matching
- Nuevas tools (4-5): consultar_cortes_pendientes, obtener_expediente_estudiante, listar_notas_evaluaciones, consultar_plan_mejora, verificar_requisitos_cierre
- Implementación: /mcp-server/src/tools/ (pattern: cada tool es archivo .ts con register(), schema zod, safeHandler)
- Uso: Claude Desktop o Claude Code conecta MCP → puede consultar estado de práctica del estudiante sin UI manual
- Evidencia: tools nuevas citan endpoints backend nuevos, requieren auth JWT (apiClient usa Authorization header)

**Requisito #5 (Pruebas) → EXTENDER:**
- Unitarias: backend/src/test/java/** (ExpedienteServiceTest, NotasServiceTest, ChecklistCierreServiceTest)
- Contrato: tests/newman/** (requests nuevas en SIVU.postman_collection.json)
- E2E: tests/cypress/cypress/e2e/** (specs 06-08 para expediente, evaluaciones, cortes)
- Load: tests/k6/expediente-load.js (mide P95 de GET expediente)
- Evidencia: ci.yml ejecuta todos en paralelo (backend job + api-contract job + e2e job), genera reportes en artifacts

**Requisito #6 (Sonar) → VALIDAR + MEJORAR:**
- Config actual: sonar-project.properties cubre backend + frontend + mcp
- Coverage: JaCoCo en backend (meta: >70% para clases nuevas de expediente/evaluacion/cortes)
- Exclusiones: mantener DTOs, config, mappers
- Análisis en CI: mvn sonar:sonar se ejecuta si SONAR_TOKEN está set
- Nuevas clases: expediente/**, evaluacion/**, cortes/** deben alcanzar >75% coverage
- Evidencia: SonarCloud project=sivu, branch analysis de main, PR checks si está configurado

**Requisito #9 (CI/CD) → COMPLETO + VALIDACIÓN:**
- Flujo actual: push → backend build + test + sonar → newman → cypress → docker → deploy (Render + Vercel)
- Validación v2: agregar step en ci.yml después de 'Compile and test': ./scripts/validate-new-endpoints.sh (verifica que los tests pasen)
- Deployables nuevos: backend (cambios en expediente, evaluacion), frontend (UI nuevas)
- Revert automático: si api-contract o e2e fallan, no despliega
- Notificaciones: si deploy falla, Slack/email a DL de devs
- Evidencia: ci.yml jobs ordenados por dependencia, concurrency, artifacts, deploy solo en main y post tests verdes


**Riesgo:** **RIESGO CRÍTICO:**
1. **Nuevas queries n+1 en expediente:** si se accede a hoja_vida + documentos + trimestres + evaluaciones sin eager loading, queries lentas → solucionar con @Query(fetch=FetchType.JOIN) o desnormalización en V22
2. **IA sidecar timeout:** si POST /summary en sidecar tarda >120s (timeout actual), el endpoint falla → mitigar con timeout configurables, fallback a heurístico
3. **Coverage de tests:** si nuevas clases (ExpedienteService, NotasService) no alcanzan >75%, SonarCloud marca crítico → requerir tests unitarios y E2E antes de merge

**RIESGO MODERADO:**
1. **Índices de BD:** las nuevas queries de expediente en tablas grandes (estudiantes × trimestres × evaluaciones) necesitan índices → V22 debe crear INDEX idx_estudiante_id_created_at en trimestre, notas_evaluacion
2. **Compatibilidad backward:** si expediente incluye campos nuevos, clientes antiguos fallan → versionar DTOs como ExpedienteV1Response vs ExpedienteV2Response (o marcar como @Deprecated)
3. **IA sidecar caído:** si el servicio no está disponible, fallback heurístico funciona pero pierde contexto de evaluaciones → documental bien el comportamiento degradado

**RIESGO BAJO:**
1. **Migrate Flyway:** V22 agrega tablas pero no toca existentes → zero risk si no hay FK circulares
2. **Frontend UI:** componentes nuevos de expediente/evaluaciones pueden no encajar en layout actual → diseñar responsive desde el inicio
3. **Permisos:** nuevos endpoints necesitan @PreAuthorize corrects (estudiante ve su expediente, coordinador ve todos) → revisar en code review

**VALIDACIÓN PRE-DEPLOY:**
- [ ] Todos los nuevos tests (unit + newman + cypress) pasan localmente
- [ ] Coverage >75% en expediente/**, evaluacion/**, cortes/**
- [ ] SonarCloud score mejora o se mantiene
- [ ] IA sidecar health check pasa: GET /health → {ok, hasToken, model}
- [ ] Load test (K6) con 100 usuarios simultáneos: P95 < 1s para GET expediente
- [ ] Rollback plan: si deploy a producción falla, volver a último commit con tests verdes
