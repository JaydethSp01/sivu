package co.uempresarial.sivu.trimestre.pdf;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.trimestre.domain.PlanActividades;
import co.uempresarial.sivu.trimestre.domain.PlanActividadesMes;
import co.uempresarial.sivu.trimestre.domain.PlanActividadesObjetivo;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import static co.uempresarial.sivu.trimestre.pdf.PdfStyles.*;

@Component
public class PlanActividadesPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd", new Locale("es", "CO"));
    private static final String[] MESES = {
        "", "Mes 1", "Mes 2", "Mes 3", "Mes 4", "Mes 5", "Mes 6",
        "Mes 7", "Mes 8", "Mes 9", "Mes 10", "Mes 11", "Mes 12"
    };

    public byte[] generar(PlanActividades pa) {
        Trimestre t = pa.getTrimestre();
        Convenio c = t.getConvenio();
        Estudiante e = c.getEstudiante();
        Empresa em = c.getEmpresa();

        Document document = new Document(PageSize.LETTER, 30, 30, 30, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(encabezadoInstitucional(
                "GAC-FM-10", "3", LocalDate.now().format(FECHA),
                "PLAN DE ACTIVIDADES DEL ESTUDIANTE\nFASE EMPRESA"));
            document.add(espacio(8));

            // INFORMACION ESTUDIANTE
            PdfPTable tEst = new PdfPTable(2);
            tEst.setWidthPercentage(100);
            tEst.addCell(seccionCell("Información del estudiante", 2));
            tEst.addCell(campoCell("Nombre", safe(e.getNombres()) + " " + safe(e.getApellidos())));
            tEst.addCell(campoCell("Documento", safe(e.getTipoDocumento() != null ? e.getTipoDocumento().name() : "") + " " + safe(e.getNumeroDocumento())));
            tEst.addCell(campoCell("Programa", safe(e.getProgramaAcademico())));
            tEst.addCell(campoCell("Semestre", e.getSemestre() == null ? "" : e.getSemestre().toString()));
            tEst.addCell(campoCell("Correo", safe(e.getEmail())));
            tEst.addCell(campoCell("Materia núcleo", safe(t.getMateriaNucleo())));
            document.add(tEst);
            document.add(espacio(6));

            // INFORMACION EMPRESA
            PdfPTable tEmp = new PdfPTable(2);
            tEmp.setWidthPercentage(100);
            tEmp.addCell(seccionCell("Información de la empresa", 2));
            tEmp.addCell(campoCell("Razón social", safe(em.getRazonSocial())));
            tEmp.addCell(campoCell("NIT", safe(em.getNit())));
            tEmp.addCell(campoCell("Sector", safe(em.getSector())));
            tEmp.addCell(campoCell("Ciudad", safe(em.getCiudad())));
            tEmp.addCell(campoCell("Tutor de la empresa", c.getTutorEmpresarial() != null
                ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                : ""));
            tEmp.addCell(campoCell("Escenario de coformación", safe(pa.getEscenarioCoformacion())));
            document.add(tEmp);
            document.add(espacio(6));

            // INFORMACION PROFESOR
            PdfPTable tProf = new PdfPTable(2);
            tProf.setWidthPercentage(100);
            tProf.addCell(seccionCell("Información del profesor de acompañamiento", 2));
            tProf.addCell(campoCell("Nombre", c.getTutorAcademico() != null
                ? (safe(c.getTutorAcademico().getNombres()) + " " + safe(c.getTutorAcademico().getApellidos()))
                : ""));
            tProf.addCell(campoCell("Correo", c.getTutorAcademico() != null
                ? safe(c.getTutorAcademico().getEmail()) : ""));
            document.add(tProf);
            document.add(espacio(6));

            // PEM
            PdfPTable tPem = new PdfPTable(2);
            tPem.setWidthPercentage(100);
            tPem.addCell(seccionCell("Identificación del plan especial de mejora (PEM)", 2));
            PdfPCell c1 = new PdfPCell(new Phrase("Descripción del escenario", FUENTE_CAMPO));
            c1.setBackgroundColor(GRIS_SUAVE);
            c1.setPadding(4);
            PdfPCell c2 = new PdfPCell(new Phrase("Objetivo general del PEM", FUENTE_CAMPO));
            c2.setBackgroundColor(GRIS_SUAVE);
            c2.setPadding(4);
            tPem.addCell(c1);
            tPem.addCell(c2);
            tPem.addCell(celdaTexto(safe(pa.getPemDescripcionEscenario()), FUENTE_TEXTO, Element.ALIGN_LEFT));
            tPem.addCell(celdaTexto(safe(pa.getPemObjetivoGeneral()), FUENTE_TEXTO, Element.ALIGN_LEFT));
            document.add(tPem);
            document.add(espacio(6));

            // OBJETIVOS DE APRENDIZAJE
            PdfPTable tObj = new PdfPTable(new float[]{2.2f, 5.5f, 1f});
            tObj.setWidthPercentage(100);
            tObj.addCell(seccionCell("Objetivos de aprendizaje", 3));
            tObj.addCell(celdaTextoFondo("Escenario", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tObj.addCell(celdaTextoFondo("Descripción", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tObj.addCell(celdaTextoFondo("Selec.", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            if (pa.getObjetivos().isEmpty()) {
                PdfPCell vacio = celdaTexto("(Sin objetivos registrados)", FUENTE_PEQUENO, Element.ALIGN_CENTER);
                vacio.setColspan(3);
                tObj.addCell(vacio);
            } else {
                for (PlanActividadesObjetivo o : pa.getObjetivos()) {
                    tObj.addCell(celdaTexto(safe(o.getEscenario()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                    tObj.addCell(celdaTexto(safe(o.getDescripcion()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                    tObj.addCell(celdaTexto(Boolean.TRUE.equals(o.getSeleccionado()) ? "X" : "",
                        FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
                }
            }
            document.add(tObj);
            document.add(espacio(6));

            // PLAN MENSUAL
            PdfPTable tMes = new PdfPTable(new float[]{1f, 2.2f, 4.5f, 2.2f});
            tMes.setWidthPercentage(100);
            tMes.addCell(seccionCell("Plan de actividades mensual", 4));
            tMes.addCell(celdaTextoFondo("Mes", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tMes.addCell(celdaTextoFondo("Área de rotación", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tMes.addCell(celdaTextoFondo("Actividades", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            tMes.addCell(celdaTextoFondo("Tutor", FUENTE_CAMPO, Element.ALIGN_CENTER, GRIS_SUAVE));
            if (pa.getMeses().isEmpty()) {
                PdfPCell vacio = celdaTexto("(Sin plan mensual registrado)", FUENTE_PEQUENO, Element.ALIGN_CENTER);
                vacio.setColspan(4);
                tMes.addCell(vacio);
            } else {
                for (PlanActividadesMes m : pa.getMeses()) {
                    String mesLabel = m.getMes() != null && m.getMes() >= 1 && m.getMes() <= 12
                        ? MESES[m.getMes()] : ("Mes " + m.getMes());
                    tMes.addCell(celdaTexto(mesLabel, FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER));
                    tMes.addCell(celdaTexto(safe(m.getAreaRotacion()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                    tMes.addCell(celdaTexto(safe(m.getActividades()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                    tMes.addCell(celdaTexto(safe(m.getTutorNombre()), FUENTE_TEXTO, Element.ALIGN_LEFT));
                }
            }
            document.add(tMes);
            document.add(espacio(10));

            // FIRMAS
            PdfPTable firmas = new PdfPTable(3);
            firmas.setWidthPercentage(100);
            firmas.addCell(seccionCell("Firmas", 3));
            firmas.addCell(firmaCell("Estudiante",
                safe(e.getNombres()) + " " + safe(e.getApellidos()),
                Boolean.TRUE.equals(pa.getFirmadoEstudiante())));
            firmas.addCell(firmaCell("Tutor empresarial",
                c.getTutorEmpresarial() != null
                    ? (safe(c.getTutorEmpresarial().getNombres()) + " " + safe(c.getTutorEmpresarial().getApellidos()))
                    : "",
                Boolean.TRUE.equals(pa.getFirmadoTutor())));
            firmas.addCell(firmaCell("Profesor de acompañamiento",
                c.getTutorAcademico() != null
                    ? (safe(c.getTutorAcademico().getNombres()) + " " + safe(c.getTutorAcademico().getApellidos()))
                    : "",
                Boolean.TRUE.equals(pa.getFirmadoProfesor())));
            document.add(firmas);

            Paragraph footer = new Paragraph(
                "Documento generado por SIVU — Sistema de Vinculación Universitaria",
                FUENTE_PEQUENO);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(14);
            document.add(footer);

            document.close();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando PDF Plan de Actividades", ex);
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
