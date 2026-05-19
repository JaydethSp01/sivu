package co.uempresarial.sivu.vacante.persistence;

import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Vacante;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VacanteRepository extends JpaRepository<Vacante, Long> {

    @Query("""
        SELECT v FROM Vacante v
        WHERE (:q IS NULL OR :q = '' OR LOWER(v.titulo) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:estado IS NULL OR v.estado = :estado)
          AND (:empresaId IS NULL OR v.empresa.id = :empresaId)
        """)
    Page<Vacante> buscar(@Param("q") String q,
                         @Param("estado") EstadoVacante estado,
                         @Param("empresaId") Long empresaId,
                         Pageable pageable);

    List<Vacante> findByEstado(EstadoVacante estado);

    /**
     * Verifica si alguna vacante usa la modalidad de vinculación indicada.
     * Importante: el property path es {@code modalidadVinculacion.id}, NO
     * {@code modalidad.id}, porque {@code modalidad} es el enum Presencial/Híbrido/Remoto.
     */
    boolean existsByModalidadVinculacionId(Long modalidadVinculacionId);
}
