// 页面加载后执行
window.onload = function effect(){
    // 获取“返回顶部”按钮元素
    var totop = document.getElementById("totop");
    // 定时器
    var timer = null;
    // 获取导航栏
    var nav = document.getElementById("nav");
    // 导航栏距离顶部的长度
    var navTop = nav.offsetTop; 

    // 隐藏“返回顶部”按钮
    totop.style.display = "none";
    // 给按钮绑定点击事件
    totop.onclick = function(){
        // 周期性定时器
        timer = setInterval(function(){
            // 获取滚动条距离浏览器顶端的距离
            var backTop = document.documentElement.scrollTop || document.body.scrollTop;
            console.log(backTop);
            // 滚动条向上移动
            document.documentElement.scrollTop -= backTop/5;
            
            if(backTop == 0) {
                clearInterval(timer);
            }
        }, 30);
    }

    // 临界值
    var pageHeight = 700;
    window.onscroll = function() {     
        // 返回顶部按键是否显示功能
        // 获取滚动条距离浏览器顶端的距离
        var backTop = document.documentElement.scrollTop || document.body.scrollTop;
        if(backTop > pageHeight) {
            totop.style.display = "block";
        } else {
            totop.style.display = "none";
        }

        // 吸顶灯效果
        if(backTop >= navTop){
            nav.style.position = "fixed";
            nav.style.top = "0";
            nav.style.left = "0";
            nav.style.zIndex = "100";
        } else{
            nav.style.position = "";
        }
    }

    // 初始化swiper
    var mySwiper = new Swiper('.swiper-container', {
        direction: 'vertical',
        loop: true,
         
        // 如果需要分页器
        pagination: {
          el: '.swiper-pagination',
        },
         
        // 如果需要前进后退按钮
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
         
        // 如果需要滚动条
        scrollbar: {
          el: '.swiper-scrollbar',
        },
    })    
}