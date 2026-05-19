package co.uempresarial.sivu.catalogo.requisito.web;

import co.uempresarial.sivu.catalogo.requisito.service.RequisitoModalidadService;
import co.uempresarial.sivu.catalogo.requisito.web.dto.RequisitoModalidadRequest;
import co.uempresarial.sivu.catalogo.requisito.web.dto.RequisitoModalidadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/requisitos-modalidad")
@RequiredArgsConstructor
@Tag(name = "Requisitos por modalidad", description = "Matriz que asocia tipos de requisito documental con modalidades de vinculación")
public class RequisitoModalidadController {

    private final RequisitoModalidadService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Agregar un requisito a una modalidad")
    public ResponseEntity<RequisitoModalidadResponse> agregar(@Valid @RequestBody RequisitoModalidadRequest request) {
        RequisitoModalidadResponse created = service.agregar(request);
        return ResponseEntity.created(URI.create("/api/v1/requisitos-modalidad/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener un requisito de modalidad por id")
    public ResponseEntity<RequisitoModalidadResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/por-modalidad/{modalidadId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar requisitos de una modalidad (ordenados por 'orden ASC', sin paginar)")
    public ResponseEntity<List<RequisitoModalidadResponse>> listarPorModalidad(@PathVariable Long modalidadId) {
        return ResponseEntity.ok(service.listarPorModalidad(modalidadId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Actualizar atributos (obligatorio, orden, instrucciones) de un requisito de modalidad")
    public ResponseEntity<RequisitoModalidadResponse> actualizar(@PathVariable Long id,
                                                                 @Valid @RequestBody RequisitoModalidadRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Operation(summary = "Eliminar un requisito de modalidad")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
