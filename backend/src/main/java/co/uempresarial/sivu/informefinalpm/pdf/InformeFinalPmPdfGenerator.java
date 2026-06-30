package co.uempresarial.sivu.informefinalpm.pdf;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import co.uempresarial.sivu.trimestre.pdf.PdfStyles;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * PDF Informe Final del Plan de Mejora — formato institucional Uniempresarial
 * GTC-FM-16 (Versión 3.0). Replica carátula, encabezado por página ("Página X de 15"),
 * las 12 secciones numeradas oficiales y el bloque de firmas/calificación.
 */
@Component
public class InformeFinalPmPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern(
        "dd 'de' MMMM 'de' yyyy", new Locale("es", "CO"));

    private static final BigDecimal NOTA_MINIMA = new BigDecimal("3.0");

    private static final String CODIGO = "GTC-FM-16";
    private static final String VERSION = "3.0";
    private static final String FECHA_FORMATO = "03/04/2025";
    private static final int TOTAL_PAGINAS = 15;

    /** Encabezado institucional GTC-FM-16 repetido en cada página con "Página X de 15". */
    private static final class HeaderPorPagina extends PdfPageEventHelper {
        private final Short nivel;
        HeaderPorPagina(Short nivel) { this.nivel = nivel; }

        @Override
        public void onEndPage(PdfWriter writer, Document doc) {
            String titulo = "Informe Final de Plan de Mejora\nNivel "
                + (nivel != null ? nivel : 3);
            PdfPTable header = PdfStyles.encabezadoInstitucional(
                CODIGO, VERSION, FECHA_FORMATO,
                writer.getPageNumber() + " de " + TOTAL_PAGINAS, titulo);
            header.setTotalWidth(doc.right() - doc.left());
            PdfContentByte cb = writer.getDirectContent();
            // Dibuja el encabezado en la banda superior, por encima del área de contenido.
            header.writeSelectedRows(0, -1, doc.left(), doc.getPageSize().getHeight() - 28, cb);
        }
    }

    public byte[] generar(InformeFinalPm informe) {
        // Margen superior amplio para alojar el encabezado institucional por página.
        Document doc = new Document(PageSize.LETTER, 55, 55, 100, 55);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            writer.setPageEvent(new HeaderPorPagina(informe.getNivel()));
            doc.open();

            Font small  = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font normal = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font bold   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font h2     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, PdfStyles.AZUL_UE);
            Font caratulaTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, PdfStyles.AZUL_UE);
            Font caratulaSub    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);

            var pm = informe.getPlanMejora();
            var trimestre = pm.getTrimestre();
            var convenio = trimestre.getConvenio();
            Estudiante est = convenio.getEstudiante();
            String nombre = (safe(est.getNombres()) + " " + safe(est.getApellidos())).trim();
            String tutorEmp = convenio.getTutorEmpresarial() != null
                ? (safe(convenio.getTutorEmpresarial().getNombres()) + " "
                   + safe(convenio.getTutorEmpresarial().getApellidos())).trim()
                : "—";
            String profesor = convenio.getTutorAcademico() != null
                ? (safe(convenio.getTutorAcademico().getNombres()) + " "
                   + safe(convenio.getTutorAcademico().getApellidos())).trim()
                : "—";

            String tituloInformeStr = informe.getTituloInforme();
            if (tituloInformeStr == null || tituloInformeStr.isBlank()) {
                tituloInformeStr = safe(pm.getTitulo());
            }

            // ===================== CARÁTULA (Página 1 de 15) =====================
            Paragraph rotulo = new Paragraph(
                "Título del Informe Final de Plan de Mejora Nivel "
                    + (informe.getNivel() != null ? informe.getNivel() : 3), caratulaSub);
            rotulo.setAlignment(Element.ALIGN_CENTER);
            doc.add(spacer(30));
            doc.add(rotulo);
            doc.add(spacer(30));

            Paragraph tInf = new Paragraph(tituloInformeStr, caratulaTitulo);
            tInf.setAlignment(Element.ALIGN_CENTER);
            doc.add(tInf);
            // El flag "Alto Impacto" va en su sección dedicada (no en la carátula), como el template oficial.

            doc.add(spacer(80));

            doc.add(caratulaLinea("Nombre del estudiante: ", nombre, bold, normal));
            doc.add(caratulaLinea("Programa académico: ", safe(est.getProgramaAcademico()), bold, normal));
            doc.add(caratulaLinea("Profesor acompañante: ", profesor, bold, normal));

            doc.add(spacer(30));
            Paragraph fecha = new Paragraph(LocalDate.now().format(FECHA), normal);
            fecha.setAlignment(Element.ALIGN_CENTER);
            doc.add(fecha);

            doc.newPage();

            // ===================== PÁGINA 2: datos + nota aclaratoria =====================
            Paragraph rotulo2 = new Paragraph(
                "Título del Informe Final de Plan de Mejora Nivel "
                    + (informe.getNivel() != null ? informe.getNivel() : 3), bold);
            rotulo2.setAlignment(Element.ALIGN_CENTER);
            doc.add(rotulo2);
            Paragraph t2 = new Paragraph(tituloInformeStr, normal);
            t2.setAlignment(Element.ALIGN_CENTER);
            doc.add(t2);
            doc.add(spacer(14));

            doc.add(seccion("Información del Estudiante", h2));
            doc.add(linea("Nombre del Estudiante:", nombre, bold, normal));
            doc.add(linea("Programa Académico:", safe(est.getProgramaAcademico()), bold, normal));
            doc.add(linea("Semestre:", est.getSemestre() == null ? "—" : est.getSemestre().toString(), bold, normal));
            doc.add(linea("Promoción:", "—", bold, normal));
            doc.add(spacer(8));

            doc.add(seccion("Información de la Empresa", h2));
            doc.add(linea("Razón Social:", safe(convenio.getEmpresa().getRazonSocial()), bold, normal));
            doc.add(linea("Nombre del Tutor Empresarial:", tutorEmp, bold, normal));
            String cargo = informe.getCargoTutorEmpresarial();
            if ((cargo == null || cargo.isBlank()) && convenio.getTutorEmpresarial() != null) {
                cargo = convenio.getTutorEmpresarial().getCargo();
            }
            doc.add(linea("Cargo del Tutor:", (cargo == null || cargo.isBlank()) ? "—" : cargo, bold, normal));
            doc.add(linea("Email del Tutor:",
                convenio.getTutorEmpresarial() != null && convenio.getTutorEmpresarial().getEmail() != null
                    ? convenio.getTutorEmpresarial().getEmail() : "—", bold, normal));
            doc.add(spacer(10));

            doc.add(seccion("Nota aclaratoria", h2));
            Paragraph nota = new Paragraph(
                "Estimado estudiante: para la aprobación del Informe de Plan de Mejora como opción "
                + "de trabajo de grado, debe diligenciar todos los parámetros contemplados en este "
                + "documento. Tenga en cuenta que su evaluación está a cargo del profesor de "
                + "acompañamiento y del tutor de la empresa, quienes verificarán la presentación y "
                + "completitud del Informe. Recuerde que, para su aprobación, este producto deberá "
                + "obtener una nota igual o superior a 3.0, y en su elaboración no deberá superar las "
                + "15 páginas de desarrollo.", normal);
            nota.setAlignment(Element.ALIGN_JUSTIFIED);
            doc.add(nota);

            doc.newPage();

            // ===================== DESARROLLO: 12 secciones numeradas =====================
            Paragraph devTitulo = new Paragraph(
                "Informe Final de Plan de Mejora Nivel "
                    + (informe.getNivel() != null ? informe.getNivel() : 3),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, PdfStyles.AZUL_UE));
            devTitulo.setAlignment(Element.ALIGN_CENTER);
            devTitulo.setSpacingAfter(10);
            doc.add(devTitulo);

            String contextualizacion = informe.getContextualizacionEmpresa() != null
                    && !informe.getContextualizacionEmpresa().isBlank()
                ? informe.getContextualizacionEmpresa()
                : informe.getContextualizacion();
            String objEspecificos = informe.getObjetivosEspecificos() != null
                    && !informe.getObjetivosEspecificos().isBlank()
                ? informe.getObjetivosEspecificos()
                : informe.getObjetivos();

            addSeccion(doc, h2, normal, "1. Resumen Ejecutivo", informe.getResumenEjecutivo());
            addSeccion(doc, h2, normal, "2. Contextualización de la Empresa Coformadora", contextualizacion);
            addSeccion(doc, h2, normal, "3. Planteamiento del Problema", informe.getPlanteamientoProblema());
            addSeccion(doc, h2, normal, "4. Marco Teórico", informe.getMarcoTeorico());

            doc.add(seccion("5. Objetivo General y Objetivos Específicos", h2));
            addSub(doc, bold, normal, "5.1 Objetivo General:", informe.getObjetivoGeneral());
            addSub(doc, bold, normal, "5.2 Objetivos Específicos:", objEspecificos);

            // ---- 6. Diagnóstico Empresarial (tablas institucionales GTC-FM-16) ----
            doc.add(seccion("6. Diagnóstico Empresarial", h2));
            // Texto introductorio opcional: conserva el texto plano previo si existe.
            if (informe.getDiagnostico() != null && !informe.getDiagnostico().isBlank()) {
                Paragraph introDx = new Paragraph(informe.getDiagnostico(), normal);
                introDx.setAlignment(Element.ALIGN_JUSTIFIED);
                introDx.setSpacingAfter(6);
                doc.add(introDx);
            }

            doc.add(subtitulo("6.1 Diagnóstico Externo", bold));
            addTabla(doc,
                "Tabla 1 — Tabla de Recolección de Datos para el Diagnóstico Externo",
                "Descripción del Factor", "Análisis del Factor",
                new String[][]{
                    {"Político", informe.getPestelPolitico()},
                    {"Económico", informe.getPestelEconomico()},
                    {"Social", informe.getPestelSocial()},
                    {"Tecnológico", informe.getPestelTecnologico()},
                });

            addSub(doc, bold, normal,
                "6.1.1 Diagnóstico de la Ventaja Competitiva", informe.getVentajaCompetitiva());

            doc.add(subtitulo("6.2 Diagnóstico Interno o del Área Funcional", bold));
            addTabla(doc,
                "Tabla 2 — Tabla de Recolección de Datos para el Análisis Interno o del Área Funcional",
                "Descripción del Factor", "Análisis del Factor",
                new String[][]{
                    {"Capacidad directiva (Analiza el liderazgo, motivación, gestión y toma de decisiones)",
                        informe.getInternoCapacidadDirectiva()},
                    {"Capacidad tecnológica (Analiza software, hardware, tecnología avanzada o tecnología obsoleta)",
                        informe.getInternoCapacidadTecnologica()},
                    {"Capacidad técnica (Analiza la estructura o ambiente físico y capacidad instalada del área)",
                        informe.getInternoCapacidadTecnica()},
                    {"Capacidad de talento humano (Analiza ambiente laboral, capacitación y desarrollo personal de los colaboradores, experiencia de servicio)",
                        informe.getInternoTalentoHumano()},
                });

            // ---- 7. Metodología del Plan de Mejora (Tabla 3 — 5W) ----
            doc.add(seccion("7. Metodología del Plan de Mejora", h2));
            if (informe.getMetodologia() != null && !informe.getMetodologia().isBlank()) {
                Paragraph introMet = new Paragraph(informe.getMetodologia(), normal);
                introMet.setAlignment(Element.ALIGN_JUSTIFIED);
                introMet.setSpacingAfter(6);
                doc.add(introMet);
            }
            addTabla(doc, "Tabla 3 — Metodología del Plan de Mejora", null, null,
                new String[][]{
                    {"¿Qué hacer?", informe.getMetodologiaQue()},
                    {"¿Cómo hacerlo?", informe.getMetodologiaComo()},
                    {"¿Cuándo hacerlo?", informe.getMetodologiaCuando()},
                    {"¿Dónde hacerlo?", informe.getMetodologiaDonde()},
                    {"¿Con quién hacerlo?", informe.getMetodologiaConQuien()},
                });
            if (informe.getPropuestaSolucion() != null && !informe.getPropuestaSolucion().isBlank()) {
                addSub(doc, bold, normal, "7.1 Propuesta de Solución:", informe.getPropuestaSolucion());
            }

            addSeccion(doc, h2, normal, "8. Justificación del Plan de Mejora", informe.getJustificacion());
            addSeccion(doc, h2, normal, "9. Factibilidad del Plan de Mejora", informe.getFactibilidad());
            addSeccion(doc, h2, normal, "10. Resultados", informe.getResultados());
            addSeccion(doc, h2, normal, "11. Conclusiones", informe.getConclusiones());
            addSeccion(doc, h2, normal, "12. Referencias bibliográficas", informe.getReferenciasApa());
            if (informe.getAnexos() != null && !informe.getAnexos().isBlank()) {
                addSeccion(doc, h2, normal, "Anexos", informe.getAnexos());
            }

            // ===================== FIRMAS Y CALIFICACIÓN =====================
            doc.add(spacer(16));
            doc.add(firmaLinea("Nombre del estudiante:", nombre,
                Boolean.TRUE.equals(informe.getFirmadoEstudiante()), bold, normal));
            doc.add(spacer(10));
            doc.add(firmaLinea("Nombre del tutor empresarial:", tutorEmp,
                Boolean.TRUE.equals(informe.getFirmadoTutorEmp()), bold, normal));
            doc.add(new Paragraph("Firma de aprobación del tutor empresarial: "
                + (Boolean.TRUE.equals(informe.getFirmadoTutorEmp()) ? "[ FIRMADO ]" : "_______________"), normal));
            doc.add(spacer(10));
            doc.add(firmaLinea("Nombre del profesor de acompañamiento:", profesor,
                Boolean.TRUE.equals(informe.getFirmadoTutorAcad()), bold, normal));
            doc.add(new Paragraph("Firma de aprobación del profesor de acompañamiento: "
                + (Boolean.TRUE.equals(informe.getFirmadoTutorAcad()) ? "[ FIRMADO ]" : "_______________"), normal));

            doc.add(spacer(14));
            doc.add(linea("Nota del profesor:", nota(informe.getNotaProfesor()), bold, normal));
            doc.add(linea("Nota del tutor:", nota(informe.getNotaTutor()), bold, normal));
            doc.add(linea("Nota definitiva del Plan de Mejora (valor promediado entre nota de profesor y tutor):",
                informe.getNotaPromedio() != null ? nota(informe.getNotaPromedio()) : "—", bold, normal));
            if (informe.getNotaPromedio() != null) {
                boolean aprueba = informe.getNotaPromedio().compareTo(NOTA_MINIMA) >= 0;
                doc.add(linea("Resultado (nota mínima 3.0):", aprueba ? "APROBADO" : "NO APROBADO", bold, normal));
            }
            boolean alto = Boolean.TRUE.equals(informe.getAltoImpacto());
            doc.add(linea("El plan de mejora es de alto impacto (Marque con una X):",
                "SI: " + (alto ? "[X]" : "[ ]") + "    No: " + (!alto ? "[X]" : "[ ]"), bold, normal));

            doc.add(spacer(10));
            Paragraph notaImpacto = new Paragraph(
                "Nota: El Plan de Mejora de Alto Impacto se considera así porque la empresa puede "
                + "implementarlo directamente, generando mejoras concretas y alineadas con sus "
                + "objetivos estratégicos.", small);
            notaImpacto.setAlignment(Element.ALIGN_JUSTIFIED);
            doc.add(notaImpacto);

            doc.add(spacer(8));
            doc.add(seccion("Observaciones de los evaluadores", h2));
            String obsEval = informe.getObservacionesRevisor();
            Paragraph obs = new Paragraph(
                (obsEval == null || obsEval.isBlank()) ? "—" : obsEval, normal);
            obs.setAlignment(Element.ALIGN_JUSTIFIED);
            doc.add(obs);

            doc.close();
        } catch (DocumentException ex) {
            throw new IllegalStateException("Error generando Informe Final PM (GTC-FM-16)", ex);
        }
        return out.toByteArray();
    }

    private static Paragraph seccion(String texto, Font h2) {
        Paragraph p = new Paragraph(texto, h2);
        p.setSpacingBefore(10);
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

    private static Paragraph caratulaLinea(String etiqueta, String valor, Font bold, Font normal) {
        Paragraph p = linea(etiqueta, valor, bold, normal);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingAfter(6);
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

    private static void addSub(Document doc, Font bold, Font normal, String titulo, String contenido)
        throws DocumentException {
        Paragraph t = new Paragraph(titulo, bold);
        t.setSpacingBefore(4);
        t.setSpacingAfter(2);
        doc.add(t);
        Paragraph p = new Paragraph(contenido == null || contenido.isBlank() ? "—" : contenido, normal);
        p.setAlignment(Element.ALIGN_JUSTIFIED);
        p.setSpacingAfter(6);
        doc.add(p);
    }

    private static Paragraph subtitulo(String texto, Font bold) {
        Paragraph p = new Paragraph(texto, bold);
        p.setSpacingBefore(8);
        p.setSpacingAfter(2);
        return p;
    }

    /**
     * Renderiza una tabla institucional de 2 columnas (descripción/análisis o pregunta/respuesta).
     * Si {@code colIzq}/{@code colDer} son nulos no se imprime fila de cabeceras (caso Tabla 3).
     * La primera columna lleva la etiqueta FIJA del template; la segunda el contenido del usuario
     * ("—" cuando está vacío).
     */
    private static void addTabla(Document doc, String titulo, String colIzq, String colDer,
                                 String[][] filas) throws DocumentException {
        Paragraph t = new Paragraph(titulo,
            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PdfStyles.AZUL_UE));
        t.setSpacingBefore(6);
        t.setSpacingAfter(4);
        doc.add(t);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{42f, 58f});
        table.setSpacingAfter(8);

        Font hf = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, java.awt.Color.WHITE);
        Font lf = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font vf = FontFactory.getFont(FontFactory.HELVETICA, 9);

        if (colIzq != null && colDer != null) {
            table.addCell(tablaCell(colIzq, hf, PdfStyles.AZUL_UE, Element.ALIGN_CENTER));
            table.addCell(tablaCell(colDer, hf, PdfStyles.AZUL_UE, Element.ALIGN_CENTER));
        }
        for (String[] fila : filas) {
            table.addCell(tablaCell(fila[0], lf, PdfStyles.GRIS_SUAVE, Element.ALIGN_LEFT));
            String v = (fila[1] == null || fila[1].isBlank()) ? "—" : fila[1];
            table.addCell(tablaCell(v, vf, null, Element.ALIGN_LEFT));
        }
        doc.add(table);
    }

    private static PdfPCell tablaCell(String text, Font font, java.awt.Color bg, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text == null ? "" : text, font));
        if (bg != null) c.setBackgroundColor(bg);
        c.setPadding(5);
        c.setHorizontalAlignment(align);
        return c;
    }

    private static Paragraph firmaLinea(String etiqueta, String nombre, boolean firmado, Font bold, Font normal) {
        Phrase ph = new Phrase();
        ph.add(new Chunk(etiqueta + " ", bold));
        ph.add(new Chunk(nombre, normal));
        ph.add(new Chunk("  —  " + (firmado ? "[ FIRMADO ]" : "[ pendiente ]"), normal));
        Paragraph p = new Paragraph(ph);
        p.setSpacingAfter(2);
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

    private static String nota(BigDecimal n) {
        return n == null ? "— (sin calificar)" : n.stripTrailingZeros().toPlainString();
    }
}
