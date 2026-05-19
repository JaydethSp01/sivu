package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.automatizacion.pdf.CertificadoPdfGenerator;
import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
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
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CertificadoService {

    private final ConvenioRepository convenioRepository;
    private final DocumentoRepository documentoRepository;
    private final CertificadoPdfGenerator pdfGenerator;
    private final NotificacionService notificacionService;

    @Value("${app.storage.path:./storage/documentos}")
    private String storagePath;

    public Convenio generar(Long convenioId) {
        Convenio convenio = convenioRepository.findById(convenioId)
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", convenioId));
        if (convenio.getEstado() != EstadoConvenio.FINALIZADO) {
            throw new BusinessException("Solo se puede emitir certificado de convenios FINALIZADOS "
                + "(actual: " + convenio.getEstado() + ")");
        }
        if (convenio.getCalificacionFinal() == null) {
            throw new BusinessException("El convenio no tiene calificación final asignada");
        }

        byte[] pdf = pdfGenerator.generar(convenio);
        String nombre = "CERTIFICADO-" + convenio.getNumeroConvenio() + ".pdf";
        Path archivo = guardarArchivo(nombre, pdf);

        Documento doc = Documento.builder()
            .estudiante(convenio.getEstudiante())
            .postulacion(convenio.getPostulacion())
            .tipo(TipoDocumentoSoporte.CERTIFICADO)
            .nombreOriginal(nombre)
            .rutaAlmacenamiento(archivo.toString())
            .mimeType("application/pdf")
            .tamanoBytes((long) pdf.length)
            .estado(EstadoDocumento.VALIDADO)
            .fechaValidacion(OffsetDateTime.now())
            .build();
        doc = documentoRepository.save(doc);

        convenio.setCertificadoPdf(doc);
        convenio = convenioRepository.save(convenio);

        notificacionService.enviarCertificadoEmitido(
            convenio.getEstudiante().getEmail(),
            convenio.getEstudiante().getNombres(),
            convenio.getNumeroConvenio(),
            convenio.getCalificacionFinal().toPlainString());

        log.info("Certificado emitido para convenio {}", convenio.getNumeroConvenio());
        return convenio;
    }

    public byte[] descargar(Long convenioId) {
        Convenio convenio = convenioRepository.findById(convenioId)
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", convenioId));
        if (convenio.getCertificadoPdf() == null) {
            throw new BusinessException("El convenio aún no tiene certificado emitido");
        }
        try {
            return Files.readAllBytes(Path.of(convenio.getCertificadoPdf().getRutaAlmacenamiento()));
        } catch (IOException ex) {
            log.warn("No se pudo leer el certificado del convenio {}, regenerando al vuelo", convenioId);
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
