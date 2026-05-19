# Flujo TO-BE — Proceso automatizado con SIVU

Reflejo en Mermaid del BPMN `to be jaydeth (2).bpm`, **aterrizado a tecnologías locales** del proyecto académico (sin n8n + AWS).

> El TO-BE original proponía n8n + AWS Textract + Bedrock + SES + RDS. Por la restricción del proyecto (entrega solo local, ver [decisión arquitectónica](../arquitectura/README.md#adr-006)), SIVU implementa las mismas automatizaciones con:
>
> - **Textract → Validador local + parsing simple** (en futura iteración: integrar Tesseract/Apache PDFBox).
> - **Bedrock matching → MatchingService propio** (TF de keywords + reglas).
> - **SES → MailHog** en demo, JavaMailSender en producción.
> - **CloudHSM / DocuSign → Firma simulada** vía endpoint PATCH `/convenios/{id}/firmar/{parte}`.
> - **API académica → MockUniversidadApiService** (en producción: integrar el SIA real).

```mermaid
flowchart TD
    Start([Estudiante entra al portal SIVU]) --> A1[Sube documentos<br/>HV, ID, EPS, certificado<br/>vía formulario web]
    A1 --> A2[Sistema valida<br/>formato y tamaño<br/>automáticamente]
    A2 -- inválido --> A3[Rechaza con observaciones<br/>+ notif email]
    A3 --> A1
    A2 -- válido --> A4[GET /automatizacion/validar-academico<br/>MockUniversidadApiService]
    A4 -- no cumple --> A5[Email automático:<br/>no cumple condiciones]
    A5 --> End1([FIN: Rechazo automático])
    A4 -- cumple --> A6[Estudiante navega vacantes<br/>publicadas]
    A6 --> A7[POST /postulaciones<br/>MatchingService calcula score]
    A7 --> A8[Genera evento + notif email<br/>Estado: POSTULADA]
    A8 --> A9[Empresa recibe postulantes<br/>ordenados por score<br/>desc]
    A9 --> A10{Empresa<br/>preselecciona?}
    A10 -- No --> A11[PATCH /postulaciones/:id/estado<br/>nuevoEstado: RECHAZADA]
    A11 --> A12[Email automático]
    A12 --> End2([FIN: Rechazada])
    A10 -- Sí --> A13[PATCH a PRESELECCIONADA<br/>+ email automático]
    A13 --> A14{Coordinador<br/>acepta?}
    A14 -- No --> A11
    A14 -- Sí --> A15[PATCH a ACEPTADA<br/>+ email automático]
    A15 --> A16[POST /automatizacion/formalizar/:id<br/>FormalizacionService]
    A16 --> A17[FormalizacionPdfGenerator<br/>genera PDF con datos<br/>auto-completados]
    A17 --> A18[Crea Convenio<br/>+ Documento PDF<br/>+ email a estudiante]
    A18 --> A19[Estudiante y Empresa<br/>firman vía PATCH<br/>/convenios/:id/firmar/:parte]
    A19 --> A20[Universidad firma<br/>→ estado ACTIVO]
    A20 --> End3([FIN: Práctica iniciada])

    style End1 fill:#fca5a5,color:#000
    style End2 fill:#fca5a5,color:#000
    style End3 fill:#86efac,color:#000
    style A2 fill:#a78bfa,color:#fff
    style A4 fill:#a78bfa,color:#fff
    style A7 fill:#a78bfa,color:#fff
    style A8 fill:#a78bfa,color:#fff
    style A12 fill:#a78bfa,color:#fff
    style A13 fill:#a78bfa,color:#fff
    style A15 fill:#a78bfa,color:#fff
    style A16 fill:#a78bfa,color:#fff
    style A17 fill:#a78bfa,color:#fff
    style A18 fill:#a78bfa,color:#fff
```

**Pasos automatizados** (en lila): de los 17 pasos del flujo, 11 son ejecutados automáticamente por SIVU. El estudiante ve el estado en tiempo real en su dashboard ("tipo seguimiento de pedido"), y un agente MCP permite a Coordinación responder preguntas como *"¿Qué estudiantes están en EN_REVISION desde hace más de 5 días?"*.
