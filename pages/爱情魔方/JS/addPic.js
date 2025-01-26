var bgWidth = 150;
var divWidth = 50;
// 添加图片
function addPic(idName) {
    var arr = document.querySelectorAll(idName);
    for(var i = 0; i < arr.length; ++i) {
        for(var j = 0; j < 3; ++j) {
            for(var k = 0; k < 3; ++k) {
                // 创建元素
                var divs = document.createElement("div");
                // 定义元素样式
                divs.style.cssText = "width: " + divWidth +"px; height: " + divWidth +"px; border: 1px solid #fff; box-sizing: border-box;" + 
                "position: absolute; background-image: url(img/a" + i + ".jpg); background-size: " + bgWidth + "px " + bgWidth + "px;"
                divs.style.left = j * divWidth + "px";
                divs.style.top = k * divWidth + "px";
                divs.style.backgroundPositionX = -j * divWidth + "px";
                divs.style.backgroundPositionY = -k * divWidth + "px";
                divs.className = "play";
                divs.style.animationDelay = (j * 3 + k) * 0.5 + "s";
                
                arr[i].appendChild(divs);
            }
        }
    }
}

// 更改元素elem动画播放状态
function changeAnimationState(elem) {
    if(elem.style.animationPlayState == "running") {
        elem.style.animationPlayState = "paused";
    }
    else {
        elem.style.animationPlayState = "running";
    }
}

// 更改魔方块动画状态
function stopFly() {
    var arr = document.getElementsByClassName("box-page");
    for(var j = 0; j < arr.length; ++j){
        var elems = arr[j].childNodes;  // 获取每个面下的9个子节点
        for(var i = 0; i < elems.length; ++i) {
            changeAnimationState(elems[i]);
        }
    }
}

// 更改魔方动画状态
function stopRotate() {
    var arr = document.getElementById("box");
    changeAnimationState(arr);
}

// 重新播放所有使用选择器idName的元素的动画
function replay() {
    // alert("重新播放！");
    var arr = document.getElementsByClassName("box-page");
    for(var j = 0; j < arr.length; ++j){
        var elems = arr[j].childNodes;
        for(var i = 0; i < elems.length; ++i) {
            // 飞出效果的重新开始通过将动画切换为另一个效果相同的动画实现
            // 例如replay和play是两个效果相同的样式
            if(elems[i].className == "replay") {
                elems[i].className = "play";
                elems[i].style.animationDelay = i * 0.5 + "s";
            } else {
                elems[i].className = "replay";
                elems[i].style.animationDelay = i * 0.5 + "s";
            }
        }
    } 
}