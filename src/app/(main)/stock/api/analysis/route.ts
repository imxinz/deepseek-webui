import { NextRequest, NextResponse } from 'next/server';
import { StockAnalysisService } from '@/services/analysis';

// 涨停股接口
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const len = searchParams.get('len') || 20;
  const service = new StockAnalysisService();

  try {
    let data;
    switch(type) {
      case 'limit-up':
        data = await service.getLimitUpStocks({num: len});
        break;
      case 'top-turnover':
        data = await service.getTopTurnoverStocks();
        break;
      case 'top-turnover-ratio':
        data = await service.getTopTurnoverRatioStocks();
        break;
      case 'composite':
        data = await service.getCompositeConditionStocks();
        break;
      case 'volume-surge':
        const multiple = Number(searchParams.get('n')) || 1.5;
        data = await service.getVolumeSurgeStocks(multiple);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' }, 
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Analysis failed', details: JSON.stringify(error) },
      { status: 500 }
    );
  }
}