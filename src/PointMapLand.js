import * as THREE from 'three'

const STATIC_SOURCE = 'https://wpstatic.mafengwo.net/mbigdata/nestui/traveldata/'

const PointMapLand = function (data, ops) {

  this.ops = {
    scale: 0.005,   // 缩放倍数
    centerLngLat: [115, 39],   // 最小位置点
    pointSize: 5,   // 点大小
    pointMinOpacity: 0.5,   // 点透明度最小值
    pointImage: STATIC_SOURCE + '/img/dot.png',     // 点图片
  }
  if (ops) {
    Object.assign(this.ops, ops)
  }

  this.segment = 3    // 点阵分片数
  this.perOpacity = (1 - this.ops.pointMinOpacity) / 2

  this.mesh = new THREE.Object3D()

  // 经纬点对应绘制点 随机塞入分片
  this.positions = []
  for(let i = 0; i < this.segment; i++) { this.positions.push([]) }  
  for(let point of data) {
    let x = (point[0] - this.ops.centerLngLat[0]) / this.ops.scale
    let y = (point[1] - this.ops.centerLngLat[1]) / this.ops.scale * LATITUDE_SCALE     
    let z = 0
    this.positions[Math.floor(Math.random()*this.segment)].push(x, y, z)
  }
  
  // 绘制点阵
  this.points = []
  for(let i = 0; i < this.segment; i++) {
    let mapGeometry = new THREE.BufferGeometry();
    mapGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( this.positions[i], 3 ) )
    let material = new THREE.PointsMaterial( { 
      // color: 0x74768C,
      size: this.ops.pointSize, 
      transparent: true,
      opacity: this.ops.pointMinOpacity + (i * this.perOpacity),
      map: new THREE.TextureLoader().load(this.ops.pointImage),
      // alphaMap: new THREE.TextureLoader().load(require('@/assets/clouds.png'))   // 点材质不支持这个属性
    } );
    // let shiningGeometry = 
    this.points[i] = new THREE.Points( mapGeometry, material )
    this.mesh.add(this.points[i])
  
    this.animatStatus = new Array(this.segment).fill(0)   // 0: stop, 1: up , 2: down
    this.animatStatus[0] = 1
  
  }

  // 动画
  this.animation = function() {
    // for (let i = 0; i < this.segment; i++) {
    //   if (this.animatStatus[i] != 0) {
    //     if (this.animatStatus[i] == 1) { 
    //       this.points[i].material.opacity += this.perOpacity / 20
    //       if (this.points[i].material.opacity >= this.ops.pointMinOpacity + ((i + 1) * this.perOpacity)) {
    //         this.animatStatus[i] = 2
    //       }
    //     } else {
    //       this.points[i].material.opacity -= this.perOpacity / 20
    //       if (this.points[i].material.opacity <= this.ops.pointMinOpacity + (i * this.perOpacity)) {
    //         this.animatStatus[i] = 0
    //         let n = i + 1
    //         if (n == this.segment) { n = 0 }
    //         this.animatStatus[n] = 1
    //       }
    //     }
    //   }
    // }
  }


}

export default PointMapLand