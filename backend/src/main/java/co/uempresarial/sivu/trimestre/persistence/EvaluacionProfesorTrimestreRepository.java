package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.EvaluacionProfesorTrimestre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EvaluacionProfesorTrimestreRepository extends JpaRepository<EvaluacionProfesorTrimestre, Long> {

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "documentoPdf"
    })
    @Override
    Optional<EvaluacionProfesorTrimestre> findById(Long id);

    @EntityGraph(attributePaths = {
        "trimestre", "trimestre.convenio", "trimestre.convenio.estudiante",
        "trimestre.convenio.empresa", "documentoPdf"
    })
    Optional<EvaluacionProfesorTrimestre> findByTrimestreId(Long trimestreId);
}
