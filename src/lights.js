import * as THREE from 'three'
import config from './config.js'

export default function ThreeMapLight (data, options) {

  this.options = options

  let positions = []
  let sizes = []
  for(let point of data) {
    let x = (point[0] - options.centerLngLat[0]) / options.scale
    let y = (point[1] - options.centerLngLat[1]) / options.scale * config.LATITUDE_SCALE
    let z = 0
    positions.push(x, y, z)
    sizes.push(Math.random() * options.pointMaxSize + options.pointMinSize)
  }

  let lightGeometry = new THREE.BufferGeometry();
  lightGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) )
  lightGeometry.addAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ) )
  // 自定义着色器 仿星光效果
  let glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(options.pointColor) },
      pointTexture: { value: new THREE.TextureLoader().load(options.pointImage) }
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
  })

  this.mesh = new THREE.Points( lightGeometry, glowMaterial )

}

ThreeMapLight.prototype.animation = function() {

  var attributes = this.mesh.geometry.attributes;
  for ( var i = 0; i < attributes.size.array.length; i ++ ) {
    attributes.size.array[ i ] += this.options.pointMinSize
    if (attributes.size.array[ i ] > this.options.pointMaxSize) {
      attributes.size.array[ i  ] = this.options.pointMinSize
    }
  }
  attributes.size.needsUpdate = true

}
