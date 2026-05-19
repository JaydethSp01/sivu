package co.uempresarial.sivu.hojavida.pdf;

import co.uempresarial.sivu.hojavida.domain.HojaVida;
import co.uempresarial.sivu.hojavida.domain.HojaVidaEducacion;
import co.uempresarial.sivu.hojavida.domain.HojaVidaExperienciaFase;
import co.uempresarial.sivu.hojavida.domain.HojaVidaExperienciaLaboral;
import co.uempresarial.sivu.hojavida.domain.HojaVidaHabilidad;
import co.uempresarial.sivu.hojavida.domain.HojaVidaIdioma;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Genera la Hoja de Vida en PDF replicando el layout institucional de la
 * Universidad Empresarial (formato base "Formato hoja de vida institucional").
 * Estructura: columna izquierda con datos + foto + habilidades + idiomas,
 * columna derecha con perfil + educación + experiencia.
 */
@Component
public class HojaVidaPdfGenerator {

    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("MMMM 'de' yyyy", new Locale("es", "CO"));

    private static final Color AZUL_UE = new Color(15, 76, 129);
    private static final Color GRIS_SUAVE = new Color(238, 238, 240);

    private static final Font FUENTE_NOMBRE       = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, AZUL_UE);
    private static final Font FUENTE_PROGRAMA     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, AZUL_UE);
    private static final Font FUENTE_SECCION      = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE);
    private static final Font FUENTE_SUBSECCION   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, AZUL_UE);
    private static final Font FUENTE_TEXTO        = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
    private static final Font FUENTE_TEXTO_BOLD   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.DARK_GRAY);
    private static final Font FUENTE_PEQUENO      = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, Color.GRAY);
    private static final Font FUENTE_FOOTER       = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

    public byte[] generar(HojaVida hv) {
        Document document = new Document(PageSize.LETTER, 40, 40, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Header con marca Uniempresarial
            PdfPTable header = new PdfPTable(new float[]{1f, 4f});
            header.setWidthPercentage(100);
            header.addCell(cellNoBorder(parrafo("Uniempresarial", FUENTE_NOMBRE)));
            header.addCell(cellNoBorder(parrafo("Hoja de Vida institucional", FUENTE_PROGRAMA)));
            document.add(header);
            document.add(linea(AZUL_UE, 12, 12));

            // Nombre grande
            document.add(parrafo(
                (hv.getEstudiante().getNombres() + " " + hv.getEstudiante().getApellidos()).toUpperCase(),
                FUENTE_NOMBRE));
            document.add(parrafo(
                safe(hv.getEstudiante().getProgramaAcademico())
                    + (hv.getEstudiante().getSemestre() != null
                        ? " — Semestre " + hv.getEstudiante().getSemestre() : ""),
                FUENTE_PROGRAMA));

            document.add(espacio(10));

            // Layout dos columnas (izq datos + habilidades + idiomas; der perfil + educación + experiencia)
            PdfPTable cuerpo = new PdfPTable(new float[]{1.2f, 2.5f});
            cuerpo.setWidthPercentage(100);
            cuerpo.setSpacingBefore(8);

            cuerpo.addCell(columnaIzquierda(hv));
            cuerpo.addCell(columnaDerecha(hv));

            document.add(cuerpo);

            // Footer
            document.add(espacio(14));
            document.add(linea(AZUL_UE, 8, 4));
            Paragraph footer = parrafo(
                "Documento generado por SIVU — Sistema de Vinculación Universitaria",
                FUENTE_FOOTER);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando PDF de la Hoja de Vida", ex);
        }
        return out.toByteArray();
    }

    private PdfPCell columnaIzquierda(HojaVida hv) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.setPaddingRight(12);

        // Caja de "Foto"
        PdfPCell foto = new PdfPCell();
        foto.setBackgroundColor(GRIS_SUAVE);
        foto.setFixedHeight(110);
        foto.setHorizontalAlignment(Element.ALIGN_CENTER);
        foto.setVerticalAlignment(Element.ALIGN_MIDDLE);
        foto.addElement(parrafo("Foto formal\n(fondo blanco o azul)", FUENTE_PEQUENO));
        PdfPTable fotoTable = new PdfPTable(1);
        fotoTable.setWidthPercentage(100);
        fotoTable.addCell(foto);
        c.addElement(fotoTable);

        c.addElement(espacio(10));

        // Datos de contacto
        c.addElement(tituloSeccion("Contacto"));
        if (hv.getTelefonoContacto() != null && !hv.getTelefonoContacto().isBlank()) {
            c.addElement(parrafo("Tel.: " + hv.getTelefonoContacto(), FUENTE_TEXTO));
        }
        c.addElement(parrafo(safe(hv.getEstudiante().getEmail()), FUENTE_TEXTO));
        if (hv.getDireccion() != null && !hv.getDireccion().isBlank()) {
            c.addElement(parrafo(hv.getDireccion()
                + (hv.getCiudad() != null && !hv.getCiudad().isBlank() ? " · " + hv.getCiudad() : ""),
                FUENTE_TEXTO));
        }

        // Habilidades
        c.addElement(espacio(8));
        c.addElement(tituloSeccion("Habilidades técnicas y personales"));
        if (hv.getHabilidades() != null && !hv.getHabilidades().isEmpty()) {
            for (HojaVidaHabilidad h : hv.getHabilidades()) {
                c.addElement(parrafo("• " + h.getDescripcion(), FUENTE_TEXTO));
            }
        } else {
            c.addElement(parrafo("(sin registrar)", FUENTE_PEQUENO));
        }

        // Idiomas
        c.addElement(espacio(8));
        c.addElement(tituloSeccion("Idiomas"));
        if (hv.getIdiomas() != null && !hv.getIdiomas().isEmpty()) {
            for (HojaVidaIdioma i : hv.getIdiomas()) {
                c.addElement(parrafo("• " + i.getIdioma() + ": " + i.getNivel().name(), FUENTE_TEXTO));
            }
        } else {
            c.addElement(parrafo("(sin registrar)", FUENTE_PEQUENO));
        }

        return c;
    }

    private PdfPCell columnaDerecha(HojaVida hv) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.setPaddingLeft(12);

        // PERFIL — SABER / HACER / SER
        c.addElement(tituloSeccion("Perfil"));
        if (hv.getPerfilSaber() != null && !hv.getPerfilSaber().isBlank()) {
            c.addElement(subtituloAzul("SABER"));
            c.addElement(parrafo(hv.getPerfilSaber(), FUENTE_TEXTO));
        }
        if (hv.getPerfilHacer() != null && !hv.getPerfilHacer().isBlank()) {
            c.addElement(espacio(4));
            c.addElement(subtituloAzul("HACER"));
            c.addElement(parrafo(hv.getPerfilHacer(), FUENTE_TEXTO));
        }
        if (hv.getPerfilSer() != null && !hv.getPerfilSer().isBlank()) {
            c.addElement(espacio(4));
            c.addElement(subtituloAzul("SER"));
            c.addElement(parrafo(hv.getPerfilSer(), FUENTE_TEXTO));
        }

        // EDUCACIÓN
        c.addElement(espacio(8));
        c.addElement(tituloSeccion("Educación"));
        if (hv.getEducacion() != null && !hv.getEducacion().isEmpty()) {
            for (HojaVidaEducacion e : hv.getEducacion()) {
                c.addElement(parrafo(e.getPrograma(), FUENTE_TEXTO_BOLD));
                c.addElement(parrafo(e.getInstitucion(), FUENTE_TEXTO));
                c.addElement(parrafo(fechas(e.getFechaInicio(), e.getFechaFin(), e.getEnCurso()), FUENTE_PEQUENO));
                if (e.getObservaciones() != null && !e.getObservaciones().isBlank()) {
                    c.addElement(parrafo(e.getObservaciones(), FUENTE_TEXTO));
                }
                c.addElement(espacio(4));
            }
        } else {
            c.addElement(parrafo("(sin registrar)", FUENTE_PEQUENO));
        }

        // EXPERIENCIA FASE EMPRESA
        c.addElement(espacio(4));
        c.addElement(tituloSeccion("Experiencia fase empresa"));
        if (hv.getExperienciaFase() != null && !hv.getExperienciaFase().isEmpty()) {
            for (HojaVidaExperienciaFase x : hv.getExperienciaFase()) {
                c.addElement(parrafo(x.getEmpresa() + (x.getCargo() != null ? " — " + x.getCargo() : ""),
                    FUENTE_TEXTO_BOLD));
                c.addElement(parrafo(fechas(x.getFechaInicio(), x.getFechaFin(), x.getEnCurso()), FUENTE_PEQUENO));
                if (x.getDescripcion() != null && !x.getDescripcion().isBlank()) {
                    c.addElement(parrafo(x.getDescripcion(), FUENTE_TEXTO));
                }
                c.addElement(espacio(4));
            }
        } else {
            c.addElement(parrafo("(sin registrar)", FUENTE_PEQUENO));
        }

        // EXPERIENCIA LABORAL
        c.addElement(espacio(4));
        c.addElement(tituloSeccion("Experiencia laboral"));
        if (hv.getExperienciaLaboral() != null && !hv.getExperienciaLaboral().isEmpty()) {
            for (HojaVidaExperienciaLaboral x : hv.getExperienciaLaboral()) {
                c.addElement(parrafo(x.getEmpresa() + " — " + x.getCargo(), FUENTE_TEXTO_BOLD));
                c.addElement(parrafo(fechas(x.getFechaInicio(), x.getFechaFin(), x.getEnCurso()), FUENTE_PEQUENO));
                if (x.getDescripcion() != null && !x.getDescripcion().isBlank()) {
                    c.addElement(parrafo(x.getDescripcion(), FUENTE_TEXTO));
                }
                c.addElement(espacio(4));
            }
        } else {
            c.addElement(parrafo("(sin registrar)", FUENTE_PEQUENO));
        }

        return c;
    }

    private String fechas(java.time.LocalDate i, java.time.LocalDate f, Boolean enCurso) {
        String ini = i == null ? "—" : i.format(DATE_FMT);
        String fin = Boolean.TRUE.equals(enCurso) || f == null ? "Actualidad" : f.format(DATE_FMT);
        return ini + "  a  " + fin;
    }

    private Paragraph tituloSeccion(String texto) {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell c = new PdfPCell(parrafo(texto.toUpperCase(), FUENTE_SECCION));
        c.setBackgroundColor(AZUL_UE);
        c.setPadding(5);
        c.setBorder(Rectangle.NO_BORDER);
        t.addCell(c);
        Paragraph p = new Paragraph();
        p.add(t);
        p.setSpacingBefore(6);
        p.setSpacingAfter(4);
        return p;
    }

    private Paragraph subtituloAzul(String texto) {
        Paragraph p = parrafo(texto, FUENTE_SUBSECCION);
        p.setSpacingBefore(2);
        return p;
    }

    private Paragraph parrafo(String texto, Font font) {
        return new Paragraph(safe(texto), font);
    }

    private Paragraph espacio(float h) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(h);
        return p;
    }

    private Paragraph linea(Color color, float spacingBefore, float spacingAfter) {
        Paragraph p = new Paragraph();
        p.setSpacingBefore(spacingBefore);
        p.setSpacingAfter(spacingAfter);
        com.lowagie.text.pdf.draw.LineSeparator ls = new com.lowagie.text.pdf.draw.LineSeparator();
        ls.setLineColor(color);
        ls.setLineWidth(1.2f);
        p.add(new com.lowagie.text.Chunk(ls));
        return p;
    }

    private PdfPCell cellNoBorder(Element e) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.addElement(e);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return c;
    }

    private String safe(String s) { return s == null ? "" : s; }
}
