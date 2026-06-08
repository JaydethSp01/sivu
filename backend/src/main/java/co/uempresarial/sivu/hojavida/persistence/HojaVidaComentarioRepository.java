package co.uempresarial.sivu.hojavida.persistence;

import co.uempresarial.sivu.hojavida.domain.HojaVidaComentario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HojaVidaComentarioRepository extends JpaRepository<HojaVidaComentario, Long> {
    List<HojaVidaComentario> findByHojaVidaIdOrderByCreatedAtAsc(Long hojaVidaId);
}
