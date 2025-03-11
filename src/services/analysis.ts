import { dataSource } from '@/lib/store/db';
import { StockTrade } from '@/entities/trade';
import { Like, MoreThanOrEqual, In } from 'typeorm';

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

    // 近7天成交量倍量
    async getVolumeSurgeStocks(n: number = 1.5) {
        const today = this.getTodayDate();

        if (this.stockTradeRepo) {
            return this.stockTradeRepo.query(`
                SELECT t.symbol
                    FROM (
                    SELECT 
                        s1.symbol,
                        s1.date,
                        s1.volume,
                        (SELECT AVG(s2.volume) 
                        FROM stock_trade s2 
                        WHERE s2.symbol = s1.symbol 
                        AND s2.date BETWEEN DATE_FORMAT(s1.date - INTERVAL 6 DAY, '%Y%m%d') 
                                        AND s1.date
                        ) as ma7_volume
                    FROM stock_trade s1
                    WHERE s1.date BETWEEN DATE_FORMAT(? - INTERVAL 3 DAY, '%Y%m%d') AND ?
                    ) t
                    WHERE t.volume >= t.ma7_volume * ?
                    GROUP BY t.symbol
                    HAVING COUNT(DISTINCT t.date) = 3
            `, [today, today, n]);
        }

        return [];
    }

}