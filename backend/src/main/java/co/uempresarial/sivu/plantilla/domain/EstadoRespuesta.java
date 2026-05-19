package co.uempresarial.sivu.plantilla.domain;

public enum EstadoRespuesta {
    PENDIENTE,     // Asignado, sin abrir
    EN_PROGRESO,   // Hay valores guardados, no entregado
    ENTREGADO,     // El asignado entregó, no editable
    FIRMADO,       // El asignado firmó
    APROBADO,      // Coformación validó
    RECHAZADO      // Coformación devolvió con observaciones
}
