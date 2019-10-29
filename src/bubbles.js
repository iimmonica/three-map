import * as THREE from 'three'
import config from './config.js'

export default function ThreeMapBubbles (data, options) {

  this.bubbleList = data
  this.options = options

  this.activeIndex = -1

  this.interval = 10 * 1000
  this.start = Date.now()

  this.stop = false

  this.mesh = new THREE.Object3D()

  this.loader = new THREE.TextureLoader()

  // 头像
  this.logo = new THREE.Mesh( 
    new THREE.CircleGeometry( options.logoSize, 32 ), 
    new THREE.MeshBasicMaterial( { map: this.loader.load(config.STATIC_SOURCE + '/img/userlogo/logo_1.png'), visible: false } ) 
  )
  this.mesh.add(this.logo)
  this.logoBorder = new THREE.Mesh( new THREE.RingGeometry( 
    options.logoSize, options.logoSize + 1, 32 ), 
    new THREE.MeshBasicMaterial( { color: options.textBackColor, visible: false } )
  )
  this.mesh.add(this.logoBorder)
  this.mesh.position.z = options.logoHigh

  this.textBackMaterial = new THREE.MeshLambertMaterial({color: options.textBackColor, transparent: true, opacity: 0.8, visible: false})
  this.textMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, visible: false } )

  // 加载字体
  new THREE.FontLoader().load(config.STATIC_SOURCE + '/fonts/Microsoft_YaHei_Regular.json', font => {
    this.font = font
    this.setUser()
  })

}


// 配置一个新的用户冒泡
ThreeMapBubbles.prototype.setUser = function() {
  if (!this.font || this.bubbleList.length<1) return
  this.activeIndex++
  if (this.activeIndex == this.bubbleList) this.activeIndex = 0
  if (!this.bubbleList[this.activeIndex]) return

  // 冒泡位置
  this.mesh.position.x = (this.bubbleList[this.activeIndex].lng - this.options.centerLngLat[0]) / this.options.scale
  this.mesh.position.y = (this.bubbleList[this.activeIndex].lat - this.options.centerLngLat[1]) / this.options.scale * config.LATITUDE_SCALE

  // 用户头像
  this.logo.material.map = this.loader.load(this.bubbleList[this.activeIndex].user_logo)
  
  // 清除之前的文本mesh 
  if (this.mesh.children[3]) {
    this.mesh.remove(this.mesh.children[3])
  }
  if (this.mesh.children[2]) {
    this.mesh.remove(this.mesh.children[2])
  }

  // 文字内容
  let user = this.bubbleList[this.activeIndex]
  let srcText = (user.user_name + ' ' + user.time + ' ' + user.behavior).replace(/[\r\n]/g,"")
  let text = ''
  let al = this.options.textWidth - this.options.textPadding * 2
  let l = 0
  for (let i = 0; i < srcText.length && l < this.options.textMaxLines; i++) {
    if (this.getTextSize(srcText.substr(0, i)) >= al) {
      text += srcText.substr(0, i) + '\n'
      srcText = srcText.substr(i)
      i = 0
      l++
    }
  }
  if (l < this.options.textMaxLines) { 
    text += srcText
    l++
  } else if (l == this.options.textMaxLines) {
    text = text.substr(0, text.length - 6) + '******'
  }
  let height = (l * this.getTextSize('马蜂窝', true) + this.options.textPadding * 2) * 0.835
  
  // 文本框
  let roundShap = new THREE.Shape()
  this.roundedRect(roundShap, -this.options.textWidth, -height, this.options.textWidth, height, this.options.textBorderRadius, this.options.logoSize + 1)
  this.textBack = new THREE.Mesh(new THREE.ShapeGeometry( roundShap ), this.textBackMaterial)
  this.mesh.add(this.textBack)
  // 文字
  var geometry = new THREE.TextGeometry( text, { font: this.font, size: this.options.textFontSize, height: 0.1 } );
  this.text = new THREE.Mesh( geometry, this.textMaterial )
  this.text.position.x = -this.options.textWidth + this.options.textPadding
  this.text.position.y = -this.options.textBorderRadius - this.options.textPadding
  this.text.position.z = 1
  this.mesh.add(this.text)

  this.logoScale = 0

  this.logo.material.visible = true
  this.logoBorder.material.visible = true
  this.text.material.visible = false
  this.textBack.material.visible = false
}


// 文本框形状
ThreeMapBubbles.prototype.roundedRect = function( shape, x, y, width, height, radius, subtractRadius ) {
  shape.moveTo( x, y + radius );
  shape.lineTo( x, y + height - radius );
  shape.quadraticCurveTo( x, y + height, x + radius, y + height );
  shape.lineTo( x + width - subtractRadius, y + height);
  shape.absarc(x + width, y + height, subtractRadius, Math.PI, Math.PI * 3 / 2);
  shape.lineTo( x + width, y + radius );
  shape.quadraticCurveTo( x + width, y, x + width - radius, y );
  shape.lineTo( x + radius, y );
  shape.quadraticCurveTo( x, y, x, y + radius );
  return shape
}

ThreeMapBubbles.prototype.getTextSize = function(text, ifHeight) {
  let span = document.createElement("span");
  let width = span.offsetWidth;
  let height = span.offsetHeight;
  span.style.visibility = "hidden";
  span.style.fontSize = this.options.textFontSize * 2.3 + 'px';
  span.style.fontFamily = 'arial';
  span.style.display = "inline-block";
  document.body.appendChild(span);
  if(typeof span.textContent != "undefined"){
    span.textContent = text;
  }else{
    span.innerText = text;
  }
  let r = ifHeight ? parseFloat(window.getComputedStyle(span).height) - height : parseFloat(window.getComputedStyle(span).width) - width
  r /= 1.525
  span.remove()
  return r
}

// 头像冒出动画
ThreeMapBubbles.prototype.animatUser = function() {
 
  if ( this.activeIndex < 0 ) return 
  if (this.logoScale < 1) {
    this.logoScale += 0.05
    this.logo.scale.set( this.logoScale, this.logoScale, this.logoScale );
    this.logoBorder.scale.set( this.logoScale, this.logoScale, this.logoScale );
  } else if (this.logoScale >= 1){
    this.text.material.visible = true
    this.textBack.material.visible = true
  }

}

ThreeMapBubbles.prototype.animation = function() {

  if (!this.stop && Date.now() - this.start >= this.interval) {
    this.setUser()
    this.start = Date.now()
  }
  this.animatUser()

}


// 加载用户冒泡数据
ThreeMapBubbles.prototype.loadUsers = function(data) {

  this.bubbleList = data

}
