package co.uempresarial.sivu.solicitudfabrica.persistence;

import co.uempresarial.sivu.solicitudfabrica.domain.EstadoSolicitudFabrica;
import co.uempresarial.sivu.solicitudfabrica.domain.SolicitudFabrica;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SolicitudFabricaRepository extends JpaRepository<SolicitudFabrica, Long> {

    @EntityGraph(attributePaths = {"estudiante"})
    List<SolicitudFabrica> findByEstadoOrderByFechaSolicitudAsc(EstadoSolicitudFabrica estado);

    @EntityGraph(attributePaths = {"estudiante"})
    List<SolicitudFabrica> findByEstudianteIdOrderByFechaSolicitudDesc(Long estudianteId);

    Optional<SolicitudFabrica> findFirstByEstudianteIdAndEstado(
        Long estudianteId, EstadoSolicitudFabrica estado);

    @EntityGraph(attributePaths = {"estudiante"})
    List<SolicitudFabrica> findByEstadoInOrderByFechaSolicitudAsc(List<EstadoSolicitudFabrica> estados);

    boolean existsByEstudianteIdAndEstado(Long estudianteId, EstadoSolicitudFabrica estado);
}
