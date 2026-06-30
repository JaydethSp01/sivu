package co.uempresarial.sivu.calificacion.persistence;

import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

/**
 * Lectura de la nota promedio del Informe Final del Plan de Mejora (GTC-FM-16) de un convenio.
 * Solo lee; no modifica la entidad ni su lógica.
 */
public interface NotaInformeFinalRepository extends JpaRepository<InformeFinalPm, Long> {

    /** Notas promedio de informe final presentes en el convenio, último trimestre primero. */
    @Query("""
        select i.notaPromedio
        from InformeFinalPm i
        where i.planMejora.trimestre.convenio.id = :convenioId and i.notaPromedio is not null
        order by i.planMejora.trimestre.numero desc
        """)
    List<BigDecimal> findNotasPromedio(@Param("convenioId") Long convenioId);
}
