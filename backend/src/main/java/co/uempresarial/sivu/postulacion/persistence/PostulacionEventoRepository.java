package co.uempresarial.sivu.postulacion.persistence;

import co.uempresarial.sivu.postulacion.domain.PostulacionEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostulacionEventoRepository extends JpaRepository<PostulacionEvento, Long> {
    List<PostulacionEvento> findByPostulacionIdOrderByOcurridoEnAsc(Long postulacionId);
}
