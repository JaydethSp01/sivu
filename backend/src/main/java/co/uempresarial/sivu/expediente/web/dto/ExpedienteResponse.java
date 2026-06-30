package co.uempresarial.sivu.expediente.web.dto;

import co.uempresarial.sivu.expediente.domain.EstadoSeccionExpediente;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * BI-16 / RF-B01 — Expediente Digital Unificado.
 *
 * <p>Vista agregada en memoria (sin tabla propia) que consolida por estudiante todo su proceso
 * de Coformación: datos del estudiante, convenio y empresa; el estado de cada documento por
 * trimestre/corte (Plan de Actividades, Actas, Evaluación Docente, Evaluación del Tutor e
 * Informe Final); las notas por corte y la nota final calculada; y la lista de PDFs descargables.</p>
 *
 * <p>Es de solo lectura: el servicio agregador consume los repositorios/servicios de los módulos
 * existentes sin modificar su lógica.</p>
 */
public record ExpedienteResponse(
    EstudianteResumen estudiante,
    ConvenioResumen convenio,
    EmpresaResumen empresa,
    TutoresResumen tutores,
    CalificacionResumen calificacion,
    List<TrimestreExpediente> trimestres,
    List<DocumentoExpediente> documentos,
    String estadoGeneral
) {

    /** Datos del estudiante dueño del expediente. */
    public record EstudianteResumen(
        Long id,
        String nombres,
        String apellidos,
        String numeroDocumento,
        String email,
        String programaAcademico,
        Short semestre,
        String estado
    ) {}

    /** Convenio que enmarca el proceso (puede ser null si el estudiante aún no tiene convenio). */
    public record ConvenioResumen(
        Long id,
        String numeroConvenio,
        String estado,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        String semestreAcademico,
        Boolean esContinuidad,
        Long documentoPdfId,
        Long certificadoPdfId
    ) {}

    /** Empresa contraparte del convenio. */
    public record EmpresaResumen(
        Long id,
        String razonSocial,
        String nit,
        String sector,
        String ciudad
    ) {}

    /** Tutores asignados (nombre completo o null si no asignado). */
    public record TutoresResumen(
        String tutorAcademico,
        String tutorEmpresarial
    ) {}

    /** Notas por corte y nota final (reúsa el cálculo trazable de BI-10). */
    public record CalificacionResumen(
        BigDecimal notaCorte1,
        BigDecimal notaCorte2,
        BigDecimal notaCorte3,
        BigDecimal notaFinal,
        boolean completa,
        boolean bloqueada
    ) {}

    /** Consolidado de un trimestre con el estado de cada uno de sus documentos. */
    public record TrimestreExpediente(
        Long id,
        Short numero,
        String materiaNucleo,
        String estado,
        SeccionDocumento planActividades,
        SeccionActas actas,
        SeccionDocumento evaluacionDocente,
        SeccionDocumento evaluacionTutor,
        List<SeccionInformeFinal> informesFinales
    ) {}

    /** Estado derivado de un documento firmable individual (plan, evaluaciones). */
    public record SeccionDocumento(
        String nombre,
        EstadoSeccionExpediente estado,
        Long documentoPdfId,
        boolean firmadoEstudiante,
        boolean firmadoTutor,
        boolean firmadoProfesor
    ) {}

    /** Agregado de las actas de reunión del trimestre (conteo + firmadas). */
    public record SeccionActas(
        String nombre,
        EstadoSeccionExpediente estado,
        int total,
        int firmadas,
        List<ActaItem> items
    ) {
        /** Acta individual con su estado y PDF descargable. */
        public record ActaItem(
            Long id,
            Short numero,
            LocalDate fecha,
            String asunto,
            EstadoSeccionExpediente estado,
            Long documentoPdfId
        ) {}
    }

    /** Informe Final del Plan de Mejora con su estado y nota. */
    public record SeccionInformeFinal(
        Long id,
        Long planMejoraId,
        String titulo,
        String estado,
        EstadoSeccionExpediente estadoSeccion,
        BigDecimal notaPromedio,
        Long documentoPdfId
    ) {}

    /** PDF/documento de soporte descargable del estudiante. */
    public record DocumentoExpediente(
        Long id,
        String tipo,
        String nombreOriginal,
        String estado,
        OffsetDateTime fecha
    ) {}
}
