package co.uempresarial.sivu.automatizacion.web;

import co.uempresarial.sivu.automatizacion.service.ChecklistRequisitosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checklist")
@RequiredArgsConstructor
@Tag(name = "Checklist de requisitos",
     description = "Calcula los documentos requeridos para postular a una vacante según su modalidad, cruzando con los documentos ya cargados por el estudiante")
public class ChecklistRequisitosController {

    private final ChecklistRequisitosService service;

    @GetMapping("/vacante/{vacanteId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener checklist de requisitos para una vacante (opcionalmente cruzado con los documentos de un estudiante)")
    public ResponseEntity<ChecklistRequisitosService.ResumenChecklist> porVacante(
        @PathVariable Long vacanteId,
        @RequestParam(required = false) Long estudianteId
    ) {
        return ResponseEntity.ok(service.checklistParaVacante(vacanteId, estudianteId));
    }
}
