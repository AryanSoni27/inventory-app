package com.inventory.scheduler;

import com.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserScheduler {

    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void pingDatabaseEveryHour() {
        log.info("Pinging database... Executing count query on user repository.");
        long userCount = userRepository.count();
        log.info("Database ping successful. Total users in repository: {}", userCount);
    }
}
