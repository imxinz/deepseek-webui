"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function StockList() {
  const [activeTab, setActiveTab] = useState<"increase" | "volume">("increase")
  const [showCharts, setShowCharts] = useState(false)
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/stock/api/analysis?type=transcation&n=4&x=5&sort=${activeTab}`
        )
        if (!response.ok) throw new Error('获取数据失败')
        const { data } = await response.json();

        console.log(data);
        setStocks(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab])

  return (
    <div className="max-w-md mx-auto bg-white p-4 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">股票推荐</h1>
        <div className="flex items-center gap-4">
          <button
            className={`flex items-center gap-1 ${showCharts ? "text-black font-medium" : "text-gray-500"}`}
            onClick={() => setShowCharts(!showCharts)}
          >
            <span>日K图</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={cn(
            "flex-1 py-3 text-center font-medium relative",
            activeTab === "increase" && "border-b-2 border-black",
          )}
          onClick={() => setActiveTab("increase")}
        >
          涨幅排序
          <span className="absolute ml-1">{activeTab === "increase" && "↓"}</span>
        </button>
        <button
          className={cn(
            "flex-1 py-3 text-center font-medium text-gray-400 relative",
            activeTab === "volume" && "border-b-2 border-black text-black",
          )}
          onClick={() => setActiveTab("volume")}
        >
          成交量排序
          <span className="absolute ml-1">{activeTab === "volume" && "↓"}</span>
        </button>
      </div>

      {/* Stock List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center text-gray-500">加载中...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          stocks.map((item) => (
            <StockItem
              key={item.symbol}
              code={item.code}
              name={item.name}
              change={`${item.changepercent}%`}
              recentChanges={[]}
              volumes={[
                { key: "多头", value: item?.long },
                { key: "强势", value: item?.strength },
                { key: "主导", value: item?.dominant }
              ]}
              isPositive={item.change > 0}
              showChart={showCharts}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface StockItemProps {
  code: string
  name: string
  change: string
  recentChanges: string[]
  volumes: IVolume[]
  isPositive: boolean
  showChart?: boolean
}

interface IVolume {
  key: string;
  value: string | number;
}

function StockItem({ code, name, change, recentChanges, volumes, isPositive, showChart = false }: StockItemProps) {
  const textColor = isPositive ? "text-red-500" : "text-green-500"

  return (
    <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between mb-1">
        <div className="text-xl font-bold">{code}</div>
        <div className={`text-xl font-bold ${textColor}`}>{change}</div>
      </div>

      <div className="flex justify-between mb-3">
        <div className="text-gray-500">{name}</div>
        <div className="text-gray-500">近3日: {recentChanges.join(" ")}</div>
      </div>

      {showChart && (
        <div className="mb-4 mt-2">
          K线图
        </div>
      )}

      <div className="flex gap-2">
        {volumes.map((volume, index) => (
          <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm">
            <span className={textColor}>{volume.key}: {volume.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
