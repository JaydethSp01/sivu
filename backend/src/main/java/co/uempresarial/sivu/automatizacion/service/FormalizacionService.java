package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.automatizacion.pdf.FormalizacionPdfGenerator;
import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FormalizacionService {

    private final PostulacionRepository postulacionRepository;
    private final ConvenioRepository convenioRepository;
    private final DocumentoRepository documentoRepository;
    private final FormalizacionPdfGenerator pdfGenerator;
    private final NotificacionService notificacionService;

    @Value("${app.storage.path:./storage/documentos}")
    private String storagePath;

    public Convenio formalizar(Long postulacionId) {
        Postulacion postulacion = postulacionRepository.findById(postulacionId)
            .orElseThrow(() -> new ResourceNotFoundException("Postulación", postulacionId));

        if (postulacion.getEstado() != EstadoPostulacion.ACEPTADA) {
            throw new BusinessException("Solo se pueden formalizar postulaciones en estado ACEPTADA "
                + "(actual: " + postulacion.getEstado() + ")");
        }
        convenioRepository.findByPostulacionId(postulacionId).ifPresent(c -> {
            throw new BusinessException("La postulación ya tiene convenio asociado: " + c.getNumeroConvenio());
        });

        String numero = "CONV-" + LocalDate.now().getYear() + "-"
            + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Convenio convenio = Convenio.builder()
            .postulacion(postulacion)
            .estudiante(postulacion.getEstudiante())
            .empresa(postulacion.getVacante().getEmpresa())
            .vacante(postulacion.getVacante())
            .numeroConvenio(numero)
            .fechaInicio(postulacion.getVacante().getFechaInicio())
            .fechaFin(postulacion.getVacante().getFechaInicio()
                .plusMonths(postulacion.getVacante().getDuracionMeses()))
            .estado(EstadoConvenio.BORRADOR)
            .build();

        convenio = convenioRepository.save(convenio);

        byte[] pdf = pdfGenerator.generar(convenio);
        Path archivo = guardarArchivo(numero + ".pdf", pdf);

        Documento doc = Documento.builder()
            .estudiante(postulacion.getEstudiante())
            .postulacion(postulacion)
            .tipo(TipoDocumentoSoporte.FORMALIZACION)
            .nombreOriginal(numero + ".pdf")
            .rutaAlmacenamiento(archivo.toString())
            .mimeType("application/pdf")
            .tamanoBytes((long) pdf.length)
            .estado(EstadoDocumento.VALIDADO)
            .fechaValidacion(OffsetDateTime.now())
            .build();
        doc = documentoRepository.save(doc);

        convenio.setDocumentoPdf(doc);
        convenio = convenioRepository.save(convenio);

        notificacionService.enviarFormalizacion(
            postulacion.getEstudiante().getEmail(),
            postulacion.getEstudiante().getNombres(),
            numero,
            postulacion.getVacante().getEmpresa().getRazonSocial());

        log.info("Formalización completada para postulación {} -> convenio {}", postulacionId, numero);
        return convenio;
    }

    public byte[] descargarPdf(Long convenioId) {
        Convenio convenio = convenioRepository.findById(convenioId)
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", convenioId));
        if (convenio.getDocumentoPdf() == null) {
            // Genera al vuelo si por algún motivo no existe
            return pdfGenerator.generar(convenio);
        }
        try {
            return Files.readAllBytes(Path.of(convenio.getDocumentoPdf().getRutaAlmacenamiento()));
        } catch (IOException ex) {
            log.warn("No se pudo leer PDF del convenio {}, regenerando al vuelo", convenioId);
            return pdfGenerator.generar(convenio);
        }
    }

    private Path guardarArchivo(String nombre, byte[] contenido) {
        try {
            Path dir = Paths.get(storagePath);
            Files.createDirectories(dir);
            Path archivo = dir.resolve(nombre);
            Files.write(archivo, contenido);
            return archivo;
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo guardar el archivo: " + ex.getMessage(), ex);
        }
    }
}
