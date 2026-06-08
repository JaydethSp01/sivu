package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.PlanActividades;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlanActividadesRepository extends JpaRepository<PlanActividades, Long> {

    // No incluir 'objetivos' + 'meses' (dos List) en el mismo EntityGraph:
    // Hibernate no puede hacer fetch-join de dos bags a la vez
    // (MultipleBagFetchException). Se cargan LAZY con default_batch_fetch_size.
    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "documentoPdf"
    })
    @Override
    Optional<PlanActividades> findById(Long id);

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "documentoPdf"
    })
    Optional<PlanActividades> findByTrimestreId(Long trimestreId);
}
