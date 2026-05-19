package co.uempresarial.sivu.cohorte.persistence;

import co.uempresarial.sivu.cohorte.domain.Cohorte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CohorteRepository extends JpaRepository<Cohorte, Long> {

    Optional<Cohorte> findBySemestreAcademico(String semestreAcademico);

    boolean existsBySemestreAcademico(String semestreAcademico);

    List<Cohorte> findByActivaTrueOrderByFechaAperturaDesc();
}
