import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { Card, Spin, Alert } from 'antd'
import type { MapDataPoint } from '../../types'
import client from '../../api/client'

interface Props {
  data: MapDataPoint[] | undefined
  loading: boolean
}

export default function ChinaMap({ data, loading }: Props) {
  const [geoJson, setGeoJson] = useState<object | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const isGH = window.location.hostname.includes('github.io')
    const basePath = isGH ? '/pig-dashboard' : ''

    // GitHub Pages: 从静态 data/china-map.json 加载；本地: 从后端 API 加载
    const loadGeo = isGH
      ? fetch(`${basePath}/data/china-map.json`).then(r => r.json()).then(d => d.data)
      : client.get<{ code: number; data: object }>('/china-map').then(r => r.data.data)

    loadGeo
      .then((geoData) => {
        if (!geoData) throw new Error('地图数据为空')
        echarts.registerMap('china', geoData as Parameters<typeof echarts.registerMap>[1])
        setGeoJson(geoData)
      })
      .catch((err) => {
        console.warn('后端地图加载失败，尝试备用 CDN:', err)
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
          .then((r) => r.json())
          .then((json) => {
            echarts.registerMap('china', json)
            setGeoJson(json)
          })
          .catch((e2) => {
            console.error('CDN 地图加载也失败:', e2)
            setLoadError('地图数据加载失败，请刷新页面重试')
          })
      })
  }, [])

  const mapData = (data || []).map((item) => ({
    name: item.name,
    value: item.value,
    change: (item as { change?: number }).change ?? 0,
  }))

  const changeMap: Record<string, { change: number; price: number }> = {}
  for (const item of data || []) {
    changeMap[item.name] = { change: (item as { change?: number }).change ?? 0, price: item.value || 0 }
  }

  // 动态 min/max 基于实际数据
  const values = mapData.map((d) => d.value).filter(Boolean)
  const vmin = Math.floor(Math.min(...values) - 0.5)
  const vmax = Math.ceil(Math.max(...values) + 0.5)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 23, 0.95)',
      borderColor: 'rgba(0, 200, 255, 0.2)',
      textStyle: { color: '#e0f0ff', fontSize: 13 },
      formatter: (params: { name: string; value?: number }) => {
        if (!params.value) return `${params.name}<br/><span style="color:#556677">暂无数据</span>`
        const info = changeMap[params.name] || { change: 0, price: params.value }
        const pct = info.price > 0 ? (info.change / info.price) * 100 : 0
        const changeStr = pct > 0
          ? `<span style="color:#ff4466">▲ +${pct.toFixed(2)}%</span>`
          : pct < 0
            ? `<span style="color:#00ff88">▼ ${pct.toFixed(2)}%</span>`
            : `<span style="color:#556677">— 0.00%</span>`
        return `<b>${params.name}</b><br/>外三元: <b style="color:#00d4ff">${params.value.toFixed(2)}</b> 元/公斤<br/>24h: ${changeStr}`
      },
    },
    visualMap: {
      min: vmin,
      max: vmax,
      left: 'left',
      bottom: '8%',
      text: ['高价', '低价'],
      textStyle: { color: '#7a8a9a', fontSize: 11 },
      inRange: {
        color: ['#0a1628', '#0d2847', '#1a4a6e', '#2a7a8a', '#4aaa6a', '#8ada44', '#f0cc30', '#ff8820', '#ff4420'],
      },
      calculable: true,
    },
    series: [
      {
        name: '外三元价格',
        type: 'map',
        map: 'china',
        roam: true,
        zoom: 1.2,
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          itemStyle: { areaColor: '#00d4ff', shadowBlur: 20, shadowColor: 'rgba(0,200,255,0.5)' },
        },
        label: {
          show: true,
          fontSize: 10,
          color: '#889aaa',
        },
        itemStyle: {
          borderColor: 'rgba(0, 200, 255, 0.15)',
          borderWidth: 1,
        },
        nameMap: {
          '北京': '北京市', '天津': '天津市', '河北': '河北省', '山西': '山西省',
          '内蒙古': '内蒙古自治区', '辽宁': '辽宁省', '吉林': '吉林省', '黑龙江': '黑龙江省',
          '上海': '上海市', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
          '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
          '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '广西': '广西壮族自治区',
          '海南': '海南省', '重庆': '重庆市', '四川': '四川省', '贵州': '贵州省',
          '云南': '云南省', '西藏': '西藏自治区', '陕西': '陕西省', '甘肃': '甘肃省',
          '青海': '青海省', '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
        },
        data: mapData,
      },
    ],
  }

  return (
    <Card
      title={
        <span style={{ color: '#e0f0ff', fontSize: 15, fontWeight: 600 }}>
          🌏 全国生猪价格热力图（外三元）
        </span>
      }
      bordered={false}
      style={{
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(10, 14, 23, 0.95))',
        border: '1px solid rgba(0, 200, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        height: '100%',
      }}
      bodyStyle={{ padding: '8px 0' }}
    >
      {loadError ? (
        <Alert message={loadError} type="error" showIcon style={{ margin: 16 }} />
      ) : loading || !geoJson ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 120, flexDirection: 'column', gap: 16 }}>
          <Spin size="large" />
          <div style={{ color: '#556677' }}>加载地图数据中...</div>
        </div>
      ) : (
        <ReactECharts
          option={option}
          style={{ height: 500 }}
          opts={{ renderer: 'canvas' }}
          notMerge
          lazyUpdate={false}
        />
      )}
    </Card>
  )
}
