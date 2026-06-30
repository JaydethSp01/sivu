package co.uempresarial.sivu.admin;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
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
import co.uempresarial.sivu.trimestre.domain.EstadoTrimestre;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.tutor.domain.EstadoTutor;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
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
 * Crea datos demo idempotentes (sólo si las tablas están vacías) del flujo de
 * Coformación v2: usuarios/roles, estudiantes, empresas, tutores (docente
 * acompañante + tutor empresarial) y UNA práctica asignada (Convenio creado
 * directamente por la Oficina de Coformación) con su primer Trimestre/corte.
 *
 * No siembra vacantes ni postulaciones: en Coformación el estudiante es ASIGNADO
 * directamente a la práctica, no se postula a ninguna vacante.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SeedService {

    private final EstudianteRepository estudianteRepository;
    private final EmpresaRepository empresaRepository;
    private final TutorRepository tutorRepository;
    private final ConvenioRepository convenioRepository;
    private final TrimestreRepository trimestreRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> seed() {
        // El orden importa: dominio primero, después usuarios que referencian sus ids,
        // y por último la práctica que enlaza estudiante + empresa + tutores.
        int empresas = seedEmpresas();
        int estudiantes = seedEstudiantes();
        int tutores = seedTutores();
        seedUsuariosVinculados();
        int practicas = seedPracticaAsignada();

        return Map.of(
            "ok", true,
            "estudiantes", estudiantes,
            "empresas", empresas,
            "tutores", tutores,
            "practicas", practicas,
            "usuariosDemo", Map.of(
                "admin", "admin@uempresarial.edu.co",
                "coordinador", "coord@uempresarial.edu.co",
                "estudiante", "kelly@est.uempresarial.edu.co",
                "empresa", "rrhh@coally.com",
                "tutor", "cmendoza@uempresarial.edu.co",
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
    // Tutores (docente acompañante + tutor empresarial)
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
    // Práctica asignada (Convenio directo) + primer Trimestre
    // ---------------------------------------------------------------

    private int seedPracticaAsignada() {
        if (convenioRepository.count() > 0) return (int) convenioRepository.count();

        Estudiante kelly = estudianteRepository
            .findByEmailIgnoreCase("kelly@est.uempresarial.edu.co").orElse(null);
        Empresa coally = empresaRepository.findByNit("900111222-3").orElse(null);
        if (kelly == null || coally == null) {
            log.warn("No se pudo sembrar la práctica demo: falta estudiante o empresa base.");
            return 0;
        }

        Tutor docente = tutorRepository.findAll().stream()
            .filter(t -> t.getTipo() == TipoTutor.ACADEMICO)
            .findFirst().orElse(null);
        Tutor tutorEmpresarial = tutorRepository.findAll().stream()
            .filter(t -> t.getTipo() == TipoTutor.EMPRESARIAL)
            .findFirst().orElse(null);

        LocalDate inicio = LocalDate.now().withDayOfMonth(1);
        LocalDate fin = inicio.plusMonths(9);

        Convenio practica = Convenio.builder()
            .estudiante(kelly)
            .empresa(coally)
            .tutorAcademico(docente)
            .tutorEmpresarial(tutorEmpresarial)
            .numeroConvenio("CONV-" + inicio.getYear() + "-DEMO1")
            .fechaInicio(inicio)
            .fechaFin(fin)
            .estado(EstadoConvenio.ACTIVO)
            .semestreAcademico(inicio.getYear() + "-1")
            .esContinuidad(false)
            .build();
        practica = convenioRepository.save(practica);

        // Primer corte/trimestre del proceso de Coformación.
        trimestreRepository.save(Trimestre.builder()
            .convenio(practica)
            .numero((short) 1)
            .materiaNucleo("Práctica Profesional I")
            .fechaInicio(inicio)
            .fechaFin(inicio.plusMonths(3))
            .estado(EstadoTrimestre.ABIERTO)
            .build());

        log.info("Práctica demo sembrada: convenio={} estudiante={} empresa={}",
            practica.getNumeroConvenio(), kelly.getEmail(), coally.getRazonSocial());
        return (int) convenioRepository.count();
    }

    // ---------------------------------------------------------------
    // Usuarios (con vínculos a entidades de dominio)
    // ---------------------------------------------------------------

    private void seedUsuariosVinculados() {
        Long kellyId = estudianteRepository.findByEmailIgnoreCase("kelly@est.uempresarial.edu.co")
            .map(Estudiante::getId).orElse(null);
        Long coallyId = empresaRepository.findByNit("900111222-3")
            .map(Empresa::getId).orElse(null);
        // Entidad Tutor académico del docente acompañante: habilita su scope estricto.
        Long docenteTutorId = tutorRepository.findByEmailIgnoreCase("cmendoza@uempresarial.edu.co")
            .map(co.uempresarial.sivu.tutor.domain.Tutor::getId).orElse(null);

        crearSiNoExiste("admin@uempresarial.edu.co", "Admin123*",
            "Admin", "SIVU", Set.of(Rol.ADMIN), null, null, null);
        crearSiNoExiste("coord@uempresarial.edu.co", "Coord123*",
            "Carmen", "Coordinadora", Set.of(Rol.COORDINADOR), null, null, null);
        crearSiNoExiste("kelly@est.uempresarial.edu.co", "Estudiante123*",
            "Kellyn", "Delgado", Set.of(Rol.ESTUDIANTE), kellyId, null, null);
        // Tutor empresarial (lado empresa): vinculado a la empresa para el scope por empresaId.
        crearSiNoExiste("rrhh@coally.com", "Tutor123*",
            "RRHH", "Coally", Set.of(Rol.TUTOR), null, coallyId, null);
        // Docente acompañante: vinculado a su entidad Tutor ACADEMICO para el scope estricto.
        crearSiNoExiste("cmendoza@uempresarial.edu.co", "Docente123*",
            "Carlos", "Mendoza", Set.of(Rol.DOCENTE), null, null, docenteTutorId);
        crearSiNoExiste("mcp_agent@sivu.uempresarial.edu.co", "Mcp_Agent123*",
            "Agente", "MCP", Set.of(Rol.MCP_AGENT), null, null, null);
    }

    private void crearSiNoExiste(String email, String password, String nombres, String apellidos,
                                 Set<Rol> roles, Long estudianteId, Long empresaId, Long tutorId) {
        if (usuarioRepository.existsByEmailIgnoreCase(email)) return;
        Usuario u = Usuario.builder()
            .email(email.toLowerCase())
            .passwordHash(passwordEncoder.encode(password))
            .nombres(nombres)
            .apellidos(apellidos)
            .roles(new HashSet<>(roles))
            .estudianteId(estudianteId)
            .empresaId(empresaId)
            .tutorId(tutorId)
            .activo(true)
            .build();
        usuarioRepository.save(u);
        log.info("Usuario seed creado: {} (estudianteId={}, empresaId={}, tutorId={})",
            email, estudianteId, empresaId, tutorId);
    }
}
