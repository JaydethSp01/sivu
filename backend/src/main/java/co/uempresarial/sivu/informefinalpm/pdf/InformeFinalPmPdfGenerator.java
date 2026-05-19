package co.uempresarial.sivu.informefinalpm.pdf;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * PDF Informe Final del Plan Especial de Mejora — formato Uniempresarial GTC-FM-16.
 */
@Component
public class InformeFinalPmPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern(
        "dd 'de' MMMM 'de' yyyy", new Locale("es", "CO"));

    public byte[] generar(InformeFinalPm informe) {
        Document doc = new Document(PageSize.LETTER, 60, 60, 60, 60);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font small  = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font normal = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font bold   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font h2     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
            Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);

            // Header institucional GTC-FM-16
            Paragraph header = new Paragraph(
                "UNIVERSIDAD EMPRESARIAL\n"
                + "DIRECCIÓN DE COFORMACIÓN EMPRESARIAL\n"
                + "Código: GTC-FM-16   Versión: V.01   Fecha: " + LocalDate.now().format(FECHA),
                small);
            header.setAlignment(Element.ALIGN_CENTER);
            doc.add(header);

            doc.add(spacer(16));

            Paragraph title = new Paragraph("INFORME FINAL DEL PLAN ESPECIAL DE MEJORA", titulo);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);
            doc.add(spacer(12));

            // Identificación del PM y estudiante
            var pm = informe.getPlanMejora();
            var trimestre = pm.getTrimestre();
            var convenio = trimestre.getConvenio();
            Estudiante est = convenio.getEstudiante();
            String nombre = (safe(est.getNombres()) + " " + safe(est.getApellidos())).trim();

            doc.add(seccion("Identificación", h2));
            doc.add(linea("Título del PM:", safe(pm.getTitulo()), bold, normal));
            doc.add(linea("Estudiante:", nombre, bold, normal));
            doc.add(linea("Programa:", safe(est.getProgramaAcademico()), bold, normal));
            doc.add(linea("Empresa:", safe(convenio.getEmpresa().getRazonSocial()), bold, normal));
            doc.add(linea("Trimestre:", "T" + safe(trimestre.getNumero()) + " — " + safe(trimestre.getMateriaNucleo()),
                bold, normal));
            doc.add(linea("Páginas declaradas:", safe(informe.getNumeroPaginas()) + " (máx. 15)", bold, normal));
            doc.add(spacer(10));

            // Secciones
            addSeccion(doc, h2, normal, "Resumen Ejecutivo", informe.getResumenEjecutivo());
            addSeccion(doc, h2, normal, "Contextualización de la Empresa", informe.getContextualizacion());
            addSeccion(doc, h2, normal, "Planteamiento del Problema", informe.getPlanteamientoProblema());
            addSeccion(doc, h2, normal, "Marco Teórico", informe.getMarcoTeorico());
            addSeccion(doc, h2, normal, "Objetivo General", informe.getObjetivoGeneral());
            addSeccion(doc, h2, normal, "Objetivos Específicos", informe.getObjetivosEspecificos());
            addSeccion(doc, h2, normal, "Diagnóstico (DOFA / PESTEL / Ishikawa)", informe.getDiagnostico());
            addSeccion(doc, h2, normal, "Metodología", informe.getMetodologia());
            addSeccion(doc, h2, normal, "Propuesta de Solución", informe.getPropuestaSolucion());
            addSeccion(doc, h2, normal, "Factibilidad", informe.getFactibilidad());
            addSeccion(doc, h2, normal, "Conclusiones", informe.getConclusiones());
            if (informe.getAnexos() != null && !informe.getAnexos().isBlank()) {
                addSeccion(doc, h2, normal, "Anexos", informe.getAnexos());
            }

            // Estado y revisión
            doc.add(spacer(12));
            doc.add(seccion("Estado del Informe", h2));
            doc.add(linea("Estado actual:", informe.getEstado().name(), bold, normal));
            if (informe.getFechaEntrega() != null) {
                doc.add(linea("Fecha de entrega:", informe.getFechaEntrega().toLocalDate().format(FECHA), bold, normal));
            }
            if (informe.getRevisadoPorNombre() != null) {
                doc.add(linea("Revisor:", informe.getRevisadoPorNombre(), bold, normal));
            }
            if (informe.getObservacionesRevisor() != null && !informe.getObservacionesRevisor().isBlank()) {
                doc.add(spacer(6));
                doc.add(new Paragraph("Observaciones del revisor:", bold));
                Paragraph obs = new Paragraph(informe.getObservacionesRevisor(), normal);
                obs.setAlignment(Element.ALIGN_JUSTIFIED);
                doc.add(obs);
            }

            // Firmas
            doc.add(spacer(24));
            doc.add(seccion("Firmas", h2));
            doc.add(firmaLinea("Estudiante:", nombre, Boolean.TRUE.equals(informe.getFirmadoEstudiante()), bold, normal));
            doc.add(firmaLinea("Tutor Académico (Docente Acompañante):", "—",
                Boolean.TRUE.equals(informe.getFirmadoTutorAcad()), bold, normal));
            doc.add(firmaLinea("Tutor Empresarial:", "—",
                Boolean.TRUE.equals(informe.getFirmadoTutorEmp()), bold, normal));

            doc.close();
        } catch (DocumentException ex) {
            throw new IllegalStateException("Error generando Informe Final PM (GTC-FM-16)", ex);
        }
        return out.toByteArray();
    }

    private static Paragraph seccion(String texto, Font h2) {
        Paragraph p = new Paragraph(texto, h2);
        p.setSpacingBefore(8);
        p.setSpacingAfter(4);
        return p;
    }

    private static Paragraph linea(String etiqueta, String valor, Font bold, Font normal) {
        Phrase ph = new Phrase();
        ph.add(new Chunk(etiqueta + " ", bold));
        ph.add(new Chunk(valor == null ? "" : valor, normal));
        Paragraph p = new Paragraph(ph);
        p.setSpacingAfter(2);
        return p;
    }

    private static void addSeccion(Document doc, Font h2, Font normal, String titulo, String contenido)
        throws DocumentException {
        doc.add(seccion(titulo, h2));
        Paragraph p = new Paragraph(contenido == null || contenido.isBlank() ? "—" : contenido, normal);
        p.setAlignment(Element.ALIGN_JUSTIFIED);
        p.setSpacingAfter(6);
        doc.add(p);
    }

    private static Paragraph firmaLinea(String etiqueta, String nombre, boolean firmado, Font bold, Font normal) {
        Phrase ph = new Phrase();
        ph.add(new Chunk(etiqueta + " ", bold));
        ph.add(new Chunk(nombre, normal));
        ph.add(new Chunk("  —  " + (firmado ? "[FIRMADO ✓]" : "[ pendiente ]"), normal));
        Paragraph p = new Paragraph(ph);
        p.setSpacingAfter(4);
        return p;
    }

    private static Paragraph spacer(float h) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(h);
        return p;
    }

    private static String safe(Object o) {
        return o == null ? "" : o.toString();
    }
}
