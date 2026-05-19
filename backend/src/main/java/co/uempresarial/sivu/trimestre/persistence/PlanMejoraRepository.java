package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.PlanMejora;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanMejoraRepository extends JpaRepository<PlanMejora, Long> {

    List<PlanMejora> findByTrimestreIdOrderByNumeroAsc(Long trimestreId);

    boolean existsByTrimestreIdAndNumero(Long trimestreId, Short numero);

    long countByTrimestreId(Long trimestreId);
}
