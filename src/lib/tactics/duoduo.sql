-- 移除了CTE改为嵌套子查询，因MySQL 5.6不支持CTE
SELECT 
  symbol,
  name,
  date,
  trade,
  changepercent,
  volume,
  turnoverratio
FROM (
  -- KDJ计算
  SELECT *,
    CASE WHEN (
      (SELECT AVG(trade) FROM stock_trade t2 
       WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
       ORDER BY date DESC LIMIT 9,1)  -- 模拟9日移动平均
      >
      (SELECT AVG(trade) FROM stock_trade t2 
       WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
       ORDER BY date DESC LIMIT 10,1)
    ) THEN 1 ELSE 0 END AS kd_signal
  FROM (
    -- MACD计算
    SELECT *,
      (SELECT AVG(trade) FROM stock_trade t2 
       WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
       ORDER BY date DESC LIMIT 12) - 
      (SELECT AVG(trade) FROM stock_trade t2 
       WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
       ORDER BY date DESC LIMIT 26) AS dif,
      (SELECT AVG(trade) FROM stock_trade t2 
       WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
       ORDER BY date DESC LIMIT 9) AS dea
    FROM (
      -- 量能分析
      SELECT *,
        (SELECT AVG(volume) FROM stock_trade t2 
         WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
         ORDER BY date DESC LIMIT 5) AS avg_5d_vol,
        volume / IFNULL((SELECT AVG(volume) FROM stock_trade t2 
                        WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
                        ORDER BY date DESC LIMIT 5), 1) AS vol_ratio
      FROM (
        -- 布林线计算
        SELECT *,
          (SELECT AVG(trade) FROM stock_trade t2 
           WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
           ORDER BY date DESC LIMIT 20) AS boll_mid,
          (SELECT STD(trade) FROM stock_trade t2 
           WHERE t2.symbol = t1.symbol AND t2.date <= t1.date 
           ORDER BY date DESC LIMIT 20) AS boll_std
        FROM (
          -- 移动平均计算
          SELECT t.*,
            (SELECT AVG(trade) FROM stock_trade t2 
             WHERE t2.symbol = t.symbol AND t2.date <= t.date 
             ORDER BY date DESC LIMIT 5) AS ma5,
            (SELECT AVG(trade) FROM stock_trade t2 
             WHERE t2.symbol = t.symbol AND t2.date <= t.date 
             ORDER BY date DESC LIMIT 10) AS ma10,
            (SELECT AVG(trade) FROM stock_trade t2 
             WHERE t2.symbol = t.symbol AND t2.date <= t.date 
             ORDER BY date DESC LIMIT 20) AS ma20
          FROM stock_trade t
        ) t1
      ) t1
    ) t1
  ) t1
) t1
WHERE
  trade > ma5 
  AND trade > (boll_mid + 2*boll_std)
  AND changepercent >= 3
  AND (trade - (SELECT trade FROM stock_trade t2 
               WHERE t2.symbol = t1.symbol AND t2.date < t1.date 
               ORDER BY date DESC LIMIT 1 OFFSET 3)) / 
      (SELECT trade FROM stock_trade t2 
       WHERE t2.symbol = t1.symbol AND t2.date < t1.date 
       ORDER BY date DESC LIMIT 1 OFFSET 3) <= 0.15
  AND volume >= 2 * avg_5d_vol
  AND turnoverratio > 1
  AND vol_ratio > 1
  AND dif > dea 
  AND kd_signal = 1
  AND ma5 > ma10
  AND trade > ma20
  AND name NOT LIKE '%ST%'
  AND date = '20250321';