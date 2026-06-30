package co.uempresarial.sivu.calificacion.persistence;

import co.uempresarial.sivu.trimestre.domain.EvaluacionProfesorTrimestre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

/**
 * Lectura de las notas ponderadas de la Evaluación Docente (GAC-FM-1) de un convenio.
 * Solo lee; no modifica la entidad ni su lógica.
 */
public interface NotaEvaluacionProfesorRepository extends JpaRepository<EvaluacionProfesorTrimestre, Long> {

    /** Notas ponderadas del corte 1 (campo sin sufijo) presentes en el convenio, último trimestre primero. */
    @Query("""
        select e.notaPonderada
        from EvaluacionProfesorTrimestre e
        where e.trimestre.convenio.id = :convenioId and e.notaPonderada is not null
        order by e.trimestre.numero desc
        """)
    List<BigDecimal> findNotasCorte1(@Param("convenioId") Long convenioId);

    /** Notas ponderadas del corte 2 (campo _c2) presentes en el convenio, último trimestre primero. */
    @Query("""
        select e.notaPonderadaC2
        from EvaluacionProfesorTrimestre e
        where e.trimestre.convenio.id = :convenioId and e.notaPonderadaC2 is not null
        order by e.trimestre.numero desc
        """)
    List<BigDecimal> findNotasCorte2(@Param("convenioId") Long convenioId);
}
