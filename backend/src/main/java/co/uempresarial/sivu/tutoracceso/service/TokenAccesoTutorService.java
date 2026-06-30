package co.uempresarial.sivu.tutoracceso.service;

import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import co.uempresarial.sivu.tutoracceso.domain.PropositoTokenTutor;
import co.uempresarial.sivu.tutoracceso.domain.TokenAccesoTutor;
import co.uempresarial.sivu.tutoracceso.persistence.TokenAccesoTutorRepository;
import co.uempresarial.sivu.tutoracceso.web.dto.TokenAccesoResponse;
import co.uempresarial.sivu.tutoracceso.web.dto.ValidacionTokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Emite y valida tokens de acceso externo para tutores empresariales, de modo que
 * puedan diligenciar su evaluación sin una cuenta institucional.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TokenAccesoTutorService {

    /** Vigencia por defecto si el solicitante no especifica una. */
    private static final int DIAS_VALIDEZ_DEFECTO = 7;

    private final TokenAccesoTutorRepository repository;
    private final TutorRepository tutorRepository;

    public TokenAccesoResponse generarToken(Long tutorId, Long convenioId,
                                            PropositoTokenTutor proposito, Integer diasValidez) {
        if (!tutorRepository.existsById(tutorId)) {
            throw new ResourceNotFoundException("Tutor", tutorId);
        }
        int dias = (diasValidez == null || diasValidez <= 0) ? DIAS_VALIDEZ_DEFECTO : diasValidez;

        TokenAccesoTutor entity = TokenAccesoTutor.builder()
            .tutorId(tutorId)
            .convenioId(convenioId)
            .token(UUID.randomUUID().toString())
            .proposito(proposito == null ? PropositoTokenTutor.EVALUACION_TUTOR : proposito)
            .expiraEn(OffsetDateTime.now().plusDays(dias))
            .usado(false)
            .build();

        return toResponse(repository.save(entity));
    }

    /** Devuelve el contexto del token si es válido y no ha expirado; si no, lanza BusinessException. */
    @Transactional(readOnly = true)
    public ValidacionTokenResponse validarToken(String token) {
        TokenAccesoTutor entity = repository.findByTokenAndUsadoFalse(token)
            .orElseThrow(() -> new BusinessException("Token de acceso inválido o ya utilizado"));
        if (entity.getExpiraEn().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("El token de acceso ha expirado");
        }
        return new ValidacionTokenResponse(true, entity.getTutorId(), entity.getConvenioId(), entity.getProposito());
    }

    public void marcarUsado(String token) {
        TokenAccesoTutor entity = repository.findByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("TokenAccesoTutor", token));
        entity.setUsado(true);
        repository.save(entity);
    }

    private TokenAccesoResponse toResponse(TokenAccesoTutor e) {
        return new TokenAccesoResponse(
            e.getId(), e.getTutorId(), e.getConvenioId(), e.getToken(),
            e.getProposito(), e.getExpiraEn(), e.isUsado());
    }
}
