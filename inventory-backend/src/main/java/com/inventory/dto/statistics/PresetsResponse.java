package com.inventory.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresetsResponse {
    private PresetItem thisWeek;
    private PresetItem lastWeek;
    private PresetItem thisMonth;
    private PresetItem lastMonth;
    private PresetItem thisQuarter;
    private PresetItem lastQuarter;
    private PresetItem thisYear;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PresetItem {
        private String startDate;
        private String endDate;
    }
}
