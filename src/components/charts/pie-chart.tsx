'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartDataPoint, ChartConfig, DEFAULT_COLORS } from '@/lib/charts'

interface PieChartProps {
  data: ChartDataPoint[]
  config?: ChartConfig
  className?: string
}

export function PieChart({ data, config = {}, className }: PieChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)

  const {
    title,
    subtitle,
    showLegend = true,
    showTooltip = true,
    height = 300,
    colors = DEFAULT_COLORS
  } = config

  // チャートの設定
  const radius = Math.min(height, 400) / 2 - 40
  const centerX = 200
  const centerY = height / 2

  // データの合計を計算
  const total = data.reduce((sum, item) => sum + item.y, 0)

  // 各セクションの角度を計算
  let currentAngle = -Math.PI / 2 // 12時の位置から開始
  const slices = data.map((item, index) => {
    const percentage = (item.y / total) * 100
    const angle = (item.y / total) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    // 中間角度（ラベル位置用）
    const midAngle = startAngle + angle / 2
    
    // パスデータを生成
    const largeArcFlag = angle > Math.PI ? 1 : 0
    const x1 = centerX + Math.cos(startAngle) * radius
    const y1 = centerY + Math.sin(startAngle) * radius
    const x2 = centerX + Math.cos(endAngle) * radius
    const y2 = centerY + Math.sin(endAngle) * radius
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    // ラベル位置
    const labelRadius = radius + 20
    const labelX = centerX + Math.cos(midAngle) * labelRadius
    const labelY = centerY + Math.sin(midAngle) * labelRadius
    
    currentAngle = endAngle
    
    return {
      ...item,
      pathData,
      percentage,
      startAngle,
      endAngle,
      midAngle,
      labelX,
      labelY,
      color: item.color || colors[index % colors.length]
    }
  })

  // パーセンテージのフォーマット
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent>
        <div className="flex flex-col items-center">
          <svg
            width={400}
            height={height}
            className="overflow-visible"
            viewBox={`0 0 400 ${height}`}
          >
            {/* パイスライス */}
            {slices.map((slice, index) => (
              <g key={index}>
                <path
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth={2}
                  className={`cursor-pointer transition-all duration-200 ${
                    hoveredSlice === index ? 'opacity-80 drop-shadow-lg' : ''
                  }`}
                  style={{
                    transform: hoveredSlice === index 
                      ? `translate(${Math.cos(slice.midAngle) * 5}px, ${Math.sin(slice.midAngle) * 5}px)` 
                      : 'none',
                    transformOrigin: `${centerX}px ${centerY}px`
                  }}
                  onMouseEnter={() => setHoveredSlice(index)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                
                {/* パーセンテージラベル（スライス内） */}
                {slice.percentage > 5 && (
                  <text
                    x={centerX + Math.cos(slice.midAngle) * (radius * 0.7)}
                    y={centerY + Math.sin(slice.midAngle) * (radius * 0.7)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-white"
                    style={{ textShadow: '0 0 3px rgba(0,0,0,0.5)' }}
                  >
                    {formatPercentage(slice.percentage)}
                  </text>
                )}
              </g>
            ))}
            
            {/* 中央の合計値 */}
            <g>
              <circle
                cx={centerX}
                cy={centerY}
                r={radius * 0.4}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth={2}
              />
              <text
                x={centerX}
                y={centerY - 10}
                textAnchor="middle"
                className="text-lg font-bold fill-gray-700"
              >
                {total.toLocaleString()}
              </text>
              <text
                x={centerX}
                y={centerY + 10}
                textAnchor="middle"
                className="text-sm fill-gray-500"
              >
                合計
              </text>
            </g>
          </svg>
          
          {/* 凡例 */}
          {showLegend && (
            <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-md">
              {slices.map((slice, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    hoveredSlice === index ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onMouseEnter={() => setHoveredSlice(index)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {slice.label || slice.x}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {slice.y.toLocaleString()} ({formatPercentage(slice.percentage)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* ツールチップ */}
      {hoveredSlice !== null && showTooltip && (
        <div className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm pointer-events-none">
          <div className="font-medium">
            {slices[hoveredSlice].label || slices[hoveredSlice].x}
          </div>
          <div>
            値: {slices[hoveredSlice].y.toLocaleString()}
          </div>
          <div>
            割合: {formatPercentage(slices[hoveredSlice].percentage)}
          </div>
        </div>
      )}
    </Card>
  )
}
