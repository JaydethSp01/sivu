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

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd", new Locale("es", "CO"));

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
                "GAC-FM-007", "2.0", LocalDate.now().format(FECHA),
                "DIRECCIÓN DE COFORMACIÓN EMPRESARIAL\nEVALUACIÓN POR PARTE DEL TUTOR"));
            document.add(espacio(8));

            // INFO ESTUDIANTE + EMPRESA
            PdfPTable tInfo = new PdfPTable(2);
            tInfo.setWidthPercentage(100);
            tInfo.addCell(seccionCell("Información del estudiante y la empresa", 2));
            tInfo.addCell(campoCell("Estudiante", safe(e.getNombres()) + " " + safe(e.getApellidos())));
            tInfo.addCell(campoCell("Programa", safe(e.getProgramaAcademico())));
            tInfo.addCell(campoCell("Empresa", safe(em.getRazonSocial())));
            tInfo.addCell(campoCell("Trimestre", "T" + t.getNumero() + " · " + safe(t.getMateriaNucleo())));
            tInfo.addCell(campoCell("Tutor empresarial", c.getTutorEmpresarial() != null
                ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                : ""));
            tInfo.addCell(campoCell("Fecha elaboración",
                ev.getFechaElaboracion() != null ? ev.getFechaElaboracion().format(FECHA) : ""));
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

            // CRITERIOS
            PdfPTable tCri = new PdfPTable(new float[]{0.6f, 1.5f, 4.5f, 1.2f});
            tCri.setWidthPercentage(100);
            tCri.addCell(seccionCell("Criterios de evaluación", 4));
            tCri.addCell(celdaTextoFondo("#", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Criterio (peso)", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Concepto a evaluar", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tCri.addCell(celdaTextoFondo("Calificación", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));

            // 1. CAPACIDADES (40%)
            tCri.addCell(celdaTexto("1", FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("CAPACIDADES Y COMPETENCIAS\n(40%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(CAPACIDADES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getCapacidades()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 2. ACTITUDES (40%)
            tCri.addCell(celdaTexto("2", FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("ACTITUDES Y COMPORTAMIENTO\n(40%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(ACTITUDES_TEXTO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getActitudes()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            // 3. APLICACIÓN DE HERRAMIENTAS (20%) — sub criterios
            PdfPCell aplCab = celdaTexto("3", FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER);
            aplCab.setRowspan(3);
            tCri.addCell(aplCab);
            PdfPCell aplLabel = celdaTexto("APLICACIÓN DE HERRAMIENTAS\n(20%)", FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT);
            aplLabel.setRowspan(3);
            tCri.addCell(aplLabel);
            tCri.addCell(celdaTexto("(10%) " + APL_DESEMPENO, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionDesempeno()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("(5%) " + APL_ELAB_PEM, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionElaboracionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCri.addCell(celdaTexto("(5%) " + APL_SUST_PEM, FUENTE_PEQUENO, Element.ALIGN_LEFT));
            tCri.addCell(celdaTexto(num(ev.getAplicacionSustentacionPem()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));

            document.add(tCri);
            document.add(espacio(6));

            // NOTA PONDERADA
            PdfPTable tNp = new PdfPTable(new float[]{4f, 1.2f});
            tNp.setWidthPercentage(100);
            tNp.addCell(celdaTextoFondo("NOTA PONDERADA FINAL", FUENTE_TEXTO_BOLD, Element.ALIGN_RIGHT, GRIS_SUAVE));
            tNp.addCell(celdaTexto(num(ev.getNotaPonderada()), FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            document.add(tNp);
            document.add(espacio(6));

            // CONTINUIDAD
            PdfPTable tCont = new PdfPTable(new float[]{4f, 1f, 1f});
            tCont.setWidthPercentage(100);
            tCont.addCell(seccionCell("Continuidad con la empresa", 3));
            tCont.addCell(celdaTexto("¿El estudiante tiene continuidad con la empresa?",
                FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
            boolean si = Boolean.TRUE.equals(ev.getContinuidadConEmpresa());
            boolean no = Boolean.FALSE.equals(ev.getContinuidadConEmpresa());
            tCont.addCell(celdaTexto("SÍ  " + (si ? "[X]" : "[ ]"),
                FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            tCont.addCell(celdaTexto("NO  " + (no ? "[X]" : "[ ]"),
                FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
            document.add(tCont);
            document.add(espacio(6));

            // OBSERVACIONES
            PdfPTable tObs = new PdfPTable(1);
            tObs.setWidthPercentage(100);
            tObs.addCell(seccionCell("Observaciones del proceso", 1));
            tObs.addCell(celdaTexto(safe(ev.getObservaciones()), FUENTE_TEXTO, Element.ALIGN_LEFT));
            document.add(tObs);
            document.add(espacio(10));

            // FIRMAS
            PdfPTable firmas = new PdfPTable(2);
            firmas.setWidthPercentage(100);
            firmas.addCell(seccionCell("Firmas", 2));
            firmas.addCell(firmaCell("Tutor empresarial",
                c.getTutorEmpresarial() != null
                    ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                    : "",
                Boolean.TRUE.equals(ev.getFirmadoTutor())));
            firmas.addCell(firmaCell("Estudiante",
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
