package co.uempresarial.sivu.informefinalpm.persistence;

import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InformeFinalPmRepository extends JpaRepository<InformeFinalPm, Long> {

    @EntityGraph(attributePaths = {"planMejora", "planMejora.trimestre", "planMejora.trimestre.convenio",
        "planMejora.trimestre.convenio.estudiante", "planMejora.trimestre.convenio.empresa"})
    Optional<InformeFinalPm> findByPlanMejoraId(Long planMejoraId);

    @EntityGraph(attributePaths = {"planMejora", "planMejora.trimestre", "planMejora.trimestre.convenio",
        "planMejora.trimestre.convenio.estudiante", "planMejora.trimestre.convenio.empresa"})
    @Override
    Optional<InformeFinalPm> findById(Long id);

    boolean existsByPlanMejoraId(Long planMejoraId);
}
