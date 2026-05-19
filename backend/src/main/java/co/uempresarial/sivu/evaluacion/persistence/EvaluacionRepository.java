package co.uempresarial.sivu.evaluacion.persistence;

import co.uempresarial.sivu.evaluacion.domain.Evaluacion;
import co.uempresarial.sivu.evaluacion.domain.TipoEvaluacion;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {

    List<Evaluacion> findByConvenioIdOrderByFechaEvaluacionAsc(Long convenioId);

    Optional<Evaluacion> findByConvenioIdAndTipoAndEvaluadorTipo(Long convenioId,
                                                                 TipoEvaluacion tipo,
                                                                 TipoTutor evaluadorTipo);
}
