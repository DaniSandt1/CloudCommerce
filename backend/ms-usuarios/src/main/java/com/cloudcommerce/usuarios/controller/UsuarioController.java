package com.cloudcommerce.usuarios.controller;

import com.cloudcommerce.usuarios.model.Direccion;
import com.cloudcommerce.usuarios.model.Usuario;
import com.cloudcommerce.usuarios.repository.DireccionRepository;
import com.cloudcommerce.usuarios.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final DireccionRepository direccionRepository;

    public UsuarioController(UsuarioRepository usuarioRepository, DireccionRepository direccionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.direccionRepository = direccionRepository;
    }

    @GetMapping("/")
    public Map<String, String> root() {
        Map<String, String> body = new HashMap<>();
        body.put("service", "ms-usuarios");
        body.put("status", "ok");
        return body;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "ok");
        body.put("total_usuarios", usuarioRepository.count());
        return body;
    }

    @GetMapping("/usuarios")
    public Page<Usuario> listarUsuarios(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return usuarioRepository.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/usuarios/{id}")
    public Usuario obtenerUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    @PostMapping("/usuarios")
    @ResponseStatus(HttpStatus.CREATED)
    public Usuario crearUsuario(@Valid @RequestBody Usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    @GetMapping("/usuarios/{id}/direcciones")
    public List<Direccion> listarDirecciones(@PathVariable Long id) {
        return direccionRepository.findByUsuarioId(id);
    }

    @PostMapping("/usuarios/{id}/direcciones")
    @ResponseStatus(HttpStatus.CREATED)
    public Direccion crearDireccion(@PathVariable Long id, @Valid @RequestBody Direccion direccion) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        direccion.setUsuario(usuario);
        return direccionRepository.save(direccion);
    }
}
