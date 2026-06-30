package co.uempresarial.sivu.trimestre.pdf;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.trimestre.domain.EvaluacionTutorTrimestre;
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
public class EvaluacionTutorPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd-MMM-yy", new Locale("es", "CO"));

    private static final String CAPACIDADES_TEXTO =
        "• Proactividad: Tiene un alto nivel de autonomía y posee una alta capacidad para "
        + "resolver situaciones complejas y/o proponer soluciones novedosas.\n"
        + "• Calidad en el trabajo: Trabaja en forma eficiente, eficaz y los resultados de su "
        + "gestión son de un alto nivel de calidad.\n"
        + "• Colaboración y resolución de problemas: Apoya y se muestra participativo con los "
        + "procesos propios del área y del equipo de trabajo. Solicita retroalimentación oportuna "
        + "y resuelve los problemas propios del área siguiendo la directriz.";

    private static final String ACTITUDES_TEXTO =
        "• Puntualidad: Respeta el horario de llegada y terminación de la jornada, así como el de "
        + "reuniones y tareas encomendadas.\n"
        + "• Responsabilidad: Responde y cumple con las tareas que le han sido asignadas dentro de "
        + "su proceso de co-formación.\n"
        + "• Cumplimiento de normas y seguimiento de instrucciones: Respeta las disposiciones y "
        + "normas de trabajo, salud ocupacional y acata las instrucciones de su tutor.\n"
        + "• Habilidades sociales: se expresa adecuadamente, se comunica asertivamente y se integra "
        + "activamente con el equipo de trabajo de la empresa co-formadora.\n"
        + "• Comprensión del contexto: Entiende las situaciones y desafíos, con sus amenazas y "
        + "oportunidades. Identifica la visión, valores y prioridades institucionales.\n"
        + "• Presentación personal: Su indumentaria física responde al código de vestuario y "
        + "comportamiento propio de la organización";

    private static final String APL_DESEMPENO =
        "Desempeño en la aplicación y uso de herramientas adquiridas en la fase aula, en el "
        + "desarrollo de sus actividades en la fase empresa";
    private static final String APL_ELAB_PEM =
        "Calidad académica en la elaboración y entrega final del documento del plan especial de mejora";
    private static final String APL_SUST_PEM =
        "Sustentación final del especial de mejora (uso de herramientas audiovisuales, calidad de "
        + "la presentación, habilidades de comunicación, entre otros)";

    public byte[] generar(EvaluacionTutorTrimestre ev) {
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
                "GAC-FM-007", "2.0", "24/09/2025",
                "DIRECCIÓN DE COFORMACION EMPRESARIAL\nEVALUACIÓN POR PARTE DEL TUTOR"));
            document.add(espacio(8));

            // INFORMACION DE ESTUDIANTE
            PdfPTable tEst = new PdfPTable(2);
            tEst.setWidthPercentage(100);
            tEst.addCell(seccionCell("Información de estudiante", 2));
            tEst.addCell(campoCell("Nombre del estudiante", safe(e.getNombres()) + " " + safe(e.getApellidos())));
            tEst.addCell(campoCell("Documento de identidad", safe(e.getNumeroDocumento())));
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

            // CRITERIOS
            PdfPTable tCri = new PdfPTable(new float[]{2.0f, 4.5f, 1.2f});
            tCri.setWidthPercentage(100);
            tCri.addCell(celdaTextoFondo("Criterio", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Concepto a evaluar", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Calificación", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));

            // 1. CAPACIDADES Y COMPETENCIAS (40%)
            tCri.addCell(celdaTexto("1. CAPACIDADES Y COMPETENCIAS (40%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(CAPACIDADES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getCapacidades()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 2. ACTITUDES Y COMPORTAMIENTO (40%)
            tCri.addCell(celdaTexto("2. ACTITUDES Y COMPORTAMIENTO (40%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(ACTITUDES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getActitudes()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 3. APLICACIÓN DE HERRAMIENTAS TECNICAS ACADEMICAS Y ELABORACION Y
            //    SUSTENCIÓN DEL PLAN ESPECIAL DE MEJORA (20%) — sub criterios
            PdfPCell aplLabel = celdaTexto(
                "3. APLICACIÓN DE HERRAMIENTAS TECNICAS ACADEMICAS Y ELABORACION Y "
                + "SUSTENCIÓN DEL PLAN ESPECIAL DE MEJORA (20%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT);
            aplLabel.setRowspan(3);
            tCri.addCell(aplLabel);
            tCri.addCell(celdaTexto(APL_DESEMPENO + " (10%).", FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionDesempeno()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(APL_ELAB_PEM + " (5%)", FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionElaboracionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto(APL_SUST_PEM + " (5%).", FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionSustentacionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // NOTA PONDERADA
            PdfPCell npLbl = celdaTextoFondo("NOTA PONDERADA", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE);
            npLbl.setColspan(2);
            tCri.addCell(npLbl);
            tCri.addCell(celdaTexto(num(ev.getNotaPonderada()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // FECHA ELABORACION
            PdfPCell feLbl = celdaTextoFondo("FECHA ELABORACION", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE);
            feLbl.setColspan(2);
            tCri.addCell(feLbl);
            tCri.addCell(celdaTexto(
                ev.getFechaElaboracion() != null ? ev.getFechaElaboracion().format(FECHA) : "—",
                FUENTE_TEXTO, Element.ALIGN_CENTER));

            document.add(tCri);
            document.add(espacio(6));

            // OBSERVACIONES A LA CALIFICACION
            PdfPTable tObsCal = new PdfPTable(1);
            tObsCal.setWidthPercentage(100);
            tObsCal.addCell(seccionCell("Observaciones a la calificación", 1));
            tObsCal.addCell(celdaTexto(safe(ev.getObservaciones()), FUENTE_TEXTO, Element.ALIGN_LEFT));
            document.add(tObsCal);
            document.add(espacio(6));

            // CONTINUIDAD
            PdfPTable tCont = new PdfPTable(new float[]{4f, 1f, 1f});
            tCont.setWidthPercentage(100);
            tCont.addCell(seccionCell("Continuidad con la empresa", 3));
            tCont.addCell(celdaTexto("EL ESTUDIANTE TIENE CONTINUIDAD CON LA EMPRESA (Marque con una X)",
                FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            boolean si = Boolean.TRUE.equals(ev.getContinuidadConEmpresa());
            boolean no = Boolean.FALSE.equals(ev.getContinuidadConEmpresa());
            tCont.addCell(celdaTexto("SI  " + (si ? "[X]" : "[ ]"),
                FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCont.addCell(celdaTexto("NO  " + (no ? "[X]" : "[ ]"),
                FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            document.add(tCont);
            document.add(espacio(10));

            // FIRMAS
            PdfPTable firmas = new PdfPTable(2);
            firmas.setWidthPercentage(100);
            firmas.addCell(seccionCell("Firmas", 2));
            firmas.addCell(firmaCell("FIRMA DEL TUTOR",
                c.getTutorEmpresarial() != null
                    ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                    : "",
                Boolean.TRUE.equals(ev.getFirmadoTutor())));
            firmas.addCell(firmaCell("FIRMA DEL ESTUDIANTE",
                safe(e.getNombres()) + " " + safe(e.getApellidos()),
                Boolean.TRUE.equals(ev.getFirmadoEstudiante())));
            document.add(firmas);

            Paragraph footer = new Paragraph(
                "Documento generado por SIVU — Sistema de Vinculación Universitaria",
                FUENTE_PEQUENO);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(14);
            document.add(footer);

            document.close();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando PDF Evaluación del Tutor", ex);
        }
        return out.toByteArray();
    }

    private static String num(BigDecimal v) {
        return v == null ? "—" : v.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private PdfPCell firmaCell(String rol, String nombre, boolean firmado) {
        Paragraph p = new Paragraph();
        p.add(new Phrase(rol + "\n", FUENTE_CAMPO));
        p.add(new Phrase("\n_____________________________________\n", FUENTE_TEXTO));
        p.add(new Phrase(nombre + "\n", FUENTE_TEXTO));
        p.add(new Phrase(firmado ? "[ FIRMADO ]" : "[ Pendiente ]",
            firmado ? FUENTE_TEXTO_BOLD : FUENTE_PEQUENO));
        PdfPCell c = new PdfPCell(p);
        c.setPadding(8);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setFixedHeight(80);
        return c;
    }
}
