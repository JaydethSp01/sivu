# Auditoría de arquitectura — Backend SIVU

> Revisión senior del backend Spring Boot 3 / Java 21 ubicado en `backend/`.
> ~16.4k LOC en `src/main`, 275 clases Java, 27 paquetes de feature.

## Fortalezas

- **Package-by-feature consistente.** Cada feature (`trimestre`, `convenio`, `postulacion`, …) trae su propia tripleta `domain/persistence/service/web` + subpaquetes `dto/`, `pdf/`, `mapper`. Reduce acoplamiento y facilita onboarding académico.
- **JPA bien configurado.** `open-in-view: false`, `default_batch_fetch_size: 16`, `ddl-auto: validate`, todas las relaciones `@ManyToOne(fetch = LAZY)`. Repositorios clave usan `@EntityGraph` (ej. `ConvenioRepository.buscar`, `TrimestreRepository.findById`) para evitar N+1 de forma quirúrgica.
- **GlobalExceptionHandler completo.** Cubre `ResourceNotFoundException`, `BusinessException` (422), validación, `DataIntegrityViolationException` (409), `AccessDeniedException`, `BadCredentialsException` y catch-all genérico con logging. Respuesta tipada (`ApiError` record).
- **JWT sólido.** HS512, valida longitud mínima de la clave en el constructor, separa `access`/`refresh` con claim `type`, expiraciones parametrizadas; el filtro es `OncePerRequestFilter` y limpia el contexto en fallo silenciosamente.
- **Migraciones Flyway atómicas.** 15 migraciones numeradas, cada una con encabezado documentado en español, propósito acotado (V8 borra bitácoras, V13 introduce respuestas, V15 sello de tiempo). Convención clara.
- **Auto-scope por rol** vía `CurrentUserService.esEmpresaPura()/esEstudiantePuro()`: usado en 9 services para filtrar listados por tenant sin contaminar controllers.

## Hallazgos críticos

- **`POST /api/v1/admin/seed` es público.** En `SecurityConfig` está en `permitAll()` y el endpoint solo declara `@SecurityRequirements`. `SeedService` (347 líneas) crea usuarios ADMIN/COORDINADOR. Cualquiera con acceso a la URL puede re-seedear o, peor, escalar privilegios si el seed crea cuentas con password conocido. **Acción:** restringir por `@Profile("dev")` o por header secret, o exigir `ROLE_ADMIN`.
- **JWT secret por defecto hardcodeado** en `application.yml` (`please_change_me_…`). Si la variable de entorno no se setea en algún despliegue, el backend arranca con clave conocida. **Acción:** fallar el arranque si `JWT_SECRET` no viene de env en perfiles distintos a `dev`/`test`.
- **CORS hardcodeado a `localhost`** en `WebConfig` y `cors(cors -> {})` en SecurityConfig sin `CorsConfigurationSource` bean. En staging/prod no permitirá el frontend real. Está fuera del scope académico pero conviene parametrizarlo por `app.cors.allowed-origins`.

## Mejoras recomendadas

- **`BusinessException` sin código de error.** Solo lleva mensaje; el frontend no puede discriminar entre 20+ reglas. Añadir `enum BusinessErrorCode` y exponerlo en `ApiError`.
- **MapStruct está como dependencia y solo 11 mappers lo usan.** El resto (`TrimestreMapper`, `ConvenioMapper`, …) son `@Component` manuales con copy/paste. Unificar criterio: o MapStruct para todos los DTO sencillos, o quitar la dependencia.
- **N+1 latente en `TrimestreService.toResponse`.** Hace 5 queries (`findByTrimestreId`, `countBy…`) por cada trimestre listado. Para `listarPorConvenio` con 3 trimestres son 15 round-trips. Resolver con un único `@Query` que devuelva un DTO proyección con conteos.
- **MongoDB para `Usuario`** crea una FK lógica (`estudianteId`, `empresaId`) sin integridad referencial cross-DB; ya está documentado en la entidad pero no hay un job de reconciliación. Considerar mover `Usuario` a Postgres salvo que haya motivo fuerte (no se ve uno en este dominio).
- **Lógica de firma duplicada.** `Convenio.firmar` (estado-máquina manual con `switch`) y `EvaluacionProfesorTrimestreService.firmar` repiten el patrón. Extraer un `SignatureWorkflow<T>` o usar Spring State Machine.
- **`SeedService` de 347 LOC** mezcla creación de Usuario/Estudiante/Empresa/Vacante. Romper en `*SeedComponent` por feature.
- **`@Transactional` a nivel clase + override por método** está bien aplicado, pero servicios como `AuthService` no lo declaran a nivel clase (solo en `register`); `login` hace `usuarioRepository.save(usuario)` fuera de transacción explícita, dependiendo de la auto-tx por defecto del repo. Hacer explícito.
- **PDFs acoplados al service.** `EvaluacionProfesorPdfGenerator` recibe la entidad JPA directa, no un DTO. Si cambia el esquema, rompe la generación. Definir un `EvaluacionProfesorPdfModel` (record).
- **`open-in-view: false`** está correcto, pero hay mappers que llaman `.getObjetivos()` y `.getMeses()` (lazy) en `TrimestreMapper`. Si el `@Transactional` del service ya cerró, lanzará `LazyInitializationException`. Verificar que toda lectura ocurra dentro de la tx.
- **Tests muy escasos** (7 archivos, ~789 LOC sobre 16k de prod ≈ 4-5% de cobertura aproximada). Faltan tests de `ConvenioService.firmar` (la máquina de estados), `TrimestreService`, controladores con `@WebMvcTest` + `spring-security-test`. JaCoCo está configurado pero no se está aprovechando.
- **Catálogo de plantillas dinámicas (V12-V14)** introduce un mini-EAV (`criterio_plantilla.tipo`, `respuesta_criterio.valor_numero/texto/bool`). Es flexible pero abre la puerta a inconsistencias; añadir validación a nivel service que verifique que el `tipo` del criterio coincide con el campo poblado.

## Quick wins

- Mover `/api/v1/admin/seed` fuera de `permitAll()` y anotar `@PreAuthorize("hasRole('ADMIN')")` + `@Profile({"dev","docker"})`.
- Añadir `@PostConstruct` en `JwtService` que falle si el secret es el placeholder cuando `profile != dev,test`.
- `BusinessException` → añadir constructor con `errorCode`; surface en `ApiError`.
- Reemplazar las 5 queries por trimestre en `toResponse` con un DTO de proyección (`TrimestreSummaryView`).
- Activar `spring.jpa.properties.hibernate.jdbc.batch_size: 20` y `order_inserts: true` para mejorar inserts en `SeedService` y en `autoGenerar3Actas`.
- Documentar `@SecurityScheme(bearer)` en `OpenApiConfig` para que Swagger pida el token (ya hay `persistAuthorization: true`).

## Veredicto

**Calificación: 8/10**

Es un backend académico **por encima del promedio**: arquitectura coherente, dominio rico (15 migraciones bien pensadas, máquinas de estado para convenio y firmas), seguridad funcional y manejo de errores serio. Los hallazgos críticos son acotados (seed público + secret por defecto) y los puntos medios son típicos de un MVP que aún no pasó por su primer hardening. Con 4-6 horas de quick wins y una semana de tests para alcanzar 40% de cobertura, este código está listo para defensa y para evolucionar a producción.
