package co.uempresarial.sivu.tutoracceso.persistence;

import co.uempresarial.sivu.tutoracceso.domain.TokenAccesoTutor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenAccesoTutorRepository extends JpaRepository<TokenAccesoTutor, Long> {

    Optional<TokenAccesoTutor> findByTokenAndUsadoFalse(String token);

    Optional<TokenAccesoTutor> findByToken(String token);
}
