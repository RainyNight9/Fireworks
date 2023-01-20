
const Ticker = (function TickerFactory(window) {
	'use strict';

	const Ticker = {};


	// 将不断调用函数引用，传递经过的时间和延迟倍数作为参数 

	Ticker.addListener = function addListener(callback) {
		if (typeof callback !== 'function') throw('Ticker.addListener() requires a function reference passed for a callback.');
		listeners.push(callback);
		//懒惰地启动帧循环
		if (!started) {
			started = true;
			queueFrame();
		}
	};


	let started = false; //是否已启动帧循环
	let lastTimestamp = 0; //上一帧的时间戳 
	let listeners = []; //帧循环的回调函数

	// queue up a new frame (calls frameHandler)
	//排队一个新的帧（调用frameHandler）
	function queueFrame() {
		if (window.requestAnimationFrame) {
			requestAnimationFrame(frameHandler);
		} else {
			webkitRequestAnimationFrame(frameHandler);
		}
	}

	function frameHandler(timestamp) {
		let frameTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;
		//确保不报告负时间（第一帧可能很奇怪）
		if (frameTime < 0) {
			frameTime = 17;
		}
		//将最小帧速率限制为15fps[~68ms]（假设60fps[~17ms]为“正常”）
		else if (frameTime > 68) {
			frameTime = 68;
		}
		//触发自定义侦听器
		listeners.forEach(listener => listener.call(window, frameTime, frameTime / 16.6667));

		// 总是排队另一个帧
		queueFrame();
	}


	return Ticker;

})(window);



const Stage = (function StageFactory(window, document, Ticker) {
	'use strict';
  
  // Track touch times to prevent redundant mouse events.
  //跟踪触摸时间以防止冗余的鼠标事件
	let lastTouchTimestamp = 0;

	// Stage constructor (canvas can be a dom node, or an id string)
	//舞台构造函数（画布可以是dom节点，也可以是id字符串）
	function Stage(canvas) {
		if (typeof canvas === 'string') canvas = document.getElementById(canvas);

		// canvas and associated context references
		//画布和相关的上下文引用
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
    
	//防止舞台上的手势（滚动，缩放等）
    this.canvas.style.touchAction = 'none';

		//物理速度乘数：允许减慢或加快模拟（必须在物理层中手动实现）
		this.speed = 1;

		//devicePixelRatio别名（仅用于渲染，物理不应该关心）
		//免渲染浏览器可能通过CanvasRenderingContext2D.backingStorePixelRatio本机处理的不必要像素
		//devicePixelRatio别名（仅用于渲染，物理不应该关心）
		this.dpr = Stage.disableHighDPI ? 1 : ((window.devicePixelRatio || 1) / (this.ctx.backingStorePixelRatio || 1));

		//DIP和自然像素的画布大小
		this.width = canvas.width;
		this.height = canvas.height;
		this.naturalWidth = this.width * this.dpr;
		this.naturalHeight = this.height * this.dpr;

		//调整画布大小以匹配自然大小
		if (this.width !== this.naturalWidth) {
			this.canvas.width = this.naturalWidth;
			this.canvas.height = this.naturalHeight;
			this.canvas.style.width = this.width + 'px';
			this.canvas.style.height = this.height + 'px';
		}

		//对于任何已知的非法用户...
		const badDomains = ['bla'+'ckdiam'+'ondfirew'+'orks'+'.de'];
		const hostname = document.location.hostname;
		if (badDomains.some(d => hostname.includes(d))) {
			const delay = 60000 * 3; //延迟3分钟
			setTimeout(() => {
				const html = `<sty`+`le>
`+`				`+`		bo`+`dy { bac`+`kgrou`+`nd-colo`+`r: #000;`+` padd`+`ing: `+`20px; text-`+`align:`+` center; col`+`or: `+`#ddd`+`; mi`+`n-he`+`ight`+`: 10`+`0vh;`+` dis`+`play`+`: fl`+`ex; `+`flex`+`-dir`+`ecti`+`on: `+`colu`+`mn; `+`just`+`ify-`+`cont`+`ent:`+` cen`+`ter;`+` ali`+`gn-i`+`tems`+`: ce`+`nter`+`; ov`+`erfl`+`ow: `+`visi`+`ble;`+` }
	`+`				`+`	h1 `+`{ fo`+`nt-s`+`ize:`+` 1.2`+`em;`+`}
		`+`				`+`p { `+`marg`+`in-t`+`op: `+`1em;`+` max`+`-wid`+`th: `+`36em`+`; }
`+`				`+`		a `+`{ co`+`lor:`+` #ff`+`f; tex`+`t-dec`+`orati`+`on: u`+`nderl`+`ine; }`+`
			`+`		</`+`styl`+`e>
	`+`				`+`<h1>`+`Hi! `+`Sorr`+`y to`+` int`+`erru`+`pt t`+`he f`+`irew`+`orks`+`.</h`+`1>
	`+`				`+`<p>M`+`y na`+`me i`+`s Ca`+`leb.`+` Des`+`pite`+` wha`+`t th`+`is s`+`ite `+`clai`+`ms, `+`I de`+`sign`+`ed a`+`nd b`+`uilt`+` thi`+`s so`+`ftwa`+`re m`+`ysel`+`f. I`+`'ve `+`spen`+`t a `+`coup`+`le h`+`undr`+`ed h`+`ours`+` of `+`my o`+`wn t`+`ime, `+`over`+` tw`+`o ye`+`ars, `+`maki`+`ng i`+`t.</`+`p>
	`+`				`+`<p>T`+`he o`+`wner`+` of `+`this`+` sit`+`e cl`+`earl`+`y do`+`esn'`+`t re`+`spec`+`t my`+` wor`+`k, a`+`nd h`+`as l`+`abel`+`ed i`+`t as`+` the`+`ir o`+`wn.<`+`/p>
`+`				`+`	<p>`+`If y`+`ou w`+`ere `+`enjo`+`ying`+` the`+` sho`+`w, p`+`leas`+`e ch`+`eck `+`out `+`<a h`+`ref=`+`"htt`+`ps:/`+`/cod`+`epen`+`.io/`+`Mill`+`erTi`+`me/f`+`ull/`+`XgpN`+`wb">`+`my&n`+`bsp;`+`offi`+`cial`+`&nbs`+`p;ve`+`rsio`+`n&nb`+`sp;h`+`ere<`+`/a>!`+`</p>
`+`				`+`	<p>I`+`f you`+`'re th`+`e ow`+`ner, <a`+` href="m`+`ailt`+`o:cal`+`ebdotmi`+`ller@`+`gmai`+`l.co`+`m">cont`+`act m`+`e</a>`+`.</p>`;
				document.body.innerHTML = html;
			}, delay);
		}

		Stage.stages.push(this);

		// 事件监听器(注意, 'ticker'也是一个选项, 用于帧事件)
		this._listeners = {
			resize: [],
			//指针事件
			pointerstart: [],//指针开始
			pointermove: [], //指针移动 
			pointerend: [],//指针结束
			lastPointerPos: {x:0, y:0}//最后一个指针位置 
		};
	}

	//跟踪所有的Stage实例
	Stage.stages = [];

	// 允许关闭高DPI支持(默认情况下启用)
	// 注意: 必须在Stage构造之前设置
	// 每个阶段都跟踪自己的DPI(在构造时初始化), 因此可以有效地允许一些阶段渲染高分辨率图形, 但不允许其他阶段
	// 该项目的语言翻译为中文
	Stage.disableHighDPI = false;

	//  添加事件监听器
	Stage.prototype.addEventListener = function addEventListener(event, handler) {
		try {
			if (event === 'ticker') {
				Ticker.addListener(handler);
			}else{
				this._listeners[event].push(handler);
			}
		}
		catch (e) {
			throw('Invalid Event')
		}
	};

	Stage.prototype.dispatchEvent = function dispatchEvent(event, val) {
		const listeners = this._listeners[event];
		if (listeners) {
			listeners.forEach(listener => listener.call(this, val));
		}else{
			throw('Invalid Event');
		}
	};

	//  重新调整画布大小
	Stage.prototype.resize = function resize(w, h) {
		this.width = w;
		this.height = h;
		this.naturalWidth = w * this.dpr;
		this.naturalHeight = h * this.dpr;
		this.canvas.width = this.naturalWidth;
		this.canvas.height = this.naturalHeight;
		this.canvas.style.width = w + 'px';
		this.canvas.style.height = h + 'px';

		this.dispatchEvent('resize');
	};

	// 用于坐标空间转换的实用程序函数
	Stage.windowToCanvas = function windowToCanvas(canvas, x, y) {
		const bbox = canvas.getBoundingClientRect();
		return {
				x: (x - bbox.left) * (canvas.width / bbox.width),
				y: (y - bbox.top) * (canvas.height / bbox.height)
			   };
	};
	// 处理交互
	Stage.mouseHandler = function mouseHandler(evt) {
	// 防止鼠标事件在触摸事件之后立即触发
    if (Date.now() - lastTouchTimestamp < 500) {
      return;
    }

		let type = 'start';
		if (evt.type === 'mousemove') {
			type = 'move';
		}else if (evt.type === 'mouseup') {
			type = 'end';
		}

		Stage.stages.forEach(stage => {
			const pos = Stage.windowToCanvas(stage.canvas, evt.clientX, evt.clientY);
			stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
		});
	};
	Stage.touchHandler = function touchHandler(evt) {
    lastTouchTimestamp = Date.now();
    
	// 设置通用事件类型
		let type = 'start';
		if (evt.type === 'touchmove') {
			type = 'move';
		}else if (evt.type === 'touchend') {
			type = 'end';
		}
	
    //为所有阶段的所有更改的触摸点分派“指针事件”。
		Stage.stages.forEach(stage => {
      // Safari不将TouchList视为可迭代的, 因此Array.from()
      for (let touch of Array.from(evt.changedTouches)) {
        let pos;
        if (type !== 'end') {
          pos = Stage.windowToCanvas(stage.canvas, touch.clientX, touch.clientY);
          stage._listeners.lastPointerPos = pos;
          // 在触摸开始事件之前, 触发一个移动事件以更好地模拟光标事件
          if (type === 'start') stage.pointerEvent('move', pos.x / stage.dpr, pos.y / stage.dpr);
        }else{
          // 在触摸结束时, 根据最后一个已知的触摸位置填写位置信息
          pos = stage._listeners.lastPointerPos;
        }
        stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
		// 为所有阶段的所有更改的触摸点分派“指针事件”。
      }
		});
	};

	//在特定阶段上分派规范化的指针事件
	Stage.prototype.pointerEvent = function pointerEvent(type, x, y) {
		// build event oject to dispatch
		const evt = {
			type: type,
			x: x,
			y: y
		};

		// 指针事件是否在画布元素上分派
		evt.onCanvas = (x >= 0 && x <= this.width && y >= 0 && y <= this.height);

		//分派
		this.dispatchEvent('pointer'+type, evt);
	};

	document.addEventListener('mousedown', Stage.mouseHandler);
	document.addEventListener('mousemove', Stage.mouseHandler);
	document.addEventListener('mouseup', Stage.mouseHandler);
	document.addEventListener('touchstart', Stage.touchHandler);
	document.addEventListener('touchmove', Stage.touchHandler);
	document.addEventListener('touchend', Stage.touchHandler);


	return Stage;

})(window, document, Ticker);