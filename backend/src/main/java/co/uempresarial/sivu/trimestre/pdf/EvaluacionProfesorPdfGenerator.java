package co.uempresarial.sivu.trimestre.pdf;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.trimestre.domain.EvaluacionProfesorTrimestre;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import static co.uempresarial.sivu.trimestre.pdf.PdfStyles.*;

@Component
public class EvaluacionProfesorPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd", new Locale("es", "CO"));

    private static final String CAPACIDADES_TEXTO =
        "Comprensión y asimilación de las funciones e instrucciones dadas para el desarrollo del "
        + "proceso de coformación. Capacidad de generar ideas y acciones pertinentes a su proceso, "
        + "más allá de las instrucciones recibidas, haciendo aportes creativos que faciliten la "
        + "actividad diaria de la empresa.";

    private static final String ACTITUDES_TEXTO =
        "Responsabilidad, dedicación, respeto, puntualidad en la entrega de compromisos, "
        + "cumplimiento de reglamentos.";

    private static final String APL_DESEMPENO =
        "Desempeño en la aplicación y uso de herramientas adquiridas en la fase aula, en el "
        + "desarrollo de sus actividades en la fase empresa";
    private static final String APL_ELAB_PEM =
        "Calidad académica en la elaboración y entrega final del documento del plan especial de mejora";
    private static final String APL_SUST_PEM =
        "Sustentación final del especial de mejora (uso de herramientas audiovisuales, calidad de "
        + "la presentación, habilidades de comunicación, entre otros)";

    public byte[] generar(EvaluacionProfesorTrimestre ev) {
        Trimestre t = ev.getTrimestre();
        Convenio c = t.getConvenio();
        Estudiante e = c.getEstudiante();
        Empresa em = c.getEmpresa();

        Document document = new Document(PageSize.LETTER, 30, 30, 30, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(encabezadoInstitucional(
                "GAC-FM-1", "3", LocalDate.now().format(FECHA),
                "FORMATO DE EVALUACIÓN POR PARTE DEL\nPROFESOR DE ACOMPAÑAMIENTO"));
            document.add(espacio(8));

            // INFO ESTUDIANTE + EMPRESA
            PdfPTable tInfo = new PdfPTable(2);
            tInfo.setWidthPercentage(100);
            tInfo.addCell(seccionCell("Información del estudiante y la empresa", 2));
            tInfo.addCell(campoCell("Estudiante", safe(e.getNombres()) + " " + safe(e.getApellidos())));
            tInfo.addCell(campoCell("Programa", safe(e.getProgramaAcademico())));
            tInfo.addCell(campoCell("Empresa", safe(em.getRazonSocial())));
            tInfo.addCell(campoCell("Trimestre", "T" + t.getNumero() + " · " + safe(t.getMateriaNucleo())));
            tInfo.addCell(campoCell("Profesor de acompañamiento", c.getTutorAcademico() != null
                ? (safe(c.getTutorAcademico().getNombres()) + " " + safe(c.getTutorAcademico().getApellidos()))
                : ""));
            tInfo.addCell(campoCell("Fecha 1° corte",
                ev.getFechaC1() != null ? ev.getFechaC1().format(FECHA)
                    : ev.getFechaElaboracion() != null ? ev.getFechaElaboracion().format(FECHA) : ""));
            tInfo.addCell(campoCell("Fecha 2° corte",
                ev.getFechaC2() != null ? ev.getFechaC2().format(FECHA) : "—"));
            document.add(tInfo);
            document.add(espacio(6));

            // ESCALA
            PdfPTable tEsc = new PdfPTable(4);
            tEsc.setWidthPercentage(100);
            tEsc.addCell(seccionCell("Escala de calificación", 4));
            tEsc.addCell(celdaTextoFondo("Insuficiente", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tEsc.addCell(celdaTextoFondo("Aceptable", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tEsc.addCell(celdaTextoFondo("Excelente", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tEsc.addCell(celdaTextoFondo("Sobresaliente", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tEsc.addCell(celdaTexto("0.0 a 2.9", FUENTE_TEXTO, Element.ALIGN_CENTER));
            tEsc.addCell(celdaTexto("3.0 a 3.9", FUENTE_TEXTO, Element.ALIGN_CENTER));
            tEsc.addCell(celdaTexto("4.0 a 4.5", FUENTE_TEXTO, Element.ALIGN_CENTER));
            tEsc.addCell(celdaTexto("4.6 a 5.0", FUENTE_TEXTO, Element.ALIGN_CENTER));
            document.add(tEsc);
            document.add(espacio(6));

            // CRITERIOS — GAC-FM-1 v3 evalúa en DOS cortes (25% cada uno)
            PdfPTable tCri = new PdfPTable(new float[]{0.5f, 1.4f, 3.6f, 1.0f, 1.0f});
            tCri.setWidthPercentage(100);
            tCri.addCell(seccionCell("Criterios de evaluación (dos cortes · 25% cada uno)", 5));
            tCri.addCell(celdaTextoFondo("#", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Criterio (peso)", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Concepto a evaluar", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("1ª Cal.\n25%", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("2ª Cal.\n25%", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));

            // 1. CAPACIDADES (10%)
            tCri.addCell(celdaTexto("1", FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("CAPACIDADES Y COMPETENCIAS\n(10%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(CAPACIDADES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getCapacidades()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getCapacidadesC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 2. ACTITUDES (10%)
            tCri.addCell(celdaTexto("2", FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("ACTITUDES Y COMPORTAMIENTO\n(10%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(ACTITUDES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getActitudes()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getActitudesC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 3. APLICACIÓN DE HERRAMIENTAS (80%) — sub criterios
            PdfPCell aplCab = celdaTexto("3", FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER);
            aplCab.setRowspan(3);
            tCri.addCell(aplCab);
            PdfPCell aplLabel = celdaTexto("APLICACIÓN DE HERRAMIENTAS\n(80%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT);
            aplLabel.setRowspan(3);
            tCri.addCell(aplLabel);
            tCri.addCell(celdaTexto("(20%) " + APL_DESEMPENO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionDesempeno()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getAplicacionDesempenoC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("(50%) " + APL_ELAB_PEM, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionElaboracionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getAplicacionElaboracionPemC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("(10%) " + APL_SUST_PEM, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionSustentacionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getAplicacionSustentacionPemC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            document.add(tCri);
            document.add(espacio(6));

            // NOTAS PONDERADAS POR CORTE + NOTA FINAL PROMEDIO
            PdfPTable tNp = new PdfPTable(new float[]{2.5f, 1.0f, 1.0f});
            tNp.setWidthPercentage(100);
            tNp.addCell(celdaTextoFondo("NOTA PONDERADA POR CORTE", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE));
            tNp.addCell(celdaTexto(num(ev.getNotaPonderada()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tNp.addCell(celdaTexto(num(ev.getNotaPonderadaC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tNp.addCell(celdaTextoFondo("NOTA FINAL (promedio de cortes con datos)", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE));
            BigDecimal nf = promedioCortes(ev.getNotaPonderada(), ev.getNotaPonderadaC2());
            PdfPCell nfCell = celdaTextoFondo(num(nf), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER, GRIS_SUAVE);
            nfCell.setColspan(2);
            tNp.addCell(nfCell);
            document.add(tNp);
            document.add(espacio(6));

            // OBSERVACIONES POR CORTE
            PdfPTable tObs = new PdfPTable(new float[]{1f, 1f});
            tObs.setWidthPercentage(100);
            tObs.addCell(seccionCell("Observaciones del proceso", 2));
            tObs.addCell(celdaTextoFondo("1° Corte", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tObs.addCell(celdaTextoFondo("2° Corte", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            String obs1 = ev.getObservacionesC1() != null && !ev.getObservacionesC1().isBlank()
                ? ev.getObservacionesC1()
                : safe(ev.getObservaciones());
            tObs.addCell(celdaTexto(obs1, FUENTE_TEXTO, Element.ALIGN_LEFT));
            tObs.addCell(celdaTexto(safe(ev.getObservacionesC2()), FUENTE_TEXTO, Element.ALIGN_LEFT));
            document.add(tObs);
            document.add(espacio(10));

            // FIRMAS con sello de tiempo
            PdfPTable firmas = new PdfPTable(2);
            firmas.setWidthPercentage(100);
            firmas.addCell(seccionCell("Firmas", 2));
            String nombreProf = ev.getFirmadoProfesorNombre() != null
                ? ev.getFirmadoProfesorNombre()
                : c.getTutorAcademico() != null
                    ? (safe(c.getTutorAcademico().getNombres()) + " " + safe(c.getTutorAcademico().getApellidos()))
                    : "";
            String nombreEst = ev.getFirmadoEstudianteNombre() != null
                ? ev.getFirmadoEstudianteNombre()
                : safe(e.getNombres()) + " " + safe(e.getApellidos());
            firmas.addCell(firmaCell("Profesor de acompañamiento", nombreProf,
                Boolean.TRUE.equals(ev.getFirmadoProfesor()), ev.getFechaFirmaProfesor()));
            firmas.addCell(firmaCell("Estudiante", nombreEst,
                Boolean.TRUE.equals(ev.getFirmadoEstudiante()), ev.getFechaFirmaEstudiante()));
            document.add(firmas);

            Paragraph notaFirma = new Paragraph(
                "Las firmas son electrónicas con sello de tiempo del SIVU: registran el usuario "
                + "autenticado y el momento exacto de cada firma.",
                FUENTE_PEQUENO);
            notaFirma.setAlignment(Element.ALIGN_CENTER);
            notaFirma.setSpacingBefore(8);
            document.add(notaFirma);

            Paragraph footer = new Paragraph(
                "Documento generado por SIVU — Sistema de Vinculación Universitaria",
                FUENTE_PEQUENO);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(6);
            document.add(footer);

            document.close();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando PDF Evaluación del Profesor", ex);
        }
        return out.toByteArray();
    }

    private static String num(BigDecimal v) {
        return v == null ? "—" : v.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    /** Promedio de las notas que tengan valor. Si solo hay una, retorna esa. */
    private static BigDecimal promedioCortes(BigDecimal c1, BigDecimal c2) {
        if (c1 == null && c2 == null) return null;
        if (c1 == null) return c2;
        if (c2 == null) return c1;
        return c1.add(c2).divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_UP);
    }

    private PdfPCell firmaCell(String rol, String nombre, boolean firmado,
                                java.time.OffsetDateTime fechaFirma) {
        Paragraph p = new Paragraph();
        p.add(new Phrase(rol + "\n", FUENTE_CAMPO));
        p.add(new Phrase("\n_____________________________________\n", FUENTE_TEXTO));
        p.add(new Phrase(nombre + "\n", FUENTE_TEXTO));
        if (firmado) {
            p.add(new Phrase("[ FIRMADO ]\n", FUENTE_TEXTO_BOLD));
            if (fechaFirma != null) {
                p.add(new Phrase(
                    fechaFirma.toLocalDate().format(FECHA) + " · "
                        + String.format("%02d:%02d", fechaFirma.getHour(), fechaFirma.getMinute()),
                    FUENTE_PEQUENO));
            }
        } else {
            p.add(new Phrase("[ Pendiente ]", FUENTE_PEQUENO));
        }
        PdfPCell c = new PdfPCell(p);
        c.setPadding(8);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setFixedHeight(90);
        return c;
    }
}
