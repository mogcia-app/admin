'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSeries, ChartConfig, DEFAULT_COLORS } from '@/lib/charts'

interface BarChartProps {
  data: ChartSeries[]
  config?: ChartConfig
  className?: string
}

export function BarChart({ data, config = {}, className }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredBar, setHoveredBar] = useState<{
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
  const padding = { top: 20, right: 20, bottom: 80, left: 60 }
  const chartWidth = 600 - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // データの範囲を計算
  const allDataPoints = data.flatMap(series => series.data)
  const yValues = allDataPoints.map(point => point.y)
  const yMin = Math.min(0, Math.min(...yValues))
  const yMax = Math.max(...yValues)

  // X軸の値（カテゴリ）を取得
  const xCategories = [...new Set(allDataPoints.map(point => String(point.x)))]
  const barWidth = chartWidth / (xCategories.length * data.length + (xCategories.length - 1) * 0.5)
  const groupWidth = barWidth * data.length

  // スケール関数
  const yScale = (value: number) => {
    return chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight
  }

  const getXPosition = (categoryIndex: number, seriesIndex: number) => {
    const groupStart = categoryIndex * (groupWidth + barWidth * 0.5)
    return groupStart + seriesIndex * barWidth
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

  // バー生成
  const generateBars = () => {
    const bars: JSX.Element[] = []
    
    xCategories.forEach((category, categoryIndex) => {
      data.forEach((series, seriesIndex) => {
        const dataPoint = series.data.find(point => String(point.x) === category)
        if (!dataPoint) return

        const x = getXPosition(categoryIndex, seriesIndex)
        const y = yScale(dataPoint.y)
        const barHeight = yScale(yMin) - y
        const color = series.color || colors[seriesIndex % colors.length]

        bars.push(
          <rect
            key={`${categoryIndex}-${seriesIndex}`}
            x={x}
            y={y}
            width={barWidth * 0.8}
            height={Math.max(0, barHeight)}
            fill={color}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onMouseEnter={(e) => {
              if (showTooltip) {
                const rect = svgRef.current?.getBoundingClientRect()
                if (rect) {
                  setHoveredBar({
                    x: rect.left + x + padding.left + (barWidth * 0.4),
                    y: rect.top + y + padding.top,
                    data: {
                      series: series.name,
                      category,
                      label: dataPoint.label || `${category}: ${dataPoint.y}`,
                      value: dataPoint.y,
                      color
                    }
                  })
                }
              }
            }}
            onMouseLeave={() => setHoveredBar(null)}
          />
        )
      })
    })
    
    return bars
  }

  // X軸ラベル生成
  const generateXAxisLabels = () => {
    return xCategories.map((category, index) => {
      const x = getXPosition(index, 0) + (groupWidth / 2) - (barWidth / 2)
      
      return (
        <text
          key={`x-label-${index}`}
          x={x}
          y={chartHeight + 20}
          textAnchor="middle"
          className="text-xs fill-gray-500"
          transform={`rotate(-45, ${x}, ${chartHeight + 20})`}
        >
          {category}
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
              
              {/* バー */}
              {generateBars()}
              
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
                  y={chartHeight + 70}
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
                      className="w-3 h-3 rounded"
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
      {hoveredBar && (
        <div
          className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: hoveredBar.x,
            top: hoveredBar.y - 10,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="font-medium">{hoveredBar.data.series}</div>
          <div>{hoveredBar.data.label}</div>
        </div>
      )}
    </Card>
  )
}
