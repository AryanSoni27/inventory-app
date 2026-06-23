package com.inventory.service;

import com.inventory.dto.statistics.*;
import com.inventory.entity.User;
import com.inventory.enums.TransactionType;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final EntityManager entityManager;
    private final UserRepository userRepository;

    public SummaryResponse getSummaryStats(LocalDate startDate, LocalDate endDate, String type, String username, boolean isAdmin) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        User user = getUserIfNotAdmin(username, isAdmin);

        StringBuilder jpql = new StringBuilder("SELECT ")
                .append("COUNT(t.id), ")
                .append("SUM(CASE WHEN t.transactionType = 'REMOVE' THEN t.quantity ELSE 0 END), ")
                .append("SUM(CASE WHEN t.transactionType = 'ADD' THEN t.quantity ELSE 0 END), ")
                .append("COUNT(DISTINCT t.item.id) ")
                .append("FROM StockTransaction t WHERE t.createdAt BETWEEN :start AND :end ");

        if (user != null) {
            jpql.append("AND t.item.user = :user ");
        }
        if (type != null) {
            jpql.append("AND t.transactionType = :type ");
        }

        Query query = entityManager.createQuery(jpql.toString());
        query.setParameter("start", start);
        query.setParameter("end", end);
        if (user != null) query.setParameter("user", user);
        if (type != null) query.setParameter("type", TransactionType.valueOf(type.toUpperCase()));

        Object[] result = (Object[]) query.getSingleResult();
        long totalTransactions = result[0] != null ? ((Number) result[0]).longValue() : 0;
        long totalSold = result[1] != null ? ((Number) result[1]).longValue() : 0;
        long totalRestocked = result[2] != null ? ((Number) result[2]).longValue() : 0;
        long totalItems = result[3] != null ? ((Number) result[3]).longValue() : 0;

        SummaryResponse.ItemSummary mostSold = getMostActiveItem(start, end, TransactionType.REMOVE, user);
        SummaryResponse.ItemSummary mostRestocked = getMostActiveItem(start, end, TransactionType.ADD, user);

        return SummaryResponse.builder()
                .totalTransactions(totalTransactions)
                .totalQuantitySold(totalSold)
                .totalQuantityRestocked(totalRestocked)
                .totalItemsAffected(totalItems)
                .mostSoldItem(mostSold)
                .mostRestockedItem(mostRestocked)
                .dateRange(new SummaryResponse.DateRange(startDate.toString(), endDate.toString()))
                .build();
    }

    private SummaryResponse.ItemSummary getMostActiveItem(LocalDateTime start, LocalDateTime end, TransactionType type, User user) {
        StringBuilder jpql = new StringBuilder("SELECT t.item.id, t.item.name, SUM(t.quantity) AS totalQty ")
                .append("FROM StockTransaction t WHERE t.createdAt BETWEEN :start AND :end AND t.transactionType = :type ");

        if (user != null) {
            jpql.append("AND t.item.user = :user ");
        }
        jpql.append("GROUP BY t.item.id, t.item.name ORDER BY totalQty DESC");

        Query query = entityManager.createQuery(jpql.toString());
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("type", type);
        if (user != null) query.setParameter("user", user);
        query.setMaxResults(1);

        List<?> results = query.getResultList();
        if (!results.isEmpty()) {
            Object[] row = (Object[]) results.get(0);
            return SummaryResponse.ItemSummary.builder()
                    .itemId(((Number) row[0]).longValue())
                    .itemName((String) row[1])
                    .totalQuantity(((Number) row[2]).longValue())
                    .build();
        }
        return null;
    }

    public TrendResponse getTrendData(LocalDate startDate, LocalDate endDate, String groupBy, String type, String username, boolean isAdmin) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        User user = getUserIfNotAdmin(username, isAdmin);

        String dateFormat;
        switch (groupBy.toLowerCase()) {
            case "daily":
                dateFormat = "%Y-%m-%d";
                break;
            case "weekly":
                dateFormat = "%Y-%v"; // Year and Week
                break;
            case "monthly":
                dateFormat = "%Y-%m";
                break;
            case "quarterly":
                dateFormat = "Q"; // Handled differently in MySQL usually, we'll use CONCAT(YEAR, '-Q', QUARTER)
                break;
            default:
                dateFormat = "%Y-%m";
        }

        StringBuilder nativeQueryStr = new StringBuilder();
        if (groupBy.equalsIgnoreCase("quarterly")) {
            nativeQueryStr.append("SELECT CONCAT(YEAR(t.created_at), '-Q', QUARTER(t.created_at)) AS period, ");
        } else {
            nativeQueryStr.append("SELECT DATE_FORMAT(t.created_at, '").append(dateFormat).append("') AS period, ");
        }

        nativeQueryStr.append("SUM(CASE WHEN t.transaction_type = 'REMOVE' THEN t.quantity ELSE 0 END) AS sold, ")
                .append("SUM(CASE WHEN t.transaction_type = 'ADD' THEN t.quantity ELSE 0 END) AS restocked ")
                .append("FROM stock_transactions t ");
        
        if (user != null) {
            nativeQueryStr.append("JOIN items i ON t.item_id = i.id ");
        }
        
        nativeQueryStr.append("WHERE t.created_at BETWEEN :start AND :end ");

        if (user != null) {
            nativeQueryStr.append("AND i.user_id = :userId ");
        }
        if (type != null) {
            nativeQueryStr.append("AND t.transaction_type = :type ");
        }

        if (groupBy.equalsIgnoreCase("quarterly")) {
            nativeQueryStr.append("GROUP BY period ORDER BY period ASC");
        } else {
            nativeQueryStr.append("GROUP BY DATE_FORMAT(t.created_at, '").append(dateFormat).append("') ORDER BY period ASC");
        }

        Query query = entityManager.createNativeQuery(nativeQueryStr.toString());
        query.setParameter("start", start);
        query.setParameter("end", end);
        if (user != null) query.setParameter("userId", user.getId());
        if (type != null) query.setParameter("type", type.toUpperCase());

        List<Object[]> results = query.getResultList();
        List<TrendDataPoint> dataPoints = new ArrayList<>();

        for (Object[] row : results) {
            String period = (String) row[0];
            long sold = row[1] != null ? ((Number) row[1]).longValue() : 0;
            long restocked = row[2] != null ? ((Number) row[2]).longValue() : 0;
            
            String label = formatPeriodLabel(period, groupBy);
            dataPoints.add(TrendDataPoint.builder()
                    .period(period)
                    .label(label)
                    .sold(sold)
                    .restocked(restocked)
                    .net(restocked - sold)
                    .build());
        }

        return TrendResponse.builder()
                .groupBy(groupBy)
                .data(dataPoints)
                .build();
    }

    private String formatPeriodLabel(String period, String groupBy) {
        try {
            if ("monthly".equalsIgnoreCase(groupBy)) {
                LocalDate d = LocalDate.parse(period + "-01");
                return d.format(DateTimeFormatter.ofPattern("MMM yyyy"));
            } else if ("quarterly".equalsIgnoreCase(groupBy)) {
                String[] parts = period.split("-"); // 2026-Q1
                return parts[1] + " " + parts[0];
            } else if ("weekly".equalsIgnoreCase(groupBy)) {
                String[] parts = period.split("-");
                return "Week " + parts[1] + ", " + parts[0];
            } else if ("daily".equalsIgnoreCase(groupBy)) {
                LocalDate d = LocalDate.parse(period);
                return d.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));
            }
        } catch (Exception e) {
            // fallback
        }
        return period;
    }

    public ItemBreakdownPageResponse getItemBreakdown(LocalDate startDate, LocalDate endDate, String type, String sortBy, int page, int size, String username, boolean isAdmin) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        User user = getUserIfNotAdmin(username, isAdmin);

        StringBuilder selectClause = new StringBuilder("SELECT t.item.id, t.item.name, t.item.unit, ")
                .append("SUM(CASE WHEN t.transactionType = 'REMOVE' THEN t.quantity ELSE 0 END) AS totalSold, ")
                .append("SUM(CASE WHEN t.transactionType = 'ADD' THEN t.quantity ELSE 0 END) AS totalRestocked, ")
                .append("COUNT(t.id) AS txCount, MAX(t.createdAt) AS lastTxDate ");
        
        StringBuilder countClause = new StringBuilder("SELECT COUNT(DISTINCT t.item.id) ");

        StringBuilder fromWhereClause = new StringBuilder("FROM StockTransaction t WHERE t.createdAt BETWEEN :start AND :end ");

        if (user != null) {
            fromWhereClause.append("AND t.item.user = :user ");
        }
        if (type != null) {
            fromWhereClause.append("AND t.transactionType = :type ");
        }

        String groupByClause = "GROUP BY t.item.id, t.item.name, t.item.unit ";
        String orderByClause = "";
        
        if ("restocked".equalsIgnoreCase(sortBy)) {
            orderByClause = "ORDER BY totalRestocked DESC ";
        } else if ("name".equalsIgnoreCase(sortBy)) {
            orderByClause = "ORDER BY t.item.name ASC ";
        } else {
            orderByClause = "ORDER BY totalSold DESC ";
        }

        Query countQuery = entityManager.createQuery(countClause.toString() + fromWhereClause.toString());
        countQuery.setParameter("start", start);
        countQuery.setParameter("end", end);
        if (user != null) countQuery.setParameter("user", user);
        if (type != null) countQuery.setParameter("type", TransactionType.valueOf(type.toUpperCase()));

        long totalElements = ((Number) countQuery.getSingleResult()).longValue();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        Query dataQuery = entityManager.createQuery(selectClause.toString() + fromWhereClause.toString() + groupByClause + orderByClause);
        dataQuery.setParameter("start", start);
        dataQuery.setParameter("end", end);
        if (user != null) dataQuery.setParameter("user", user);
        if (type != null) dataQuery.setParameter("type", TransactionType.valueOf(type.toUpperCase()));

        dataQuery.setFirstResult(page * size);
        dataQuery.setMaxResults(size);

        List<Object[]> results = dataQuery.getResultList();
        List<ItemBreakdownResponse> content = new ArrayList<>();

        for (Object[] row : results) {
            content.add(ItemBreakdownResponse.builder()
                    .itemId(((Number) row[0]).longValue())
                    .itemName((String) row[1])
                    .unit((String) row[2])
                    .totalSold(((Number) row[3]).longValue())
                    .totalRestocked(((Number) row[4]).longValue())
                    .transactionCount(((Number) row[5]).longValue())
                    .lastTransactionDate((LocalDateTime) row[6])
                    .build());
        }

        return ItemBreakdownPageResponse.builder()
                .content(content)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .currentPage(page)
                .build();
    }

    public PresetsResponse getPresets() {
        LocalDate today = LocalDate.now();

        LocalDate thisWeekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate thisWeekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        
        LocalDate lastWeekStart = thisWeekStart.minusWeeks(1);
        LocalDate lastWeekEnd = thisWeekEnd.minusWeeks(1);

        LocalDate thisMonthStart = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate thisMonthEnd = today.with(TemporalAdjusters.lastDayOfMonth());

        LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
        LocalDate lastMonthEnd = lastMonthStart.with(TemporalAdjusters.lastDayOfMonth());

        int currentQuarter = (today.getMonthValue() - 1) / 3 + 1;
        LocalDate thisQuarterStart = LocalDate.of(today.getYear(), (currentQuarter - 1) * 3 + 1, 1);
        LocalDate thisQuarterEnd = thisQuarterStart.plusMonths(2).with(TemporalAdjusters.lastDayOfMonth());

        LocalDate lastQuarterStart = thisQuarterStart.minusMonths(3);
        LocalDate lastQuarterEnd = lastQuarterStart.plusMonths(2).with(TemporalAdjusters.lastDayOfMonth());

        LocalDate thisYearStart = today.with(TemporalAdjusters.firstDayOfYear());
        LocalDate thisYearEnd = today.with(TemporalAdjusters.lastDayOfYear());

        return PresetsResponse.builder()
                .thisWeek(new PresetsResponse.PresetItem(thisWeekStart.toString(), thisWeekEnd.toString()))
                .lastWeek(new PresetsResponse.PresetItem(lastWeekStart.toString(), lastWeekEnd.toString()))
                .thisMonth(new PresetsResponse.PresetItem(thisMonthStart.toString(), thisMonthEnd.toString()))
                .lastMonth(new PresetsResponse.PresetItem(lastMonthStart.toString(), lastMonthEnd.toString()))
                .thisQuarter(new PresetsResponse.PresetItem(thisQuarterStart.toString(), thisQuarterEnd.toString()))
                .lastQuarter(new PresetsResponse.PresetItem(lastQuarterStart.toString(), lastQuarterEnd.toString()))
                .thisYear(new PresetsResponse.PresetItem(thisYearStart.toString(), thisYearEnd.toString()))
                .build();
    }

    private User getUserIfNotAdmin(String username, boolean isAdmin) {
        if (isAdmin) return null;
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
