import * as THREE from 'three'

const STATIC_SOURCE = 'https://wpstatic.mafengwo.net/mbigdata/nestui/traveldata/'

const PointMapLight = function (data, ops) {

  this.ops = {
    scale: 0.005,   // 缩放倍数
    centerLngLat: [115, 39], // 基准点经纬度
    distance: 0.1,  // 点到陆地距离
    animatHigh: 10,   // 点动画上升高度
    pointMinSize: 0.25,   // 最小点大小
    pointMaxSize: 30,   // 最大点大小
    pointColor: 0xffd580,     // 点颜色
    pointImage: STATIC_SOURCE + '/img/lighting.png',     // 点图片
  }
  if (ops) {
    Object.assign(this.ops, ops)
  }
 
  let positions = []
  let sizes = []
  for(let point of data) {
    let x = (point[0] - this.ops.centerLngLat[0]) / this.ops.scale
    let y = (point[1] - this.ops.centerLngLat[1]) / this.ops.scale * LATITUDE_SCALE
    let z = 0
    // let z = (Math.random() * this.ops.animatHigh + this.ops.distance)
    positions.push(x, y, z)
    sizes.push(Math.random() * this.ops.pointMaxSize + this.ops.pointMinSize)
  }
  let lightGeometry = new THREE.BufferGeometry();
  lightGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) )
  lightGeometry.addAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ) )
  // 自定义着色器 仿星光效果
  let glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(this.ops.pointColor) },
      pointTexture: { value: new THREE.TextureLoader().load(this.ops.pointImage) }
    },
    vertexShader: `
      attribute float size;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 100.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform sampler2D pointTexture;
      void main() {
        gl_FragColor = vec4( color * 1.5, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
      }
    `,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    transparent: true
  });

  this.mesh = new THREE.Points( lightGeometry, glowMaterial )
       

  this.animation = function() {
    var attributes = this.mesh.geometry.attributes;
    for ( var i = 0; i < attributes.size.array.length; i ++ ) {
      attributes.size.array[ i ] += this.ops.pointMinSize
      if (attributes.size.array[ i ] > this.ops.pointMaxSize) {
        attributes.size.array[ i  ] = this.ops.pointMinSize
      }
    }
    attributes.size.needsUpdate = true
  }
  

}

export default PointMapLight