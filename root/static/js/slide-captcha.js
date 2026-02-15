const Ajax = (function () {
    var xhr

    function __initialize() {
        if(window.XMLHttpRequest){
            xhr = new XMLHttpRequest()
        } else if(window.ActiveObject){
            xhr = new ActiveXobject('Microsoft.XMLHTTP')
        }
    }

    function requestHandler(options){
        options = options || {}
        options.type = (options.type || "GET").toUpperCase()
        options.dataType = options.dataType || "json"
        const params = ajaxFormatParams(options.data)

        if(options.type === "GET"){
            xhr.open("GET", options.url+"?" + params,true);
            xhr.send(null);
        }else if(options.type === "POST"){
            xhr.open("post",options.url,true);
            xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            xhr.send(params);
        }

        xhr.timeout = options.timeout
        setTimeout(function(){
            if(xhr.readySate !== 4){
                xhr.abort();
            }
        }, options.timeout)

        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                var status = xhr.status;
                if(status >= 200 && status < 300 || status === 304){
                    var data = xhr.responseText
                    if (isJSONString(data)) {
                        data = eval("("+xhr.responseText+")")
                    }
                    options.success&&options.success(data, xhr.responseXML);
                }else{
                    options.error&&options.error(status);
                }
            }
            options.complete&&options.complete(status);
        }
    }

    function isJSONString(str) {
        if (typeof str == 'string') {
            try {
                var obj = JSON.parse(str)
                return typeof obj == 'object' && obj
            } catch(e) {}
        }

        return false
    }

    function ajaxFormatParams(data){
        var arr = [];
        for(var name in data){
            arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]))
        }
        arr.push(("v=" + Math.random()).replace(".",""))
        return arr.join("&")
    }

    function handlePost (url, data, success, error, complete) {
        requestHandler({
            url: url,
            type: 'POST',
            data: data,
            dataType:'json',
            timeout: 10000,
            contentType: "application/json",
            success: success,
            error: error,
            complete: complete
        })
    }

    function handleGet (url, data, success, error, complete) {
        requestHandler({
            url: url,
            type: 'GET',
            data: data,
            dataType:'json',
            timeout: 10000,
            success: success,
            error: error,
            complete: complete
        })
    }

    __initialize()
    return {
        post: handlePost,
        get: handleGet
    }
})();

const Helper = (function () {
    function addEventListener(el,type,fn, c) {
        if(el.addEventListener){
            el.addEventListener(type,fn, c);
        }else{
            el["on" + type]=fn;
        }
    }

    function removeEventListener(el,type,fn, c) {
        if(el.removeEventListener){
            el.removeEventListener(type,fn, c);
        }else{
            el["on" + type]=null;
        }
    }

    function calcLocationLeft(el){
        var tmp = el.offsetLeft
        var val = el.offsetParent
        while(val != null){
            tmp += val.offsetLeft
            val = val.offsetParent
        }
        return tmp
    }

    function calcLocationTop(el){
        var tmp = el.offsetTop
        var val = el.offsetParent
        while(val != null){
            tmp += val.offsetTop
            val = val.offsetParent
        }
        return tmp
    }

    function getDomXY(dom){
        var x = 0
        var y = 0
        if (dom.getBoundingClientRect) {
            var box = dom.getBoundingClientRect();
            var D = document.documentElement;
            x = box.left + Math.max(D.scrollLeft, document.body.scrollLeft) - D.clientLeft;
            y = box.top + Math.max(D.scrollTop, document.body.scrollTop) - D.clientTop
        }
        else{
            while (dom !== document.body) {
                x += dom.offsetLeft
                y += dom.offsetTop
                dom = dom.offsetParent
            }
        }
        return {
            domX: x,
            domY: y
        }
    }

    const checkTargetFather = function (that, e) {
        var parent = e.relatedTarget
        try{
            while(parent && parent !== that) {
                parent = parent.parentNode
            }
        }catch (e){
            console.warn(e)
        }
        return parent !== that
    }

    return {
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        getDomXY: getDomXY,
        calcLocationTop: calcLocationTop,
        calcLocationLeft: calcLocationLeft,
        checkTargetFather: checkTargetFather,
    }
})();

const Captcha = (function () {
    const getCaptDataApi = window.GetCaptchaDataApi ? window.GetCaptchaDataApi : "/api/captcha/slide/id"
    const checkCaptDataApi = window.CheckCaptchaDataApi ? window.CheckCaptchaDataApi : "/api/captcha/slide/check"

    var captchaKey = ""
    var pointX = 0
    var pointY = 0

    const hiddenClassName = "wg-cap-wrap__hidden"
    const dialogActiveClassName = "wg-cap-dialog__active"
    const activeDefaultClassName = "wg-cap-active__default"
    const activeOverClassName = "wg-cap-active__over"
    const activeErrorClassName = "wg-cap-active__error"
    const activeSuccessClassName = "wg-cap-active__success"

    const captchaDragWrapDom        = document.querySelector("#wg-cap-wrap-drag")
    const captchaTileWrapDom        = document.querySelector("#wg-cap-tile")
    const captchaDragSlideBarDom    = document.querySelector("#wg-cap-drag-slidebar")
    const captchaDragBlockDom       = document.querySelector("#wg-cap-drag-block")
    const captchaTileImageDom       = document.querySelector("#wg-cap-tile-picture")
    const captchaImageDom           = document.querySelector("#wg-cap-image")
    const captchaBtnControlDom      = document.querySelector("#wg-cap-btn-control")
    const captchaCloseBtnDom        = document.querySelector("#wg-cap-close-btn")
    const captchaDialogBtnDom       = document.querySelector("#wg-cap-dialog")
    const captchaRefreshBtnDom      = document.querySelector("#wg-cap-refresh-btn")
    const captchaDefaultBtnDom      = document.querySelector("#wg-cap-btn-default")
    const captchaErrorBtnDom        = document.querySelector("#wg-cap-btn-error")
    const captchaOverBtnDom         = document.querySelector("#wg-cap-btn-over")
    const dialogDom                 = document.querySelector("#wg-cap-container")

    function __initialize() {
        // requestCaptchaData()
        handleEvent()

        document.addEventListener('touchstart', (event) => {
            if (event.touches.length > 1) {
                event.preventDefault()
            }
        })
        document.addEventListener('gesturestart', (event) => {
            event.preventDefault()
        })
        document.body.addEventListener('touchend', () => { })
    }

    function handleEvent() {
        Helper.addEventListener(captchaDragSlideBarDom, "mousedown", handleDragEvent, false)
        Helper.addEventListener(captchaDragBlockDom, "touchstart", handleDragEvent, false)
        Helper.addEventListener(captchaCloseBtnDom, "click", handleClickClose, false)
        Helper.addEventListener(captchaDialogBtnDom, "click", handleClickClose, false)
        Helper.addEventListener(captchaRefreshBtnDom, "click", handleClickRefresh, false)
        Helper.addEventListener(captchaDefaultBtnDom, "click", handleClickDefault, false)
        Helper.addEventListener(captchaErrorBtnDom, "click", handleClickDefault, false)
        Helper.addEventListener(captchaOverBtnDom, "click", handleClickDefault, false)
    }

    function resetCaptcha() {
        captchaKey = ""
        captchaTileImageDom.setAttribute("src", "")
        captchaTileWrapDom.style.left = 0
        captchaTileWrapDom.style.top = 0
        captchaDragBlockDom.style.left = 0
        captchaTileWrapDom.style.display = "none"
    }
	
	function restartCaptcha() {
        captchaKey = ""
		captchaBtnControlDom.classList.remove(activeSuccessClassName)
        captchaBtnControlDom.classList.remove(dialogActiveClassName)
        captchaBtnControlDom.classList.remove(activeErrorClassName)
        captchaBtnControlDom.classList.remove(activeOverClassName)
        captchaBtnControlDom.classList.add(activeDefaultClassName)
	}
	
	window['restartCaptcha'] = function() {
		restartCaptcha();
	}

    function clearImage() {
        captchaImageDom.setAttribute("src", "")
    }

    function handleDragEvent(ev){
        const touch = ev.touches && ev.touches[0];
        const ee = ev || window.event;
        const offsetLeft = captchaDragBlockDom.offsetLeft
        const width = captchaDragSlideBarDom.offsetWidth
        const blockWidth = captchaDragBlockDom.offsetWidth
        const maxWidth = width - blockWidth
        const tileWith  = captchaTileWrapDom.offsetWidth
        const ad = blockWidth - tileWith
        const p = ((maxWidth - pointX) + ad) / maxWidth

        var isMoving = false
        var startX = 0;
        if (touch) {
            startX = touch.pageX - offsetLeft
        } else {
            startX = ee.clientX - offsetLeft
        }

        const handleMove = function(e) {
            isMoving = true
            const mTouche = e.touches && e.touches[0];
            const me = e || window.event;

            var left = 0;
            if (mTouche) {
                left = mTouche.pageX - startX
            } else {
                left = me.clientX - startX
            }

            if (left >= maxWidth) {
                captchaDragBlockDom.style.left = maxWidth + "px";
                return
            }

            if (left <= 0) {
                captchaDragBlockDom.style.left = 0 + "px";
                return
            }

            captchaDragBlockDom.style.left = left + "px";
            captchaTileWrapDom.style.left = (pointX + (left * p))+ "px";
            me.cancelBubble = true
            me.preventDefault()
        }

        const handleUp = function(e) {
            const ue = e || window.event;

            if (!Helper.checkTargetFather(captchaDragSlideBarDom, e)) {
                return
            }

            if (!isMoving) {
                return
            }

            isMoving = false
            Helper.removeEventListener(captchaDragSlideBarDom, "mousemove", handleMove, false)
            Helper.removeEventListener(captchaDragSlideBarDom, "mouseup", handleUp, false)
            Helper.removeEventListener(captchaDragSlideBarDom, "mouseout", handleUp, false)

            Helper.removeEventListener(captchaDragSlideBarDom, "touchmove", handleMove, false)
            Helper.removeEventListener(captchaDragSlideBarDom, "touchend", handleUp, false)

            handleClickCheck(captchaTileWrapDom.offsetLeft, captchaTileWrapDom.offsetTop)

            ue.cancelBubble = true
            ue.preventDefault()
        }

        Helper.addEventListener(captchaDragSlideBarDom, "mousemove", handleMove, false);
        Helper.addEventListener(captchaDragSlideBarDom, "mouseup", handleUp, false);
        Helper.addEventListener(captchaDragSlideBarDom, "mouseout", handleUp, false);

        Helper.addEventListener(captchaDragSlideBarDom, "touchmove", handleMove, false);
        Helper.addEventListener(captchaDragSlideBarDom, "touchend", handleUp, false);

        ee.cancelBubble = true
        ee.preventDefault()
    }

    function handleClickRefresh() {
        requestCaptchaData()
    }

    function handleClickClose() {
        dialogDom.classList.remove(dialogActiveClassName)
    }

    function handleClickCheck(x, y) {
        if (x === pointX) {
            //alert("请点拖动图案进行验证")
            return
        }

        requestCheckCaptchaData({'point': [x, y].join(','), 'key': captchaKey})
    }

    function handleClickDefault() {
        requestCaptchaData()
        dialogDom.classList.add(dialogActiveClassName)
    }

    function requestCaptchaData() {
        resetCaptcha()
        clearImage()
        captchaImageDom.classList.add(hiddenClassName)

        Ajax.get(getCaptDataApi, {}, function(data){
            if (data['code'] === 0) {
                captchaImageDom.classList.remove(hiddenClassName)
                captchaImageDom.setAttribute("src", data['image_base64'])
                captchaTileImageDom.setAttribute("src", data['tile_base64'])

                captchaTileWrapDom.style.left = data['tile_x'] + "px"
                captchaTileWrapDom.style.top = data['tile_y'] + "px"
                captchaTileWrapDom.style.width = data['tile_width'] + "px"
                captchaTileWrapDom.style.height = data['tile_height'] + "px"
                captchaTileWrapDom.style.display = "block"

                captchaKey = data['captcha_key']
                pointX = data['tile_x']
                pointY = data['tile_y']
            } else {
                //alert("请求验证码数据失败：" + data['message'])
            }
        }, function(e){
            console.log("请求验证码数据失败：" + e['message']);
        })
    }

    function requestCheckCaptchaData(point) {
        Ajax.post(checkCaptDataApi, point, function(data){
            captchaBtnControlDom.classList.remove(activeDefaultClassName)
            captchaBtnControlDom.classList.remove(activeOverClassName)
            if (data['code'] === 0) {
                //alert("验证成功")
                captchaBtnControlDom.classList.remove(activeErrorClassName)
                captchaBtnControlDom.classList.add(activeSuccessClassName)
                setTimeout(function () {
                    handleClickClose()
                }, 200)
				$('[name=captcha_id]').val(point.key);
				$('[name=captcha_value]').val(point.point);
            } else {
                //alert("验证失败")
                captchaBtnControlDom.classList.remove(activeSuccessClassName)
                captchaBtnControlDom.classList.add(activeErrorClassName)
                requestCaptchaData()
            }
        }, function(e){
            captchaBtnControlDom.classList.remove(activeDefaultClassName)
            captchaBtnControlDom.classList.remove(activeOverClassName)
            captchaBtnControlDom.classList.remove(activeSuccessClassName)
            captchaBtnControlDom.classList.add(activeErrorClassName)
            requestCaptchaData()
        }, function () {
            captchaKey = ""
        })
    }

    __initialize()
    return {}
})();