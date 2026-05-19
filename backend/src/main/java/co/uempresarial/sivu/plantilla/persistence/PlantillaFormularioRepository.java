package co.uempresarial.sivu.plantilla.persistence;

import co.uempresarial.sivu.plantilla.domain.PlantillaFormulario;
import co.uempresarial.sivu.plantilla.domain.TipoPlantilla;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlantillaFormularioRepository extends JpaRepository<PlantillaFormulario, Long> {

    List<PlantillaFormulario> findAllByOrderByTipoAscFechaVigenciaDesc();

    List<PlantillaFormulario> findByTipoOrderByFechaVigenciaDesc(TipoPlantilla tipo);

    Optional<PlantillaFormulario> findByTipoAndVigenteTrue(TipoPlantilla tipo);

    @EntityGraph(attributePaths = {"secciones"})
    Optional<PlantillaFormulario> findWithSeccionesById(Long id);
}
