import axios from 'axios';
import { dataSource } from '@/lib/store/db';
import { StockTrade } from '@/entities/trade';
import { API_CONFIG } from '@/lib/api/config';

export class CollectorService {
    private stockTradeRepo;

    constructor() {
        // 添加数据库连接检查
        if (!dataSource.isInitialized) {
            dataSource.initialize().then(() => {
                this.stockTradeRepo = dataSource.getRepository(StockTrade);
            }).catch(error => {
                throw new Error(`数据库连接失败: ${error.message}`);
            });
        } else {
            this.stockTradeRepo = dataSource.getRepository(StockTrade);
        }
    }

    async fetchProxy(apiKey: string, params: any) {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.sina.com.cn' // 根据实际情况修改
        };

        return await axios.get(`https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/${apiKey}`, {
            headers,
            params: {
                key: API_CONFIG['SINA_API_KEY'],
                ...params
            },
            timeout: 10000
        });
    }

    // 采集股票数据
    async collectStockData(options = { market: 'sh_a', pageSize: 100, maxPages: 40 }) {
        try {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const existingSymbols = await this.getExistingSymbols(today); // 新增存在性检查

            const collectedData = [];
            let currentPage = 1;

            //?page=1&num=100&sort=changepercent&asc=0&node=sh_a&symbol=sh688598
            // 分页采集数据
            while (currentPage <= options.maxPages) {
                const response = await this.fetchProxy('Market_Center.getHQNodeData', {
                    num: 500,
                    sort: 'amoun',
                    asc: 0,
                    node: options.market,
                    symbol: '',
                    page: currentPage,
                });

                console.log('response', response);

                // 当没有数据时停止采集
                if (!response.data?.length) break;

                collectedData.push(...response.data);
                currentPage++;
            }

            const newData = collectedData.filter(item =>
                !existingSymbols.has(`${item.symbol}_${today}`)
            ).map(item => ({
                ...item,
                date: today  // 添加日期字段
            }));

            // 批量入库（分块事务处理）
            const BATCH_SIZE = 500;
            let successCount = 0;
            if (this.stockTradeRepo) {
                for (let i = 0; i < newData.length; i += BATCH_SIZE) {
                    const batch = newData.slice(i, i + BATCH_SIZE);
                    await this.stockTradeRepo.manager.transaction(async (manager) => {
                        // 添加冲突处理（假设symbol是唯一标识）
                        await manager.createQueryBuilder()
                            .insert()
                            .into(StockTrade)
                            .values(batch)
                            .orUpdate(['trade', 'volume', 'changepercent', 'date'], ['symbol']) // 添加更新冲突字段
                            .execute();
                        successCount += batch.length;
                    });
                }
            }

            return {
                success: true,
                totalCollected: collectedData.length,
                successCount,
                skippedCount: collectedData.length - newData.length,
                failedCount: collectedData.length - successCount
            };
        } catch (error: any) {
            console.error('数据采集失败:', error);
            throw new Error(`股票数据采集失败: ${error.message}`);
        }
    }

    // 新增存在性检查方法
    private async getExistingSymbols(date: string): Promise<Set<string>> {
        if (!this.stockTradeRepo) { return new Set(''); }

        const existRecords = await this.stockTradeRepo.find({
            select: ['symbol'],
            where: { date },
            cache: 30000 // 缓存30秒
        });
        return new Set(existRecords.map(r => `${r.symbol}_${date}`));
    }
}