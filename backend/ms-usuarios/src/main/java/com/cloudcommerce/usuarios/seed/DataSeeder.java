package com.cloudcommerce.usuarios.seed;

import com.cloudcommerce.usuarios.model.Direccion;
import com.cloudcommerce.usuarios.model.Usuario;
import com.cloudcommerce.usuarios.repository.DireccionRepository;
import com.cloudcommerce.usuarios.repository.UsuarioRepository;
import com.github.javafaker.Faker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Carga masiva de usuarios ficticios al arrancar la aplicación, solo si la
 * tabla usuarios está vacía. Controlado por la propiedad "seed.count"
 * (env SEED_COUNT), default 20000.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final DireccionRepository direccionRepository;

    @Value("${seed.count:20000}")
    private int seedCount;

    public DataSeeder(UsuarioRepository usuarioRepository, DireccionRepository direccionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.direccionRepository = direccionRepository;
    }

    @Override
    public void run(String... args) {
        long existentes = usuarioRepository.count();
        if (existentes >= seedCount) {
            System.out.println("Ya existen " + existentes + " usuarios, no se inserta nada más.");
            return;
        }

        Faker faker = new Faker(new Locale("es"));
        long faltantes = seedCount - existentes;
        int lote = 0;
        List<Usuario> buffer = new ArrayList<>();

        for (long i = 0; i < faltantes; i++) {
            String nombre = faker.name().fullName();
            String email = faker.internet().emailAddress() + "." + (existentes + i);
            Usuario usuario = new Usuario(nombre, email, "hash-demo");
            buffer.add(usuario);

            if (buffer.size() >= 500) {
                List<Usuario> guardados = usuarioRepository.saveAll(buffer);
                guardarDireccionesDemo(guardados, faker);
                buffer.clear();
                lote++;
                System.out.println("Insertados " + (lote * 500) + "/" + faltantes);
            }
        }
        if (!buffer.isEmpty()) {
            List<Usuario> guardados = usuarioRepository.saveAll(buffer);
            guardarDireccionesDemo(guardados, faker);
        }
        System.out.println("Listo. Total usuarios en BD: " + usuarioRepository.count());
    }

    private void guardarDireccionesDemo(List<Usuario> usuarios, Faker faker) {
        List<Direccion> direcciones = new ArrayList<>();
        for (Usuario usuario : usuarios) {
            direcciones.add(new Direccion(
                    faker.address().streetAddress(),
                    faker.address().city(),
                    faker.address().country(),
                    usuario
            ));
        }
        direccionRepository.saveAll(direcciones);
    }
}
