package co.uempresarial.sivu.admin;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import co.uempresarial.sivu.catalogo.modalidad.persistence.ModalidadVinculacionRepository;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.domain.EstadoEmpresa;
import co.uempresarial.sivu.empresa.persistence.EmpresaRepository;
import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.domain.TipoDocumento;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.security.domain.Rol;
import co.uempresarial.sivu.security.domain.Usuario;
import co.uempresarial.sivu.security.persistence.UsuarioRepository;
import co.uempresarial.sivu.tutor.domain.EstadoTutor;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import co.uempresarial.sivu.vacante.domain.AreaPractica;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Modalidad;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Crea datos demo idempotentes (sólo si las tablas están vacías).
 * Importante: crea primero las entidades de dominio (Estudiantes, Empresas) y luego
 * los Usuarios, **vinculando** `usuario.estudianteId` / `usuario.empresaId` para que
 * la UI sepa a qué entidad pertenece cada cuenta logueada.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SeedService {

    private final EstudianteRepository estudianteRepository;
    private final EmpresaRepository empresaRepository;
    private final VacanteRepository vacanteRepository;
    private final TutorRepository tutorRepository;
    private final ModalidadVinculacionRepository modalidadRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> seed() {
        // El orden importa: dominio primero, después usuarios que referencian sus ids.
        int empresas = seedEmpresas();
        int estudiantes = seedEstudiantes();
        int vacantes = seedVacantes();
        int tutores = seedTutores();
        seedUsuariosVinculados();

        return Map.of(
            "ok", true,
            "estudiantes", estudiantes,
            "empresas", empresas,
            "vacantes", vacantes,
            "tutores", tutores,
            "usuariosDemo", Map.of(
                "admin", "admin@uempresarial.edu.co",
                "coordinador", "coord@uempresarial.edu.co",
                "estudiante", "kelly@est.uempresarial.edu.co",
                "empresa", "rrhh@coally.com",
                "mcp_agent", "mcp_agent@sivu.uempresarial.edu.co"),
            "credencialesDocumentadas",
                "Ver README.md o pantalla de login para las contraseñas demo");
    }

    // ---------------------------------------------------------------
    // Estudiantes
    // ---------------------------------------------------------------

    private int seedEstudiantes() {
        if (estudianteRepository.count() > 0) return (int) estudianteRepository.count();
        save(crearEst("CC", "1010111111", "Kellyn Johanna", "Delgado Jaimes",
            "kelly@est.uempresarial.edu.co", "Ingeniería de Sistemas", (short) 9, (short) 140, "4.30"));
        save(crearEst("CC", "1010222222", "Jaydeth", "Sandoval",
            "jaydeth@est.uempresarial.edu.co", "Ingeniería de Sistemas", (short) 10, (short) 160, "4.10"));
        save(crearEst("CC", "1010333333", "Fabian", "Suárez",
            "fabian@est.uempresarial.edu.co", "Ingeniería Industrial", (short) 8, (short) 130, "3.80"));
        save(crearEst("CC", "1010444444", "Nicol", "Daza",
            "nicol@est.uempresarial.edu.co", "Administración de Empresas", (short) 9, (short) 145, "4.50"));
        save(crearEst("CC", "1010555555", "Juan David", "Pérez",
            "juan@est.uempresarial.edu.co", "Ingeniería de Sistemas", (short) 7, (short) 110, "3.60"));
        save(crearEst("TI", "1010666666", "Laura", "Gómez",
            "laura@est.uempresarial.edu.co", "Mercadeo", (short) 6, (short) 95, "3.20"));
        return (int) estudianteRepository.count();
    }

    private Estudiante crearEst(String tipoDoc, String numDoc, String nombres, String apellidos,
                                String email, String programa, short semestre, short creditos, String promedio) {
        return Estudiante.builder()
            .tipoDocumento(TipoDocumento.valueOf(tipoDoc))
            .numeroDocumento(numDoc)
            .nombres(nombres)
            .apellidos(apellidos)
            .email(email)
            .telefono("+57 3000000000")
            .programaAcademico(programa)
            .semestre(semestre)
            .creditosAprobados(creditos)
            .promedioAcumulado(new BigDecimal(promedio))
            .estado(EstadoEstudiante.ACTIVO)
            .build();
    }

    private void save(Estudiante e) {
        if (!estudianteRepository.existsByNumeroDocumento(e.getNumeroDocumento())) {
            estudianteRepository.save(e);
        }
    }

    // ---------------------------------------------------------------
    // Empresas
    // ---------------------------------------------------------------

    private int seedEmpresas() {
        if (empresaRepository.count() > 0) return (int) empresaRepository.count();
        empresaRepository.save(Empresa.builder()
            .nit("900111222-3")
            .razonSocial("Coally S.A.S.")
            .nombreComercial("Coally")
            .sector("Tecnología")
            .ciudad("Bogotá")
            .direccion("Cra 7 #45-10")
            .emailContacto("rrhh@coally.com")
            .telefonoContacto("+57 6011112233")
            .contactoNombre("Andrea Ruiz")
            .contactoCargo("Head of Talent")
            .estado(EstadoEmpresa.ACTIVA)
            .build());
        empresaRepository.save(Empresa.builder()
            .nit("900222333-4")
            .razonSocial("Bancolombia S.A.")
            .nombreComercial("Bancolombia")
            .sector("Servicios financieros")
            .ciudad("Medellín")
            .direccion("Cra 48 #26-85")
            .emailContacto("practicas@bancolombia.com.co")
            .telefonoContacto("+57 6042223344")
            .contactoNombre("Camilo Restrepo")
            .contactoCargo("Coordinador de Talento")
            .estado(EstadoEmpresa.ACTIVA)
            .build());
        empresaRepository.save(Empresa.builder()
            .nit("900333444-5")
            .razonSocial("Rappi Inc.")
            .nombreComercial("Rappi")
            .sector("Tecnología")
            .ciudad("Bogotá")
            .direccion("Cra 11 #93-46")
            .emailContacto("internships@rappi.com")
            .telefonoContacto("+57 6013334455")
            .contactoNombre("María Rodríguez")
            .contactoCargo("People Ops")
            .estado(EstadoEmpresa.ACTIVA)
            .build());
        return (int) empresaRepository.count();
    }

    // ---------------------------------------------------------------
    // Vacantes
    // ---------------------------------------------------------------

    private int seedVacantes() {
        if (vacanteRepository.count() > 0) return (int) vacanteRepository.count();
        var empresas = empresaRepository.findAll();
        if (empresas.isEmpty()) return 0;
        Empresa coally = empresas.get(0);
        Empresa banco = empresas.size() > 1 ? empresas.get(1) : coally;
        Empresa rappi = empresas.size() > 2 ? empresas.get(2) : coally;

        // Las 3 modalidades vienen sembradas por la migración V4. Las usamos para
        // asignar a cada vacante demo la modalidad apropiada.
        ModalidadVinculacion modCCB = modalidadRepository
            .findByCodigoIgnoreCase("EMPRESA_ALIADA_CCB").orElse(null);
        ModalidadVinculacion modInternaU = modalidadRepository
            .findByCodigoIgnoreCase("INTERNA_UNIVERSIDAD").orElse(null);

        vacanteRepository.save(Vacante.builder()
            .empresa(coally)
            .titulo("Practicante de Desarrollo Backend Java")
            .descripcion("Apoyo en desarrollo de microservicios Spring Boot, integraciones REST y CI/CD con GitHub Actions.")
            .areaPractica(AreaPractica.DESARROLLO_SW)
            .modalidad(Modalidad.HIBRIDO)
            .modalidadVinculacion(modCCB)
            .ciudad("Bogotá")
            .requisitosKeywords("java, spring, sistemas, postgres, docker")
            .creditosMinimos((short) 120)
            .promedioMinimo(new BigDecimal("3.50"))
            .programasDirigidos("Ingeniería de Sistemas, Ingeniería de Software")
            .duracionMeses((short) 6)
            .cuposDisponibles((short) 2)
            .fechaInicio(LocalDate.now().plusMonths(1))
            .fechaCierrePostulaciones(LocalDate.now().plusWeeks(3))
            .estado(EstadoVacante.PUBLICADA)
            .build());

        vacanteRepository.save(Vacante.builder()
            .empresa(banco)
            .titulo("Practicante de Analítica de Datos")
            .descripcion("Soporte en construcción de dashboards en Tableau, análisis exploratorio y modelos predictivos.")
            .areaPractica(AreaPractica.ANALISIS_DATOS)
            .modalidad(Modalidad.PRESENCIAL)
            .modalidadVinculacion(modCCB)
            .ciudad("Medellín")
            .requisitosKeywords("python, sql, tableau, sistemas, industrial, estadistica")
            .creditosMinimos((short) 100)
            .promedioMinimo(new BigDecimal("3.80"))
            .programasDirigidos("Ingeniería de Sistemas, Ingeniería Industrial")
            .duracionMeses((short) 6)
            .cuposDisponibles((short) 1)
            .fechaInicio(LocalDate.now().plusMonths(1))
            .fechaCierrePostulaciones(LocalDate.now().plusWeeks(4))
            .estado(EstadoVacante.PUBLICADA)
            .build());

        // Práctica interna en la U como demo del segundo escenario.
        vacanteRepository.save(Vacante.builder()
            .empresa(rappi)
            .titulo("Practicante en Fábrica de Software de la Universidad")
            .descripcion("Proyectos internos de transformación digital de la U. Buen plan B cuando no quedas en empresa aliada.")
            .areaPractica(AreaPractica.DESARROLLO_SW)
            .modalidad(Modalidad.HIBRIDO)
            .modalidadVinculacion(modInternaU)
            .ciudad("Bogotá")
            .requisitosKeywords("java, react, sistemas, software")
            .creditosMinimos((short) 100)
            .promedioMinimo(new BigDecimal("3.30"))
            .programasDirigidos("Ingeniería de Sistemas, Ingeniería de Software")
            .duracionMeses((short) 6)
            .cuposDisponibles((short) 4)
            .fechaInicio(LocalDate.now().plusMonths(1))
            .fechaCierrePostulaciones(LocalDate.now().plusWeeks(2))
            .estado(EstadoVacante.PUBLICADA)
            .build());

        vacanteRepository.save(Vacante.builder()
            .empresa(rappi)
            .titulo("Practicante de Marketing Digital")
            .descripcion("Gestión de campañas en redes sociales, análisis de métricas y reporte semanal a stakeholders.")
            .areaPractica(AreaPractica.MARKETING)
            .modalidad(Modalidad.REMOTO)
            .modalidadVinculacion(modCCB)
            .ciudad("Bogotá")
            .requisitosKeywords("marketing, redes sociales, contenidos, mercadeo, analytics")
            .creditosMinimos((short) 90)
            .promedioMinimo(new BigDecimal("3.20"))
            .programasDirigidos("Mercadeo, Administración de Empresas")
            .duracionMeses((short) 6)
            .cuposDisponibles((short) 3)
            .fechaInicio(LocalDate.now().plusMonths(1))
            .fechaCierrePostulaciones(LocalDate.now().plusWeeks(2))
            .estado(EstadoVacante.PUBLICADA)
            .build());

        return (int) vacanteRepository.count();
    }

    // ---------------------------------------------------------------
    // Tutores
    // ---------------------------------------------------------------

    private int seedTutores() {
        if (tutorRepository.count() > 0) return (int) tutorRepository.count();
        var empresas = empresaRepository.findAll();
        Empresa coally = empresas.isEmpty() ? null : empresas.get(0);

        tutorRepository.save(Tutor.builder()
            .tipo(TipoTutor.ACADEMICO).nombres("Carlos").apellidos("Mendoza")
            .email("cmendoza@uempresarial.edu.co").telefono("+57 3001111111")
            .cargo("Profesor titular").dependencia("Facultad de Ingeniería")
            .estado(EstadoTutor.ACTIVO).build());

        tutorRepository.save(Tutor.builder()
            .tipo(TipoTutor.ACADEMICO).nombres("Patricia").apellidos("Vargas")
            .email("pvargas@uempresarial.edu.co").telefono("+57 3002222222")
            .cargo("Profesora asociada").dependencia("Facultad de Ciencias Económicas")
            .estado(EstadoTutor.ACTIVO).build());

        if (coally != null) {
            tutorRepository.save(Tutor.builder()
                .tipo(TipoTutor.EMPRESARIAL).nombres("Andrea").apellidos("Ruiz")
                .email("aruiz@coally.com").telefono("+57 3003333333")
                .cargo("Head of Talent").dependencia("Talento Humano")
                .empresa(coally).estado(EstadoTutor.ACTIVO).build());

            tutorRepository.save(Tutor.builder()
                .tipo(TipoTutor.EMPRESARIAL).nombres("Juan").apellidos("Castro")
                .email("jcastro@coally.com").telefono("+57 3004444444")
                .cargo("Tech Lead Backend").dependencia("Ingeniería")
                .empresa(coally).estado(EstadoTutor.ACTIVO).build());
        }

        return (int) tutorRepository.count();
    }

    // ---------------------------------------------------------------
    // Usuarios (con vínculos a entidades de dominio)
    // ---------------------------------------------------------------

    private void seedUsuariosVinculados() {
        Long kellyId = estudianteRepository.findByEmailIgnoreCase("kelly@est.uempresarial.edu.co")
            .map(Estudiante::getId).orElse(null);
        Long coallyId = empresaRepository.findByNit("900111222-3")
            .map(Empresa::getId).orElse(null);

        crearSiNoExiste("admin@uempresarial.edu.co", "Admin123*",
            "Admin", "SIVU", Set.of(Rol.ADMIN), null, null);
        crearSiNoExiste("coord@uempresarial.edu.co", "Coord123*",
            "Carmen", "Coordinadora", Set.of(Rol.COORDINADOR), null, null);
        crearSiNoExiste("kelly@est.uempresarial.edu.co", "Estudiante123*",
            "Kellyn", "Delgado", Set.of(Rol.ESTUDIANTE), kellyId, null);
        crearSiNoExiste("rrhh@coally.com", "Empresa123*",
            "RRHH", "Coally", Set.of(Rol.EMPRESA), null, coallyId);
        crearSiNoExiste("mcp_agent@sivu.uempresarial.edu.co", "Mcp_Agent123*",
            "Agente", "MCP", Set.of(Rol.MCP_AGENT), null, null);
    }

    private void crearSiNoExiste(String email, String password, String nombres, String apellidos,
                                 Set<Rol> roles, Long estudianteId, Long empresaId) {
        if (usuarioRepository.existsByEmailIgnoreCase(email)) return;
        Usuario u = Usuario.builder()
            .email(email.toLowerCase())
            .passwordHash(passwordEncoder.encode(password))
            .nombres(nombres)
            .apellidos(apellidos)
            .roles(new HashSet<>(roles))
            .estudianteId(estudianteId)
            .empresaId(empresaId)
            .activo(true)
            .build();
        usuarioRepository.save(u);
        log.info("Usuario seed creado: {} (estudianteId={}, empresaId={})", email, estudianteId, empresaId);
    }
}
