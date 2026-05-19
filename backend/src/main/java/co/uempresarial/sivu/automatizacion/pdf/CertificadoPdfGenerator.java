package co.uempresarial.sivu.automatizacion.pdf;

import co.uempresarial.sivu.convenio.domain.Convenio;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class CertificadoPdfGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern(
        "dd 'de' MMMM 'de' yyyy", new Locale("es", "CO"));

    public byte[] generar(Convenio convenio) {
        if (convenio.getCalificacionFinal() == null) {
            throw new IllegalStateException("El convenio no tiene calificación final asignada");
        }

        Document document = new Document(PageSize.LETTER.rotate(), 60, 60, 60, 60);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font tituloFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, Font.BOLD);
            Font subFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Font.BOLD);
            Font nombreFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.BOLD);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 13);
            Font calFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.BOLD);

            document.add(centered("UNIVERSIDAD EMPRESARIAL", subFont, 0));
            document.add(centered("CERTIFICADO DE PRÁCTICA PROFESIONAL", tituloFont, 18));

            document.add(centered("La Universidad Empresarial certifica que:", normalFont, 30));

            String nombreEstudiante = (convenio.getEstudiante().getNombres() + " "
                + convenio.getEstudiante().getApellidos()).toUpperCase();
            document.add(centered(nombreEstudiante, nombreFont, 24));

            document.add(centered("identificado(a) con " + convenio.getEstudiante().getTipoDocumento()
                + " " + convenio.getEstudiante().getNumeroDocumento(), normalFont, 12));

            String parrafo = "Realizó y completó satisfactoriamente su práctica profesional denominada \""
                + convenio.getVacante().getTitulo()
                + "\", en la empresa " + convenio.getEmpresa().getRazonSocial()
                + " (NIT " + convenio.getEmpresa().getNit() + "), correspondiente al programa académico de "
                + convenio.getEstudiante().getProgramaAcademico() + ".";
            document.add(parrafo(parrafo, normalFont, 18));

            String periodo = "Periodo de práctica: " + convenio.getFechaInicio().format(DATE_FMT)
                + " al " + convenio.getFechaFin().format(DATE_FMT)
                + " (" + convenio.getVacante().getDuracionMeses() + " meses).";
            document.add(parrafo(periodo, normalFont, 6));

            document.add(centered("Calificación final obtenida:", normalFont, 24));
            document.add(centered(convenio.getCalificacionFinal().toPlainString() + " / 5.00", calFont, 6));

            document.add(parrafo("Número de convenio: " + convenio.getNumeroConvenio(), normalFont, 24));

            document.add(parrafo("Se expide el presente certificado a solicitud del interesado a los "
                + java.time.LocalDate.now().format(DATE_FMT) + ".", normalFont, 12));

            document.add(parrafo("\n\n_______________________________      _______________________________\n"
                + "  Director(a) del Programa                                Coordinación de Prácticas\n"
                + "  Universidad Empresarial                                Universidad Empresarial",
                normalFont, 28));

            document.close();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando PDF del certificado", ex);
        }
        return out.toByteArray();
    }

    private Paragraph centered(String texto, Font font, float spacingBefore) {
        Paragraph p = new Paragraph(texto, font);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingBefore(spacingBefore);
        return p;
    }

    private Paragraph parrafo(String texto, Font font, float spacingBefore) {
        Paragraph p = new Paragraph(texto, font);
        p.setAlignment(Element.ALIGN_JUSTIFIED);
        p.setSpacingBefore(spacingBefore);
        return p;
    }
}
