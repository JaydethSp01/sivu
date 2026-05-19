package co.uempresarial.sivu.trimestre.pdf;

import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;

import java.awt.Color;

/** Estilos compartidos para los PDFs institucionales Uniempresarial. */
public final class PdfStyles {

    private PdfStyles() {}

    public static final Color AZUL_UE = new Color(15, 76, 129);
    public static final Color GRIS_SUAVE = new Color(238, 238, 240);
    public static final Color GRIS_BORDE = new Color(180, 180, 188);

    public static final Font FUENTE_TITULO       = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, AZUL_UE);
    public static final Font FUENTE_SUBTITULO    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, AZUL_UE);
    public static final Font FUENTE_SECCION      = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
    public static final Font FUENTE_CAMPO        = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY);
    public static final Font FUENTE_VALOR        = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
    public static final Font FUENTE_TEXTO        = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
    public static final Font FUENTE_TEXTO_BOLD   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY);
    public static final Font FUENTE_PEQUENO      = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
    public static final Font FUENTE_HEADER_LOGO  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, AZUL_UE);
    public static final Font FUENTE_HEADER_META  = FontFactory.getFont(FontFactory.HELVETICA, 7, Color.DARK_GRAY);

    /** Encabezado institucional con marca, código y versión. */
    public static PdfPTable encabezadoInstitucional(String codigo, String version, String fecha, String titulo) {
        PdfPTable header = new PdfPTable(new float[]{2.2f, 4.5f, 2.5f});
        header.setWidthPercentage(100);

        PdfPCell logo = new PdfPCell(new Paragraph("Uniempresarial", FUENTE_HEADER_LOGO));
        logo.setBorder(Rectangle.BOX);
        logo.setBorderColor(GRIS_BORDE);
        logo.setPadding(8);
        logo.setHorizontalAlignment(Element.ALIGN_CENTER);
        logo.setVerticalAlignment(Element.ALIGN_MIDDLE);
        header.addCell(logo);

        PdfPCell titulo1 = new PdfPCell(new Paragraph(titulo, FUENTE_SUBTITULO));
        titulo1.setBorder(Rectangle.BOX);
        titulo1.setBorderColor(GRIS_BORDE);
        titulo1.setPadding(8);
        titulo1.setHorizontalAlignment(Element.ALIGN_CENTER);
        titulo1.setVerticalAlignment(Element.ALIGN_MIDDLE);
        header.addCell(titulo1);

        PdfPTable meta = new PdfPTable(2);
        meta.addCell(metaCell("Código", true));
        meta.addCell(metaCell(codigo, false));
        meta.addCell(metaCell("Versión", true));
        meta.addCell(metaCell(version, false));
        meta.addCell(metaCell("Fecha", true));
        meta.addCell(metaCell(fecha, false));
        PdfPCell metaWrap = new PdfPCell(meta);
        metaWrap.setBorder(Rectangle.BOX);
        metaWrap.setBorderColor(GRIS_BORDE);
        metaWrap.setPadding(2);
        header.addCell(metaWrap);
        return header;
    }

    private static PdfPCell metaCell(String text, boolean header) {
        PdfPCell c = new PdfPCell(new Phrase(text, FUENTE_HEADER_META));
        c.setBorder(Rectangle.BOX);
        c.setBorderColor(GRIS_BORDE);
        c.setPadding(3);
        if (header) c.setBackgroundColor(GRIS_SUAVE);
        return c;
    }

    public static PdfPCell seccionCell(String texto, int colspan) {
        PdfPCell c = new PdfPCell(new Phrase(texto.toUpperCase(), FUENTE_SECCION));
        c.setBackgroundColor(AZUL_UE);
        c.setPadding(5);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setColspan(colspan);
        return c;
    }

    public static PdfPCell campoCell(String campo, String valor) {
        PdfPTable tbl = new PdfPTable(new float[]{2f, 5f});
        tbl.setWidthPercentage(100);
        PdfPCell c1 = new PdfPCell(new Phrase(campo, FUENTE_CAMPO));
        c1.setBackgroundColor(GRIS_SUAVE);
        c1.setPadding(4);
        PdfPCell c2 = new PdfPCell(new Phrase(valor == null ? "" : valor, FUENTE_VALOR));
        c2.setPadding(4);
        tbl.addCell(c1);
        tbl.addCell(c2);
        PdfPCell wrap = new PdfPCell(tbl);
        wrap.setPadding(0);
        return wrap;
    }

    public static PdfPCell celdaTexto(String texto, Font font, int align) {
        PdfPCell c = new PdfPCell(new Phrase(texto == null ? "" : texto, font));
        c.setPadding(4);
        c.setHorizontalAlignment(align);
        return c;
    }

    public static PdfPCell celdaTextoFondo(String texto, Font font, int align, Color bg) {
        PdfPCell c = celdaTexto(texto, font, align);
        c.setBackgroundColor(bg);
        return c;
    }

    public static Paragraph espacio(float h) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(h);
        return p;
    }

    public static String safe(String s) { return s == null ? "" : s; }
}
