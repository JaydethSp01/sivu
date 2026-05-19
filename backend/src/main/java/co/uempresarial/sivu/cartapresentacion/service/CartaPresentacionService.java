package co.uempresarial.sivu.cartapresentacion.service;

import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.cartapresentacion.domain.CartaPresentacion;
import co.uempresarial.sivu.cartapresentacion.pdf.CartaPresentacionPdfGenerator;
import co.uempresarial.sivu.cartapresentacion.persistence.CartaPresentacionRepository;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class CartaPresentacionService {

    private final CartaPresentacionRepository repository;
    private final PostulacionRepository postulacionRepository;
    private final CartaPresentacionPdfGenerator pdfGenerator;
    private final NotificacionService notificacionService;
    private final CurrentUserService currentUser;

    /**
     * Genera (o regenera) la carta institucional de presentación cuando la
     * postulación es aceptada. Se llama automáticamente desde el flujo de
     * aceptación, pero también se puede invocar a demanda.
     */
    public CartaPresentacion generarParaPostulacion(Long postulacionId, String contenidoExtra) {
        Postulacion p = postulacionRepository.findById(postulacionId)
            .orElseThrow(() -> new ResourceNotFoundException("Postulación", postulacionId));

        CartaPresentacion cartaNueva = repository.findByPostulacionId(postulacionId)
            .orElseGet(() -> CartaPresentacion.builder().postulacion(p).build());

        cartaNueva.setContenidoExtra(contenidoExtra);
        cartaNueva.setGeneradaAt(OffsetDateTime.now());
        currentUser.current().ifPresent(u -> {
            cartaNueva.setFirmadaPorCoordMongoId(u.getId());
            cartaNueva.setFirmadaPorCoordNombre(u.getNombres() + " " + u.getApellidos());
        });

        CartaPresentacion carta = repository.save(cartaNueva);

        notificacionService.enviarTexto(
            p.getEstudiante().getEmail(),
            "[SIVU] Tu Carta de Presentación está lista",
            "Hola " + p.getEstudiante().getNombres()
                + ",\n\nLa Oficina de Coformación generó tu Carta de Presentación para "
                + p.getVacante().getEmpresa().getRazonSocial()
                + ". Descárgala desde el portal y entrégala a tu empresa.\n\nEquipo SIVU");

        return carta;
    }

    @Transactional(readOnly = true)
    public CartaPresentacion obtenerPorPostulacion(Long postulacionId) {
        return repository.findByPostulacionId(postulacionId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Aún no se ha generado la Carta de Presentación para la postulación " + postulacionId));
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long postulacionId) {
        return pdfGenerator.generar(obtenerPorPostulacion(postulacionId));
    }
}
