package co.uempresarial.sivu.entrevista.persistence;

import co.uempresarial.sivu.entrevista.domain.Entrevista;
import co.uempresarial.sivu.entrevista.domain.ResultadoEntrevista;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EntrevistaRepository extends JpaRepository<Entrevista, Long> {

    @EntityGraph(attributePaths = {"postulacion", "postulacion.estudiante", "postulacion.vacante", "postulacion.vacante.empresa"})
    List<Entrevista> findByPostulacionIdOrderByFechaProgramadaDesc(Long postulacionId);

    @EntityGraph(attributePaths = {"postulacion", "postulacion.estudiante", "postulacion.vacante", "postulacion.vacante.empresa"})
    List<Entrevista> findByPostulacionEstudianteIdOrderByFechaProgramadaDesc(Long estudianteId);

    @EntityGraph(attributePaths = {"postulacion", "postulacion.estudiante", "postulacion.vacante", "postulacion.vacante.empresa"})
    List<Entrevista> findByPostulacionVacanteEmpresaIdOrderByFechaProgramadaDesc(Long empresaId);

    @EntityGraph(attributePaths = {"postulacion", "postulacion.estudiante", "postulacion.vacante", "postulacion.vacante.empresa"})
    List<Entrevista> findByResultadoOrderByFechaProgramadaDesc(ResultadoEntrevista resultado);

    @EntityGraph(attributePaths = {"postulacion", "postulacion.estudiante", "postulacion.vacante", "postulacion.vacante.empresa"})
    Optional<Entrevista> findWithRelationsById(Long id);
}
