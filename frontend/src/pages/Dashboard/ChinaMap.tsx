import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { Card, Spin, Alert } from 'antd'

interface Props {
  data: { name: string; value: number; change?: number }[] | undefined
  loading: boolean
}

export default function ChinaMap({ data, loading }: Props) {
  const [geoJson, setGeoJson] = useState<object | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const isGH = window.location.hostname.includes('github.io')
    const url = isGH
      ? '/pig-dashboard/data/china-map.json'
      : '/api/v1/china-map'

    fetch(url)
      .then(r => r.json())
      .then(d => {
        const g = isGH ? d.data : d.data
        if (g) {
          echarts.registerMap('china', g as any)
          setGeoJson(g)
        }
      })
      .catch(() => {
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
          .then(r => r.json())
          .then(json => {
            echarts.registerMap('china', json)
            setGeoJson(json)
          })
          .catch(() => setLoadError('地图加载失败'))
      })
  }, [])

  const mapData = (data || []).map(d => ({ name: d.name, value: d.value }))
  const changeMap: Record<string, number> = {}
  ;(data || []).forEach(d => { changeMap[d.name] = d.change || 0 })

  const vals = mapData.map(d => d.value).filter(Boolean)
  const vmin = vals.length ? Math.floor(Math.min(...vals) - 1) : 8
  const vmax = vals.length ? Math.ceil(Math.max(...vals) + 1) : 12

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,14,23,0.95)',
      borderColor: 'rgba(0,200,255,0.2)',
      textStyle: { color: '#e0f0ff', fontSize: 12 },
      formatter: (p: any) => {
        if (!p.value) return `${p.name}<br/><span style="color:#556677">暂无数据</span>`
        const ch = changeMap[p.name] || 0
        const pct = p.value > 0 ? (ch / p.value * 100) : 0
        const cs = pct > 0 ? `<span style="color:#ff4466">▲+${pct.toFixed(2)}%</span>`
          : pct < 0 ? `<span style="color:#00ff88">▼${pct.toFixed(2)}%</span>`
            : `<span style="color:#556677">—0.00%</span>`
        return `<b>${p.name}</b><br/>外三元: <b style="color:#00d4ff">${p.value.toFixed(2)}</b>元/kg<br/>24h: ${cs}`
      },
    },
    visualMap: {
      min: vmin, max: vmax, left: 'left', bottom: '8%',
      text: ['高价', '低价'],
      textStyle: { color: '#7a8a9a', fontSize: 10 },
      inRange: { color: ['#0a1628', '#0d2847', '#1a4a6e', '#2a7a8a', '#4aaa6a', '#8ada44', '#f0cc30', '#ff8820', '#ff4420'] },
      calculable: true,
    },
    series: [{
      name: '外三元', type: 'map', map: 'china', roam: true, zoom: 1.2,
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#fff' }, itemStyle: { areaColor: '#00d4ff' } },
      label: { show: true, fontSize: 9, color: '#889aaa' },
      itemStyle: { borderColor: 'rgba(0,200,255,0.12)', borderWidth: 1 },
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
    }],
  }

  return (
    <Card
      title={<span style={{ color: '#e0f0ff', fontSize: 14, fontWeight: 600 }}>🌏 全国生猪价格热力图</span>}
      bordered={false}
      style={{ borderRadius: 14, background: 'linear-gradient(135deg, rgba(17,24,39,0.9), rgba(10,14,23,0.95))', border: '1px solid rgba(0,200,255,0.1)', height: '100%' }}
      bodyStyle={{ padding: '4px 0' }}
    >
      {loadError ? <Alert message={loadError} type="error" /> :
       loading || !geoJson ? <div style={{ textAlign: 'center', padding: 80 }}><Spin /></div> :
       <ReactECharts option={option} style={{ height: 420 }} notMerge lazyUpdate={false} />}
    </Card>
  )
}
