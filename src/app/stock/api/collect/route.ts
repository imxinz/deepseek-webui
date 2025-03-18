import { NextRequest, NextResponse } from 'next/server';
import { CollectorService } from '@/services/collector';

export async function GET() {
    try {
        const collector = await new CollectorService();
        console.log('collector', collector);
        const markets = ['sz_a', 'sh_a', 'cyb', 'kcb'];

        const results = await Promise.allSettled(
            markets.map(market =>
                collector.collectStockData({
                    market,
                    pageSize: 100,
                    maxPages: 40
                })
            )
        );

        return NextResponse.json(results);

    //     const response = {
    //         totalCollected: 0,
    //         totalSuccess: 0,
    //         totalFailed: 0,
    //         details: results.map((result, index) => ({
    //             market: markets[index],
    //             status: result.status,
    //             ...(result.status === 'fulfilled' ? result.value : {
    //                 error: result.reason.message
    //             })
    //         }))
    //     }

    //     // 汇总统计结果
    //     response.details.forEach((detail, index) => {
    //         if (detail.status === 'fulfilled') {
    //             response.totalCollected += detail.totalCollected
    //             response.totalSuccess += detail.successCount
    //             response.totalFailed += detail.failedCount
    //         } else {
    //             response.totalFailed += 1
    //         }
    //     })

    //     res.status(200).json(response)
    } catch (error) {
    //     console.error('全局错误:', error)
    //     res.status(500).json({
    //         success: false,
    //         message: error instanceof Error ? error.message : '未知错误'
    //     })
    } finally {
    //     // 关闭数据库连接
    //     if (dataSource.isInitialized) {
    //         await dataSource.destroy()
    //     }
    }
}