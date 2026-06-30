package co.uempresarial.sivu.convenio.pdf;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.trimestre.pdf.PdfStyles;
import co.uempresarial.sivu.tutor.domain.Tutor;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import static co.uempresarial.sivu.trimestre.pdf.PdfStyles.*;

/**
 * Genera el PDF del convenio de práctica entre estudiante, empresa y
 * universidad. Cierra el gap §4.4 del doc para Coformación: antes el
 * convenio existía solo como estado en BD; ahora produce un PDF
 * institucional descargable con datos completos y firmas registradas.
 */
@Component
public class ConvenioPdfGenerator {

    private static final DateTimeFormatter FECHA =
        DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", new Locale("es", "CO"));
    private static final DateTimeFormatter FECHA_CORTA =
        DateTimeFormatter.ofPattern("yyyy-MM-dd", new Locale("es", "CO"));

    public byte[] generar(Convenio c) {
        Estudiante e = c.getEstudiante();
        Empresa em = c.getEmpresa();
        Tutor tutorAcad = c.getTutorAcademico();
        Tutor tutorEmp = c.getTutorEmpresarial();

        Document document = new Document(PageSize.LETTER, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(encabezadoInstitucional(
                "GAC-FM-CV", "1", LocalDate.now().format(FECHA_CORTA),
                "CONVENIO DE PRÁCTICA\nCOFORMACIÓN EMPRESARIAL N° " + safe(c.getNumeroConvenio())));
            document.add(espacio(10));

            // Resumen de partes
            PdfPTable resumen = new PdfPTable(2);
            resumen.setWidthPercentage(100);
            resumen.addCell(seccionCell("Partes del convenio", 2));
            resumen.addCell(campoCell("Estudiante", safe(e.getNombres()) + " " + safe(e.getApellidos())));
            resumen.addCell(campoCell("Documento", safe(e.getTipoDocumento() != null ? e.getTipoDocumento().name() : "")
                + " " + safe(e.getNumeroDocumento())));
            resumen.addCell(campoCell("Programa académico", safe(e.getProgramaAcademico())));
            resumen.addCell(campoCell("Email institucional", safe(e.getEmail())));
            resumen.addCell(campoCell("Empresa", safe(em.getRazonSocial())));
            resumen.addCell(campoCell("NIT", safe(em.getNit())));
            resumen.addCell(campoCell("Sector", safe(em.getSector())));
            resumen.addCell(campoCell("Ciudad", safe(em.getCiudad())));
            document.add(resumen);
            document.add(espacio(8));

            // Datos del convenio
            PdfPTable datos = new PdfPTable(2);
            datos.setWidthPercentage(100);
            datos.addCell(seccionCell("Datos del convenio", 2));
            datos.addCell(campoCell("N° de convenio", safe(c.getNumeroConvenio())));
            datos.addCell(campoCell("Estado", c.getEstado() != null ? c.getEstado().name() : ""));
            datos.addCell(campoCell("Fecha de inicio", c.getFechaInicio() != null ? c.getFechaInicio().format(FECHA) : ""));
            datos.addCell(campoCell("Fecha de fin", c.getFechaFin() != null ? c.getFechaFin().format(FECHA) : ""));
            datos.addCell(campoCell("Semestre académico", safe(c.getSemestreAcademico())));
            datos.addCell(campoCell("Continuidad de práctica previa", Boolean.TRUE.equals(c.getEsContinuidad()) ? "Sí" : "No"));
            document.add(datos);
            document.add(espacio(8));

            // Tutores asignados
            PdfPTable tutores = new PdfPTable(2);
            tutores.setWidthPercentage(100);
            tutores.addCell(seccionCell("Tutores designados", 2));
            tutores.addCell(campoCell("Profesor acompañante (académico)",
                tutorAcad == null ? "" : (safe(tutorAcad.getNombres()) + " " + safe(tutorAcad.getApellidos())
                    + (tutorAcad.getEmail() != null ? " · " + tutorAcad.getEmail() : ""))));
            tutores.addCell(campoCell("Tutor empresarial",
                tutorEmp == null ? "" : (safe(tutorEmp.getNombres()) + " " + safe(tutorEmp.getApellidos())
                    + (tutorEmp.getCargo() != null ? " · " + tutorEmp.getCargo() : ""))));
            document.add(tutores);
            document.add(espacio(10));

            // Cláusulas mínimas (texto legal estándar)
            Paragraph clausulas = new Paragraph("CLÁUSULAS GENERALES", FUENTE_SUBTITULO);
            clausulas.setSpacingAfter(4);
            document.add(clausulas);
            String[] cuerpoClausulas = {
                "PRIMERA — Objeto. Las partes acuerdan formalizar la práctica de coformación empresarial del estudiante en las instalaciones (o de manera virtual) de la empresa, en el rol y proyecto descritos.",
                "SEGUNDA — Duración. La práctica se desarrollará entre las fechas indicadas. Cualquier modificación deberá pactarse por escrito entre las partes.",
                "TERCERA — Acompañamiento académico. El profesor acompañante designado por la Fundación Universitaria Empresarial realizará seguimiento periódico mediante reuniones (Actas GAC-FM-11) y evaluaciones formales (Evaluación GAC-FM-1 v3).",
                "CUARTA — Tutoría empresarial. La empresa asigna un tutor empresarial responsable de orientar, supervisar y evaluar al estudiante en su práctica (Evaluación GAC-FM-007 v2.0).",
                "QUINTA — Confidencialidad y propiedad intelectual. El estudiante se compromete a respetar las políticas de confidencialidad y de propiedad intelectual de la empresa.",
                "SEXTA — Aprobación. La práctica se considera APROBADA con nota ponderada ≥ 3.0 al cierre del proceso (Informe Final GTC-FM-16 v3.0).",
                "SÉPTIMA — Continuidad. Si el estudiante y la empresa convienen continuidad laboral, deberá reportarse en el formato GAC-FM-007 al cierre de la práctica.",
            };
            for (String linea : cuerpoClausulas) {
                Paragraph p = new Paragraph(linea, FUENTE_TEXTO);
                p.setSpacingAfter(3);
                p.setAlignment(Element.ALIGN_JUSTIFIED);
                document.add(p);
            }
            document.add(espacio(8));

            // Estado y firmas
            PdfPTable firmas = new PdfPTable(3);
            firmas.setWidthPercentage(100);
            firmas.addCell(seccionCell("Estado actual del convenio: " + estadoLegible(c.getEstado()), 3));
            firmas.addCell(firmaCell("Estudiante",
                safe(e.getNombres()) + " " + safe(e.getApellidos()),
                firmadoPorEstudiante(c.getEstado()), c.getUpdatedAt()));
            firmas.addCell(firmaCell("Tutor empresarial",
                tutorEmp == null ? "" : (safe(tutorEmp.getNombres()) + " " + safe(tutorEmp.getApellidos())),
                firmadoPorEmpresa(c.getEstado()), c.getUpdatedAt()));
            firmas.addCell(firmaCell("Coformación Uniempresarial",
                "Oficina de Coformación",
                firmadoPorUniversidad(c.getEstado()), c.getUpdatedAt()));
            document.add(firmas);

            Paragraph pie = new Paragraph(
                "Documento generado por SIVU el " + LocalDate.now().format(FECHA)
                    + ". Las firmas reflejan el estado del convenio en el sistema; los timestamps se conservan en BD.",
                FUENTE_PEQUENO);
            pie.setAlignment(Element.ALIGN_CENTER);
            pie.setSpacingBefore(8);
            document.add(pie);

            document.close();
        } catch (Exception ex) {
            throw new RuntimeException("Error generando PDF de convenio: " + ex.getMessage(), ex);
        }
        return out.toByteArray();
    }

    private static PdfPCell firmaCell(String rol, String nombre, boolean firmado, java.time.OffsetDateTime fecha) {
        PdfPTable inner = new PdfPTable(1);
        inner.setWidthPercentage(100);
        PdfPCell linea = new PdfPCell(new Phrase(firmado ? "✓ FIRMADO" : "Pendiente",
            firmado ? PdfStyles.FUENTE_TEXTO_BOLD : PdfStyles.FUENTE_PEQUENO));
        linea.setBorder(Rectangle.BOTTOM);
        linea.setBorderColor(PdfStyles.GRIS_BORDE);
        linea.setPaddingTop(28);
        linea.setHorizontalAlignment(Element.ALIGN_CENTER);
        inner.addCell(linea);
        PdfPCell nombreCell = new PdfPCell(new Phrase(nombre, FUENTE_VALOR));
        nombreCell.setBorder(Rectangle.NO_BORDER);
        nombreCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        inner.addCell(nombreCell);
        PdfPCell rolCell = new PdfPCell(new Phrase(rol, FUENTE_CAMPO));
        rolCell.setBorder(Rectangle.NO_BORDER);
        rolCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        inner.addCell(rolCell);
        if (firmado && fecha != null) {
            PdfPCell ts = new PdfPCell(new Phrase(
                "Sello tiempo SIVU · " + fecha.toLocalDate().format(FECHA_CORTA), FUENTE_PEQUENO));
            ts.setBorder(Rectangle.NO_BORDER);
            ts.setHorizontalAlignment(Element.ALIGN_CENTER);
            inner.addCell(ts);
        }
        PdfPCell wrap = new PdfPCell(inner);
        wrap.setPadding(6);
        return wrap;
    }

    private static String estadoLegible(EstadoConvenio e) {
        if (e == null) return "—";
        return switch (e) {
            case BORRADOR -> "Borrador (sin firmas)";
            case FIRMADO_ESTUDIANTE -> "Firmado por el estudiante";
            case FIRMADO_EMPRESA -> "Firmado por la empresa";
            case FIRMADO_UNIVERSIDAD -> "Firmado por la Universidad";
            case ACTIVO -> "Activo (3 firmas registradas)";
            case FINALIZADO -> "Práctica finalizada";
            case CANCELADO -> "Convenio cancelado";
        };
    }

    private static boolean firmadoPorEstudiante(EstadoConvenio e) {
        if (e == null) return false;
        return switch (e) {
            case FIRMADO_ESTUDIANTE, FIRMADO_EMPRESA, FIRMADO_UNIVERSIDAD, ACTIVO, FINALIZADO -> true;
            default -> false;
        };
    }

    private static boolean firmadoPorEmpresa(EstadoConvenio e) {
        if (e == null) return false;
        return switch (e) {
            case FIRMADO_EMPRESA, FIRMADO_UNIVERSIDAD, ACTIVO, FINALIZADO -> true;
            default -> false;
        };
    }

    private static boolean firmadoPorUniversidad(EstadoConvenio e) {
        if (e == null) return false;
        return switch (e) {
            case FIRMADO_UNIVERSIDAD, ACTIVO, FINALIZADO -> true;
            default -> false;
        };
    }
}
