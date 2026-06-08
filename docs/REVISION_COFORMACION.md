# SIVU — Revisión para la Oficina de Coformación

> **Sistema de Vinculación Universitaria (SIVU)** — plataforma institucional para
> automatizar el proceso de Coformación Empresarial de Uniempresarial.
>
> Este documento está dirigido a la **Oficina de Coformación**. Listamos cada
> módulo del sistema, qué hace, qué **NO** hace, y dejamos preguntas abiertas
> para que ustedes nos digan qué falta, qué cambiar y qué quitar.

---

## 1. Cómo leer este documento

| Marca | Significado |
|---|---|
| **Listo** | Módulo implementado y probado en local |
| **Parcial** | Existe pero le falta algo concreto que se indica |
| **No implementado** | Identificado pero pendiente |
| **Manual hoy** | El sistema no lo automatiza; sigue siendo trabajo manual de la oficina |

Cada módulo tiene una sección **¿Qué falta?** vacía o con notas, donde
ustedes pueden anotar lo que no contemplamos.

---

## 2. Resumen ejecutivo

SIVU cubre **el flujo completo descrito en la guía oficial** que Coformación
nos compartió, organizado en estos grandes bloques:

1. **Identidad y roles** — cinco roles del proceso (Estudiante, Empresa,
   Tutor empresarial, Profesor/Docente Acompañante, Oficina de Coformación)
   + Administrador.
2. **Vinculación** — hoja de vida institucional → revisión por Coformación
   → publicación a empresas → postulación → entrevista → carta de presentación
   → formalización del convenio.
3. **Fase activa** — plan de actividades mensual, plan especial de mejora,
   tres actas de acompañamiento, dos evaluaciones (tutor y profesor).
4. **Cierre** — informe final del PM (GTC-FM-16), nota ponderada, continuidad
   con la empresa, opción de grado.
5. **Programa interno (Fábrica de Soluciones)** — fallback institucional
   cuando el estudiante no consigue empresa a tiempo, con solicitud explícita.
6. **Formatos institucionales configurables** — Coformación puede editar
   criterios y pesos de los 5 formatos oficiales sin tocar código.

**Lo que automatizamos que no estaba explícito en la guía oficial:**

- Hoja de vida con generación automática de PDF Uniempresarial.
- Hoja de vida ↔ Documentos: cuando el estudiante completa su HV, se
  sincroniza como documento institucional automáticamente.
- Notificaciones por correo (MailHog en local) en cada cambio de estado.
- Plantillas configurables: 5 formatos editables desde la app (criterios,
  pesos, vigencia, tipos de campo).
- Programa interno con solicitud del estudiante + aprobación de Coformación.
- Asignación a programa interno por **calendario académico**: cuando inicia
  el periodo de prácticas (fecha apertura de la cohorte) y el estudiante no
  tiene empresa, queda elegible.

---

## 3. Actores del sistema (roles)

| Rol oficial (guía) | Rol en SIVU | Permisos resumidos |
|---|---|---|
| Estudiante | `ESTUDIANTE` | Hoja de vida, postularse, llenar formularios, ver su práctica |
| Tutor Empresarial | `TUTOR` (tipo EMPRESARIAL) | Firmar documentos, evaluar al estudiante |
| Docente Acompañante (Profesor Coformación) | `TUTOR` (tipo ACADEMICO) | Moderar reuniones, firmar, evaluar |
| Oficina de Coformación | `COORDINADOR` | Aprueba HV, revisa formularios, gestiona empresas, asigna plantillas |
| Empresa (RRHH) | `EMPRESA` | Publica vacantes, programa entrevistas, firma convenios |
| (No en la guía) | `ADMIN` | Todo lo del coordinador + configuración del sistema |

**Nota terminológica:** en el código y la base de datos el rol técnico se
llama `COORDINADOR`, pero en pantalla mostramos **"Coformación"** porque
ese es el nombre institucional correcto. Si quieren un cambio total a
"Coformación" también a nivel técnico, lo hacemos.

### ¿Qué falta?

- _(reservado para Coformación)_

---

## 4. Módulos del sistema

### 4.1 Hoja de vida institucional

**Documento oficial:** Hoja de vida con formato Uniempresarial.

**Cubierto:**

- Formulario por secciones: perfil SABER / HACER / SER, habilidades,
  idiomas, educación, experiencia formativa y laboral. **Listo**
- Generación automática de PDF con el formato Uniempresarial. **Listo**
- Ciclo de validación: `BORRADOR → ENVIADA → APROBADA / RECHAZADA`. **Listo**
- Bandeja en Coformación con aprobar/rechazar con observaciones. **Listo**
- Cuando el estudiante completa su HV, queda **automáticamente** registrada
  como documento institucional (no necesita subir un PDF aparte). **Listo**
- Email al estudiante cuando se aprueba o rechaza. **Listo**

**No implementado / decisión pendiente:**

- ¿Coformación quiere ver el **historial** de versiones de una HV o solo
  la última?
- ¿Se debe poder **bloquear** edición de la HV una vez aprobada hasta nuevo
  semestre, o el estudiante puede seguir actualizándola?

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.2 Postulación a empresas y entrevistas

**Documento oficial:** "Las empresas coformadoras contactan a los candidatos
… programan entrevistas …"

**Cubierto:**

- Estudiante con HV APROBADA puede ver vacantes y postularse a un clic. **Listo**
- Postulación viaja por estados: `POSTULADA → EN_REVISION →
  ENTREVISTA_PROGRAMADA → ENTREVISTA_REALIZADA → PRESELECCIONADA → ACEPTADA`. **Listo**
- Empresa o Coformación agenda entrevistas (modalidad, fecha, enlace virtual,
  entrevistador). **Listo**
- Tras la entrevista se registra resultado APROBADA / RECHAZADA con
  observaciones; el estado de la postulación se mueve automático. **Listo**
- Notificación al estudiante en cada paso. **Listo**

**Manual hoy:**

- La asignación de qué empresas ven qué estudiantes no tiene reglas
  inteligentes — hoy todas las empresas activas ven a todos los
  estudiantes con HV aprobada.

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.3 Carta de presentación

**Documento oficial:** "Una vez el estudiante es seleccionado por la empresa,
la universidad emite una carta de presentación formal."

**Cubierto:**

- Coformación genera la carta desde la postulación PRESELECCIONADA o
  ACEPTADA. **Listo**
- PDF institucional firmado por el responsable de Coformación. **Listo**
- Descargable por estudiante, empresa y Coformación. **Listo**

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.4 Convenio de práctica (formalización)

**Documento oficial:** "se define el período de coformación: 3 meses o 6 meses"

**Cubierto:**

- Convenio creado al aceptar la postulación. **Listo**
- Datos: estudiante, empresa, vacante, fechas, modalidad, tutor académico,
  tutor empresarial. **Listo**
- Estados: `BORRADOR → FIRMADO_ESTUDIANTE → FIRMADO_EMPRESA →
  FIRMADO_UNIVERSIDAD → ACTIVO → FINALIZADO`. **Listo**

**No implementado:**

- Generación del PDF del convenio firmado en sí mismo (hoy se modela como
  estado y los firmantes quedan registrados, pero no hay un PDF
  "convenio_firmado.pdf").

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.5 Plan de actividades mensual (GAC-FM-10)

**Documento oficial:** Plan mensual mes 1 a mes 6 con área de rotación,
actividades, tutor a cargo. Incluye identificación del PEM y objetivos
de aprendizaje del programa.

**Cubierto:**

- Plan por trimestre con identificación del PEM (problema + objetivo). **Listo**
- Lista de **objetivos de aprendizaje del programa** (9 objetivos
  predefinidos para Ingeniería de Software, tomados del formato real).
  Estudiante marca los que aplican. **Listo**
- Plan mes a mes (1-6) con área, actividades y tutor. **Listo**
- Disclaimer institucional de actividades no permitidas (mensajería,
  consignaciones, aseo, etc.) mostrado en el form. **Listo**
- Tres firmas (estudiante, tutor empresarial, profesor acompañante) con
  fecha. **Listo**
- Generación de PDF GAC-FM-10. **Listo**

**Parcial:**

- Los 9 objetivos predefinidos están **hardcoded para Ingeniería de
  Software**. Si Coformación quiere mismo formato para otros programas
  (Administración, etc.), hay que extender el catálogo.

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.6 Plan Especial de Mejora — Informe Final (GTC-FM-16 v3.0)

**Documento oficial:** 12 secciones académicas, máximo 15 páginas, nota ≥ 3.0
para aprobación, posible opción de grado.

**Cubierto (las 12 secciones del formato real):**

- Resumen Ejecutivo, Contextualización, Planteamiento del Problema,
  Marco Teórico, Objetivo General, Objetivos Específicos, Diagnóstico,
  Metodología, Propuesta de Solución, Factibilidad, Conclusiones,
  Anexos. **Listo**
- Validación de longitud (≤ 15 páginas, autoreportadas). **Listo**
- Validación de nota ≥ 3.0 al aprobar. **Listo**
- Ciclo: `BORRADOR → ENTREGADO → APROBADO / RECHAZADO`. **Listo**
- Aprobación / rechazo con observaciones por Coformación. **Listo**
- Generación de PDF GTC-FM-16. **Listo**
- Bandera "opción de grado" en el plan de mejora asociado. **Listo**

**No implementado:**

- **Nivel del informe** (el formato real menciona "Nivel 3"). No tenemos
  un campo "nivel" — ¿Coformación necesita distinguir niveles 1, 2, 3 con
  diferentes exigencias?
- **Cargo del tutor empresarial** en la cabecera del informe. Hoy solo el
  nombre; el cargo no está como campo.
- **Carátula** separada con el título del informe. Hoy el informe arranca
  con la primera sección.

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.7 Reuniones de acompañamiento (GAC-FM-11)

**Documento oficial:** 3 reuniones (inicio, mitad, cierre del periodo) entre
estudiante, tutor empresarial y profesor.

**Cubierto:**

- Las 3 actas (INICIO / MITAD / CIERRE) se crean automáticamente al abrir
  un trimestre. **Listo**
- Formulario con: fecha, hora, tipo de reunión, lugar, asunto, asistentes
  (nombre + rol + correo), temas tratados, compromisos, observaciones,
  firmas. **Listo**
- Generación de PDF GAC-FM-11. **Listo**

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.8 Evaluación del Tutor Empresarial (GAC-FM-007 v2.0)

**Documento oficial:** Tutor empresarial califica al estudiante.
Pesos: Capacidades 40% / Actitudes 40% / Aplicación 20% (Desempeño 10% +
Calidad PEM 5% + Sustentación 5%).

**Cubierto:**

- Formulario con los 3 grupos y los 9 conceptos descriptivos del formato
  real (Proactividad, Calidad, Colaboración, Puntualidad, Responsabilidad,
  Normas, Habilidades sociales, Comprensión del contexto, Presentación
  personal). **Listo**
- Nota ponderada automática con los pesos exactos. **Listo**
- Campo **"¿El estudiante tiene continuidad con la empresa?" SI / NO**
  — diferenciador clave de Uniempresarial. **Listo**
- Firma de tutor y estudiante. **Listo**
- Generación de PDF GAC-FM-007. **Listo**

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.9 Evaluación del Profesor Acompañante (GAC-FM-1 v3)

**Documento oficial:** Profesor evalúa al estudiante en **DOS cortes**
(1° y 2°, cada uno 25% del total del proceso = 50% combinado).
Pesos por corte: Capacidades 10% / Actitudes 10% / Aplicación 80%
(Desempeño 20% + Calidad PEM 50% + Sustentación 10%).

**Cubierto:**

- Formulario con **dos columnas** (corte 1 y corte 2) lado a lado en pantalla. **Listo**
- Nota ponderada automática por corte y nota final promedio. **Listo**
- Observaciones del proceso por corte (1° y 2°). **Listo**
- Firma de profesor y estudiante. **Listo**
- Generación de PDF GAC-FM-1 (parcial: la versión de PDF actual aún
  muestra una sola columna; pendiente actualizar el generador). **Parcial**

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.10 Programa Interno (Fábrica de Soluciones)

**Documento oficial:** "espacio interno de la universidad donde [el estudiante]
desarrolla proyectos reales bajo la tutoría de docentes".

**Cubierto:**

- Vista para Coformación con explicación del programa. **Listo**
- Asignación automática **cada lunes 9:00 AM** de estudiantes elegibles
  a vacantes internas de la universidad (`modalidad =
  INTERNA_UNIVERSIDAD`). **Listo**
- Botón "Asignar elegibles ahora" para forzar la ejecución. **Listo**
- Estudiante puede **solicitar explícitamente** entrar al programa con
  un motivo. **Listo**
- Coformación tiene bandeja para aprobar / rechazar solicitudes con
  observaciones. **Listo**
- Criterio de elegibilidad por **calendario académico**: HV aprobada +
  cohorte cuya fecha de apertura ya inició + sin convenio activo. **Listo**
- Email al estudiante en cada decisión. **Listo**

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.11 Plantillas configurables de formatos

**No estaba en la guía oficial — lo agregamos.**

**Cubierto:**

- Los 5 formatos institucionales viven en base de datos como **plantillas
  editables**:
  - GAC-FM-007 v2.0 — Evaluación del Tutor
  - GAC-FM-1 v3 — Evaluación del Profesor
  - GAC-FM-11 v2.0 — Acta de Acompañamiento
  - GAC-FM-10 v2.0 — Plan de Actividades
  - GTC-FM-16 v3.0 — Informe Final del PM
- Coformación puede:
  - Crear nuevas versiones de cualquier formato
  - Agregar / quitar / reordenar secciones y criterios
  - Cambiar pesos (subponderaciones)
  - Cambiar tipo de campo de cada criterio: **calificación (0-5), texto,
    sí/no, fecha, lista desplegable, firma**
  - Marcar una versión como vigente (desactiva la anterior)
- Asignar una plantilla a un usuario específico con fecha límite. **Listo**
- El asignado ve el formulario en "Mis formularios", lo llena con
  autoguardado, entrega, firma. **Listo**
- PDF dinámico generado desde la plantilla (no hardcoded). **Listo**

**No implementado:**

- Generación de PDF dinámico **idéntico** al formato corporativo
  Uniempresarial. Hoy el PDF dinámico es funcional pero más sobrio que
  los PDFs específicos (GAC-FM-007, GAC-FM-1, etc.) que sí imitan el
  formato oficial.

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.12 Documentos institucionales

**Cubierto:**

- Subida de documentos (PDF, JPG, PNG, DOCX, max 10 MB). **Listo**
- Vista por rol:
  - Estudiante: tarjetas con sus soportes (hoja de vida, EPS,
    identificación, certificados). **Listo**
  - Empresa: documentos corporativos (RUT, cámara de comercio,
    convenios). **Listo**
  - Coformación / Admin: tabla con filtros por tipo y estado. **Listo**
- Estados de validación: `RECIBIDO → VALIDADO / RECHAZADO`. **Listo**
- Para hoja de vida: el documento se sincroniza automáticamente cuando
  el estudiante completa su HV. **Listo**

### ¿Qué falta?

- _(reservado para Coformación)_

---

### 4.13 Catálogos de modalidades y requisitos

**Cubierto:**

- Modalidades de vinculación (presencial, híbrido, remoto, interna
  universidad). **Listo**
- Tipos de requisito documental por modalidad. **Listo**
- Matriz: qué documentos exige cada modalidad. **Listo**
- Coformación las gestiona desde la app. **Listo**

### ¿Qué falta?

- _(reservado para Coformación)_

---

## 5. Lo que automatizamos que la guía no menciona

| Pieza | Por qué importa |
|---|---|
| **Hoja de vida → Documento automático** | El estudiante no necesita subir un PDF aparte; lo genera SIVU y queda registrado. |
| **Notificaciones por email** | Cada cambio de estado (aprobación HV, agendar entrevista, generación de carta, etc.) dispara un correo al involucrado. |
| **Programa interno por calendario** | La asignación al plan B sucede automáticamente cuando inicia el periodo y el estudiante no tiene empresa, sin que Coformación tenga que rastrear caso por caso. |
| **Plantillas configurables** | Coformación cambia criterios y pesos sin pedirle al equipo técnico. |
| **Cards de vacantes con compatibilidad** | El estudiante ve un score automático por cada vacante y postula a un clic. |

---

## 6. Lo que NO automatizamos (gaps reales)

Honestamente, hay cosas de la guía oficial o del proceso real que **no**
están cubiertas por SIVU todavía:

### 6.1 Continuidad post-práctica · **Parcial**

El formato GAC-FM-007 pregunta "¿El estudiante tiene continuidad con la
empresa?" — eso **sí lo tenemos**. Lo que **no tenemos** es un reporte
agregado para Coformación: "¿qué porcentaje de practicantes del semestre
pasado quedaron contratados?". Sería un dashboard de empleabilidad.

### 6.2 Alertas por plazos académicos · **No implementado**

La guía dice "los documentos deben ser entregados dentro de los plazos
establecidos por el calendario académico" — hoy SIVU permite poner una
fecha límite a cada formulario, pero **no envía recordatorios automáticos**
al estudiante / tutor cuando faltan X días. Eso sería un job semanal +
emails de aviso.

### 6.3 Carátula y nivel del Informe Final · **No implementado**

El formato GTC-FM-16 real tiene:
- Carátula con el título del informe (separada del cuerpo).
- Indicador de "Nivel 3" (puede haber niveles 1, 2, 3 con exigencias
  distintas).

Hoy el informe arranca directo en el cuerpo, sin carátula propia. Y no
tenemos campo "nivel".

### 6.4 Asistencia con IA para el PM · **No implementado**

Idea diferenciadora: usar Claude (vía el MCP que existe en el repo) para
revisar borradores del informe final y dar feedback antes de entregar
("falta marco teórico", "esta sección tiene 2 páginas de relleno", etc.).
**No lo construimos.**

### 6.5 Analítica institucional · **No implementado**

Hoy hay un dashboard básico con conteos. Lo que NO hay:
- Tasas de continuidad por empresa / cohorte / programa.
- Tiempo promedio de cada estado de postulación.
- Empresas que más rechazan / más aceptan.
- Estudiantes en riesgo (no postulan, no completan HV).

### 6.6 Otros gaps menores

| Gap | ¿Crítico? |
|---|---|
| Convenio de práctica no se genera como PDF independiente | Medio |
| El PDF dinámico de plantillas no imita el formato corporativo aún | Bajo |
| Catálogo de objetivos del programa hardcoded a Ing. Software | Bajo |
| Sin app móvil nativa (sí es responsive en web) | Decisión |

---

## 7. Tecnología (resumen no técnico)

- **Frontend** (lo que se ve): aplicación web responsive (funciona en
  computador y móvil). Construida con React + TypeScript.
- **Backend** (la lógica + base de datos): Spring Boot + Java 21.
- **Base de datos**: PostgreSQL para datos transaccionales, MongoDB para
  usuarios.
- **PDFs**: se generan en el servidor (OpenPDF) — sin dependencias
  externas.
- **Correos**: en local con MailHog; en producción cualquier SMTP estándar.
- **Despliegue**: Docker. Por ahora todo corre en local; el despliegue a
  servidor de la universidad queda fuera del alcance de esta entrega.

---

## 8. Preguntas abiertas para Coformación

Si pueden responder estas preguntas en una reunión rápida, ajustamos
el sistema:

1. **Roles y nombres:** ¿queremos cambiar el rol técnico `COORDINADOR` a
   `COFORMACION` también en código (BD, tokens), o el cambio solo visible
   es suficiente?

2. **Versiones de HV:** cuando un estudiante actualiza su HV ya aprobada,
   ¿queda automáticamente como BORRADOR para revisión nueva, o se mantiene
   APROBADA hasta que Coformación decida re-validar?

3. **Asignación de empresas:** ¿quieren que las empresas vean a TODOS los
   estudiantes con HV aprobada (como hoy) o filtrado por programa /
   semestre / cohorte?

4. **Continuidad y empleabilidad:** ¿necesitan un dashboard de
   empleabilidad por cohorte / empresa / programa? Tipo "el 67% de los
   practicantes de 2025-1 quedaron contratados".

5. **Alertas por plazos:** ¿el sistema debe enviar recordatorios por
   correo cuando faltan X días para una entrega? ¿Cuál sería el "X"
   adecuado (3 días, 7 días)?

6. **Niveles de informe final:** ¿hay niveles 1, 2, 3 con exigencias
   distintas? Si sí, ¿qué cambia entre ellos?

7. **Otros programas:** los objetivos de aprendizaje del Plan de
   Actividades hoy son los de Ingeniería de Software. ¿Coformación
   gestiona también Administración, Negocios, etc.? Si sí, pásennos los
   objetivos por programa para agregarlos al catálogo.

8. **Carátula del informe final:** ¿la necesitamos como página separada
   con título grande, o el formato actual sin carátula está bien?

9. **Documentos físicos vs digitales:** ¿algún documento del proceso
   sigue siendo físico (firmas a mano sobre papel) o todo es digital?

10. **Asistencia con IA:** si pudiéramos usar IA para que el estudiante
    reciba feedback automático sobre su informe final antes de entregar,
    ¿les interesa? ¿Hay restricciones institucionales sobre uso de IA?

---

## 9. Cómo revisar SIVU

Para probar el sistema en local:

```bash
cd ~/sivu
make demo
```

Esto levanta todo (frontend + backend + bases de datos + correo local
MailHog) y siembra datos de prueba.

URLs:
- Aplicación: <http://localhost:5173>
- API y Swagger: <http://localhost:8080/swagger-ui.html>
- Correo demo (MailHog): <http://localhost:8025>

Credenciales demo:
- Admin: `admin@uempresarial.edu.co` / `Admin123*`
- Coformación: `coord@uempresarial.edu.co` / `Coord123*`
- Estudiante: `kelly@est.uempresarial.edu.co` / `Estudiante123*`
- Empresa: `rrhh@coally.com` / `Empresa123*`

---

## 10. Próximos pasos

Después de la revisión de Coformación, los pasos lógicos son:

1. **Llenar las secciones "¿Qué falta?"** de cada módulo con las
   observaciones de ustedes.
2. **Priorizar gaps**: ¿qué es bloqueante para usar SIVU en producción y
   qué es "nice to have"?
3. **Confirmar contenido de plantillas**: hoy los 5 formatos están con
   los criterios del PDF real que nos compartieron. ¿Está al 100% o hay
   ajustes?
4. **Acordar despliegue**: dónde corre el sistema en producción, dominio,
   manejo de correos reales (Office 365, Gmail Workspace, etc.).
