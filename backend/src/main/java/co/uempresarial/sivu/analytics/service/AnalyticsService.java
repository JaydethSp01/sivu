package co.uempresarial.sivu.analytics.service;

import co.uempresarial.sivu.analytics.web.dto.AnalyticsDtos.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Analytics institucional — cierra gaps §6.1 (empleabilidad/continuidad) y
 * §6.5 (analítica) del doc para Coformación.
 *
 * Usa queries nativas SQL agregadas: este servicio sirve un dashboard, no
 * un transaccional, así que va directo contra la base sin pasar por JPA.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    @PersistenceContext
    private EntityManager em;

    public Resumen resumen() {
        long estActivos = scalarLong("SELECT COUNT(*) FROM estudiantes WHERE estado = 'ACTIVO'");
        long empActivas = scalarLong("SELECT COUNT(*) FROM empresas WHERE estado = 'ACTIVA'");
        long vacPub    = scalarLong("SELECT COUNT(*) FROM vacantes WHERE estado = 'PUBLICADA'");
        long convB     = scalarLong("SELECT COUNT(*) FROM convenios WHERE estado = 'BORRADOR'");
        long convA     = scalarLong("SELECT COUNT(*) FROM convenios WHERE estado = 'ACTIVO'");
        long convF     = scalarLong("SELECT COUNT(*) FROM convenios WHERE estado = 'FINALIZADO'");
        long hvAprob   = scalarLong("SELECT COUNT(*) FROM hoja_vida WHERE estado = 'APROBADA'");
        long hvRev     = scalarLong("SELECT COUNT(*) FROM hoja_vida WHERE estado = 'ENVIADA'");
        long postAbiertas = scalarLong("""
            SELECT COUNT(*) FROM postulaciones
            WHERE estado IN ('POSTULADA','EN_REVISION','ENTREVISTA_PROGRAMADA',
                             'ENTREVISTA_REALIZADA','PRESELECCIONADA')""");
        long entrevistas  = scalarLong("""
            SELECT COUNT(*) FROM entrevista
            WHERE fecha_programada >= NOW() AND resultado = 'PENDIENTE'""");
        long solicitudesPend = scalarLong(
            "SELECT COUNT(*) FROM solicitud_fabrica WHERE estado = 'PENDIENTE'");
        long alertasUrgente  = scalarLong("""
            SELECT COUNT(*) FROM respuesta_formulario
            WHERE fecha_limite IS NOT NULL
              AND fecha_limite <= CURRENT_DATE + INTERVAL '3 day'
              AND estado IN ('PENDIENTE','EN_PROGRESO')""");

        return new Resumen(estActivos, empActivas, vacPub, convB, convA, convF,
            hvAprob, hvRev, postAbiertas, entrevistas, solicitudesPend, alertasUrgente);
    }

    public EmbudoPostulaciones embudoPostulaciones() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
            SELECT estado, COUNT(*) FROM postulaciones GROUP BY estado ORDER BY estado
            """).getResultList();
        Map<String, Long> conteo = new LinkedHashMap<>();
        long total = 0;
        for (Object[] r : rows) {
            String estado = (String) r[0];
            long c = ((Number) r[1]).longValue();
            conteo.put(estado, c);
            total += c;
        }
        return new EmbudoPostulaciones(conteo, total);
    }

    public EmpleabilidadResumen empleabilidad() {
        // Una evaluación del tutor empresarial responde "continuidad sí/no" por convenio.
        // Agregamos por empresa para el ranking.
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
            SELECT em.id, em.razon_social,
                   COUNT(DISTINCT c.id) AS convenios,
                   COUNT(CASE WHEN et.continuidad_con_empresa = TRUE THEN 1 END) AS si,
                   COUNT(CASE WHEN et.continuidad_con_empresa = FALSE THEN 1 END) AS no_
            FROM empresas em
            JOIN convenios c ON c.empresa_id = em.id
            JOIN trimestre t ON t.convenio_id = c.id
            LEFT JOIN evaluacion_tutor_trimestre et ON et.trimestre_id = t.id
            WHERE et.continuidad_con_empresa IS NOT NULL
            GROUP BY em.id, em.razon_social
            ORDER BY si DESC, convenios DESC
            LIMIT 10
            """).getResultList();

        List<EmpleabilidadEmpresa> top = new ArrayList<>();
        long convTotal = 0, siTotal = 0, noTotal = 0;
        for (Object[] r : rows) {
            Long id = ((Number) r[0]).longValue();
            String rs = (String) r[1];
            long c = ((Number) r[2]).longValue();
            long si = ((Number) r[3]).longValue();
            long no = ((Number) r[4]).longValue();
            long denom = si + no;
            BigDecimal tasa = denom == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(si * 100.0 / denom).setScale(1, RoundingMode.HALF_UP);
            top.add(new EmpleabilidadEmpresa(id, rs, c, si, no, tasa));
            convTotal += c; siTotal += si; noTotal += no;
        }
        long denomG = siTotal + noTotal;
        BigDecimal tasaG = denomG == 0 ? BigDecimal.ZERO
            : BigDecimal.valueOf(siTotal * 100.0 / denomG).setScale(1, RoundingMode.HALF_UP);
        return new EmpleabilidadResumen(convTotal, siTotal, noTotal, tasaG, top);
    }

    public List<EstudianteEnRiesgo> estudiantesEnRiesgo() {
        // En riesgo = estudiante ACTIVO con HV sin aprobar y sin postulación activa,
        // y al menos una cohorte ya iniciada. Cubre el caso "se les pasa la fecha
        // y siguen sin moverse".
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
            SELECT e.id,
                   TRIM(COALESCE(e.nombres,'') || ' ' || COALESCE(e.apellidos,'')) AS nombre,
                   e.email,
                   e.programa_academico,
                   CASE
                     WHEN hv.id IS NULL THEN 'Sin Hoja de Vida creada'
                     WHEN hv.estado <> 'APROBADA' THEN 'HV en estado ' || hv.estado
                     ELSE 'Sin postulación activa'
                   END AS motivo
            FROM estudiantes e
            LEFT JOIN hoja_vida hv ON hv.estudiante_id = e.id
            LEFT JOIN (
                SELECT estudiante_id, COUNT(*) AS act
                FROM postulaciones
                WHERE estado IN ('POSTULADA','EN_REVISION','ENTREVISTA_PROGRAMADA',
                                 'ENTREVISTA_REALIZADA','PRESELECCIONADA','ACEPTADA')
                GROUP BY estudiante_id
            ) p ON p.estudiante_id = e.id
            LEFT JOIN cohorte_estudiante ce ON ce.estudiante_id = e.id
            LEFT JOIN cohorte co ON co.id = ce.cohorte_id
                AND co.fecha_apertura IS NOT NULL
                AND co.fecha_apertura <= CURRENT_DATE
            WHERE e.estado = 'ACTIVO'
              AND (hv.id IS NULL OR hv.estado <> 'APROBADA' OR COALESCE(p.act,0) = 0)
              AND co.id IS NOT NULL
            ORDER BY e.id
            LIMIT 50
            """).getResultList();

        List<EstudianteEnRiesgo> result = new ArrayList<>();
        for (Object[] r : rows) {
            result.add(new EstudianteEnRiesgo(
                ((Number) r[0]).longValue(),
                (String) r[1],
                (String) r[2],
                (String) r[3],
                (String) r[4]));
        }
        return result;
    }

    private long scalarLong(String sql) {
        Object v = em.createNativeQuery(sql).getSingleResult();
        return v == null ? 0L : ((Number) v).longValue();
    }
}
