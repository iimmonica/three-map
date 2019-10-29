import * as THREE from 'three'
import axios from 'axios'
import config from './config.js'
import ThreeMapLand from './land.js'
import ThreeMapLights from './lights.js'
import ThreeMapBubbles from './bubbles.js'

export default function ThreeMap(containerStr, options) {
    
  const defaultOptions = {
    baseLongitude: -30,     // 地球切割经度
    backgroundColor: 0x1a152e,     // 背景颜色
    backgroundAlpha: 1,     // 背景透明度
    land: {
      pointSize: 5,   // 点大小
      pointMinOpacity: 0.5,   // 点透明度最小值
      pointImage: config.STATIC_SOURCE + '/img/dot.png',     // 点图片
    },
    lights: {
      distance: 0.1,  // 点到陆地距离
      animatHigh: 10,   // 点动画上升高度
      pointMinSize: 0.25,   // 最小点大小
      pointMaxSize: 30,   // 最大点大小
      pointColor: 0xffd580,     // 点颜色
      pointImage: config.STATIC_SOURCE + '/img/lighting.png',     // 点图片
    },
    bubbles: {
      logoSize: 13,   // 头像大小
      logoHigh: 15,   // 头像高度
      textBackColor: 0x6F5BBD,  // 文字背景颜色、logo边框颜色
      textWidth: 180,   // 文字框宽度
      textMaxLines: 5,    // 文字框最多行数
      textMaxHeight: 50,    // 文字框最大高度
      textBorderRadius: 6,  // 文字框圆角
      textPadding: 11,    //  文字框内边距
      textFontSize: 6.9,    // 字体大小
    }
  }
  this.options = defaultOptions
  if (options) {
    Object.assign(this.options, options)
  }

  const container = document.querySelector(containerStr)
  if (!container) {
    new Error('Container can not be null!')
  } else {
    this.container = container

    let width = container.offsetWidth
    let height = container.offsetHeight

    const canvas = document.createElement('canvas')
    container.appendChild(canvas)

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500)
    this.camera.position.z = 500;
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, context: canvas.getContext( 'webgl2' ) || canvas.getContext( 'webgl' ), antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.setClearColor(this.options.backgroundColor, this.options.backgroundAlpha)
    this.renderer.shadowMap.enabled = true

    let light = new THREE.AmbientLight(0xFFFFFF)
    light.position.set(100, 100, 200)
    this.scene.add(light)

    this.Object3Ds = new Array()
    
    window.addEventListener('orientationchange', this.resizeMap.bind(this))
    window.addEventListener('resize', this.resizeMap.bind(this))
  
    this.skipCount = 0
    this.render()

  }
  
  return this

}

ThreeMap.prototype.render = function() {

  requestAnimationFrame(this.render.bind(this))

  this.skipCount++
  if (this.skipCount % 2 == 0) return
  if (this.skipCount > 9007199254740900) this.skipCount = 0

  for (let obj of this.Object3Ds) {
    if (typeof obj.animation == 'function') {
      obj.animation()
    }
  }

  this.renderer.render(this.scene, this.camera)

}

ThreeMap.prototype.addObject3D = function(obj) {

  this.Object3Ds.push(obj)
  this.scene.add(obj.mesh)

}

ThreeMap.prototype.removeAllObject3D = function() {
  
  for (let obj of this.Object3Ds) {
    this.scene.remove(obj.mesh)
  }

  this.Object3Ds = new Array()

}

ThreeMap.prototype.load = function(mddid) {

  this.mddid = mddid
  return this.loadLand().then(function() {
    this.loadLights()
  }.bind(this))

}

ThreeMap.prototype.loadLand = function() {

  return axios.get(config.LAND_POINT_API + this.mddid).then(function (response) {
    
    let landPoints = response.data
    
    let max = [this.options.baseLongitude, -90]
    let min = [360 + this.options.baseLongitude, 90]
    for(let point of landPoints) {
      if (point[0] < this.options.baseLongitude) { point[0] += 360 }
      max[0] = Math.max(max[0], point[0])
      max[1] = Math.max(max[1], point[1])
      min[0] = Math.min(min[0], point[0])
      min[1] = Math.min(min[1], point[1])
    }
    let maxD = (max[0] - min[0]) > ((max[1] - min[1]) * config.LATITUDE_SCALE) ? 0 : 1
    
    this.scale = (max[maxD] - min[maxD]) / config.PAINT_SIZE * (maxD == 1 ? config.LATITUDE_SCALE : 1)
    this.center = [(max[0] + min[0])/2, (max[1] + min[1])/2]

    let land = new ThreeMapLand(landPoints, Object.assign({scale: this.scale, centerLngLat: this.center}, this.options.land))
    this.addObject3D(land)

  }.bind(this))
  .catch(function (error) {
    console.log('Land point data request fail!')
  })

}

ThreeMap.prototype.loadLights = function() {

  return axios.get(config.LIGHTS_POINT_API + this.mddid).then(function (response) {
   
    let lights = response.data

    for(let point of lights) {
      if (point[0] < this.options.baseLongitude) { point[0] += 360 }
    }
    let light = new ThreeMapLights(lights, Object.assign({scale: this.scale, centerLngLat: this.center}, this.options.lights))
    this.addObject3D(light)

  }.bind(this))
  .catch(function (error) {
    console.log('Light points data request fail!')
  })
  
}

ThreeMap.prototype.bubble = function(data) {
  if (data) {
    this.setBubble(data)
  } else {
    axios.get(config.USER_BUBBLE_API + '?mddid=' + this.mddid).then(function (response) {

      this.setBubble(response.data.data)
  
    }.bind(this))
    .catch(function (error) {
      console.log('Bubble data request fail!')
    })
  }
}

ThreeMap.prototype.setBubble = function(data) {
 
  for(let bubble of data) {

  }
  if (!this.bubbles) {
    this.bubbles = new ThreeMapBubbles(data, Object.assign({scale: this.scale, centerLngLat: this.center}, this.options.bubbles))
    this.addObject3D(this.bubbles)
  } else {
    this.bubbles.loadBubble(bubbleData)
  }

}


ThreeMap.prototype.resizeMap = function() {
  if (isElementInViewport(this.container)) { 
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight)
  }
}

function isElementInViewport (el) {
  var rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 && 
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
  );
}
