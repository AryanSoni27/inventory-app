package com.inventory.config;

import com.inventory.entity.Item;
import com.inventory.entity.User;
import com.inventory.enums.Role;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        User adminUser;
        if (userRepository.findByUsername("admin").isEmpty()) {
            adminUser = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();

            adminUser = userRepository.save(adminUser);
            log.info("✅ Admin user created successfully (username: admin, password: admin123)");
        } else {
            adminUser = userRepository.findByUsername("admin").get();
            log.info("ℹ️ Admin user already exists, skipping seed.");
        }

        // Migrate any existing items that don't have a user assigned
        List<Item> items = itemRepository.findAll();
        boolean migrated = false;
        for (Item item : items) {
            if (item.getUser() == null) {
                item.setUser(adminUser);
                itemRepository.save(item);
                migrated = true;
            }
        }
        if (migrated) {
            log.info("✅ Migrated existing items to be owned by admin.");
        }
    }
}
