// 布局图片
function layer() {
    var elems = document.getElementsByClassName("image");
    var len = elems.length;     //图片数量
    var angle = 360 / len;      //每张图片偏移的角度
    var angle2 = 2 * Math.PI / len;    //每张图片偏移的弧度

    for(var i = 0; i < len; ++i) {
        offsetX = 300 * Math.sin(angle2 * i);
        offsetZ = 300 * Math.cos(angle2 * i);
        // translate属性要放在rotate属性前面，否则会出错
        elems[i].style.transform = "translateX(" + offsetX + "px) translateZ(" + offsetZ + "px) rotateY(" + (angle*i) + "deg) rotateX(-5deg)";
        // var str = "rorateY(" + (angle*i) + "deg) rotateX(0deg) translateX(" + offsetX + "px) translateZ(" + offsetZ + "px)";
        // console.log(str);
    }
}

var newX = 0, lastX = 0, newY = 0, lastY = 0;
var cvalueY = 0, rotY = 0, cvalueX = 0, rotX = -20;
function drag() {
    // 鼠标按下时开始转动
    document.onmousedown = function(e) {
        e.preventDefault();
        lastX = e.clientX;
        lastY = e.clientY;
        this.onmousemove = function(e) {
            e.preventDefault();
            //获取鼠标位置,转动照片
            newX = e.clientX;
            newY = e.clientY;
            cvalueY = lastX - newX;
            cvalueX = lastY - newY;
            lastX = newX;
            lastY = newY;
            rotY = rotY - cvalueY / 20;
            rotX = rotX - cvalueX / 20;
            // 限制上下翻转的角度
            rotX = Math.max(-45, rotX);
            rotX = Math.min(20, rotX);
            // 将图片转动
            var elem = document.getElementById("box");
            elem.style.transform = "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
        }
        // 鼠标抬起时停止转动
        this.onmouseup = function() {
            this.onmousemove = null;
        }
    }
    // 阻止拖拽的默认行为,防止图片被拉动
    document.ondrag = function(e) {
        e.preventDefault();
    }
}