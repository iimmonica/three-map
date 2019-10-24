import * as THREE from 'three'
import PointMapLand from './PointMapLand'
import PointMapLight from './PointMapLight'
import PointMapUser from './PointMapUser'

const LATITUDE_SCALE = 1.29   // 纬度系数 勿动此值 会导致地图变形
const PAINT_SIZE = 330

const PointMap = function(dom, ops) {

  let _this = this

  this.dom = dom

  let width = dom.offsetWidth
  let height = dom.offsetHeight

  this.canvas = document.createElement('canvas')
  dom.appendChild(this.canvas)

  this.scene = new THREE.Scene()

  this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500)
  this.camera.position.z = 500;
  this.camera.lookAt(this.scene.position);

  this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, context: this.canvas.getContext( 'webgl2' ) || this.canvas.getContext( 'webgl' ), antialias: true })
  this.renderer.setSize(width, height)
  this.renderer.shadowMap.enabled = true

  let light = new THREE.AmbientLight(0xFFFFFF)
  light.position.set(100, 100, 200)
  this.scene.add(light)
  
  this.Object3Ds = new Array()

  this.initMap = function (landPoints, mapOps) {
    this.removeAllObject3D()

    this.baseOps = {
      scaleMultiply: 1,
      baseLongitude: -30
    }
    if (mapOps) {
      Object.assign(this.baseOps, mapOps)
    }

    let max = [this.baseOps.baseLongitude, -90]
    let min = [360 + this.baseOps.baseLongitude, 90]
    for(let point of landPoints) {
      if (point[0] < this.baseOps.baseLongitude) { point[0] += 360 }
      max[0] = Math.max(max[0], point[0])
      max[1] = Math.max(max[1], point[1])
      min[0] = Math.min(min[0], point[0])
      min[1] = Math.min(min[1], point[1])
    }
    let maxD = (max[0] - min[0]) > ((max[1] - min[1]) * LATITUDE_SCALE) ? 0 : 1
    this.scale = (max[maxD] - min[maxD]) / PAINT_SIZE * (maxD == 1 ? LATITUDE_SCALE : 1) * this.baseOps.scaleMultiply
    this.center = [(max[0] + min[0])/2, (max[1] + min[1])/2]
    
    let land = new PointMapLand(landPoints, {scale: this.scale, centerLngLat: this.center})
    this.addObject3D(land)
  }


  this.loadLights = function (lights, lightSize) {

    for(point of lights) {
      if (point[0] < this.baseOps.baseLongitude) { point[0] += 360 }
    }
    let light = new PointMapLight(lights, {scale: this.scale, centerLngLat: this.center, pointMaxSize: lightSize || 30})
    this.addObject3D(light)

  }

  this.initUsers = function () {

    this.user = new PointMapUser([], {scale: this.scale, centerLngLat: this.center})
    this.addObject3D(this.user)

  }

  this.loadUsers = function (users) {

    this.user.loadUsers(users)

  }

  this.addObject3D = function (obj) {

    this.Object3Ds.push(obj)
    this.scene.add(obj.mesh)
  
  }
  this.removeAllObject3D = function() {
    for (let obj of this.Object3Ds) {
      this.scene.remove(obj.mesh)
    }
    this.Object3Ds = new Array()
  }

  this.skipCount = 0
  this.render = function() {

    requestAnimationFrame(_this.render)
    
    _this.skipCount++
    if (_this.skipCount % 2 == 0) return
    if (_this.skipCount > 9007199254740900) _this.skipCount = 0

    for (let obj of _this.Object3Ds) {
      obj.animation()
    }

    _this.renderer.render(_this.scene, _this.camera)

  }

  window.addEventListener('orientationchange', function() { _this.resizeMap() })
  window.addEventListener('resize', function () { _this.resizeMap() })
  this.resizeMap = function () {
    if (isElementInViewport(_this.dom)) { 
      this.camera.aspect = this.dom.offsetWidth / this.dom.offsetHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.dom.offsetWidth, this.dom.offsetHeight)
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
  /**
   * 地图跟随鼠标移动动画
   * 对着色器有影响
  this.mouseX = 0
  this.mouseY = 0
  this.handleMousemove = function (event) {
    let e = event || window.event
    if (this.mouseX != 0 && this.mouseY != 0) {
      let x = this.mouseX - e.clientX
      let y = this.mouseY - e.clientY
      this.scene.rotation.y += -x / 1000
      this.scene.rotation.x += -y / 1000
      this.camera.position.z = 500 + Math.sqrt(x * x + y * y)/5
    }
    this.mouseX = e.clientX
    this.mouseY = e.clientY
  }
  this.canvas.addEventListener('mousemove', function (event) { 
    _this.handleMousemove(event) 
  } )
   */

  this.render()

  return this

}

export default PointMap

