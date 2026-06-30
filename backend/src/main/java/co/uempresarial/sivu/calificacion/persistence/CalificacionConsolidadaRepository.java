package co.uempresarial.sivu.calificacion.persistence;

import co.uempresarial.sivu.calificacion.domain.CalificacionConsolidada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CalificacionConsolidadaRepository extends JpaRepository<CalificacionConsolidada, Long> {

    Optional<CalificacionConsolidada> findByConvenioId(Long convenioId);
}
