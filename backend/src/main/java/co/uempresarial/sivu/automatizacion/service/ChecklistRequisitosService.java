package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;
import co.uempresarial.sivu.catalogo.requisito.domain.RequisitoModalidad;
import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import co.uempresarial.sivu.catalogo.requisito.persistence.RequisitoModalidadRepository;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Calcula el checklist de documentos requeridos para una vacante específica, cruzando
 * la modalidad de la vacante con los documentos que el estudiante ya tiene cargados y
 * validados.
 *
 * Es el servicio central del módulo de "requisitos configurables": el frontend lo
 * consume al mostrar una vacante para que el estudiante sepa exactamente qué le falta
 * antes de postular.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ChecklistRequisitosService {

    private final VacanteRepository vacanteRepository;
    private final RequisitoModalidadRepository requisitoModalidadRepository;
    private final DocumentoRepository documentoRepository;

    /**
     * Item del checklist visible al usuario.
     */
    public record ItemChecklist(
        Long tipoRequisitoId,
        String tipoCodigo,
        String tipoNombre,
        String descripcion,
        AplicaA aplicaA,
        boolean obligatorio,
        int orden,
        String instrucciones,
        boolean cargado,
        EstadoDocumento estadoDocumento,
        Long documentoId,
        String observacionValidacion
    ) {}

    /**
     * Resumen agregado del checklist (cuántos requeridos, cuántos OK, etc.).
     */
    public record ResumenChecklist(
        Long vacanteId,
        Long modalidadId,
        String modalidadCodigo,
        String modalidadNombre,
        int totalRequisitos,
        int totalObligatorios,
        int obligatoriosCumplidos,
        int totalOpcionales,
        int opcionalesCumplidos,
        boolean puedePostular,
        List<ItemChecklist> items
    ) {}

    /**
     * Construye el checklist para que un estudiante visualice qué requisitos cumple
     * (y cuáles le faltan) para una vacante específica.
     *
     * @param vacanteId    id de la vacante (debe existir y tener modalidad asignada)
     * @param estudianteId id del estudiante que evaluará el cumplimiento; si es null,
     *                     devuelve el checklist sin marcar nada como cargado.
     */
    public ResumenChecklist checklistParaVacante(Long vacanteId, Long estudianteId) {
        Vacante vacante = vacanteRepository.findById(vacanteId)
            .orElseThrow(() -> new ResourceNotFoundException("Vacante", vacanteId));

        ModalidadVinculacion modalidad = vacante.getModalidadVinculacion();
        if (modalidad == null) {
            throw new BusinessException(
                "La vacante " + vacanteId + " no tiene modalidad de vinculación asignada. "
                    + "Asígnala antes de mostrar el checklist.");
        }

        List<RequisitoModalidad> requisitos =
            requisitoModalidadRepository.findByModalidadIdOrderByOrdenAsc(modalidad.getId());

        if (requisitos.isEmpty()) {
            log.warn("Modalidad {} ({}) no tiene requisitos configurados",
                modalidad.getId(), modalidad.getCodigo());
        }

        // Indexar documentos VALIDADOS del estudiante por tipoRequisitoId.
        // Aceptamos VALIDADO o RECIBIDO (RECIBIDO == cargado pero pendiente revisión).
        Map<Long, Documento> docsPorTipo = estudianteId == null
            ? Map.of()
            : documentoRepository.findByEstudianteIdOrderByCreatedAtDesc(estudianteId).stream()
                .filter(d -> d.getTipoRequisito() != null)
                .filter(d -> d.getEstado() != EstadoDocumento.RECHAZADO)
                .collect(Collectors.toMap(
                    d -> d.getTipoRequisito().getId(),
                    d -> d,
                    (a, b) -> a.getCreatedAt().isAfter(b.getCreatedAt()) ? a : b));

        List<ItemChecklist> items = new ArrayList<>();
        for (RequisitoModalidad rm : requisitos) {
            TipoRequisitoDocumental t = rm.getTipoRequisito();
            Documento doc = docsPorTipo.get(t.getId());
            items.add(new ItemChecklist(
                t.getId(),
                t.getCodigo(),
                t.getNombre(),
                t.getDescripcion(),
                t.getAplicaA(),
                Boolean.TRUE.equals(rm.getObligatorio()),
                rm.getOrden() == null ? 0 : rm.getOrden(),
                rm.getInstrucciones(),
                doc != null,
                doc != null ? doc.getEstado() : null,
                doc != null ? doc.getId() : null,
                doc != null ? doc.getObservacionesValidacion() : null
            ));
        }
        items.sort(Comparator.comparingInt(ItemChecklist::orden));

        int totalObligatorios = (int) items.stream().filter(ItemChecklist::obligatorio).count();
        int obligatoriosCumplidos = (int) items.stream()
            .filter(ItemChecklist::obligatorio)
            .filter(i -> i.cargado() && i.estadoDocumento() == EstadoDocumento.VALIDADO)
            .count();
        int totalOpcionales = items.size() - totalObligatorios;
        int opcionalesCumplidos = (int) items.stream()
            .filter(i -> !i.obligatorio())
            .filter(i -> i.cargado() && i.estadoDocumento() == EstadoDocumento.VALIDADO)
            .count();

        boolean puedePostular = totalObligatorios == 0
            || obligatoriosCumplidos == totalObligatorios;

        return new ResumenChecklist(
            vacanteId,
            modalidad.getId(),
            modalidad.getCodigo(),
            modalidad.getNombre(),
            items.size(),
            totalObligatorios,
            obligatoriosCumplidos,
            totalOpcionales,
            opcionalesCumplidos,
            puedePostular,
            items);
    }

    /**
     * Verifica si el estudiante cumple los requisitos OBLIGATORIOS de la modalidad de
     * la vacante. Usado por PostulacionService antes de crear una postulación, para
     * fail-fast con mensaje claro.
     */
    public Optional<String> faltanRequisitosObligatorios(Long vacanteId, Long estudianteId) {
        ResumenChecklist r = checklistParaVacante(vacanteId, estudianteId);
        if (r.puedePostular()) return Optional.empty();
        String faltantes = r.items().stream()
            .filter(ItemChecklist::obligatorio)
            .filter(i -> !i.cargado() || i.estadoDocumento() != EstadoDocumento.VALIDADO)
            .map(i -> "• " + i.tipoNombre()
                + (i.cargado() ? " (estado: " + i.estadoDocumento() + ")" : " (no cargado)"))
            .collect(Collectors.joining("\n"));
        return Optional.of(
            "Te faltan documentos obligatorios para postular a esta vacante:\n" + faltantes);
    }
}
