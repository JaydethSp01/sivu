package co.uempresarial.sivu.catalogo.requisito.persistence;

import co.uempresarial.sivu.catalogo.requisito.domain.RequisitoModalidad;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RequisitoModalidadRepository extends JpaRepository<RequisitoModalidad, Long> {

    @EntityGraph(attributePaths = {"modalidad", "tipoRequisito"})
    List<RequisitoModalidad> findByModalidadIdOrderByOrdenAsc(Long modalidadId);

    Optional<RequisitoModalidad> findByModalidadIdAndTipoRequisitoId(Long modalidadId, Long tipoRequisitoId);

    boolean existsByModalidadIdAndTipoRequisitoId(Long modalidadId, Long tipoRequisitoId);

    boolean existsByTipoRequisitoId(Long tipoRequisitoId);

    void deleteByModalidadIdAndTipoRequisitoId(Long modalidadId, Long tipoRequisitoId);
}
