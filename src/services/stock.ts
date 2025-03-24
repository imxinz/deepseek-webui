import axios from 'axios';
import { dataSource } from '@/lib/store/db';
import { Stock } from '@/entities/stock';
import { API_CONFIG } from '@/lib/api/config';
import { logger } from "@/lib/utils/logger";

export class StockCollectorService {
    private stockRepo;
    private readonly logger = logger;

    constructor() {
        // 添加数据库连接检查
        if (!dataSource.isInitialized) {
            dataSource.initialize().then(() => {
                this.stockRepo = dataSource.getRepository(Stock);
                this.logger.info('Database connection established!');
            }).catch(error => {
                this.logger.error('Database connection failed', {
                    error: error.stack,
                    dbConfig: dataSource.options // 自动过滤敏感字段
                });
                throw new Error(`数据库连接失败: ${error.message}`);
            });
        } else {
            this.stockRepo = dataSource.getRepository(Stock);
        }
    }

    async importStocksFromCSV(filePath: string) {
        const csv = require('csv-parser');
        const fs = require('fs');
        const results: Stock[] = [];
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        return new Promise((resolve, reject) => {
            console.log('filePath', filePath);
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data: any) => {
                    console.log('原始CSV行数据:', data);

                    if (!data.symbol || !data.code) {
                        // this.logger.warn('无效的股票记录', data);
                        return;
                    }

                    // 适配MySQL导出的字段命名风格
                    const stock = new Stock();
                    stock.symbol = data.symbol || data['`symbol`'] || data['"symbol"'];
                    stock.code = data.code || data['`code`'] || '';
                    stock.name = data.name || data['`name`'] || '未知名称';
                    stock.date = today;

                    // 处理可能存在的转义字符
                    // if (stock.symbol) {
                    //     stock.symbol = stock.symbol.replace(/['"`]/g, '');
                    // }

                    results.push(stock);
                })
                .on('end', async () => {
                    try {
                        // 新增行业题材获取逻辑
                        for (const stock of results) {
                            try {
                                console.log('stock', stock);
                                let industryRes, subjectRes;

                                industryRes = await this.fetchProxy('industryAndRegion', {
                                    symbol: stock.symbol
                                });

                                subjectRes = await this.fetchProxy('subject', {
                                    symbol: stock.symbol
                                });

                                // 解析行业数据
                                let industry = industryRes?.data?.result?.data?.find((item: any) => { return item.BOARD_TYPE == '行业' });
                                let region = industryRes?.data?.result?.data?.find((item: any) => { return item.BOARD_TYPE == '板块' });
                                // 解析题材数据
                                let subjects = subjectRes?.data?.result?.data?.map((item: any) => { return item.BOARD_NAME });


                                console.log(industry, region, subjects);
                                // 赋值前校验必要字段
                                stock.industry = industry?.BOARD_NAME || '';
                                stock.region = region?.BOARD_NAME || '';
                                stock.subject = subjects.join(',') || '';

                            } catch (error: any) {
                                this.logger.warn('获取行业题材失败', {
                                    symbol: stock.symbol,
                                    error: error.message
                                });
                                continue; // 跳过当前股票继续处理下一个
                            }
                        }

                        // 批量插入数据（添加冲突处理）
                        const BATCH_SIZE = 500;
                        for (let i = 0; i < results.length; i += BATCH_SIZE) {
                            const batch = results.slice(i, i + BATCH_SIZE);
                            if (this.stockRepo) {
                                await this.stockRepo.manager.transaction(async (manager) => {
                                    await manager.createQueryBuilder()
                                        .insert()
                                        .into(Stock)
                                        .values(batch)
                                        .orUpdate(['industry', 'subject', 'name'], ['symbol']) // 根据symbol更新字段
                                        .execute();
                                });
                            }
                        }
                        resolve(results.length);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', reject);
        });
    }

    async fetchProxy(urlKey: 'industryAndRegion' | 'subject' = 'industryAndRegion', params: any) {
        let { symbol } = params;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            // 'Referer': 'https://www.sina.com.cn' // 根据实际情况修改
        };

        symbol = symbol.replace(/([a-zA-Z]{2})([0-9]{6})/, `$2.$1`);
        symbol = symbol.toUpperCase();

        const urlMaps = {
            // 行业&地区
            industryAndRegion: `https://datacenter.eastmoney.com/securities/api/data/get?type=RPT_F10_CORETHEME_BOARDTYPE&sty=SECUCODE%2CSECURITY_CODE%2CSECURITY_NAME_ABBR%2CBOARD_CODE%2CBOARD_NAME%2CIS_PRECISE%2CBOARD_RANK%2CBOARD_TYPE&filter=(SECUCODE%3D%22${symbol}%22)&p=1&ps=&sr=1&st=BOARD_RANK&source=HSF10&client=PC`,
            // 板块&题材
            subject: `https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_CORETHEME_BOARDTYPE&columns=SECUCODE%2CSECURITY_CODE%2CSECURITY_NAME_ABBR%2CNEW_BOARD_CODE%2CBOARD_NAME%2CSELECTED_BOARD_REASON%2CIS_PRECISE%2CBOARD_RANK%2CBOARD_YIELD%2CDERIVE_BOARD_CODE&quoteColumns=f3~05~NEW_BOARD_CODE~BOARD_YIELD&filter=(SECUCODE%3D%22${symbol}%22)(IS_PRECISE%3D%221%22)&pageNumber=1&pageSize=&sortTypes=1&sortColumns=BOARD_RANK&source=HSF10`
        };

        return await axios.get(urlMaps[urlKey], {
            headers,
            params: {
                ...params
            },
            timeout: 10000
        });
    }
}