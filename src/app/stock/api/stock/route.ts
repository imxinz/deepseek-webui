import { NextRequest, NextResponse } from 'next/server';
import { StockCollectorService } from '@/services/stock';
const path = require('path');

export async function GET() {
    try {
        const collector = await new StockCollectorService();
        const stockFile = path.resolve(__dirname, '../../../../../../') + '/src/lib/tactics/stocks_raw.csv';
        // console.log('stockFile', stockFile);
        const res = collector.importStocksFromCSV(stockFile);

        return NextResponse.json(res);
    } catch (error) {
        //     console.error('全局错误:', error)
        NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : '未知错误'
        })
    } finally {

    }
}