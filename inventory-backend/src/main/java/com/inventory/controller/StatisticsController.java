package com.inventory.controller;

import com.inventory.dto.statistics.*;
import com.inventory.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String type,
            Authentication authentication
    ) {
        String username = authentication.getName();
        SummaryResponse response = statisticsService.getSummaryStats(startDate, endDate, type, username, isAdmin(authentication));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trends")
    public ResponseEntity<TrendResponse> getTrends(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "monthly") String groupBy,
            @RequestParam(required = false) String type,
            Authentication authentication
    ) {
        String username = authentication.getName();
        TrendResponse response = statisticsService.getTrendData(startDate, endDate, groupBy, type, username, isAdmin(authentication));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/items")
    public ResponseEntity<ItemBreakdownPageResponse> getItems(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "sold") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        String username = authentication.getName();
        ItemBreakdownPageResponse response = statisticsService.getItemBreakdown(startDate, endDate, type, sortBy, page, size, username, isAdmin(authentication));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/presets")
    public ResponseEntity<PresetsResponse> getPresets() {
        return ResponseEntity.ok(statisticsService.getPresets());
    }
}
