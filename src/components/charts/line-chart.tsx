'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSeries, ChartConfig, DEFAULT_COLORS } from '@/lib/charts'

interface LineChartProps {
  data: ChartSeries[]
  config?: ChartConfig
  className?: string
}

export function LineChart({ data, config = {}, className }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number
    y: number
    data: any
  } | null>(null)

  const {
    title,
    subtitle,
    xAxisLabel,
    yAxisLabel,
    showLegend = true,
    showGrid = true,
    showTooltip = true,
    height = 300,
    colors = DEFAULT_COLORS
  } = config

  // チャート描画用の計算
  const padding = { top: 20, right: 20, bottom: 60, left: 60 }
  const chartWidth = 600 - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // データの範囲を計算
  const allDataPoints = data.flatMap(series => series.data)
  const xValues = allDataPoints.map(point => 
    typeof point.x === 'number' ? point.x : 0
  )
  const yValues = allDataPoints.map(point => point.y)

  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(0, Math.min(...yValues))
  const yMax = Math.max(...yValues)

  // スケール関数
  const xScale = (value: string | number) => {
    if (typeof value === 'string') {
      // 文字列の場合は順序に基づいて位置を計算
      const uniqueXValues = [...new Set(allDataPoints.map(p => p.x))]
      const index = uniqueXValues.indexOf(value)
      return (index / (uniqueXValues.length - 1)) * chartWidth
    }
    return ((value - xMin) / (xMax - xMin)) * chartWidth
  }

  const yScale = (value: number) => {
    return chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight
  }

  // グリッドライン生成
  const generateGridLines = () => {
    const lines = []
    const ySteps = 5
    
    for (let i = 0; i <= ySteps; i++) {
      const y = (chartHeight / ySteps) * i
      const value = yMax - ((yMax - yMin) / ySteps) * i
      
      lines.push(
        <g key={`grid-${i}`}>
          <line
            x1={0}
            y1={y}
            x2={chartWidth}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <text
            x={-10}
            y={y + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {value.toFixed(0)}
          </text>
        </g>
      )
    }
    
    return lines
  }

  // パス生成
  const generatePath = (series: ChartSeries) => {
    if (series.data.length === 0) return ''
    
    const pathData = series.data.map((point, index) => {
      const x = xScale(point.x)
      const y = yScale(point.y)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
    
    return pathData
  }

  // データポイント生成
  const generatePoints = (series: ChartSeries, seriesIndex: number) => {
    return series.data.map((point, index) => {
      const x = xScale(point.x)
      const y = yScale(point.y)
      const color = series.color || colors[seriesIndex % colors.length]
      
      return (
        <circle
          key={`${seriesIndex}-${index}`}
          cx={x}
          cy={y}
          r={4}
          fill={color}
          stroke="white"
          strokeWidth={2}
          className="cursor-pointer hover:r-6 transition-all"
          onMouseEnter={(e) => {
            if (showTooltip) {
              const rect = svgRef.current?.getBoundingClientRect()
              if (rect) {
                setHoveredPoint({
                  x: rect.left + x + padding.left,
                  y: rect.top + y + padding.top,
                  data: {
                    series: series.name,
                    label: point.label || `${point.x}: ${point.y}`,
                    value: point.y,
                    color
                  }
                })
              }
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
        />
      )
    })
  }

  // X軸ラベル生成
  const generateXAxisLabels = () => {
    const uniqueXValues = [...new Set(allDataPoints.map(p => p.x))]
    const maxLabels = Math.min(uniqueXValues.length, 8) // 最大8個のラベル
    const step = Math.ceil(uniqueXValues.length / maxLabels)
    
    return uniqueXValues
      .filter((_, index) => index % step === 0)
      .map((value, index) => {
        const x = xScale(value)
        return (
          <text
            key={`x-label-${index}`}
            x={x}
            y={chartHeight + 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {String(value)}
          </text>
        )
      })
  }

  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent>
        <div className="relative">
          <svg
            ref={svgRef}
            width={600}
            height={height}
            className="w-full"
            viewBox={`0 0 600 ${height}`}
          >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* グリッド */}
              {showGrid && generateGridLines()}
              
              {/* データ系列 */}
              {data.map((series, index) => {
                const color = series.color || colors[index % colors.length]
                
                return (
                  <g key={series.name}>
                    {/* 線 */}
                    <path
                      d={generatePath(series)}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      className="transition-all duration-300"
                    />
                    
                    {/* エリア塗りつぶし（オプション） */}
                    {series.type === 'area' && (
                      <path
                        d={`${generatePath(series)} L ${xScale(series.data[series.data.length - 1]?.x || 0)} ${chartHeight} L ${xScale(series.data[0]?.x || 0)} ${chartHeight} Z`}
                        fill={color}
                        fillOpacity={0.2}
                      />
                    )}
                    
                    {/* データポイント */}
                    {generatePoints(series, index)}
                  </g>
                )
              })}
              
              {/* X軸 */}
              <line
                x1={0}
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#374151"
                strokeWidth={1}
              />
              
              {/* Y軸 */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={chartHeight}
                stroke="#374151"
                strokeWidth={1}
              />
              
              {/* X軸ラベル */}
              {generateXAxisLabels()}
              
              {/* 軸タイトル */}
              {xAxisLabel && (
                <text
                  x={chartWidth / 2}
                  y={chartHeight + 50}
                  textAnchor="middle"
                  className="text-sm fill-gray-700 font-medium"
                >
                  {xAxisLabel}
                </text>
              )}
              
              {yAxisLabel && (
                <text
                  x={-40}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90, -40, ${chartHeight / 2})`}
                  className="text-sm fill-gray-700 font-medium"
                >
                  {yAxisLabel}
                </text>
              )}
            </g>
          </svg>
          
          {/* 凡例 */}
          {showLegend && data.length > 1 && (
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {data.map((series, index) => {
                const color = series.color || colors[index % colors.length]
                return (
                  <div key={series.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-600">{series.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* ツールチップ */}
      {hoveredPoint && (
        <div
          className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: hoveredPoint.x + 10,
            top: hoveredPoint.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-medium">{hoveredPoint.data.series}</div>
          <div>{hoveredPoint.data.label}</div>
        </div>
      )}
    </Card>
  )
}
