package co.uempresarial.sivu.shared.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String recurso, Object id) {
        super("%s no encontrado(a) con id=%s".formatted(recurso, id));
    }

    public ResourceNotFoundException(String mensaje) {
        super(mensaje);
    }
}
