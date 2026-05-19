package co.uempresarial.sivu.hojavida.persistence;

import co.uempresarial.sivu.hojavida.domain.HojaVida;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HojaVidaRepository extends JpaRepository<HojaVida, Long> {

    @EntityGraph(attributePaths = {
        "estudiante", "habilidades", "idiomas", "educacion",
        "experienciaFase", "experienciaLaboral"
    })
    Optional<HojaVida> findByEstudianteId(Long estudianteId);

    boolean existsByEstudianteId(Long estudianteId);
}
