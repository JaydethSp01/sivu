package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.Trimestre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrimestreRepository extends JpaRepository<Trimestre, Long> {

    @EntityGraph(attributePaths = {"convenio", "convenio.estudiante", "convenio.empresa"})
    @Override
    Optional<Trimestre> findById(Long id);

    @EntityGraph(attributePaths = {"convenio"})
    List<Trimestre> findByConvenioIdOrderByNumeroAsc(Long convenioId);

    Optional<Trimestre> findByConvenioIdAndNumero(Long convenioId, Short numero);

    boolean existsByConvenioIdAndNumero(Long convenioId, Short numero);
}
