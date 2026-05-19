package co.uempresarial.sivu.automatizacion.pdf;

import co.uempresarial.sivu.convenio.domain.Convenio;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class FormalizacionPdfGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new Locale("es", "CO"));

    public byte[] generar(Convenio convenio) {
        Document document = new Document(PageSize.LETTER, 60, 60, 60, 60);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font tituloFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Font.BOLD);
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            Paragraph titulo = new Paragraph("CONVENIO DE PRÁCTICA PROFESIONAL", tituloFont);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(8);
            document.add(titulo);

            Paragraph num = new Paragraph("Número: " + convenio.getNumeroConvenio(), subFont);
            num.setAlignment(Element.ALIGN_CENTER);
            num.setSpacingAfter(24);
            document.add(num);

            document.add(parrafo("Entre la Universidad Empresarial, en adelante \"LA UNIVERSIDAD\", "
                + "y la empresa " + convenio.getEmpresa().getRazonSocial()
                + " identificada con NIT " + convenio.getEmpresa().getNit()
                + ", en adelante \"LA EMPRESA\", se acuerda el presente convenio de práctica profesional "
                + "para el estudiante " + convenio.getEstudiante().getNombres() + " "
                + convenio.getEstudiante().getApellidos()
                + " identificado con " + convenio.getEstudiante().getTipoDocumento()
                + " " + convenio.getEstudiante().getNumeroDocumento()
                + ", en adelante \"EL PRACTICANTE\".",
                normalFont));

            document.add(seccion("1. OBJETO", subFont));
            document.add(parrafo("EL PRACTICANTE desarrollará la práctica profesional denominada \""
                + convenio.getVacante().getTitulo() + "\" "
                + "en modalidad " + convenio.getVacante().getModalidad()
                + ", en el área " + convenio.getVacante().getAreaPractica() + ".",
                normalFont));

            document.add(seccion("2. DURACIÓN", subFont));
            document.add(parrafo("La práctica se desarrollará entre el "
                + convenio.getFechaInicio().format(DATE_FMT)
                + " y el " + convenio.getFechaFin().format(DATE_FMT)
                + ", con una duración total de " + convenio.getVacante().getDuracionMeses()
                + " meses.", normalFont));

            document.add(seccion("3. DESCRIPCIÓN DE LA VACANTE", subFont));
            document.add(parrafo(convenio.getVacante().getDescripcion(), normalFont));

            document.add(seccion("4. OBLIGACIONES DE LAS PARTES", subFont));
            document.add(parrafo("LA UNIVERSIDAD se compromete a designar un tutor académico que dará seguimiento "
                + "a la práctica. LA EMPRESA se compromete a brindar el acompañamiento de un tutor empresarial y "
                + "los recursos necesarios para el desarrollo de las actividades. EL PRACTICANTE se compromete a "
                + "cumplir con las actividades asignadas y las normas internas de LA EMPRESA.", normalFont));

            document.add(seccion("5. FIRMAS", subFont));
            document.add(parrafo("\n\n_______________________________      _______________________________\n"
                + "  Estudiante                                                Empresa\n\n\n"
                + "_______________________________\n"
                + "  Universidad Empresarial", normalFont));

            document.close();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando PDF del convenio", ex);
        }
        return out.toByteArray();
    }

    private Paragraph seccion(String texto, Font font) {
        Paragraph p = new Paragraph(texto, font);
        p.setSpacingBefore(14);
        p.setSpacingAfter(6);
        return p;
    }

    private Paragraph parrafo(String texto, Font font) {
        Paragraph p = new Paragraph(texto, font);
        p.setAlignment(Element.ALIGN_JUSTIFIED);
        p.setSpacingAfter(6);
        return p;
    }
}
