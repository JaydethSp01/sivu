package co.uempresarial.sivu.plantilla.pdf;

import co.uempresarial.sivu.plantilla.domain.*;
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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import static co.uempresarial.sivu.trimestre.pdf.PdfStyles.*;

/**
 * PDF dinámico para cualquier respuesta de plantilla. Renderiza secciones,
 * criterios y valores tal como están en la BD — sin reglas hardcoded.
 */
@Component
public class RespuestaFormularioPdfGenerator {

    private static final DateTimeFormatter FECHA =
        DateTimeFormatter.ofPattern("yyyy-MM-dd", new Locale("es", "CO"));

    public byte[] generar(RespuestaFormulario r) {
        PlantillaFormulario p = r.getPlantilla();
        Document document = new Document(PageSize.LETTER, 30, 30, 30, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Encabezado institucional con código/versión de la plantilla
            document.add(encabezadoInstitucional(
                p.getCodigo(),
                p.getVersion(),
                LocalDate.now().format(FECHA),
                p.getNombre()));
            document.add(espacio(8));

            // Datos del contexto
            PdfPTable contexto = new PdfPTable(2);
            contexto.setWidthPercentage(100);
            contexto.addCell(seccionCell("Información del formulario", 2));
            contexto.addCell(campoCell("Asignado a", safe(r.getAsignadoANombre())));
            contexto.addCell(campoCell("Rol", safe(r.getAsignadoARol())));
            contexto.addCell(campoCell("Fecha asignación",
                r.getFechaAsignacion() == null ? "" : r.getFechaAsignacion().toLocalDate().format(FECHA)));
            contexto.addCell(campoCell("Estado", r.getEstado().name()));
            if (r.getEstudiante() != null) {
                String nombre = (r.getEstudiante().getNombres() + " " + r.getEstudiante().getApellidos()).trim();
                contexto.addCell(campoCell("Estudiante", nombre));
                contexto.addCell(campoCell("Programa", safe(r.getEstudiante().getProgramaAcademico())));
            }
            document.add(contexto);
            document.add(espacio(8));

            // Índice de valores por criterio
            Map<Long, RespuestaCriterio> valoresPorCriterio = new HashMap<>();
            for (RespuestaCriterio rc : r.getRespuestas()) {
                if (rc.getCriterio() != null) {
                    valoresPorCriterio.put(rc.getCriterio().getId(), rc);
                }
            }

            // Render dinámico de secciones + criterios
            for (SeccionPlantilla s : p.getSecciones()) {
                PdfPTable t = new PdfPTable(new float[]{4f, 1.2f});
                t.setWidthPercentage(100);
                String tituloSeccion = s.getTitulo()
                    + (s.getPeso() != null ? "  (" + porcentaje(s.getPeso()) + ")" : "");
                t.addCell(seccionCell(tituloSeccion, 2));

                if (s.getDescripcion() != null && !s.getDescripcion().isBlank()) {
                    PdfPCell desc = celdaTexto(s.getDescripcion(), FUENTE_TEXTO, Element.ALIGN_LEFT);
                    desc.setColspan(2);
                    t.addCell(desc);
                }

                if (s.getCriterios().isEmpty()) {
                    // Sin criterios numéricos: muestra observaciones libres si las hay
                    PdfPCell vacia = celdaTexto("(Sin criterios definidos)", FUENTE_PEQUENO, Element.ALIGN_CENTER);
                    vacia.setColspan(2);
                    t.addCell(vacia);
                } else {
                    for (CriterioPlantilla c : s.getCriterios()) {
                        String etiqueta = c.getDescripcion()
                            + (c.getPeso() != null ? "  (" + porcentaje(c.getPeso()) + ")" : "");
                        t.addCell(celdaTexto(etiqueta, FUENTE_TEXTO, Element.ALIGN_LEFT));

                        RespuestaCriterio rc = valoresPorCriterio.get(c.getId());
                        String valor = "—";
                        if (rc != null) {
                            if (rc.getValorNumero() != null) valor = rc.getValorNumero().toPlainString();
                            else if (rc.getValorTexto() != null) valor = rc.getValorTexto();
                            else if (rc.getValorBool() != null) valor = rc.getValorBool() ? "Sí" : "No";
                        }
                        t.addCell(celdaTextoFondo(valor, FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER, GRIS_SUAVE));
                    }
                }
                document.add(t);
                document.add(espacio(4));
            }

            // Nota calculada (si la plantilla tiene pesos)
            if (r.getNotaCalculada() != null) {
                PdfPTable nota = new PdfPTable(2);
                nota.setWidthPercentage(60);
                nota.setHorizontalAlignment(Element.ALIGN_RIGHT);
                nota.addCell(celdaTextoFondo("NOTA CALCULADA", FUENTE_CAMPO, Element.ALIGN_RIGHT, GRIS_SUAVE));
                nota.addCell(celdaTextoFondo(r.getNotaCalculada().toPlainString(),
                    FUENTE_TEXTO_BOLD, Element.ALIGN_CENTER, GRIS_SUAVE));
                document.add(nota);
                document.add(espacio(6));
            }

            // Observaciones generales
            if (r.getObservaciones() != null && !r.getObservaciones().isBlank()) {
                PdfPTable obs = new PdfPTable(1);
                obs.setWidthPercentage(100);
                obs.addCell(seccionCell("Observaciones", 1));
                obs.addCell(celdaTexto(r.getObservaciones(), FUENTE_TEXTO, Element.ALIGN_LEFT));
                document.add(obs);
                document.add(espacio(6));
            }

            // Firma
            PdfPTable firma = new PdfPTable(2);
            firma.setWidthPercentage(100);
            firma.addCell(celdaTexto("Firmado por", FUENTE_CAMPO, Element.ALIGN_LEFT));
            firma.addCell(celdaTexto(
                r.getFirmadoPorNombre() == null ? "(Sin firmar)" : r.getFirmadoPorNombre(),
                FUENTE_TEXTO, Element.ALIGN_LEFT));
            firma.addCell(celdaTexto("Fecha de firma", FUENTE_CAMPO, Element.ALIGN_LEFT));
            firma.addCell(celdaTexto(
                r.getFechaFirma() == null ? "—" : r.getFechaFirma().toLocalDate().format(FECHA),
                FUENTE_TEXTO, Element.ALIGN_LEFT));
            document.add(firma);

            document.close();
        } catch (Exception ex) {
            throw new RuntimeException("Error generando PDF de respuesta " + r.getId(), ex);
        }
        return out.toByteArray();
    }

    private static String porcentaje(BigDecimal v) {
        return v.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP) + "%";
    }
}
