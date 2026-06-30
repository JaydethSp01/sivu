package co.uempresarial.sivu.calificacion.persistence;

import co.uempresarial.sivu.trimestre.domain.EvaluacionTutorTrimestre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

/**
 * Lectura de la nota ponderada de la Evaluación del Tutor (GAC-FM-9) de un convenio.
 * Solo lee; no modifica la entidad ni su lógica.
 */
public interface NotaEvaluacionTutorRepository extends JpaRepository<EvaluacionTutorTrimestre, Long> {

    /** Notas ponderadas del tutor presentes en el convenio, último trimestre primero. */
    @Query("""
        select e.notaPonderada
        from EvaluacionTutorTrimestre e
        where e.trimestre.convenio.id = :convenioId and e.notaPonderada is not null
        order by e.trimestre.numero desc
        """)
    List<BigDecimal> findNotasTutor(@Param("convenioId") Long convenioId);
}
