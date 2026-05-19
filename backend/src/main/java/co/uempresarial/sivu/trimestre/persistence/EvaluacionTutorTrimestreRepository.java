package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.EvaluacionTutorTrimestre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EvaluacionTutorTrimestreRepository extends JpaRepository<EvaluacionTutorTrimestre, Long> {

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "documentoPdf"
    })
    @Override
    Optional<EvaluacionTutorTrimestre> findById(Long id);

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "documentoPdf"
    })
    Optional<EvaluacionTutorTrimestre> findByTrimestreId(Long trimestreId);
}
