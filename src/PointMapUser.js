import * as THREE from 'three'

// const LATITUDE_SCALE = 1.29   // 纬度系数 勿动此值 会导致地图变形
const STATIC_SOURCE = 'https://wpstatic.mafengwo.net/mbigdata/nestui/traveldata/'

const PointMapUser = function (data, ops) {

  this.ops = {
    scale: 0.005,   // 缩放倍数
    centerLngLat: [115, 39], // 基准点经纬度
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
  if (ops) {
    Object.assign(this.ops, ops)
  }

  this.userList = data

  this.activeIndex = -1

  this.interval = 10 * 1000
  this.start = Date.now()

  this.stop = false

  this.mesh = new THREE.Object3D()

  this.loader = new THREE.TextureLoader()

  // 头像
  this.logo = new THREE.Mesh( 
    new THREE.CircleGeometry( this.ops.logoSize, 32 ), 
    new THREE.MeshBasicMaterial( { map: this.loader.load(STATIC_SOURCE + '/img/userlogo/logo_1.png'), visible: false } ) 
  )
  this.mesh.add(this.logo)
  this.logoBorder = new THREE.Mesh( new THREE.RingGeometry( 
    this.ops.logoSize, this.ops.logoSize + 1, 32 ), 
    new THREE.MeshBasicMaterial( { color: this.ops.textBackColor, visible: false } )
  )
  this.mesh.add(this.logoBorder)

  this.textBackMaterial = new THREE.MeshLambertMaterial({color: this.ops.textBackColor, transparent: true, opacity: 0.8, visible: false})
  this.textMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, visible: false } )

  // 文本框形状
  this.roundedRect = function ( shape, x, y, width, height, radius, subtractRadius ) {
    shape.moveTo( x, y + radius );
    shape.lineTo( x, y + height - radius );
    shape.quadraticCurveTo( x, y + height, x + radius, y + height );
    shape.lineTo( x + width - subtractRadius, y + height);
    shape.absarc(x + width, y + height, subtractRadius, Math.PI, Math.PI * 3 / 2);
    // shape.quadraticCurveTo( x + width - subtractRadius, y + height - subtractRadius, x + width, y + height - subtractRadius );
    shape.lineTo( x + width, y + radius );
    shape.quadraticCurveTo( x + width, y, x + width - radius, y );
    shape.lineTo( x + radius, y );
    shape.quadraticCurveTo( x, y, x, y + radius );
    return shape
  }
  
  // 加载字体
  new THREE.FontLoader().load(STATIC_SOURCE + '/fonts/Microsoft_YaHei_Regular.json', font => {
    this.font = font
    this.setUser()
  })

  this.getTextSize = function (text, ifHeight) {
    let span = document.createElement("span");
    let width = span.offsetWidth;
    let height = span.offsetHeight;
    span.style.visibility = "hidden";
    span.style.fontSize = this.ops.textFontSize * 2.3 + 'px';
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

  this.mesh.position.z = this.ops.logoHigh

  // 加载用户冒泡数据
  this.loadUsers = function (data) {
    this.userList = data
  }

  // 配置一个新的用户冒泡
  this.setUser = function () {
    if (!this.font || this.userList.length<1) return
    this.activeIndex++
    if (this.activeIndex == this.userList) this.activeIndex = 0
    if (!this.userList[this.activeIndex]) return

    // 冒泡位置
    this.mesh.position.x = (this.userList[this.activeIndex].lng - this.ops.centerLngLat[0]) / this.ops.scale
    this.mesh.position.y = (this.userList[this.activeIndex].lat - this.ops.centerLngLat[1]) / this.ops.scale * LATITUDE_SCALE

    // 用户头像
    this.logo.material.map = this.loader.load(this.userList[this.activeIndex].user_logo)
    
    // 清除之前的文本mesh 
    if (this.mesh.children[3]) {
      this.mesh.remove(this.mesh.children[3])
    }
    if (this.mesh.children[2]) {
      this.mesh.remove(this.mesh.children[2])
    }

    // 文字内容
    let user = this.userList[this.activeIndex]
    let srcText = (user.user_name + ' ' + user.time + ' ' + user.behavior).replace(/[\r\n]/g,"")
    let text = ''
    let al = this.ops.textWidth - this.ops.textPadding * 2
    let l = 0
    for (let i = 0; i < srcText.length && l < this.ops.textMaxLines; i++) {
      if (this.getTextSize(srcText.substr(0, i)) >= al) {
        text += srcText.substr(0, i) + '\n'
        srcText = srcText.substr(i)
        i = 0
        l++
      }
    }
    if (l < this.ops.textMaxLines) { 
      text += srcText
      l++
    } else if (l == this.ops.textMaxLines) {
      text = text.substr(0, text.length - 6) + '******'
    }
    let height = (l * this.getTextSize('马蜂窝', true) + this.ops.textPadding * 2) * 0.835
    
    // 文本框
    let roundShap = new THREE.Shape()
    this.roundedRect(roundShap, -this.ops.textWidth, -height, this.ops.textWidth, height, this.ops.textBorderRadius, this.ops.logoSize + 1)
    this.textBack = new THREE.Mesh(new THREE.ShapeGeometry( roundShap ), this.textBackMaterial)
    this.mesh.add(this.textBack)
    // 文字
    var geometry = new THREE.TextGeometry( text, { font: this.font, size: this.ops.textFontSize, height: 0.1 } );
    this.text = new THREE.Mesh( geometry, this.textMaterial )
    this.text.position.x = -this.ops.textWidth + this.ops.textPadding
    this.text.position.y = -this.ops.textBorderRadius - this.ops.textPadding
    this.text.position.z = 1
    this.mesh.add(this.text)

    this.logoScale = 0

    this.logo.material.visible = true
    this.logoBorder.material.visible = true
    this.text.material.visible = false
    this.textBack.material.visible = false
  }

  // 头像冒出动画
  this.animatUser = function () {
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
  
  // 动画
  this.animation = function () {
    if (!this.stop && Date.now() - this.start >= this.interval) {
      this.setUser()
      this.start = Date.now()
    }
    this.animatUser()
  }


}

export default PointMapUser