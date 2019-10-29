const config = {}

Object.defineProperties(config, {
  'LATITUDE_SCALE': { value: 1.29 },   // 纬度系数 勿动此值 会导致地图变形
  'PAINT_SIZE': { value: 330 },    // 绘制尺寸（相对）
  'STATIC_SOURCE': {  // 图片资源地址
    value: 'https://wpstatic.mafengwo.net/mbigdata/nestui/traveldata/' 
  },
  'LAND_POINT_API': {   // 陆地白点地址
    value: 'https://sales-inner.mafengwo.cn/zlnebula/coordinate/mdd_scope/'
  },
  'LIGHTS_POINT_API': {   // 点亮黄点地址
    value: 'https://sales-inner.mafengwo.cn/zlnebula/coordinate/user_checkin/'
  },
  'USER_BUBBLE_API': {    // 用户冒泡地址
    value: 'https://www.mafengwo.cn/databank/nestApi/bubble'
  }
})

export default config