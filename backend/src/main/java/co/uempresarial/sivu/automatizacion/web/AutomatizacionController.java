package co.uempresarial.sivu.automatizacion.web;

import co.uempresarial.sivu.automatizacion.service.CertificadoService;
import co.uempresarial.sivu.automatizacion.service.FormalizacionService;
import co.uempresarial.sivu.automatizacion.service.MatchingService;
import co.uempresarial.sivu.automatizacion.service.MockUniversidadApiService;
import co.uempresarial.sivu.automatizacion.service.ValidacionAcademicaService;
import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/automatizacion")
@RequiredArgsConstructor
@Tag(name = "Automatización", description = "Endpoints que ejecutan las funciones automatizadas del flujo de vinculación (matching, validación, formalización)")
public class AutomatizacionController {

    private final MatchingService matchingService;
    private final ValidacionAcademicaService validacionService;
    private final FormalizacionService formalizacionService;
    private final CertificadoService certificadoService;
    private final EstudianteRepository estudianteRepository;
    private final VacanteRepository vacanteRepository;

    @GetMapping("/info")
    @Operation(summary = "Descripción del algoritmo de matching y parámetros de verificación académica")
    public ResponseEntity<Map<String, Object>> info() {
        return ResponseEntity.ok(Map.of(
            "matching", matchingService.describirAlgoritmo(),
            "verificacionAcademica", "Mock API Universidad: créditos y promedio mínimos parametrizables"));
    }

    @GetMapping("/matching")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','EMPRESA','ESTUDIANTE','MCP_AGENT')")
    @Operation(summary = "Calcular score de matching entre un estudiante y una vacante (sin crear postulación)")
    // @Transactional: el matching accede vacante.empresa (LAZY) en la rama de
    // continuidad; con open-in-view=false hay que mantener la sesión abierta
    // durante fetch + cálculo, si no lanza LazyInitializationException (→ 0% en el dashboard).
    @Transactional(readOnly = true)
    public ResponseEntity<MatchingResponse> matching(@RequestParam Long estudianteId, @RequestParam Long vacanteId) {
        var estudiante = estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));
        var vacante = vacanteRepository.findById(vacanteId)
            .orElseThrow(() -> new ResourceNotFoundException("Vacante", vacanteId));
        var r = matchingService.calcular(estudiante, vacante);
        return ResponseEntity.ok(new MatchingResponse(
            estudianteId, vacanteId, r.score(), r.recomendado(), r.justificacion(), r.desglose()));
    }

    @GetMapping("/validar-academico/{estudianteId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR','ESTUDIANTE','MCP_AGENT')")
    @Operation(summary = "Verificar automáticamente las condiciones académicas del estudiante (mock API universidad)")
    public ResponseEntity<MockUniversidadApiService.VerificacionAcademica> validarAcademico(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(validacionService.verificar(estudianteId));
    }

    @PostMapping("/formalizar/{postulacionId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Genera el convenio y PDF de formalización para una postulación ACEPTADA")
    public ResponseEntity<Map<String, Object>> formalizar(@PathVariable Long postulacionId) {
        Convenio c = formalizacionService.formalizar(postulacionId);
        return ResponseEntity.ok(Map.of(
            "convenioId", c.getId(),
            "numeroConvenio", c.getNumeroConvenio(),
            "estado", c.getEstado().name(),
            "documentoPdfId", c.getDocumentoPdf() != null ? c.getDocumentoPdf().getId() : null));
    }

    @GetMapping("/convenios/{convenioId}/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar el PDF de formalización del convenio")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long convenioId) {
        byte[] pdf = formalizacionService.descargarPdf(convenioId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=convenio-" + convenioId + ".pdf")
            .body(pdf);
    }

    @PostMapping("/certificado/{convenioId}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Emitir certificado de práctica para un convenio FINALIZADO con calificación")
    public ResponseEntity<Map<String, Object>> emitirCertificado(@PathVariable Long convenioId) {
        Convenio c = certificadoService.generar(convenioId);
        return ResponseEntity.ok(Map.of(
            "convenioId", c.getId(),
            "numeroConvenio", c.getNumeroConvenio(),
            "calificacionFinal", c.getCalificacionFinal(),
            "certificadoPdfId", c.getCertificadoPdf() != null ? c.getCertificadoPdf().getId() : null));
    }

    @GetMapping("/convenios/{convenioId}/certificado")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Descargar el certificado de práctica de un convenio finalizado")
    public ResponseEntity<byte[]> descargarCertificado(@PathVariable Long convenioId) {
        byte[] pdf = certificadoService.descargar(convenioId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=certificado-" + convenioId + ".pdf")
            .body(pdf);
    }

    public record MatchingResponse(
        Long estudianteId,
        Long vacanteId,
        java.math.BigDecimal score,
        boolean recomendado,
        String justificacion,
        List<co.uempresarial.sivu.automatizacion.service.MatchingService.DesgloseCriterio> desglose
    ) {}
}
