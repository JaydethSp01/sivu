package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.PlanActividadesComentario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanActividadesComentarioRepository
    extends JpaRepository<PlanActividadesComentario, Long> {

    List<PlanActividadesComentario> findByPlanActividadesIdOrderByCreatedAtAsc(Long planActividadesId);
}
