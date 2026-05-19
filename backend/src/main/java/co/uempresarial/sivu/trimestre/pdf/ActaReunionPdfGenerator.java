package co.uempresarial.sivu.trimestre.pdf;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.trimestre.domain.ActaReunion;
import co.uempresarial.sivu.trimestre.domain.ActaTema;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.ActaReunionResponse;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import static co.uempresarial.sivu.trimestre.pdf.PdfStyles.*;

@Component
@RequiredArgsConstructor
public class ActaReunionPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd", new Locale("es", "CO"));

    private final TrimestreMapper mapper;

    public byte[] generar(ActaReunion acta) {
        Trimestre t = acta.getTrimestre();
        Convenio c = t.getConvenio();
        Estudiante e = c.getEstudiante();
        Empresa em = c.getEmpresa();

        Document document = new Document(PageSize.LETTER, 30, 30, 30, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(encabezadoInstitucional(
                "GAC-FM-11", "2", LocalDate.now().format(FECHA),
                "ACTA DE REUNIÓN N° AC" + acta.getNumero()
                    + "\nSEGUIMIENTO FASE EMPRESA"));
            document.add(espacio(8));

            // INFORMACION ESTUDIANTE
            PdfPTable tEst = new PdfPTable(2);
            tEst.setWidthPercentage(100);
            tEst.addCell(seccionCell("Información del estudiante", 2));
            tEst.addCell(campoCell("Nombre", safe(e.getNombres()) + " " + safe(e.getApellidos())));
            tEst.addCell(campoCell("Documento", safe(e.getTipoDocumento() != null ? e.getTipoDocumento().name() : "") + " " + safe(e.getNumeroDocumento())));
            tEst.addCell(campoCell("Programa", safe(e.getProgramaAcademico())));
            tEst.addCell(campoCell("Trimestre", "T" + t.getNumero() + " · " + safe(t.getMateriaNucleo())));
            document.add(tEst);
            document.add(espacio(6));

            // INFORMACION EMPRESA
            PdfPTable tEmp = new PdfPTable(2);
            tEmp.setWidthPercentage(100);
            tEmp.addCell(seccionCell("Información de la empresa", 2));
            tEmp.addCell(campoCell("Razón social", safe(em.getRazonSocial())));
            tEmp.addCell(campoCell("NIT", safe(em.getNit())));
            tEmp.addCell(campoCell("Tutor empresarial", c.getTutorEmpresarial() != null
                ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                : ""));
            tEmp.addCell(campoCell("Profesor de acompañamiento", c.getTutorAcademico() != null
                ? (safe(c.getTutorAcademico().getNombres()) + " " + safe(c.getTutorAcademico().getApellidos()))
                : ""));
            document.add(tEmp);
            document.add(espacio(6));

            // DATOS GENERALES REUNIÓN
            PdfPTable tDg = new PdfPTable(2);
            tDg.setWidthPercentage(100);
            tDg.addCell(seccionCell("Datos generales de la reunión", 2));
            tDg.addCell(campoCell("Fecha", acta.getFecha() != null ? acta.getFecha().format(FECHA) : ""));
            tDg.addCell(campoCell("Hora", safe(acta.getHora())));
            tDg.addCell(campoCell("Lugar", safe(acta.getLugar())));
            tDg.addCell(campoCell("Tipo de reunión", acta.getTipoReunion() != null
                ? acta.getTipoReunion().name() : ""));
            PdfPCell asuntoLabel = new PdfPCell(new Phrase("Asunto", FUENTE_CAMPO));
            asuntoLabel.setBackgroundColor(GRIS_SUAVE);
            asuntoLabel.setPadding(4);
            tDg.addCell(asuntoLabel);
            PdfPCell asuntoCell = new PdfPCell(new Phrase(safe(acta.getAsunto()), FUENTE_VALOR));
            asuntoCell.setPadding(4);
            tDg.addCell(asuntoCell);
            document.add(tDg);
            document.add(espacio(6));

            // ASISTENTES
            List<ActaReunionResponse.Asistente> asistentes = mapper.parseAsistentes(acta.getAsistentesJson());
            PdfPTable tAs = new PdfPTable(new float[]{3f, 2f, 3f});
            tAs.setWidthPercentage(100);
            tAs.addCell(seccionCell("Asistentes", 3));
            tAs.addCell(celdaTextoFondo("Nombre", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tAs.addCell(celdaTextoFondo("Rol", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tAs.addCell(celdaTextoFondo("Correo", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            if (asistentes.isEmpty()) {
                PdfPCell vacio = celdaTexto("(Sin asistentes registrados)", FUENTE_PEQUENO, Element.ALIGN_CENTER);
                vacio.setColspan(3);
                tAs.addCell(vacio);
            } else {
                for (ActaReunionResponse.Asistente a : asistentes) {
                    tAs.addCell(celdaTexto(safe(a.nombre()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                    tAs.addCell(celdaTexto(safe(a.rol()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                    tAs.addCell(celdaTexto(safe(a.correo()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                }
            }
            document.add(tAs);
            document.add(espacio(6));

            // ASPECTOS DE LA REUNION
            PdfPTable tTemas = new PdfPTable(new float[]{2.5f, 5f});
            tTemas.setWidthPercentage(100);
            tTemas.addCell(seccionCell("Aspectos de la reunión", 2));
            tTemas.addCell(celdaTextoFondo("Tema", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tTemas.addCell(celdaTextoFondo("Observaciones / compromisos", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            if (acta.getTemas().isEmpty()) {
                PdfPCell vacio = celdaTexto("(Sin temas tratados)", FUENTE_PEQUENO, Element.ALIGN_CENTER);
                vacio.setColspan(2);
                tTemas.addCell(vacio);
            } else {
                for (ActaTema tema : acta.getTemas()) {
                    tTemas.addCell(celdaTexto(safe(tema.getTema()), FUENTE_TEXTO_BOLD, Element.ALIGN_LEFT));
                    tTemas.addCell(celdaTexto(safe(tema.getObservaciones()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                }
            }
            document.add(tTemas);
            document.add(espacio(6));

            // OTRAS OBSERVACIONES
            PdfPTable tObs = new PdfPTable(1);
            tObs.setWidthPercentage(100);
            tObs.addCell(seccionCell("Otras observaciones", 1));
            tObs.addCell(celdaTexto(safe(acta.getObservaciones()), FUENTE_TEXTO, Element.ALIGN_LEFT));
            document.add(tObs);
            document.add(espacio(10));

            // FIRMAS
            PdfPTable firmas = new PdfPTable(3);
            firmas.setWidthPercentage(100);
            firmas.addCell(seccionCell("Firmas", 3));
            firmas.addCell(firmaCell("Estudiante",
                safe(e.getNombres()) + " " + safe(e.getApellidos()),
                Boolean.TRUE.equals(acta.getFirmadoEstudiante())));
            firmas.addCell(firmaCell("Tutor empresarial",
                c.getTutorEmpresarial() != null
                    ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                    : "",
                Boolean.TRUE.equals(acta.getFirmadoTutor())));
            firmas.addCell(firmaCell("Profesor",
                c.getTutorAcademico() != null
                    ? (safe(c.getTutorAcademico().getNombres()) + " " + safe(c.getTutorAcademico().getApellidos()))
                    : "",
                Boolean.TRUE.equals(acta.getFirmadoProfesor())));
            document.add(firmas);

            Paragraph footer = new Paragraph(
                "Documento generado por SIVU — Sistema de Vinculación Universitaria",
                FUENTE_PEQUENO);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(14);
            document.add(footer);

            document.close();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando PDF Acta de Reunión", ex);
        }
        return out.toByteArray();
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
