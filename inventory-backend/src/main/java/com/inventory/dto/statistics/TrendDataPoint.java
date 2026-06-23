package com.inventory.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendDataPoint {
    private String period;
    private String label;
    private long sold;
    private long restocked;
    private long net;
}
