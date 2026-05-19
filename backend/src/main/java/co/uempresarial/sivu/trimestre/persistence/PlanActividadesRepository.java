package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.PlanActividades;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlanActividadesRepository extends JpaRepository<PlanActividades, Long> {

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "objetivos", "meses", "documentoPdf"
    })
    @Override
    Optional<PlanActividades> findById(Long id);

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "objetivos", "meses", "documentoPdf"
    })
    Optional<PlanActividades> findByTrimestreId(Long trimestreId);
}
