import * as THREE from 'three'
import config from './config.js'

export default function ThreeMapLand (data, options) {
  
  let segment = 3    // 点阵分片数
  let perOpacity = (1 - options.pointMinOpacity) / 2

  this.mesh = new THREE.Object3D()

  // 经纬点对应绘制点 随机塞入分片
  let positions = []
  for(let i = 0; i < segment; i++) { positions.push([]) }  
  for(let point of data) {
    let x = (point[0] - options.centerLngLat[0]) / options.scale
    let y = (point[1] - options.centerLngLat[1]) / options.scale * config.LATITUDE_SCALE     
    let z = 0
    positions[Math.floor(Math.random()*segment)].push(x, y, z)
  }
  
  // 绘制点阵
  let points = []
  for(let i = 0; i < segment; i++) {
    let mapGeometry = new THREE.BufferGeometry();
    mapGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions[i], 3 ) )
    let material = new THREE.PointsMaterial( { 
      size: options.pointSize, 
      transparent: true,
      opacity: options.pointMinOpacity + (i * perOpacity),
      map: new THREE.TextureLoader().load(options.pointImage),
    } );
    points[i] = new THREE.Points( mapGeometry, material )
    
    this.mesh.add(points[i])
  
  }

}
