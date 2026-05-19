package co.uempresarial.sivu.cartapresentacion.pdf;

import co.uempresarial.sivu.cartapresentacion.domain.CartaPresentacion;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.vacante.domain.Vacante;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class CartaPresentacionPdfGenerator {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern(
        "dd 'de' MMMM 'de' yyyy", new Locale("es", "CO"));

    public byte[] generar(CartaPresentacion carta) {
        Postulacion p = carta.getPostulacion();
        Estudiante e = p.getEstudiante();
        Vacante v = p.getVacante();
        Empresa em = v.getEmpresa();

        Document doc = new Document(PageSize.LETTER, 60, 60, 60, 60);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font small  = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font normal = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font bold   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);

            // Encabezado institucional
            Paragraph header = new Paragraph("UNIVERSIDAD EMPRESARIAL\n"
                + "OFICINA DE COFORMACIÓN EMPRESARIAL\n"
                + "Carta de Presentación de Estudiante en Práctica\n"
                + "Código: GAC-FM-CARTA   Versión: 1   Fecha: " + LocalDate.now().format(FECHA),
                small);
            header.setAlignment(Element.ALIGN_CENTER);
            doc.add(header);

            doc.add(spacer(20));

            // Fecha
            Paragraph fecha = new Paragraph("Bogotá D.C., " + LocalDate.now().format(FECHA), normal);
            fecha.setAlignment(Element.ALIGN_RIGHT);
            doc.add(fecha);

            doc.add(spacer(18));

            // Destinatario
            doc.add(new Paragraph("Señores", bold));
            doc.add(new Paragraph(em.getRazonSocial(), bold));
            doc.add(new Paragraph("NIT: " + em.getNit(), normal));
            if (em.getDireccion() != null) doc.add(new Paragraph(em.getDireccion(), normal));
            doc.add(new Paragraph("Ciudad", normal));

            doc.add(spacer(14));

            // Asunto
            Paragraph asunto = new Paragraph("Asunto: Presentación de estudiante para Práctica en Coformación", bold);
            doc.add(asunto);

            doc.add(spacer(12));

            // Saludo
            doc.add(new Paragraph("Cordial saludo,", normal));
            doc.add(spacer(10));

            // Cuerpo
            String nombre = (safe(e.getNombres()) + " " + safe(e.getApellidos())).trim();
            String programa = safe(e.getProgramaAcademico());
            String tipoDoc = e.getTipoDocumento() == null ? "C.C." : e.getTipoDocumento().toString();
            String doc1 = safe(e.getNumeroDocumento());
            int meses = v.getDuracionMeses() == null ? 6 : v.getDuracionMeses();

            String cuerpo = """
                Por medio de la presente, la Oficina de Coformación de la Universidad Empresarial
                presenta formalmente al(a) estudiante %s, identificado(a) con %s No. %s, del
                programa académico de %s, como candidato(a) para realizar su Práctica de
                Coformación Empresarial en la vacante "%s" de su empresa, por un período de
                %d meses.

                Nuestro estudiante ha completado satisfactoriamente los requisitos académicos
                exigidos para esta etapa formativa y su perfil ha sido evaluado y aprobado por
                nuestra Oficina de Coformación. Confiamos en que aportará valor a sus equipos y
                desarrollará las competencias propias del modelo de Coformación Empresarial que
                caracteriza a nuestra institución.

                Agradecemos su acompañamiento y la asignación de un Tutor Empresarial que guíe
                al estudiante durante el período, conforme a los lineamientos establecidos en el
                Plan de Actividades (GAC-FM-10) y las reuniones de seguimiento (GAC-FM-11) que
                forman parte integral del proceso.

                Quedamos atentos para coordinar la formalización del convenio.
                """.formatted(nombre, tipoDoc, doc1, programa, safe(v.getTitulo()), meses);

            for (String parrafo : cuerpo.split("\n\n")) {
                Paragraph par = new Paragraph(parrafo.trim().replace("\n", " "), normal);
                par.setAlignment(Element.ALIGN_JUSTIFIED);
                par.setSpacingAfter(8);
                doc.add(par);
            }

            if (carta.getContenidoExtra() != null && !carta.getContenidoExtra().isBlank()) {
                Paragraph extra = new Paragraph(carta.getContenidoExtra(), normal);
                extra.setAlignment(Element.ALIGN_JUSTIFIED);
                extra.setSpacingAfter(8);
                doc.add(extra);
            }

            doc.add(spacer(24));

            // Firma
            String firmaCoord = carta.getFirmadaPorCoordNombre() == null
                ? "Coordinador(a) de Coformación Empresarial"
                : carta.getFirmadaPorCoordNombre();
            doc.add(new Paragraph("_______________________________________", normal));
            doc.add(new Paragraph(firmaCoord, bold));
            doc.add(new Paragraph("Oficina de Coformación Empresarial", normal));
            doc.add(new Paragraph("Universidad Empresarial", normal));

            doc.close();
        } catch (DocumentException ex) {
            throw new IllegalStateException("Error generando Carta de Presentación", ex);
        }
        return out.toByteArray();
    }

    private static Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(height);
        return p;
    }

    private static String safe(Object o) {
        return o == null ? "" : o.toString();
    }
}
