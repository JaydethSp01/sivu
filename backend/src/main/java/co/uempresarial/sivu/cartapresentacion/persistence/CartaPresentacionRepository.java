package co.uempresarial.sivu.cartapresentacion.persistence;

import co.uempresarial.sivu.cartapresentacion.domain.CartaPresentacion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartaPresentacionRepository extends JpaRepository<CartaPresentacion, Long> {

    @EntityGraph(attributePaths = {
        "postulacion", "postulacion.estudiante", "postulacion.vacante",
        "postulacion.vacante.empresa"
    })
    Optional<CartaPresentacion> findByPostulacionId(Long postulacionId);

    boolean existsByPostulacionId(Long postulacionId);
}
