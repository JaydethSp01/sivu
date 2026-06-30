package co.uempresarial.sivu.expediente.domain;

/**
 * BI-16 / RF-B01 — Estado derivado de cada sección/documento del Expediente Digital Unificado.
 *
 * <p>No se persiste: se calcula al vuelo a partir de los campos de firma/estado/PDF de las
 * entidades origen (Plan de Actividades, Actas, Evaluaciones, Informe Final), sin alterarlas.</p>
 *
 * <ul>
 *   <li>{@code NO_INICIADO} — la sección aún no existe para ese trimestre.</li>
 *   <li>{@code PENDIENTE} — existe pero sin avance de firma ni nota.</li>
 *   <li>{@code EN_REVISION} — diligenciado o firmado parcialmente, en curso.</li>
 *   <li>{@code FIRMADO} — firmado por todas las partes requeridas.</li>
 *   <li>{@code PDF_GENERADO} — ya tiene documento PDF formalizado asociado.</li>
 * </ul>
 */
public enum EstadoSeccionExpediente {
    NO_INICIADO,
    PENDIENTE,
    EN_REVISION,
    FIRMADO,
    PDF_GENERADO
}
