package co.uempresarial.sivu.shared.exception;

import java.time.OffsetDateTime;
import java.util.List;

public record ApiError(
    OffsetDateTime timestamp,
    int status,
    String error,
    String message,
    String path,
    List<FieldErrorDetail> errors
) {
    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(OffsetDateTime.now(), status, error, message, path, List.of());
    }

    public static ApiError of(int status, String error, String message, String path, List<FieldErrorDetail> errors) {
        return new ApiError(OffsetDateTime.now(), status, error, message, path, errors);
    }

    public record FieldErrorDetail(String campo, String mensaje) {}
}
