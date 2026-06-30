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

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd-MMM-yy", new Locale("es", "CO"));

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
                "GAC-FM-1", "3", "15/11/2023", "1 de 1",
                "Formato de evaluación por parte del profesor acompañamiento"));
            document.add(espacio(8));

            // INFORMACION DE ESTUDIANTE
            PdfPTable tEst = new PdfPTable(2);
            tEst.setWidthPercentage(100);
            tEst.addCell(seccionCell("Información de estudiante", 2));
            tEst.addCell(campoCell("Nombre del estudiante", safe(e.getNombres()) + " " + safe(e.getApellidos())));
            tEst.addCell(campoCell("Documento identificación", safe(e.getNumeroDocumento())));
            tEst.addCell(campoCell("Programa", safe(e.getProgramaAcademico())));
            tEst.addCell(campoCell("Semestre", e.getSemestre() == null ? "" : e.getSemestre().toString()));
            document.add(tEst);
            document.add(espacio(6));

            // INFORMACIÓN DE LA EMPRESA COFORMADORA
            PdfPTable tEmp = new PdfPTable(3);
            tEmp.setWidthPercentage(100);
            tEmp.addCell(seccionCell("Información de la empresa coformadora", 3));
            tEmp.addCell(celdaTextoFondo("Razón social de la empresa", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tEmp.addCell(celdaTextoFondo("Nombre del Tutor", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tEmp.addCell(celdaTextoFondo("Nombre del Profesor Acompañante", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tEmp.addCell(celdaTexto(safe(em.getRazonSocial()), FUENTE_TEXTO, Element.ALIGN_CENTER));
            tEmp.addCell(celdaTexto(c.getTutorEmpresarial() != null
                ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                : "", FUENTE_TEXTO, Element.ALIGN_CENTER));
            tEmp.addCell(celdaTexto(c.getTutorAcademico() != null
                ? (safe(c.getTutorAcademico().getNombres()) + " " + safe(c.getTutorAcademico().getApellidos()))
                : "", FUENTE_TEXTO, Element.ALIGN_CENTER));
            document.add(tEmp);
            document.add(espacio(6));

            // INFORMACION DE LA EVALUACIÓN — escala oficial
            PdfPTable tEsc = new PdfPTable(1);
            tEsc.setWidthPercentage(100);
            tEsc.addCell(seccionCell("Información de la evaluación", 1));
            tEsc.addCell(celdaTexto(
                "Insuficiente: entre 0,0 y 2,9  -  Aceptable entre 3,0 y 3,9  -  "
                + "Excelente entre 4,0 y 4,5  -  Sobresaliente entre 4,6 y 5,0",
                FUENTE_TEXTO, Element.ALIGN_CENTER));
            document.add(tEsc);
            document.add(espacio(6));

            // CRITERIOS — GAC-FM-1 v3: DOS columnas de calificación (1ª y 2ª, 25% c/u)
            PdfPTable tCri = new PdfPTable(new float[]{1.9f, 4.0f, 1.0f, 1.0f});
            tCri.setWidthPercentage(100);
            tCri.addCell(celdaTextoFondo("Criterio", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Concepto a evaluar", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("1ª Calificación\n25%", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("2ª Calificación\n25%", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));

            // 1. CAPACIDADES Y COMPETENCIAS (10%)
            tCri.addCell(celdaTexto("1. CAPACIDADES Y COMPETENCIAS (10%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(CAPACIDADES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getCapacidades()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getCapacidadesC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 2. ACTITUDES Y COMPORTAMIENTO (10%)
            tCri.addCell(celdaTexto("2. ACTITUDES Y COMPORTAMIENTO (10%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(ACTITUDES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getActitudes()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getActitudesC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 3. APLICACIÓN DE HERRAMIENTAS TECNICAS ACADEMICAS Y ELABORACION Y
            //    SUSTENCIÓN DEL PLAN ESPECIAL DE MEJORA (80%) — sub criterios
            PdfPCell aplLabel = celdaTexto(
                "3. APLICACIÓN DE HERRAMIENTAS TECNICAS ACADEMICAS Y ELABORACION Y "
                + "SUSTENCIÓN DEL PLAN ESPECIAL DE MEJORA (80%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT);
            aplLabel.setRowspan(3);
            tCri.addCell(aplLabel);
            tCri.addCell(celdaTexto(APL_DESEMPENO + " (20%).", FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionDesempeno()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getAplicacionDesempenoC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(APL_ELAB_PEM + " (50%)", FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionElaboracionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getAplicacionElaboracionPemC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(APL_SUST_PEM + " (10%).", FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionSustentacionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getAplicacionSustentacionPemC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // NOTA PONDERADA (1ª y 2ª calificación)
            PdfPCell npLbl = celdaTextoFondo("NOTA PONDERADA", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE);
            npLbl.setColspan(2);
            tCri.addCell(npLbl);
            tCri.addCell(celdaTexto(num(ev.getNotaPonderada()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(num(ev.getNotaPonderadaC2()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // NOTA FINAL ACUMULADA = promedio de los dos cortes (cada uno pesa 25% en la nota final).
            PdfPCell nfaLbl = celdaTextoFondo("NOTA FINAL ACUMULADA", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE);
            nfaLbl.setColspan(2);
            tCri.addCell(nfaLbl);
            PdfPCell nfaVal = celdaTexto(notaAcumulada(ev), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER);
            nfaVal.setColspan(2);
            tCri.addCell(nfaVal);

            // FECHA ELABORACION (una por corte)
            PdfPCell feLbl = celdaTextoFondo("FECHA ELABORACION", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE);
            feLbl.setColspan(2);
            tCri.addCell(feLbl);
            tCri.addCell(celdaTexto(
                ev.getFechaC1() != null ? ev.getFechaC1().format(FECHA)
                    : ev.getFechaElaboracion() != null ? ev.getFechaElaboracion().format(FECHA) : "—",
                FUENTE_TEXTO, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(
                ev.getFechaC2() != null ? ev.getFechaC2().format(FECHA) : "—",
                FUENTE_TEXTO, Element.ALIGN_CENTER));

            document.add(tCri);
            document.add(espacio(6));

            // OBSERVACIONES
            PdfPTable tObs = new PdfPTable(1);
            tObs.setWidthPercentage(100);
            tObs.addCell(seccionCell("Observaciones", 1));
            String obs1 = ev.getObservacionesC1() != null && !ev.getObservacionesC1().isBlank()
                ? ev.getObservacionesC1()
                : safe(ev.getObservaciones());
            tObs.addCell(campoCell("Observaciones del proceso 1° calificación", obs1));
            tObs.addCell(campoCell("Observaciones del proceso 2° calificación", safe(ev.getObservacionesC2())));
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
            firmas.addCell(firmaCell("FIRMA DEL PROFESOR ACOMPAÑANTE", nombreProf,
                Boolean.TRUE.equals(ev.getFirmadoProfesor()), ev.getFechaFirmaProfesor()));
            firmas.addCell(firmaCell("FIRMA DEL ESTUDIANTE", nombreEst,
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

    /** Nota final acumulada del docente = promedio de los dos cortes (25%+25%). "—" si falta alguno. */
    private static String notaAcumulada(EvaluacionProfesorTrimestre ev) {
        BigDecimal c1 = ev.getNotaPonderada();
        BigDecimal c2 = ev.getNotaPonderadaC2();
        if (c1 == null || c2 == null) return "—";
        return num(c1.add(c2).divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_UP));
    }

    private static String num(BigDecimal v) {
        return v == null ? "—" : v.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
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
