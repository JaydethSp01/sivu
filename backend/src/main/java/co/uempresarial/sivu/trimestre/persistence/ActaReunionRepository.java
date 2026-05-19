package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.ActaReunion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActaReunionRepository extends JpaRepository<ActaReunion, Long> {

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "temas", "documentoPdf"
    })
    @Override
    Optional<ActaReunion> findById(Long id);

    @EntityGraph(attributePaths = {"temas"})
    List<ActaReunion> findByTrimestreIdOrderByNumeroAsc(Long trimestreId);

    boolean existsByTrimestreIdAndNumero(Long trimestreId, Short numero);

    long countByTrimestreId(Long trimestreId);
}
