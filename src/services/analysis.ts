import { dataSource } from '@/lib/store/db';
import { StockTrade } from '@/entities/trade';
import { Like, MoreThanOrEqual, In, Between } from 'typeorm';

export class StockAnalysisService {
    private stockTradeRepo;

    constructor() {
        if (!dataSource.isInitialized) {
            dataSource.initialize().then(() => {
                this.stockTradeRepo = dataSource.getRepository(StockTrade);
            });
        } else {
            this.stockTradeRepo = dataSource.getRepository(StockTrade);
        }
    }

    // 获取当日涨停股票（假设涨停为涨幅>=9.9%）
    async getLimitUpStocks(options: any) {
        const today = this.getTodayDate();
        if (this.stockTradeRepo) {
            return this.stockTradeRepo.find({
                where: [
                    // 创业板/科创板 (300/688 开头)
                    {
                        code: Like('300%'),
                        changepercent: MoreThanOrEqual(19.9),
                        date: today
                    },
                    {
                        code: Like('688%'),
                        changepercent: MoreThanOrEqual(19.9),
                        date: today
                    },
                    // 主板 (00/60 开头)
                    {
                        code: Like('00%'),
                        changepercent: MoreThanOrEqual(9.9),
                        date: today
                    },
                    {
                        code: Like('60%'),
                        changepercent: MoreThanOrEqual(9.9),
                        date: today
                    }
                ],
                order: { changepercent: 'DESC' },
                take: options.num || 20
            });
        }
        return [];
    }

    // 获取当日成交额前20
    async getTopTurnoverStocks() {
        const today = this.getTodayDate();
        if (this.stockTradeRepo) {
            return this.stockTradeRepo.find({
                where: { date: today },
                order: { amount: 'DESC' },
                take: 20
            });
        }
        return [];
    }

    // 获取当日换手率前20
    async getTopTurnoverRatioStocks() {
        const today = this.getTodayDate();
        if (this.stockTradeRepo) {
            return this.stockTradeRepo.find({
                where: { date: today },
                order: { turnoverratio: 'DESC' },
                take: 20
            });
        }
        return [];
    }

    // 涨停&成交量&换手均靠前-市场龙
    async getCompositeConditionStocks() {
        const [limitUp, topTurnover, topRatio] = await Promise.all([
            this.getLimitUpStocks({}),
            this.getTopTurnoverStocks(),
            this.getTopTurnoverRatioStocks()
        ]);

        // 获取symbol交集
        const symbols = this.findCommonSymbols([limitUp, topTurnover, topRatio]);

        if (this.stockTradeRepo) {
            return this.stockTradeRepo.find({
                where: { symbol: In(symbols) },
                order: { changepercent: 'DESC', amount: 'DESC', turnoverratio: 'DESC' }
            });
        }
        return [];
    }

    private getTodayDate() {
        return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }

    private findCommonSymbols(resultsArrays: StockTrade[][]) {
        const symbolCounts = new Map<string, number>();
        resultsArrays.forEach(arr => {
            new Set(arr.map(item => item.symbol)).forEach(symbol => {
                symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
            });
        });
        return Array.from(symbolCounts.entries())
            .filter(([_, count]) => count === resultsArrays.length)
            .map(([symbol]) => symbol);
    }

    /**
     * 量价首次异动选股
     * 1. 今日收盘价是近n天最高价
     * 2. 近n天累计涨幅大于0小于20
     * 3. 今日量是近n天平均量x倍
     * @param n 时间周期n天
     * @param x 当日成交量是近n天均量的x倍
     * @returns 
     */
    async getVolumeSurgeByDays(n: number = 5, x: number = 2) {
        const today = this.getTodayDate();

        if (this.stockTradeRepo) {
            return this.stockTradeRepo.query(`
                SELECT 
                s1.symbol,
                s1.name,
                s1.code,
                s1.trade AS price,
                s1.changepercent AS changepercent,
                s1.volume,
                (s1.volume / ma.ma_volume) AS ratio
            FROM stock_trade s1
            INNER JOIN (
                SELECT 
                    main.symbol,
                    AVG(main.volume) AS ma_volume,
                    MAX(main.trade) AS max_price,
                    (
                        SELECT trade 
                        FROM stock_trade prev 
                        WHERE prev.symbol = main.symbol 
                        AND prev.date = DATE_FORMAT(? - INTERVAL ? DAY, '%Y%m%d')
                        LIMIT 1
                    ) AS start_price
                FROM stock_trade main
                WHERE main.date BETWEEN DATE_FORMAT(? - INTERVAL ? DAY, '%Y%m%d') 
                                  AND DATE_FORMAT(? - INTERVAL 1 DAY, '%Y%m%d')
                GROUP BY main.symbol
                HAVING start_price IS NOT NULL
            ) ma ON s1.symbol = ma.symbol
            WHERE s1.date = ?
              AND s1.volume >= ma.ma_volume * ?
              AND s1.trade >= ma.max_price
              AND (s1.trade - ma.start_price)/ma.start_price * 100 BETWEEN 0 AND 20
            GROUP BY s1.symbol  -- 添加 GROUP BY 去重
            ORDER BY ratio DESC
            `, [today, n, today, n, today, today, x]);
        }

        return [];
    }

    /**
     * 获取指定股票的近n天数据
     * @param symbols 
     * @param n 
     * @returns 
     */
    async getStocksDataInDays(symbols: string[], n: number) {
        if (!symbols.length || n <= 0) return [];
        const today = this.getTodayDate();
        const startDate = this.getDateStringBeforeDays(n);
    
        if (this.stockTradeRepo) {
            return this.stockTradeRepo.find({
                where: {
                    symbol: In(symbols),
                    date: Between(startDate, today)
                },
                order: {
                    symbol: "ASC",
                    date: "DESC" // 按日期倒序排列，最新日期在前
                }
            });
        }
        return [];
    }
    
    private getDateStringBeforeDays(days: number) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    }

    
}