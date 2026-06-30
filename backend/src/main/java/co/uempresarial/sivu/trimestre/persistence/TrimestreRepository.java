package co.uempresarial.sivu.trimestre.persistence;

import co.uempresarial.sivu.trimestre.domain.Trimestre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TrimestreRepository extends JpaRepository<Trimestre, Long> {

    @EntityGraph(attributePaths = {"convenio", "convenio.estudiante", "convenio.empresa"})
    @Override
    Optional<Trimestre> findById(Long id);

    /** GAP 2 (RF-D01 #5): trimestres con cierre próximo aún sin recordatorio enviado. */
    @EntityGraph(attributePaths = {"convenio", "convenio.estudiante"})
    List<Trimestre> findByRecordatorioCierreEnviadoFalseAndFechaCierreBetween(LocalDate desde, LocalDate hasta);

    @EntityGraph(attributePaths = {"convenio"})
    List<Trimestre> findByConvenioIdOrderByNumeroAsc(Long convenioId);

    Optional<Trimestre> findByConvenioIdAndNumero(Long convenioId, Short numero);

    boolean existsByConvenioIdAndNumero(Long convenioId, Short numero);
}
