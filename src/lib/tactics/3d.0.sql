--
-- 策略：
-- 1. 统计日期为20250310到20250321；
-- 2.当天涨幅大于0的量能为阳量，日期范围内阳量平均成交量是日期范围内成交均量的1.2倍及以上； 
-- 3. 当天涨幅小于0的能量为阴量，日期范围内阴量平均成交是日期范围内成交均量的0.8倍及以下； 
-- 4. 日期范围内的阳量呈递增，日期范围内里的阴量呈递减； 
-- 5. 日期范围内阳量占比大于60%； 
-- 6. 日期范围内，阳量和比阴量和大于1.2；
-- 7.日期范围内，涨幅大于9.9%的次数，不小于1”
--

SELECT 
    symbol,
    name
FROM (
    SELECT 
        t.symbol,
        t.name,
        AVG(CASE WHEN changepercent > 0 THEN volume END) AS yang_avg,
        AVG(CASE WHEN changepercent < 0 THEN volume END) AS yin_avg,
        AVG(volume) AS total_avg,
        SUM(changepercent > 0)/COUNT(*) AS yang_ratio,
        SUM(CASE WHEN changepercent > 0 THEN volume ELSE 0 END) /
        NULLIF(SUM(CASE WHEN changepercent < 0 THEN volume ELSE 0 END), 0) AS yang_yin_ratio,
        SUM(changepercent > 9.9) AS up_count,
        MAX(yang_seq_check) AS yang_increasing,
        MAX(yin_seq_check) AS yin_decreasing
    FROM (
        SELECT 
            a.*,
            @yang_seq := IF(a.changepercent > 0, 
                IF(@prev_sym = a.symbol AND a.volume > @prev_yang, @yang_seq + 1, 1),
                @yang_seq
            ) AS yang_seq,
            @yin_seq := IF(a.changepercent < 0, 
                IF(@prev_sym = a.symbol AND a.volume < @prev_yin, @yin_seq + 1, 1),
                @yin_seq
            ) AS yin_seq,
            @yang_seq_check := IF(@prev_sym = a.symbol AND a.changepercent > 0, 
                IF(a.volume > @prev_yang, 1, 0), 
                1
            ) AS yang_seq_check,
            @yin_seq_check := IF(@prev_sym = a.symbol AND a.changepercent < 0, 
                IF(a.volume < @prev_yin, 1, 0), 
                1
            ) AS yin_seq_check,
            @prev_yang := IF(a.changepercent > 0, a.volume, @prev_yang),
            @prev_yin := IF(a.changepercent < 0, a.volume, @prev_yin),
            @prev_sym := a.symbol
        FROM 
            stock_trade a,
            (SELECT @prev_sym := '', @prev_yang := 0, @prev_yin := 0, 
                    @yang_seq := 0, @yin_seq := 0) vars
        WHERE 
            a.date BETWEEN '20250310' AND '20250324'
        ORDER BY 
            a.symbol, a.date
    ) t
    GROUP BY 
        t.symbol, t.name
) result
WHERE
    yang_avg >= total_avg * 1.2    
    AND yin_avg <= total_avg * 0.8 
    AND yang_ratio > 0.6           
    AND yang_yin_ratio > 1.2       
    AND up_count >= 1              
    AND yang_increasing = 1        
    AND yin_decreasing = 1;