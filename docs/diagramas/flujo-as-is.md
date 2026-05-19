# Flujo AS-IS — Proceso actual de vinculación

Diagrama del proceso actual (manual) que SIVU automatiza. Reflejo en Mermaid del BPMN del archivo `Jaydeth trabajo }.bpm`.

```mermaid
flowchart TD
    Start([Estudiante quiere hacer práctica]) --> A1[Envía documentos por correo<br/>HV, ID, EPS, certificado]
    A1 --> A2{Documentos<br/>legibles?}
    A2 -- No --> A3[Coordinador solicita<br/>reenvío por correo]
    A3 --> A1
    A2 -- Sí --> A4[Coordinador descarga<br/>y organiza manualmente]
    A4 --> A5[Coordinador verifica<br/>condiciones académicas<br/>contra sistema universitario]
    A5 --> A6{Cumple<br/>créditos/promedio?}
    A6 -- No --> A7[Envía correo rechazo]
    A7 --> End1([FIN: Rechazado])
    A6 -- Sí --> A8[Coordinador envía CV<br/>a la empresa por correo]
    A8 --> A9{Empresa lo<br/>preselecciona?}
    A9 -- No --> A10[Coordinador comunica<br/>rechazo al estudiante]
    A10 --> End2([FIN: No preseleccionado])
    A9 -- Sí --> A11[Coordinador prepara<br/>documento de formalización<br/>manualmente]
    A11 --> A12{¿Datos<br/>correctos?}
    A12 -- No --> A13[Correcciones<br/>idas y vueltas]
    A13 --> A11
    A12 -- Sí --> A14[Envía a firma física<br/>de las 3 partes]
    A14 --> A15[Coordinador valida<br/>pago de matrícula manual]
    A15 --> A16[Habilita fase de inducción]
    A16 --> End3([FIN: Práctica iniciada])

    style End1 fill:#fca5a5,color:#000
    style End2 fill:#fca5a5,color:#000
    style End3 fill:#86efac,color:#000
```

**Cuellos de botella identificados** (ver `Análisis proceso de vinculación.docx`):

1. **Carga manual de documentos** → desorden, pérdida de tiempo.
2. **Verificación humana repetitiva** → escala mal con cientos de estudiantes.
3. **Flujo de correos ineficiente** → cada paso depende de redacción manual.
4. **Fricción en la formalización** → correcciones por errores de captura.
5. **Falta de visibilidad** → el estudiante no sabe en qué paso está su trámite.
