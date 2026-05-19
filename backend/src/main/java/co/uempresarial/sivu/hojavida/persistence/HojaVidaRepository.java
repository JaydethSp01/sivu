package co.uempresarial.sivu.hojavida.persistence;

import co.uempresarial.sivu.hojavida.domain.EstadoHojaVida;
import co.uempresarial.sivu.hojavida.domain.HojaVida;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HojaVidaRepository extends JpaRepository<HojaVida, Long> {

    /**
     * Solo carga el estudiante con EntityGraph. Las sub-colecciones de la HV
     * (habilidades, idiomas, educacion, experienciaFase, experienciaLaboral)
     * se cargan via {@code default_batch_fetch_size} configurado en
     * application.yml — un solo SELECT IN(?, ?, ?) cuando se accede.
     *
     * Esto evita {@code MultipleBagFetchException}: Hibernate no permite hacer
     * JOIN FETCH a más de una colección tipo List ("bag") en la misma query.
     */
    @EntityGraph(attributePaths = {"estudiante"})
    Optional<HojaVida> findByEstudianteId(Long estudianteId);

    boolean existsByEstudianteId(Long estudianteId);

    boolean existsByEstudianteIdAndEstado(Long estudianteId, EstadoHojaVida estado);

    @EntityGraph(attributePaths = {"estudiante"})
    List<HojaVida> findByEstadoOrderByEnviadaAtAsc(EstadoHojaVida estado);
}
