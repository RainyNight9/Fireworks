
'use strict';
console.clear();

const IS_MOBILE = window.innerWidth <= 640;//这是移动端的判断
const IS_DESKTOP = window.innerWidth > 800;//这是PC端的判断
const IS_HEADER = IS_DESKTOP && window.innerHeight < 300;//这是头部的判断 也就是说小手机的高度小于300px的时候就是小于300px的时候

const IS_HIGH_END_DEVICE = (() => {
	const hwConcurrency = navigator.hardwareConcurrency;
	if (!hwConcurrency) {
		return false;
	}
	const minCount = window.innerWidth <= 1024 ? 4 : 8;
	return hwConcurrency >= minCount;
})();//这是高端设备的判断 也就是说如果是高端设备的话就是4核以上的设备


const MAX_WIDTH = 7680; // 这是最大的宽度
const MAX_HEIGHT = 4320; //这是最大的宽高
const GRAVITY = 0.9; //这是?
let simSpeed = 1; //这是速度

function getDefaultScaleFactor() {
	if (IS_MOBILE) return 0.5; //如果是移动端的话就是0.5
	if (IS_HEADER) return 0.75; //如果是手机的话就是0.75
	return 0.5; //否则就是0.5
}



let stageW, stageH; //这是画布的宽高
let quality = 1; //这是画布的质量
let isLowQuality = false; //这是画布的低质量
let isNormalQuality = true; //这是画布的正常质量
let isHighQuality = false; //这是画布的高质量

const QUALITY_LOW = 1; //这是烟花大小的低质量
const QUALITY_NORMAL = 2; //这是烟花大小的正常质量
const QUALITY_HIGH = 3; //这是烟花大小的高质量

const SKY_LIGHT_NONE = 0; //这是天空的亮度 an
const SKY_LIGHT_DIM = 1; //这是天空的亮度	zc
const SKY_LIGHT_NORMAL = 2; //这是天空的亮度 光照

const COLOR = { //这是颜色
	Red: '#ff0043', //这是红色
	Green: '#14fc56', //这是绿色
	Blue: '#1e7fff', //这是蓝色
	Purple: '#e60aff', //这是紫色
	Gold: '#ffbf36', //这是金色
	White: '#ffffff' //这是白色
};


const INVISIBLE = '_INVISIBLE_'; //这是不可见的

const PI_2 = Math.PI * 2; //这是2π 也就是360度 也就是圆
const PI_HALF = Math.PI * 0.5; //这是π/2 也就是90度 也就是半圆


const trailsStage = new Stage('trails-canvas'); //这是烟花的画布 也就是烟花的轨迹 
const mainStage = new Stage('main-canvas'); //这是烟花的画布 也就是烟花的轨迹 
const stages = [
	trailsStage, //
	mainStage //这个minStage是烟花的画布,适用于300px
];




function fullscreenEnabled() {//这是全屏的判断
	return fscreen.fullscreenEnabled;//这是全屏的判断 
}
function isFullscreen() {//这是全屏的判断
	return !!fscreen.fullscreenElement;//这是全屏的判断 
}
function toggleFullscreen() {
	if (fullscreenEnabled()) {
		if (isFullscreen()) {
			fscreen.exitFullscreen();
		} else {
			fscreen.requestFullscreen(document.documentElement);
		}
	}
} //这个toggleFullscreen是全屏的判断

fscreen.addEventListener('fullscreenchange', () => {
	store.setState({ fullscreen: isFullscreen() });//store.setState是设置状态的 也就是设置全屏的状态
});//




//这是烟花的配置,设置一些烟花的属性
const store = {
	_listeners: new Set(),//这是监听器 也就是监听器的集合
	_dispatch(prevState) {
		this._listeners.forEach(listener => listener(this.state, prevState))//这是监听器 也就是监听器的集合
	},//
	state: {//这是状态 
		paused: true,//这是暂停,也就是烟花是否暂停
		soundEnabled: true,//这是声音,也就是烟花是否有声音
		menuOpen: false,//这是菜单,也就是烟花是否有菜单 
		openHelpTopic: null,//这是帮助,也就是烟花是否有帮助
		fullscreen: isFullscreen(),//这是全屏,也就是烟花是否全屏,调用的是上面的isFullscreen()方法
		config: { //这是配置Json
			quality: String(IS_HIGH_END_DEVICE ? QUALITY_HIGH : QUALITY_NORMAL),//这是烟花大小的配置,如果是高端设备就是高质量,否则就是正常质量
			shell: 'Random',//这是烟花数量的配置,随机
			size: IS_DESKTOP ? '3' : IS_HEADER ? '1.2' : '2',//这是烟花大小的配置,如果是桌面就是大,否则就是小
			autoLaunch: false,//这是自动启动,也就是烟花是否自动启动
			finale: true,//这是烟花是否有终结
			skyLighting: SKY_LIGHT_NORMAL + '',//这是烟花的天空亮度,跟随烟花颜色
			hideControls: IS_HEADER,//这是烟花是否隐藏控制
			longExposure: false, //这是烟花是否有长曝光,是否留下印记
			scaleFactor: getDefaultScaleFactor(),//这是烟花的缩放因子,也就是烟花的大小
		}
	},
	setState(nextState) {//这是设置状态的方法 
		const prevState = this.state;//这是上一个状态
		this.state = Object.assign({}, this.state, nextState);//这是状态 
		this._dispatch(prevState);// 这是状态
		this.persist();//这是持久化的方法
	},
	subscribe(listener) {
		this._listeners.add(listener);//这是监听器监听页面是否有变化
		return () => this._listeners.remove(listener);//删除监听器
	},
	load() {//这是加载的方法
		const serializedData = localStorage.getItem('cm_fireworks_data');//这是获取本地存储的数据
		if (serializedData) {//如果有数据
			const { schemaVersion, data } = JSON.parse(serializedData);//这是解析数据
			const config = this.state.config;//这是解析的配置
			switch (schemaVersion) {//这是版本切换
				case '1.1':
					config.quality = data.quality;//这是烟花质量的配置
					config.size = data.size;//这是烟花大小的配置
					config.skyLighting = data.skyLighting;//这是烟花天空亮度的配置
					break;
				case '1.2':
					config.quality = data.quality;//
					config.size = data.size;
					config.skyLighting = data.skyLighting;
					config.scaleFactor = data.scaleFactor;
					break;
				default:
					throw new Error('version异常');//这是抛出版本切换的异常
			}
			console.log(`当前版本: ${schemaVersion}`);
		} else if (localStorage.getItem('schemaVersion') === '1') {//如果没有数据,就判断版本
			let size;//这是大小
			try {
				const sizeRaw = localStorage.getItem('configSize');//这是获取本地存储的大小
				size = typeof sizeRaw === 'string' && JSON.parse(sizeRaw);//这是解析大小
			}
			catch (e) {
				console.log('解析配置错误:');//这是打印日志
				console.error(e);
				return;
			}
			const sizeInt = parseInt(size, 10);
			if (sizeInt >= 0 && sizeInt <= 4) {
				this.state.config.size = String(sizeInt);
			}
		}
	},
	persist() {//这是持久化的方法
		const config = this.state.config;//这是配置
		localStorage.setItem('cm_fireworks_data', JSON.stringify({
			schemaVersion: '1.2',
			data: {
				quality: config.quality,
				size: config.size,
				skyLighting: config.skyLighting,
				scaleFactor: config.scaleFactor
			}
		}));//这是设置本地存储的数据,写入到本地存储里面
	}
};

if (!IS_HEADER) {
	store.load();//这是调用加载的方法
}



//这是暂停的方法
function togglePause(toggle) {
	const paused = store.state.paused;//获取暂停的状态
	let newValue;//这是新建的变量
	if (typeof toggle === 'boolean') {//如果是布尔值
		newValue = toggle;//就是新建的值就是toggle
	} else {
		newValue = !paused;//否则就是新建的值就是暂停的状态
	}
	if (paused !== newValue) {
		store.setState({ paused: newValue });//就是设置暂停的状态
	}
}
//这是声音的方法
function toggleSound(toggle) {
	if (typeof toggle === 'boolean') {//如果是布尔值
		store.setState({ soundEnabled: toggle });//这是设置声音的状态
	} else {
		store.setState({ soundEnabled: !store.state.soundEnabled });//这是设置声音的状态
	}
}
//这是菜单的方法
function toggleMenu(toggle) {
	if (typeof toggle === 'boolean') {
		store.setState({ menuOpen: toggle });
	} else {
		store.setState({ menuOpen: !store.state.menuOpen });
	}
}
//这是更新配置的方法
function updateConfig(nextConfig) {
	nextConfig = nextConfig || getConfigFromDOM();
	store.setState({
		config: Object.assign({}, store.state.config, nextConfig)
	});
	configDidUpdate();
}
//这是配置更新的方法
function configDidUpdate() {
	const config = store.state.config;
	quality = qualitySelector();
	isLowQuality = quality === QUALITY_LOW;
	isNormalQuality = quality === QUALITY_NORMAL;
	isHighQuality = quality === QUALITY_HIGH;
	if (skyLightingSelector() === SKY_LIGHT_NONE) {
		appNodes.canvasContainer.style.backgroundColor = '#000';
	}
	Spark.drawWidth = quality === QUALITY_HIGH ? 0.75 : 1;
}


//这是获取配置的方法
const isRunning = (state = store.state) => !state.paused && !state.menuOpen;//这是获取是否运行的方法
const soundEnabledSelector = (state = store.state) => state.soundEnabled;//这是获取声音是否开启的方法
const canPlaySoundSelector = (state = store.state) => isRunning(state) && soundEnabledSelector(state);//这是获取是否可以播放声音的方法
const qualitySelector = () => +store.state.config.quality;//这是获取质量的方法
const shellNameSelector = () => store.state.config.shell;//这是获取烟花的方法
const shellSizeSelector = () => +store.state.config.size;//这是获取烟花大小的方法
const finaleSelector = () => store.state.config.finale;//这是获取保留烟花的方法
const skyLightingSelector = () => +store.state.config.skyLighting;//这是获取天空的方法
const scaleFactorSelector = () => store.state.config.scaleFactor;//这是获取缩放的方法
//这是获取配置的方法 从DOM里面获取 

const helpContent = {
	shellType: {
		header: '烟花类型',
		body: '你要放的烟花的类型，选择“随机（Random）”可以获得非常好的体验！'
	},
	shellSize: {
		header: '烟花大小',
		body: '烟花越大绽放范围就越大，但是烟花越大，设备所需的性能也会增多，大的烟花可能导致你的设备卡顿。'
	},
	quality: {
		header: '画质',
		body: '如果动画运行不流畅，你可以试试降低画质。画质越高，烟花绽放后的火花数量就越多，但高画质可能导致你的设备卡顿。'
	},
	skyLighting: {
		header: '照亮天空',
		body: '烟花爆炸时，背景会被照亮。如果你的屏幕看起来太亮了，可以把它改成“暗”或者“不”。'
	},
	scaleFactor: {
		header: '缩放',
		body: '使你与烟花离得更近或更远。对于较大的烟花，你可以选择更小的缩放值，尤其是在手机或平板电脑上。'
	},
	autoLaunch: {
		header: '自动放烟花',
		body: '开启后你就可以坐在你的设备屏幕前面欣赏烟花了，你也可以关闭它，但关闭后你就只能通过点击屏幕的方式来放烟花。'
	},
	finaleMode: {
		header: '同时放更多的烟花',
		body: '可以在同一时间自动放出更多的烟花（但需要开启先开启“自动放烟花”）。'
	},
	hideControls: {
		header: '隐藏控制按钮',
		body: '隐藏屏幕顶部的按钮。如果你要截图，或者需要一个无缝的体验，你就可以将按钮隐藏，隐藏按钮后你仍然可以在右上角打开设置。'
	},
	fullscreen: {
		header: '全屏',
		body: '切换至全屏模式'
	},
	longExposure: {
		header: '保留烟花的火花',
		body: '可以保留烟花留下的火花'
	}
};

//这是获取配置的方法 从DOM里面获取 
const nodeKeyToHelpKey = {
	shellTypeLabel: 'shellType',
	shellSizeLabel: 'shellSize',
	qualityLabel: 'quality',
	skyLightingLabel: 'skyLighting',
	scaleFactorLabel: 'scaleFactor',
	autoLaunchLabel: 'autoLaunch',
	finaleModeLabel: 'finaleMode',
	hideControlsLabel: 'hideControls',
	fullscreenLabel: 'fullscreen',
	longExposureLabel: 'longExposure'
};

//这是获取配置的方法 从DOM里面获取
const appNodes = {
	stageContainer: '.stage-container',
	canvasContainer: '.canvas-container',
	controls: '.controls',
	menu: '.menu',
	menuInnerWrap: '.menu__inner-wrap',
	pauseBtn: '.pause-btn',
	pauseBtnSVG: '.pause-btn use',
	soundBtn: '.sound-btn',
	soundBtnSVG: '.sound-btn use',
	shellType: '.shell-type',
	shellTypeLabel: '.shell-type-label',
	shellSize: '.shell-size',
	shellSizeLabel: '.shell-size-label',
	quality: '.quality-ui',
	qualityLabel: '.quality-ui-label',
	skyLighting: '.sky-lighting',
	skyLightingLabel: '.sky-lighting-label',
	scaleFactor: '.scaleFactor',
	scaleFactorLabel: '.scaleFactor-label',
	autoLaunch: '.auto-launch',
	autoLaunchLabel: '.auto-launch-label',
	finaleModeFormOption: '.form-option--finale-mode',
	finaleMode: '.finale-mode',
	finaleModeLabel: '.finale-mode-label',
	hideControls: '.hide-controls',
	hideControlsLabel: '.hide-controls-label',
	fullscreenFormOption: '.form-option--fullscreen',//全屏按钮
	fullscreen: '.fullscreen',
	fullscreenLabel: '.fullscreen-label',
	longExposure: '.long-exposure',
	longExposureLabel: '.long-exposure-label',
	helpModal: '.help-modal',
	helpModalOverlay: '.help-modal__overlay',
	helpModalHeader: '.help-modal__header',
	helpModalBody: '.help-modal__body',
	helpModalCloseBtn: '.help-modal__close-btn'
};
Object.keys(appNodes).forEach(key => {
	appNodes[key] = document.querySelector(appNodes[key]);//这里是将appNodes里面的每一个key都变成一个DOM对象
});
if (!fullscreenEnabled()) {//如果不支持全屏 就隐藏全屏按钮
	appNodes.fullscreenFormOption.classList.add('remove');//这里是将appNodes里面的全屏按钮隐藏
}
//这个函数是用来渲染页面的 里面的state是一个对象
function renderApp(state) {
	const pauseBtnIcon = `#icon-${state.paused ? 'play' : 'pause'}`;
	const soundBtnIcon = `#icon-sound-${soundEnabledSelector() ? 'on' : 'off'}`;
	appNodes.pauseBtnSVG.setAttribute('href', pauseBtnIcon);
	appNodes.pauseBtnSVG.setAttribute('xlink:href', pauseBtnIcon);
	appNodes.soundBtnSVG.setAttribute('href', soundBtnIcon);
	appNodes.soundBtnSVG.setAttribute('xlink:href', soundBtnIcon);
	appNodes.controls.classList.toggle('hide', state.menuOpen || state.config.hideControls);
	appNodes.canvasContainer.classList.toggle('blur', state.menuOpen);
	appNodes.menu.classList.toggle('hide', !state.menuOpen);
	appNodes.finaleModeFormOption.style.opacity = state.config.autoLaunch ? 1 : 0.32;
	appNodes.quality.value = state.config.quality;
	appNodes.shellType.value = state.config.shell;
	appNodes.shellSize.value = state.config.size;
	appNodes.autoLaunch.checked = state.config.autoLaunch;
	appNodes.finaleMode.checked = state.config.finale;
	appNodes.skyLighting.value = state.config.skyLighting;
	appNodes.hideControls.checked = state.config.hideControls;
	appNodes.fullscreen.checked = state.fullscreen;
	appNodes.longExposure.checked = state.config.longExposure;
	appNodes.scaleFactor.value = state.config.scaleFactor.toFixed(2);
	appNodes.menuInnerWrap.style.opacity = state.openHelpTopic ? 0.12 : 1;
	appNodes.helpModal.classList.toggle('active', !!state.openHelpTopic);
	if (state.openHelpTopic) {
		const { header, body } = helpContent[state.openHelpTopic];
		appNodes.helpModalHeader.textContent = header;
		appNodes.helpModalBody.textContent = body;
	}
}
store.subscribe(renderApp);//这里是将renderApp函数注册到store.subscribe里面

//这个函数是用来处理state的变化的
function handleStateChange(state, prevState) {
	const canPlaySound = canPlaySoundSelector(state);
	const canPlaySoundPrev = canPlaySoundSelector(prevState);
	if (canPlaySound !== canPlaySoundPrev) {
		if (canPlaySound) {
			soundManager.resumeAll();
		} else {
			soundManager.pauseAll();
		}
	}
}
store.subscribe(handleStateChange);//这里是将handleStateChange函数注册到监听器里面

//这个函数是用来获取页面上变化的的配置的
function getConfigFromDOM() {
	return {
		quality: appNodes.quality.value,//这里是获取页面上的质量
		shell: appNodes.shellType.value,//这里是获取页面上的外壳
		size: appNodes.shellSize.value,//这里是获取页面上的外壳大小
		autoLaunch: appNodes.autoLaunch.checked,//这里是获取页面上的自动启动
		finale: appNodes.finaleMode.checked,//这里是获取页面上的是否开启终极模式同时
		skyLighting: appNodes.skyLighting.value,//这里是获取页面上的天空亮度
		longExposure: appNodes.longExposure.checked,//这里是获取页面上的是否开启长曝光
		hideControls: appNodes.hideControls.checked,//这里是获取页面上的是否隐藏控制按钮
		scaleFactor: parseFloat(appNodes.scaleFactor.value)//这里是获取页面上的缩放比例
	};
};

//这个函数是用来更新配置的
const updateConfigNoEvent = () => updateConfig();//这里是将updateConfig函数赋值给updateConfigNoEvent
appNodes.quality.addEventListener('input', updateConfigNoEvent);
appNodes.shellType.addEventListener('input', updateConfigNoEvent);
appNodes.shellSize.addEventListener('input', updateConfigNoEvent);
appNodes.autoLaunch.addEventListener('click', () => setTimeout(updateConfig, 0));
appNodes.finaleMode.addEventListener('click', () => setTimeout(updateConfig, 0));
appNodes.skyLighting.addEventListener('input', updateConfigNoEvent);
appNodes.longExposure.addEventListener('click', () => setTimeout(updateConfig, 0));
appNodes.hideControls.addEventListener('click', () => setTimeout(updateConfig, 0));
appNodes.fullscreen.addEventListener('click', () => setTimeout(toggleFullscreen, 0));
appNodes.scaleFactor.addEventListener('input', () => {
	updateConfig();
	handleResize();
});
Object.keys(nodeKeyToHelpKey).forEach(nodeKey => {
	const helpKey = nodeKeyToHelpKey[nodeKey];
	appNodes[nodeKey].addEventListener('click', () => {
		store.setState({ openHelpTopic: helpKey });
	});
});
appNodes.helpModalCloseBtn.addEventListener('click', () => {
	store.setState({ openHelpTopic: null });
});
appNodes.helpModalOverlay.addEventListener('click', () => {
	store.setState({ openHelpTopic: null });
});



//这个函数是用来更新配置的 颜色的
const COLOR_NAMES = Object.keys(COLOR);
const COLOR_CODES = COLOR_NAMES.map(colorName => COLOR[colorName]);
const COLOR_CODES_W_INVIS = [...COLOR_CODES, INVISIBLE];
const COLOR_CODE_INDEXES = COLOR_CODES_W_INVIS.reduce((obj, code, i) => {
	obj[code] = i;
	return obj;
}, {});
const COLOR_TUPLES = {};//这里是用来存储颜色的
COLOR_CODES.forEach(hex => {//这里是将颜色转换成rgb的
	COLOR_TUPLES[hex] = {
		r: parseInt(hex.substr(1, 2), 16),
		g: parseInt(hex.substr(3, 2), 16),
		b: parseInt(hex.substr(5, 2), 16),
	};
});

//这个函数是用来更新配置的 颜色的
function randomColorSimple() {
	return COLOR_CODES[Math.random() * COLOR_CODES.length | 0];
}


//这个函数是用来更新配置的 颜色的
let lastColor;
function randomColor(options) {
	const notSame = options && options.notSame;
	const notColor = options && options.notColor;
	const limitWhite = options && options.limitWhite;
	let color = randomColorSimple();
	if (limitWhite && color === COLOR.White && Math.random() < 0.6) {
		color = randomColorSimple();
	}
	if (notSame) {
		while (color === lastColor) {
			color = randomColorSimple();
		}
	}
	else if (notColor) {
		while (color === notColor) {
			color = randomColorSimple();
		}
	}
	lastColor = color;
	return color;
}
//随机颜色
function whiteOrGold() {
	return Math.random() < 0.5 ? COLOR.Gold : COLOR.White;
}
//这个函数是用来更新配置的 颜色的
function makePistilColor(shellColor) {
	return (shellColor === COLOR.White || shellColor === COLOR.Gold) ? randomColor({ notColor: shellColor }) : whiteOrGold();
}

//这个函数是用来生成烟花的配置,准备发射
const crysanthemumShell = (size = 1) => {
	const glitter = Math.random() < 0.25;
	const singleColor = Math.random() < 0.72;
	const color = singleColor ? randomColor({ limitWhite: true }) : [randomColor(), randomColor({ notSame: true })];
	const pistil = singleColor && Math.random() < 0.42;
	const pistilColor = pistil && makePistilColor(color);
	const secondColor = singleColor && (Math.random() < 0.2 || color === COLOR.White) ? pistilColor || randomColor({ notColor: color, limitWhite: true }) : null;
	const streamers = !pistil && color !== COLOR.White && Math.random() < 0.42;
	let starDensity = glitter ? 1.1 : 1.25;
	if (isLowQuality) starDensity *= 0.8;
	if (isHighQuality) starDensity = 1.2;
	return {
		shellSize: size,//烟花的大小
		spreadSize: 300 + size * 100,//烟花的散开大小
		starLife: 900 + size * 200,//烟花的生命
		starDensity,//烟花的密度
		color,//烟花的颜色
		secondColor,//烟花的随机颜色范围
		glitter: glitter ? 'light' : '',//烟花的闪光，可以是下面的其中一个：'light', 'medium', 'heavy', 'streamer', 'willow'
		glitterColor: whiteOrGold(),//烟花的闪光颜色,金色或者白色范围
		pistil,//烟花的 
		pistilColor,//烟花的
		streamers//烟花的
	};
};

//这个函数是用来生成烟花的配置
const ghostShell = (size = 1) => {
	const shell = crysanthemumShell(size);
	shell.starLife *= 1.5;
	let ghostColor = randomColor({ notColor: COLOR.White });
	shell.streamers = true;
	const pistil = Math.random() < 0.42;
	const pistilColor = pistil && makePistilColor(ghostColor);
	shell.color = INVISIBLE;
	shell.secondColor = ghostColor;
	shell.glitter = '';
	return shell;
};

//这个函数是用来生成一个烟花
const strobeShell = (size = 1) => {
	const color = randomColor({ limitWhite: true });
	return {
		shellSize: size,
		spreadSize: 280 + size * 92,
		starLife: 1100 + size * 200,
		starLifeVariation: 0.40,
		starDensity: 1.1,
		color,
		glitter: 'light',
		glitterColor: COLOR.White,
		strobe: true,
		strobeColor: Math.random() < 0.5 ? COLOR.White : null,
		pistil: Math.random() < 0.5,
		pistilColor: makePistilColor(color)
	};
};
//这个函数是用来生成一个烟花配置
const palmShell = (size = 1) => {
	const color = randomColor();
	const thick = Math.random() < 0.5;
	return {
		shellSize: size,
		color,
		spreadSize: 250 + size * 75,
		starDensity: thick ? 0.15 : 0.4,
		starLife: 1800 + size * 200,
		glitter: thick ? 'thick' : 'heavy'
	};
};

const ringShell = (size = 1) => {
	const color = randomColor();
	const pistil = Math.random() < 0.75;
	return {
		shellSize: size,
		ring: true,
		color,
		spreadSize: 300 + size * 100,
		starLife: 900 + size * 200,
		starCount: 2.2 * PI_2 * (size + 1),
		pistil,
		pistilColor: makePistilColor(color),
		glitter: !pistil ? 'light' : '',
		glitterColor: color === COLOR.Gold ? COLOR.Gold : COLOR.White,
		streamers: Math.random() < 0.3
	};

};

const crossetteShell = (size = 1) => {
	const color = randomColor({ limitWhite: true });
	return {
		shellSize: size,
		spreadSize: 300 + size * 100,
		starLife: 750 + size * 160,
		starLifeVariation: 0.4,
		starDensity: 0.85,
		color,
		crossette: true,
		pistil: Math.random() < 0.5,
		pistilColor: makePistilColor(color)
	};
};

const floralShell = (size = 1) => ({
	shellSize: size,
	spreadSize: 300 + size * 120,
	starDensity: 0.12,
	starLife: 500 + size * 50,
	starLifeVariation: 0.5,
	color: Math.random() < 0.65 ? 'random' : (Math.random() < 0.15 ? randomColor() : [randomColor(), randomColor({ notSame: true })]),
	floral: true
});

const fallingLeavesShell = (size = 1) => ({
	shellSize: size,
	color: INVISIBLE,
	spreadSize: 300 + size * 120,
	starDensity: 0.12,
	starLife: 500 + size * 50,
	starLifeVariation: 0.5,
	glitter: 'medium',
	glitterColor: COLOR.Gold,
	fallingLeaves: true
});

const willowShell = (size = 1) => ({
	shellSize: size,
	spreadSize: 300 + size * 100,
	starDensity: 0.6,
	starLife: 3000 + size * 300,
	glitter: 'willow',
	glitterColor: COLOR.Gold,
	color: INVISIBLE
});


//这个函数是用来生成一个烟花配置
const crackleShell = (size = 1) => {
	const color = Math.random() < 0.75 ? COLOR.Gold : randomColor();
	return {
		shellSize: size, //烟花的大小
		spreadSize: 380 + size * 75, //烟花的散开大小 
		starDensity: isLowQuality ? 0.65 : 1, //烟花的密度
		starLife: 600 + size * 100, //烟花的生命
		starLifeVariation: 0.32, //烟花的生命变化
		glitter: 'light', //烟花的闪光
		glitterColor: COLOR.Gold, //烟花的闪光颜色
		color, //烟花的颜色
		crackle: true, //烟花的爆炸 
		pistil: Math.random() < 0.65, //烟花的花瓣
		pistilColor: makePistilColor(color) //烟花的花瓣颜色
	};
};//这是一个烟花的配置文件
const horsetailShell = (size = 1) => {
	const color = randomColor();
	return {
		shellSize: size, //烟花的大小
		horsetail: true, //烟花的爆炸
		color, //烟花的颜色
		spreadSize: 250 + size * 38, //烟花的散开大小
		starDensity: 0.9, //烟花的密度
		starLife: 2500 + size * 300, //烟花的生命
		glitter: 'medium', //烟花的闪光
		glitterColor: Math.random() < 0.5 ? whiteOrGold() : color, //烟花的闪光颜色范围
		strobe: color === COLOR.White ? 0.5 : 0.25, //烟花的闪光频率
	};
};//这是一个烟花的配置文件

function randomShellName() {
	return Math.random() < 0.5 ? 'Crysanthemum' : shellNames[(Math.random() * (shellNames.length - 1) + 1) | 0];
} //这是一个随机烟花的函数

function randomShell(size) {
	if (IS_HEADER) return randomFastShell()(size);
	return shellTypes[randomShellName()](size);
} //这是一个随机烟花的函数
function shellFromConfig(size) {
	return shellTypes[shellNameSelector()](size);
} //这是一个随机烟花的函数




const fastShellBlacklist = ['Falling Leaves', 'Floral', 'Willow']; //这是一个随机烟花的函数 这个函数是用来排除一些烟花的 
function randomFastShell() { //这是一个随机烟花的函数 
	const isRandom = shellNameSelector() === 'Random'; //如果烟花是随机的话 就会随机一个烟花
	let shellName = isRandom ? randomShellName() : shellNameSelector();
	if (isRandom) { //如果isRandom是true的话,那就是随机
		while (fastShellBlacklist.includes(shellName)) { //在fastShellBlacklist里面找shellName
			shellName = randomShellName();//如果找到了就会随机一个烟花配置
		}
	}
	return shellTypes[shellName]; //返回一个烟花的的配置
}


const shellTypes = {
	'Random': randomShell, //这是一个随机烟花的函数
	'Crackle': crackleShell, //这是Crackle烟花的函数
	'Crossette': crossetteShell, //这是Crossette烟花的函数
	'Crysanthemum': crysanthemumShell, //这是Crysanthemum烟花的函数
	'Falling Leaves': fallingLeavesShell, //这是Falling Leaves烟花的函数
	'Floral': floralShell, //这是Floral烟花的函数
	'Ghost': ghostShell, //这是Ghost烟花的函数 
	'Horse Tail': horsetailShell,	//这是Horse Tail烟花的函数
	'Palm': palmShell, //这是Palm烟花的函数
	'Ring': ringShell, //这是Ring烟花的函数
	'Strobe': strobeShell, //这是Strobe烟花的函数
	'Willow': willowShell //这是Willow烟花的函数
};

const shellNames = Object.keys(shellTypes); //这是一个烟花的名字


//这是一个初始化的函数 设置一些烟花的配置
function init() {
	document.querySelector('.loading-init').remove(); //这是一个移除loading-init的函数
	appNodes.stageContainer.classList.remove('remove'); //这是一个移除stageContainer的函数
	function setOptionsForSelect(node, options) {
		node.innerHTML = options.reduce((acc, opt) => acc += `<option value="${opt.value}">${opt.label}</option>`, '');
	} //这是一个设置一些烟花的配置的函数
	let options = '';
	shellNames.forEach(opt => options += `<option value="${opt}">${opt}</option>`);
	appNodes.shellType.innerHTML = options;
	options = '';
	['3"', '4"', '6"', '8"', '12"', '16"'].forEach((opt, i) => options += `<option value="${i}">${opt}</option>`);
	appNodes.shellSize.innerHTML = options;

	setOptionsForSelect(appNodes.quality, [
		{ label: '低', value: QUALITY_LOW },
		{ label: '正常', value: QUALITY_NORMAL },
		{ label: '高', value: QUALITY_HIGH }
	]);
	setOptionsForSelect(appNodes.skyLighting, [
		{ label: '不', value: SKY_LIGHT_NONE },
		{ label: '暗', value: SKY_LIGHT_DIM },
		{ label: '正常', value: SKY_LIGHT_NORMAL }
	]);
	setOptionsForSelect(
		appNodes.scaleFactor,
		[0.5, 0.62, 0.75, 0.9, 1.0, 1.5, 2.0]
			.map(value => ({ value: value.toFixed(2), label: `${value * 100}%` }))
	);//这是一个设置一些烟花的配置的函数

	togglePause(false);//这是一个暂停的函数
	renderApp(store.state);//这是一个渲染app的函数
	configDidUpdate();//这是一个配置更新的函数
}

//fitShellPositionInBoundsH这是一个设置烟花的位置的函数
function fitShellPositionInBoundsH(position) {
	const edge = 0.18;
	return (1 - edge * 2) * position + edge;
}

function fitShellPositionInBoundsV(position) {
	return position * 0.75;
}//这是一个

function getRandomShellPositionH() {
	return fitShellPositionInBoundsH(Math.random());
}//

function getRandomShellPositionV() {
	return fitShellPositionInBoundsV(Math.random());
}

//这是一个获取随机的烟花的大小的函数
function getRandomShellSize() {
	const baseSize = shellSizeSelector();
	const maxVariance = Math.min(2.5, baseSize);
	const variance = Math.random() * maxVariance;
	const size = baseSize - variance;
	const height = maxVariance === 0 ? Math.random() : 1 - (variance / maxVariance);
	const centerOffset = Math.random() * (1 - height * 0.65) * 0.5;
	const x = Math.random() < 0.5 ? 0.5 - centerOffset : 0.5 + centerOffset;
	return {
		size,
		x: fitShellPositionInBoundsH(x),
		height: fitShellPositionInBoundsV(height)
	};
}//这是一个获取随机的烟花的大小的函数


//这是一个从配置中启动烟花的函数
function launchShellFromConfig(event) {
	const shell = new Shell(shellFromConfig(shellSizeSelector()));
	const w = mainStage.width;
	const h = mainStage.height;
	shell.launch(
		event ? event.x / w : getRandomShellPositionH(),
		event ? 1 - event.y / h : getRandomShellPositionV()
	);
}


//这是一个随机的烟花的函数
function seqRandomShell() {
	const size = getRandomShellSize();
	const shell = new Shell(shellFromConfig(size.size));
	shell.launch(size.x, size.height);
	let extraDelay = shell.starLife;
	if (shell.fallingLeaves) {
		extraDelay = 4600;
	}
	return 900 + Math.random() * 600 + extraDelay;
}
//这是一个随机的快速的烟花的函数
function seqRandomFastShell() {
	const shellType = randomFastShell();
	const size = getRandomShellSize();
	const shell = new Shell(shellType(size.size));
	shell.launch(size.x, size.height);

	let extraDelay = shell.starLife;

	return 900 + Math.random() * 600 + extraDelay;
}

//这是一个随机的两个烟花的函数
function seqTwoRandom() {
	const size1 = getRandomShellSize();
	const size2 = getRandomShellSize();
	const shell1 = new Shell(shellFromConfig(size1.size));
	const shell2 = new Shell(shellFromConfig(size2.size));
	const leftOffset = Math.random() * 0.2 - 0.1;
	const rightOffset = Math.random() * 0.2 - 0.1;
	shell1.launch(0.3 + leftOffset, size1.height);
	setTimeout(() => {
		shell2.launch(0.7 + rightOffset, size2.height);
	}, 100);
	let extraDelay = Math.max(shell1.starLife, shell2.starLife);
	if (shell1.fallingLeaves || shell2.fallingLeaves) {
		extraDelay = 4600;
	}
	return 900 + Math.random() * 600 + extraDelay;
}


//这是一个随机的三个烟花的函数
function seqTriple() {
	const shellType = randomFastShell();
	const baseSize = shellSizeSelector();
	const smallSize = Math.max(0, baseSize - 1.25);
	const offset = Math.random() * 0.08 - 0.04;
	const shell1 = new Shell(shellType(baseSize));
	shell1.launch(0.5 + offset, 0.7);
	const leftDelay = 1000 + Math.random() * 400;
	const rightDelay = 1000 + Math.random() * 400;
	setTimeout(() => {
		const offset = Math.random() * 0.08 - 0.04;
		const shell2 = new Shell(shellType(smallSize));
		shell2.launch(0.2 + offset, 0.1);
	}, leftDelay);
	setTimeout(() => {
		const offset = Math.random() * 0.08 - 0.04;
		const shell3 = new Shell(shellType(smallSize));
		shell3.launch(0.8 + offset, 0.1);
	}, rightDelay);

	return 4000;
}

//这是一个到三角形的烟花
function seqPyramid() {
	const barrageCountHalf = IS_DESKTOP ? 7 : 4;
	const largeSize = shellSizeSelector();
	const smallSize = Math.max(0, largeSize - 3);
	const randomMainShell = Math.random() < 0.78 ? crysanthemumShell : ringShell;
	const randomSpecialShell = randomShell;
	function launchShell(x, useSpecial) {
		const isRandom = shellNameSelector() === 'Random';
		let shellType = isRandom
			? useSpecial ? randomSpecialShell : randomMainShell
			: shellTypes[shellNameSelector()];
		const shell = new Shell(shellType(useSpecial ? largeSize : smallSize));
		const height = x <= 0.5 ? x / 0.5 : (1 - x) / 0.5;
		shell.launch(x, useSpecial ? 0.75 : height * 0.42);
	}

	let count = 0;
	let delay = 0;
	while (count <= barrageCountHalf) {
		if (count === barrageCountHalf) {
			setTimeout(() => {
				launchShell(0.5, true);
			}, delay);
		} else {
			const offset = count / barrageCountHalf * 0.5;
			const delayOffset = Math.random() * 30 + 30;
			setTimeout(() => {
				launchShell(offset, false);
			}, delay);
			setTimeout(() => {
				launchShell(1 - offset, false);
			}, delay + delayOffset);
		}

		count++;
		delay += 200;
	}

	return 3400 + barrageCountHalf * 250;
}

//这是一个正三角形烟花的函数
function seqSmallBarrage() {
	seqSmallBarrage.lastCalled = Date.now();
	const barrageCount = IS_DESKTOP ? 11 : 5;
	const specialIndex = IS_DESKTOP ? 3 : 1;
	const shellSize = Math.max(0, shellSizeSelector() - 2);
	const randomMainShell = Math.random() < 0.78 ? crysanthemumShell : ringShell;
	const randomSpecialShell = randomFastShell();
	function launchShell(x, useSpecial) {
		const isRandom = shellNameSelector() === 'Random';
		let shellType = isRandom
			? useSpecial ? randomSpecialShell : randomMainShell
			: shellTypes[shellNameSelector()];
		const shell = new Shell(shellType(shellSize));
		const height = (Math.cos(x * 5 * Math.PI + PI_HALF) + 1) / 2;
		shell.launch(x, height * 0.75);
	}

	let count = 0;
	let delay = 0;
	while (count < barrageCount) {
		if (count === 0) {
			launchShell(0.5, false)
			count += 1;
		}
		else {
			const offset = (count + 1) / barrageCount / 2;
			const delayOffset = Math.random() * 30 + 30;
			const useSpecial = count === specialIndex;
			setTimeout(() => {
				launchShell(0.5 + offset, useSpecial);
			}, delay);
			setTimeout(() => {
				launchShell(0.5 - offset, useSpecial);
			}, delay + delayOffset);
			count += 2;
		}
		delay += 200;
	}

	return 3400 + barrageCount * 120;
}


seqSmallBarrage.cooldown = 15000;//这是一个小的烟花的函数
seqSmallBarrage.lastCalled = Date.now();//这是一个小的烟花的函数


const sequences = [//烟花的种类
	seqRandomShell, //随机的烟花
	seqTwoRandom, //二个随机的烟花
	seqTriple, //三个烟花
	seqPyramid, //金字塔的烟花
	seqSmallBarrage //三角形烟花
];


let isFirstSeq = true; //是否是第一个
const finaleCount = 32; //最后的烟花的数量
let currentFinaleCount = 0; //当前的最后的烟花的数量


//开始,运行一次一个烟花
function startSequence() {
	if (isFirstSeq) { //如果是第一次
		isFirstSeq = false; //改成不是第一次了
		if (IS_HEADER) { //
			return seqTwoRandom();
		}
		else {
			const shell = new Shell(crysanthemumShell(shellSizeSelector()));//创建一个烟花
			shell.launch(0.5, 0.5);//烟花的位置
			return 2400;//
		}
	}
	//这里是第一个烟花的开始,后面是随机
	if (finaleSelector()) { //如果是最后的烟花
		seqRandomFastShell();//随机的快速的烟花
		if (currentFinaleCount < finaleCount) { //如果当前的最后的烟花的数量小于最后的烟花的数量
			currentFinaleCount++; //当前的最后的烟花的数量加一
			return 170;
		}
		else {
			currentFinaleCount = 0;
			return 6000;
		}
	}

	const rand = Math.random();

	if (rand < 0.08 && Date.now() - seqSmallBarrage.lastCalled > seqSmallBarrage.cooldown) {
		return seqSmallBarrage();
	} //这是判断是否是小的烟花 

	if (rand < 0.2) {
		return seqPyramid();
	}//这是判断如果是0.1就调用金色烟花

	if (rand < 0.6 && !IS_HEADER) {//如果小于0.6并且不是没有加载的
		return seqRandomShell(); //随机的烟花
	} else if (rand < 0.8) { //如果小于0.8 
		return seqTwoRandom(); //第二个随机的烟花
	} else if (rand < 1) {
		return seqTriple(); //第三种烟花
	}
}


let activePointerCount = 0;
let isUpdatingSpeed = false;

function handlePointerStart(event) {//这是一个点击导航的函数
	activePointerCount++;//这是获取鼠标点击加一次
	const btnSize = 50;//这是一个按钮的大小

	if (event.y < btnSize) {//如果点击的位置小于按钮的大小
		if (event.x < btnSize) {//如果点击的位置小于按钮的大小
			togglePause();//暂停
			return;//返回
		}
		if (event.x > mainStage.width / 2 - btnSize / 2 && event.x < mainStage.width / 2 + btnSize / 2) {
			toggleSound();//声音
			return;
		}
		if (event.x > mainStage.width - btnSize) {
			toggleMenu();//菜单
			return;
		}
	}

	if (!isRunning()) return;

	if (updateSpeedFromEvent(event)) {
		isUpdatingSpeed = true;
	}
	else if (event.onCanvas) {
		launchShellFromConfig(event);
	}
}

function handlePointerEnd(event) {
	activePointerCount--;//这是获取鼠标的函数 
	isUpdatingSpeed = false; //不是更新速度
}

function handlePointerMove(event) {//这是获取鼠标的函数
	if (!isRunning()) return;//如果没有运行就返回 
	if (isUpdatingSpeed) {//如果正在更新速度
		updateSpeedFromEvent(event);//更新速度
	}
}

function handleKeydown(event) {

	if (event.keyCode === 80) {//如果按下的是p键,就暂停
		togglePause();//暂停
	}

	else if (event.keyCode === 79) {//如果按下的是o键,就声音
		toggleSound();//打开声音
	}

	else if (event.keyCode === 27) {//如果按下的是esc键,就菜单
		toggleMenu(false);//菜单
	}
}

mainStage.addEventListener('pointerstart', handlePointerStart);//pointerstart是鼠标点击的事件?这是获取鼠标的函数
mainStage.addEventListener('pointerend', handlePointerEnd);//这是获取鼠标的函数
mainStage.addEventListener('pointermove', handlePointerMove);//烟花运行在中执行的函数
window.addEventListener('keydown', handleKeydown);//这是获取键盘的函数



function handleResize() {
	//这是一个获取屏幕的函数
	const w = window.innerWidth;
	const h = window.innerHeight;
	const containerW = Math.min(w, MAX_WIDTH);
	const containerH = w <= 420 ? h : Math.min(h, MAX_HEIGHT);
	appNodes.stageContainer.style.width = containerW + 'px';
	appNodes.stageContainer.style.height = containerH + 'px';
	stages.forEach(stage => stage.resize(containerW, containerH));
	const scaleFactor = scaleFactorSelector();
	stageW = containerW / scaleFactor;
	stageH = containerH / scaleFactor;
}

handleResize();
window.addEventListener('resize', handleResize);



let currentFrame = 0;
let speedBarOpacity = 0;
let autoLaunchTime = 0;

function updateSpeedFromEvent(event) {
	//这是更新烟花发射速度的函数
	if (isUpdatingSpeed || event.y >= mainStage.height - 44) {
		const edge = 16;
		const newSpeed = (event.x - edge) / (mainStage.width - edge * 2);
		simSpeed = Math.min(Math.max(newSpeed, 0), 1);
		speedBarOpacity = 1;
		return true;
	}

	return false;
}

function updateGlobals(timeStep, lag) {
	//这是更新全局的函数
	currentFrame++;
	if (!isUpdatingSpeed) {
		speedBarOpacity -= lag / 30;
		if (speedBarOpacity < 0) {
			speedBarOpacity = 0;
		}
	}
	if (store.state.config.autoLaunch) {//如果自动发射
		autoLaunchTime -= timeStep;//自动发射时间减去时间
		if (autoLaunchTime <= 0) {//如果自动发射时间小于0
			autoLaunchTime = startSequence() * 1.25;//自动发射时间等于发射序列乘以1.25
		}
	}
}

function update(frameTime, lag) {
	//这是更新的函数
	if (!isRunning()) return;
	const width = stageW;
	const height = stageH;
	const timeStep = frameTime * simSpeed;
	const speed = simSpeed * lag;
	updateGlobals(timeStep, lag);
	const starDrag = 1 - (1 - Star.airDrag) * speed;
	const starDragHeavy = 1 - (1 - Star.airDragHeavy) * speed;
	const sparkDrag = 1 - (1 - Spark.airDrag) * speed;
	const gAcc = timeStep / 1000 * GRAVITY;
	COLOR_CODES_W_INVIS.forEach(color => {
		const stars = Star.active[color];
		for (let i = stars.length - 1; i >= 0; i = i - 1) {
			const star = stars[i];
			if (star.updateFrame === currentFrame) {
				continue;
			}
			star.updateFrame = currentFrame;
			star.life -= timeStep;
			if (star.life <= 0) {
				stars.splice(i, 1);
				Star.returnInstance(star);
			} else {
				const burnRate = Math.pow(star.life / star.fullLife, 0.5);
				const burnRateInverse = 1 - burnRate;
				star.prevX = star.x;
				star.prevY = star.y;
				star.x += star.speedX * speed;
				star.y += star.speedY * speed;

				if (!star.heavy) {
					star.speedX *= starDrag;
					star.speedY *= starDrag;
				}
				else {
					star.speedX *= starDragHeavy;
					star.speedY *= starDragHeavy;
				}
				star.speedY += gAcc;

				if (star.spinRadius) {
					star.spinAngle += star.spinSpeed * speed;
					star.x += Math.sin(star.spinAngle) * star.spinRadius * speed;
					star.y += Math.cos(star.spinAngle) * star.spinRadius * speed;
				}
				if (star.sparkFreq) {
					star.sparkTimer -= timeStep;
					while (star.sparkTimer < 0) {
						star.sparkTimer += star.sparkFreq * 0.75 + star.sparkFreq * burnRateInverse * 4;
						Spark.add(
							star.x,
							star.y,
							star.sparkColor,
							Math.random() * PI_2,
							Math.random() * star.sparkSpeed * burnRate,
							star.sparkLife * 0.8 + Math.random() * star.sparkLifeVariation * star.sparkLife
						);
					}
				}
				if (star.life < star.transitionTime) {
					if (star.secondColor && !star.colorChanged) {
						star.colorChanged = true;
						star.color = star.secondColor;
						stars.splice(i, 1);
						Star.active[star.secondColor].push(star);
						if (star.secondColor === INVISIBLE) {
							star.sparkFreq = 0;
						}
					}

					if (star.strobe) {

						star.visible = Math.floor(star.life / star.strobeFreq) % 3 === 0;
					}
				}
			}
		}
		const sparks = Spark.active[color];
		for (let i = sparks.length - 1; i >= 0; i = i - 1) {
			const spark = sparks[i];
			spark.life -= timeStep;
			if (spark.life <= 0) {
				sparks.splice(i, 1);
				Spark.returnInstance(spark);
			} else {
				spark.prevX = spark.x;
				spark.prevY = spark.y;
				spark.x += spark.speedX * speed;
				spark.y += spark.speedY * speed;
				spark.speedX *= sparkDrag;
				spark.speedY *= sparkDrag;
				spark.speedY += gAcc;
			}
		}
	});

	render(speed);
}

function render(speed) {
	const { dpr } = mainStage;
	const width = stageW;
	const height = stageH;
	const trailsCtx = trailsStage.ctx;
	const mainCtx = mainStage.ctx;
	if (skyLightingSelector() !== SKY_LIGHT_NONE) {
		colorSky(speed);
	}
	const scaleFactor = scaleFactorSelector();
	trailsCtx.scale(dpr * scaleFactor, dpr * scaleFactor);
	mainCtx.scale(dpr * scaleFactor, dpr * scaleFactor);
	trailsCtx.globalCompositeOperation = 'source-over';
	trailsCtx.fillStyle = `rgba(0, 0, 0, ${store.state.config.longExposure ? 0.0025 : 0.175 * speed})`;
	trailsCtx.fillRect(0, 0, width, height);
	mainCtx.clearRect(0, 0, width, height);
	while (BurstFlash.active.length) {
		const bf = BurstFlash.active.pop();
		const burstGradient = trailsCtx.createRadialGradient(bf.x, bf.y, 0, bf.x, bf.y, bf.radius);
		burstGradient.addColorStop(0.024, 'rgba(255, 255, 255, 1)');
		burstGradient.addColorStop(0.125, 'rgba(255, 160, 20, 0.2)');
		burstGradient.addColorStop(0.32, 'rgba(255, 140, 20, 0.11)');
		burstGradient.addColorStop(1, 'rgba(255, 120, 20, 0)');
		trailsCtx.fillStyle = burstGradient;
		trailsCtx.fillRect(bf.x - bf.radius, bf.y - bf.radius, bf.radius * 2, bf.radius * 2);
		BurstFlash.returnInstance(bf);
	}
	trailsCtx.globalCompositeOperation = 'lighten';
	trailsCtx.lineWidth = Star.drawWidth;
	trailsCtx.lineCap = isLowQuality ? 'square' : 'round';
	mainCtx.strokeStyle = '#fff';
	mainCtx.lineWidth = 1;
	mainCtx.beginPath();
	COLOR_CODES.forEach(color => {
		const stars = Star.active[color];
		trailsCtx.strokeStyle = color;
		trailsCtx.beginPath();
		stars.forEach(star => {
			if (star.visible) {
				trailsCtx.moveTo(star.x, star.y);
				trailsCtx.lineTo(star.prevX, star.prevY);
				mainCtx.moveTo(star.x, star.y);
				mainCtx.lineTo(star.x - star.speedX * 1.6, star.y - star.speedY * 1.6);
			}
		});
		trailsCtx.stroke();
	});
	mainCtx.stroke();
	trailsCtx.lineWidth = Spark.drawWidth;
	trailsCtx.lineCap = 'butt';
	COLOR_CODES.forEach(color => {
		const sparks = Spark.active[color];
		trailsCtx.strokeStyle = color;
		trailsCtx.beginPath();
		sparks.forEach(spark => {
			trailsCtx.moveTo(spark.x, spark.y);
			trailsCtx.lineTo(spark.prevX, spark.prevY);
		});
		trailsCtx.stroke();
	});
	if (speedBarOpacity) {
		const speedBarHeight = 6;
		mainCtx.globalAlpha = speedBarOpacity;
		mainCtx.fillStyle = COLOR.Blue;
		mainCtx.fillRect(0, height - speedBarHeight, width * simSpeed, speedBarHeight);
		mainCtx.globalAlpha = 1;
	}
	trailsCtx.setTransform(1, 0, 0, 1, 0, 0);
	mainCtx.setTransform(1, 0, 0, 1, 0, 0);
}



// Sky color
const currentSkyColor = { r: 0, g: 0, b: 0 };
const targetSkyColor = { r: 0, g: 0, b: 0 };
function colorSky(speed) {
	const maxSkySaturation = skyLightingSelector() * 15;
	const maxStarCount = 500;
	let totalStarCount = 0;
	targetSkyColor.r = 0;
	targetSkyColor.g = 0;
	targetSkyColor.b = 0;

	COLOR_CODES.forEach(color => {
		const tuple = COLOR_TUPLES[color];
		const count = Star.active[color].length;
		totalStarCount += count;
		targetSkyColor.r += tuple.r * count;
		targetSkyColor.g += tuple.g * count;
		targetSkyColor.b += tuple.b * count;
	});
	const intensity = Math.pow(Math.min(1, totalStarCount / maxStarCount), 0.3);
	const maxColorComponent = Math.max(1, targetSkyColor.r, targetSkyColor.g, targetSkyColor.b);
	targetSkyColor.r = targetSkyColor.r / maxColorComponent * maxSkySaturation * intensity;
	targetSkyColor.g = targetSkyColor.g / maxColorComponent * maxSkySaturation * intensity;
	targetSkyColor.b = targetSkyColor.b / maxColorComponent * maxSkySaturation * intensity;
	const colorChange = 10;
	currentSkyColor.r += (targetSkyColor.r - currentSkyColor.r) / colorChange * speed;
	currentSkyColor.g += (targetSkyColor.g - currentSkyColor.g) / colorChange * speed;
	currentSkyColor.b += (targetSkyColor.b - currentSkyColor.b) / colorChange * speed;
	appNodes.canvasContainer.style.backgroundColor = `rgb(${currentSkyColor.r | 0}, ${currentSkyColor.g | 0}, ${currentSkyColor.b | 0})`;
}
mainStage.addEventListener('ticker', update);


//创建一个圆形爆炸的粒子
function createParticleArc(start, arcLength, count, randomness, particleFactory) {
	const angleDelta = arcLength / count;
	const end = start + arcLength - (angleDelta * 0.5);
	if (end > start) {
		for (let angle = start; angle < end; angle = angle + angleDelta) {
			particleFactory(angle + Math.random() * angleDelta * randomness);
		}
	} else {
		for (let angle = start; angle > end; angle = angle + angleDelta) {
			particleFactory(angle + Math.random() * angleDelta * randomness);
		}
	}
}



//创建一个球形爆炸的粒子
//参数：count：想要的粒子数，这个值是一个建议，创建的爆炸可能会有更多的粒子。当前的算法不能完美地在球体表面均匀地分布特定数量的点。
//particleFactory：每个星星/粒子生成一次。传递两个参数：angle：粒子的方向。speed：粒子速度的倍数，从0.0到1.0。
//startAngle=0：对于分段的爆炸，您可以仅生成部分弧形的粒子。这允许设置起始弧度。
//arcLength=TAU：弧长（弧度）。默认为一个完整的圆。
//返回：返回值：无，它取决于particleFactory使用给定的数据。

function createBurst(count, particleFactory, startAngle = 0, arcLength = PI_2) {
	const R = 0.5 * Math.sqrt(count / Math.PI);// R是半径
	const C = 2 * R * Math.PI; // C是周长
	const C_HALF = C / 2; // C_HALF是半周长
	for (let i = 0; i <= C_HALF; i++) {
		const ringAngle = i / C_HALF * PI_HALF; // ringAngle是环的角度
		const ringSize = Math.cos(ringAngle); // ringSize是环的大小
		const partsPerFullRing = C * ringSize; // partsPerFullRing是每个完整的环的部分
		const partsPerArc = partsPerFullRing * (arcLength / PI_2); // partsPerArc是每个弧的部分
		const angleInc = PI_2 / partsPerFullRing; // angleInc是角度增量
		const angleOffset = Math.random() * angleInc + startAngle; // angleOffset是角度偏移
		const maxRandomAngleOffset = angleInc * 0.33; // maxRandomAngleOffset是最大随机角度偏移
		for (let i = 0; i < partsPerArc; i++) { // i是每个弧的部分 
			const randomAngleOffset = Math.random() * maxRandomAngleOffset; // randomAngleOffset是随机角度偏移
			let angle = angleInc * i + angleOffset + randomAngleOffset; // angle是角度
			particleFactory(angle, ringSize);
			// particleFactory是粒子工厂传递两个参数：angle：粒子的方向。speed：粒子速度的倍数，从0.0到1.0。
		}
	}
}

function crossetteEffect(star) {// crossetteEffect是交叉效果
	const startAngle = Math.random() * PI_HALF; // startAngle是开始角度
	createParticleArc(startAngle, PI_2, 4, 0.5, (angle) => { // createParticleArc是创建一个粒子弧 
		Star.add(
			star.x,
			star.y,
			star.color,
			angle,
			Math.random() * 0.6 + 0.75,
			600
		);
	});
} //创建一个交叉的粒子


function floralEffect(star) {// floralEffect是花状效果
	const count = 12 + 6 * quality;
	createBurst(count, (angle, speedMult) => {
		Star.add(
			star.x,
			star.y,
			star.color,
			angle,
			speedMult * 2.4,
			1000 + Math.random() * 300,
			star.speedX,
			star.speedY
		);
	});
	BurstFlash.add(star.x, star.y, 46);
	soundManager.playSound('burstSmall');
}//创建一个花状的粒子


function fallingLeavesEffect(star) {// fallingLeavesEffect是落叶效果
	createBurst(7, (angle, speedMult) => {
		const newStar = Star.add(
			star.x,
			star.y,
			INVISIBLE,
			angle,
			speedMult * 2.4,
			2400 + Math.random() * 600,
			star.speedX,
			star.speedY
		);

		newStar.sparkColor = COLOR.Gold;
		newStar.sparkFreq = 144 / quality;
		newStar.sparkSpeed = 0.28;
		newStar.sparkLife = 750;
		newStar.sparkLifeVariation = 3.2;
	});

	BurstFlash.add(star.x, star.y, 46);
	soundManager.playSound('burstSmall');
} //创建一个落叶的粒子


function crackleEffect(star) {// crackleEffect是爆裂效果
	const count = isHighQuality ? 32 : 16; // count是数量
	createParticleArc(0, PI_2, count, 1.8, (angle) => { // createParticleArc是创建一个粒子弧
		Spark.add(
			star.x,
			star.y,
			COLOR.Gold,
			angle,

			Math.pow(Math.random(), 0.45) * 2.4,
			300 + Math.random() * 200
		);
	});
} //创建一个爆裂的粒子



//烟花的外壳，可以用下面的参数来构造
//spreadSize:烟花的大小
//starCount:烟花的数量，这个参数是可选的，如果没有设置的话，会根据烟花的大小来设置一个合理的数量
//starLife:烟花的生命
//starLifeVariation:烟花的生命变化
//color:烟花的颜色
//glitterColor:烟花的闪光颜色
//glitter:烟花的闪光，可以是下面的其中一个：'light', 'medium', 'heavy', 'streamer', 'willow'
//pistil:烟花的花瓣
//pistilColor:烟花的花瓣颜色
//streamers:烟花的流星
//crossette:烟花的交叉
//floral:烟花的花朵
//crackle:烟花的爆裂
class Shell {
	constructor(options) {// constructor是构造函数
		Object.assign(this, options);
		this.starLifeVariation = options.starLifeVariation || 0.125;
		this.color = options.color || randomColor();
		this.glitterColor = options.glitterColor || this.color;
		if (!this.starCount) {
			const density = options.starDensity || 1;
			const scaledSize = this.spreadSize / 54;
			this.starCount = Math.max(6, scaledSize * scaledSize * density);
		}
	}
	launch(position, launchHeight) {// launch是发射 
		const width = stageW; // width是宽度
		const height = stageH; // height是高度
		const hpad = 60; // hpad是水平间距
		const vpad = 50; // vpad是垂直间距
		const minHeightPercent = 0.45; // minHeightPercent是最小高度百分比
		const minHeight = height - height * minHeightPercent; // minHeight是最小高度
		const launchX = position * (width - hpad * 2) + hpad; // launchX是发射的X坐标
		const launchY = height; // launchY是发射的Y坐标
		const burstY = minHeight - (launchHeight * (minHeight - vpad)); // burstY是爆炸的Y坐标
		const launchDistance = launchY - burstY; // launchDistance是发射的距离
		const launchVelocity = Math.pow(launchDistance * 0.04, 0.64); // launchVelocity是发射的速度
		const comet = this.comet = Star.add( // comet是烟花
			launchX, // launchX是发射的X坐标
			launchY, // launchY是发射的Y坐标
			typeof this.color === 'string' && this.color !== 'random' ? this.color : COLOR.White, // color是颜色
			Math.PI, // angle是角度
			launchVelocity * (this.horsetail ? 1.2 : 1),	// speed是速度
			launchVelocity * (this.horsetail ? 100 : 400) // life是生命
		);
		comet.heavy = true; // heavy是重量
		comet.spinRadius = MyMath.random(0.32, 0.85);	// spinRadius是旋转半径
		comet.sparkFreq = 32 / quality;	// sparkFreq是粒子频率
		if (isHighQuality) comet.sparkFreq = 8; // 如果是高质量的话，粒子频率是8
		comet.sparkLife = 320; // sparkLife是粒子生命
		comet.sparkLifeVariation = 3;	// sparkLifeVariation是粒子生命变化
		if (this.glitter === 'willow' || this.fallingLeaves) {	// 如果是willow或者fallingLeaves的话
			comet.sparkFreq = 20 / quality;	// 粒子频率是20
			comet.sparkSpeed = 0.5;	// 粒子速度是0.5
			comet.sparkLife = 500;	// 粒子生命是500
		}
		if (this.color === INVISIBLE) {	// 如果颜色是不可见的话
			comet.sparkColor = COLOR.Gold;	// 粒子颜色是金色
		}
		if (Math.random() > 0.4 && !this.horsetail) { // 如果随机数大于0.4并且不是horsetail的话
			comet.secondColor = INVISIBLE;	// 第二种颜色是不可见的
			comet.transitionTime = Math.pow(Math.random(), 1.5) * 700 + 500;	// transitionTime是过渡时间
		}
		comet.onDeath = comet => this.burst(comet.x, comet.y); // onDeath是死亡,开始爆炸事件
		soundManager.playSound('lift'); // 播放声音
	}
	// burst是爆炸
	burst(x, y) {
		const speed = this.spreadSize / 96; // speed是速度
		let color, onDeath, sparkFreq, sparkSpeed, sparkLife; // color是颜色，onDeath是死亡，sparkFreq是粒子频率，sparkSpeed是粒子速度，sparkLife是粒子生命
		let sparkLifeVariation = 0.25; // sparkLifeVariation是粒子生命变化
		let playedDeathSound = false; // playedDeathSound是播放死亡声音
		if (this.crossette) onDeath = (star) => { // 如果是crossette的话
			if (!playedDeathSound) { // 如果没有播放死亡声音的话
				soundManager.playSound('crackleSmall'); // 播放小的爆裂声音
				playedDeathSound = true; // 播放死亡声音是真
			}
			crossetteEffect(star);// crossette效果 
		}
		if (this.crackle) onDeath = (star) => { // 如果是crackle的话
			if (!playedDeathSound) { // 如果没有播放死亡声音的话
				soundManager.playSound('crackle'); // 播放爆裂声音
				playedDeathSound = true; // 播放死亡声音是真
			}
			crackleEffect(star);// crackle效果 
		}
		if (this.floral) onDeath = floralEffect; // 如果是floral的话
		if (this.fallingLeaves) onDeath = fallingLeavesEffect; // 如果是fallingLeaves的话

		if (this.glitter === 'light') { // 如果是light的话
			sparkFreq = 400; // 粒子频率是400
			sparkSpeed = 0.3; // 粒子速度是0.3
			sparkLife = 300; // 粒子生命是300
			sparkLifeVariation = 2; // 粒子生命变化是2
		}
		else if (this.glitter === 'medium') { // 如果是medium的话
			sparkFreq = 200; // 粒子频率是200
			sparkSpeed = 0.44; // 粒子速度是0.44
			sparkLife = 700; // 粒子生命是700
			sparkLifeVariation = 2; // 粒子生命变化是2
		}
		else if (this.glitter === 'heavy') { // 如果是heavy的话
			sparkFreq = 80;
			sparkSpeed = 0.8;
			sparkLife = 1400;
			sparkLifeVariation = 2;
		}
		else if (this.glitter === 'thick') { // 如果是thick的话
			sparkFreq = 16;
			sparkSpeed = isHighQuality ? 1.65 : 1.5; // 如果是高质量的话
			sparkLife = 1400;
			sparkLifeVariation = 3;
		}
		else if (this.glitter === 'streamer') { // 如果是streamer的话
			sparkFreq = 32;
			sparkSpeed = 1.05;
			sparkLife = 620;
			sparkLifeVariation = 2;
		}
		else if (this.glitter === 'willow') { // 如果是willow的话
			sparkFreq = 120; // 粒子频率是120
			sparkSpeed = 0.34; // 粒子速度是0.34
			sparkLife = 1400; // 粒子生命是1400
			sparkLifeVariation = 3.8; 		// 粒子生命变化是3.8
		}
		sparkFreq = sparkFreq / quality; // 粒子频率是粒子频率除以质量
		let firstStar = true; // 第一个星星是真
		// starFactory是星星工厂
		const starFactory = (angle, speedMult) => {
			const standardInitialSpeed = this.spreadSize / 1800; // 标准初始速度是这个扩散大小除以1800
			const star = Star.add( // 添加星星
				x,
				y,
				color || randomColor(), // 颜色是随机颜色
				angle,
				speedMult * speed, // 速度是速度乘以速度倍数

				this.starLife + Math.random() * this.starLife * this.starLifeVariation, // 星星生命是星星生命加上星星生命乘以星星生命变化
				this.horsetail ? this.comet && this.comet.speedX : 0, this.horsetail ? this.comet && this.comet.speedY : -standardInitialSpeed
				// 如果是horsetail的话 那么就是这个彗星和这个彗星的速度X 否则就是0	
			);
			if (this.secondColor) { // 如果有第二种颜色的话
				star.transitionTime = this.starLife * (Math.random() * 0.05 + 0.32); // 星星过渡时间是星星生命乘以随机数乘以0.05加上0.32
				star.secondColor = this.secondColor; // 星星第二种颜色是第二种颜色
			}
			if (this.strobe) { // 如果是strobe的话
				star.transitionTime = this.starLife * (Math.random() * 0.08 + 0.46); // 星星过渡时间是星星生命乘以随机数乘以0.08加上0.46
				star.strobe = true; // 星星闪烁是真
				star.strobeFreq = Math.random() * 20 + 40; // 星星闪烁频率是随机数乘以20加上40
				if (this.strobeColor) { // 如果有闪烁颜色的话
					star.secondColor = this.strobeColor; // 星星第二种颜色是闪烁颜色
				}
			}
			// 星星死亡是死亡
			star.onDeath = onDeath;
			if (this.glitter) { // 如果有闪光的话
				star.sparkFreq = sparkFreq; // 星星粒子频率是粒子频率
				star.sparkSpeed = sparkSpeed; // 星星粒子速度是粒子速度
				star.sparkLife = sparkLife; // 星星粒子生命是粒子生命
				star.sparkLifeVariation = sparkLifeVariation; // 星星粒子生命变化是粒子生命变化
				star.sparkColor = this.glitterColor; // 星星粒子颜色是闪光颜色
				star.sparkTimer = Math.random() * star.sparkFreq; // 星星粒子计时器是随机数乘以星星粒子频率
			}
		};
		if (typeof this.color === 'string') { // 如果颜色是字符串的话
			if (this.color === 'random') { // 如果颜色是随机的话
				color = null; // 颜色是空
			} else {
				color = this.color; // 颜色是这个颜色
			}
			if (this.ring) { // 如果是环的话
				const ringStartAngle = Math.random() * Math.PI; // 环开始角度是随机数乘以PI
				const ringSquash = Math.pow(Math.random(), 2) * 0.85 + 0.15;; // 环压缩是随机数的平方乘以0.85加上0.15
				createParticleArc(0, PI_2, this.starCount, 0, angle => { // 创建粒子弧
					const initSpeedX = Math.sin(angle) * speed * ringSquash;
					const initSpeedY = Math.cos(angle) * speed; // 初始化速度Y是余弦角度乘以速度
					const newSpeed = MyMath.pointDist(0, 0, initSpeedX, initSpeedY); // 新速度是0,0和这个速度X和速度Y的距离
					const newAngle = MyMath.pointAngle(0, 0, initSpeedX, initSpeedY) + ringStartAngle;
					const star = Star.add( // 添加星星
						x,
						y,
						color,
						newAngle,
						newSpeed,//speed,
						this.starLife + Math.random() * this.starLife * this.starLifeVariation
					);
					if (this.glitter) {
						star.sparkFreq = sparkFreq;
						star.sparkSpeed = sparkSpeed;
						star.sparkLife = sparkLife;
						star.sparkLifeVariation = sparkLifeVariation;
						star.sparkColor = this.glitterColor;
						star.sparkTimer = Math.random() * star.sparkFreq;
					}
				});
			}
			else {
				createBurst(this.starCount, starFactory); // 创建爆炸
			}
		}
		else if (Array.isArray(this.color)) { // 如果颜色是数组的话
			if (Math.random() < 0.5) { // 如果随机数小于0.5的话
				const start = Math.random() * Math.PI; // 开始是随机数乘以PI
				const start2 = start + Math.PI; // 开始2是开始加上PI
				const arc = Math.PI; // 弧是PI
				color = this.color[0]; // 颜色是这个颜色的0
				createBurst(this.starCount, starFactory, start, arc); // 创建爆炸
				color = this.color[1]; // 颜色是这个颜色的1
				createBurst(this.starCount, starFactory, start2, arc);
			} else {
				color = this.color[0];
				createBurst(this.starCount / 2, starFactory);
				color = this.color[1];
				createBurst(this.starCount / 2, starFactory);
			}
		}
		else {
			throw new Error('Invalid shell color. Expected string or array of strings, but got: ' + this.color);
		}
		if (this.pistil) { // 如果是花蕊的话
			const innerShell = new Shell({
				spreadSize: this.spreadSize * 0.5,
				starLife: this.starLife * 0.6,
				starLifeVariation: this.starLifeVariation,
				starDensity: 1.4,
				color: this.pistilColor,
				glitter: 'light',
				glitterColor: this.pistilColor === COLOR.Gold ? COLOR.Gold : COLOR.White
			});
			innerShell.burst(x, y); // 爆炸
		}
		if (this.streamers) { // 如果是彗星的话
			const innerShell = new Shell({ // 内部的壳
				spreadSize: this.spreadSize * 0.9, // 0.9
				starLife: this.starLife * 0.8, // 0.8
				starLifeVariation: this.starLifeVariation, // 0.5
				starCount: Math.floor(Math.max(6, this.spreadSize / 45)), // 6个星星
				color: COLOR.White, // this.pistilColor,
				glitter: 'streamer' // 'streamer' is a special value that makes the glitter look like streamers
			});
			innerShell.burst(x, y); // 爆炸
		}
		BurstFlash.add(x, y, this.spreadSize / 4); // 添加爆炸闪光
		if (this.comet) { // 如果是彗星的话
			const maxDiff = 2; // 最大差异是2
			const sizeDifferenceFromMaxSize = Math.min(maxDiff, shellSizeSelector() - this.shellSize); // 大小差异是最小值
			const soundScale = (1 - sizeDifferenceFromMaxSize / maxDiff) * 0.3 + 0.7; // 声音比例是(1-大小差异/最大差异)*0.3+0.7
			soundManager.playSound('burst', soundScale); // 播放爆炸声音
		}
	}

}

//绘制爆炸效果是文字
class TextStar {
	loadCanvas(value) {
		var canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')
		canvas.style.position = 'absolute'
		canvas.style.left = '40%'
		canvas.style.top = '10%'
		canvas.style.zIndex = '9999'
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		var fontSize = 100 // 文本大小
		// 文本长度
		var width = calWordWidth(value, fontSize)
		var canvasTxt = document.createElement('canvas')
		canvasTxt.width = width
		canvasTxt.height = fontSize
		var ctxTxt = canvasTxt.getContext('2d')
		ctxTxt.font = fontSize + 'px Microsoft YaHei'
		ctxTxt.fillStyle = 'orange'
		ctxTxt.fillText(value, 0, fontSize - 16) // 调整绘制字符位置
		// 放入html中 
		document.body.appendChild(canvasTxt)
	}
	/**
	 * 计算 文本总长度
	 * */
	calWordWidth(value, fontSize) {
		var arr = value.split('')
		var reg = /\w/
		var width = 0
		arr.forEach(function (item, index) {
			if (reg.test(item)) {
				width += fontSize // 字母宽度
			} else {
				width += fontSize + 10 // 汉字宽度
			}
		})
		return width
	}
}



//爆炸闪光 
const BurstFlash = {
	active: [],
	_pool: [],
	_new() {
		return {}
	},
	add(x, y, radius) {//添加 
		const instance = this._pool.pop() || this._new();
		instance.x = x;
		instance.y = y;
		instance.radius = radius;
		this.active.push(instance);
		return instance;
	},
	returnInstance(instance) {
		this._pool.push(instance);
	}
};




//绘制爆炸闪光
function createParticleCollection() {
	const collection = {};
	COLOR_CODES_W_INVIS.forEach(color => {//遍历颜色 
		collection[color] = [];//创建一个数组
	});
	return collection;
}





//绘制发射火花
const Star = {
	drawWidth: 3,//绘制宽度
	airDrag: 0.98,//爆炸光线的长度具体可以设置成500看效果差异
	airDragHeavy: 0.992,//发射出去的光线的长度
	active: createParticleCollection(),//活动的
	_pool: [],//池
	_new() {
		return {};
	},
	add(x, y, color, angle, speed, life, speedOffX, speedOffY) {
		const instance = this._pool.pop() || this._new();
		instance.visible = true;
		instance.heavy = false;
		instance.x = x;
		instance.y = y;
		instance.prevX = x;
		instance.prevY = y;
		instance.color = color;
		instance.speedX = Math.sin(angle) * speed + (speedOffX || 0);
		instance.speedY = Math.cos(angle) * speed + (speedOffY || 0);
		instance.life = life;
		instance.fullLife = life;
		instance.spinAngle = Math.random() * PI_2;
		instance.spinSpeed = 0.8;
		instance.spinRadius = 0;
		instance.sparkFreq = 0;
		instance.sparkSpeed = 1;
		instance.sparkTimer = 0;
		instance.sparkColor = color;
		instance.sparkLife = 750;
		instance.sparkLifeVariation = 0.25;
		instance.strobe = false;
		this.active[color].push(instance);
		return instance;
	},
	returnInstance(instance) {
		instance.onDeath && instance.onDeath(instance);
		instance.onDeath = null;
		instance.secondColor = null;
		instance.transitionTime = 0;
		instance.colorChanged = false;
		this._pool.push(instance);
	}
};

// 火花 闪光绘制
const Spark = {
	drawWidth: 0,
	airDrag: 0.9,
	active: createParticleCollection(),
	_pool: [],
	_new() {
		return {};
	},
	add(x, y, color, angle, speed, life) {
		const instance = this._pool.pop() || this._new();
		instance.x = x;
		instance.y = y;
		instance.prevX = x;
		instance.prevY = y;
		instance.color = color;
		instance.speedX = Math.sin(angle) * speed;
		instance.speedY = Math.cos(angle) * speed;
		instance.life = life;
		this.active[color].push(instance);
		return instance;
	},
	returnInstance(instance) {
		this._pool.push(instance);
	}
};

//绘制文字
const SparText = {
	drawWidth: 0,
	airDrag: 0.9,
	active: createParticleCollection(),
	_pool: [],
	_new() {
		return {};
	},
	add(x, y, color, angle, speed, life, text) {
		const instance = this._pool.pop() || this._new();
		instance.x = x;
		instance.y = y;
		instance.prevX = x;
		instance.prevY = y;
		instance.color = color;
		instance.speedX = Math.sin(angle) * speed;
		instance.speedY = Math.cos(angle) * speed;
		instance.life = life;
		instance.text = text;
		this.active[color].push(instance);
		return instance;
	},
	returnInstance(instance) {
		this._pool.push(instance);
	}
};


const soundManager = {
	baseURL: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/',//远程地址 如果音频失效可以换成本地/mp3地址
	ctx: new (window.AudioContext || window.webkitAudioContext),
	sources: {
		lift: {
			volume: 1,
			playbackRateMin: 0.85,
			playbackRateMax: 0.95,
			fileNames: [
				'lift1.mp3',
				'lift2.mp3',
				'lift3.mp3'
			]
		},
		burst: {
			volume: 1,
			playbackRateMin: 0.8,
			playbackRateMax: 0.9,
			fileNames: [
				'burst1.mp3',
				'burst2.mp3'
			]
		},//这是烟花起飞的声音
		burstSmall: {
			volume: 0.25,
			playbackRateMin: 0.8,
			playbackRateMax: 1,
			fileNames: [
				'burst-sm-1.mp3',
				'burst-sm-2.mp3'
			]
		},//这是烟花起飞的声音 不同起飞方式的声音不同
		crackle: {
			volume: 0.2,
			playbackRateMin: 1,
			playbackRateMax: 1,
			fileNames: ['crackle1.mp3']
		},//这是烟花爆炸的声音
		crackleSmall: {
			volume: 0.3,
			playbackRateMin: 1,
			playbackRateMax: 1,
			fileNames: ['crackle-sm-1.mp3']
		}//这是烟花爆炸的声音 不同爆炸方式的声音不同
	},


	//这是预加载音频的方法
	preload() {
		const allFilePromises = [];
		function checkStatus(response) {
			if (response.status >= 200 && response.status < 300) {
				return response;
			}
			const customError = new Error(response.statusText);
			customError.response = response;
			throw customError;
		}

		const types = Object.keys(this.sources);
		types.forEach(type => {
			const source = this.sources[type];
			const { fileNames } = source;
			const filePromises = [];
			fileNames.forEach(fileName => {
				const fileURL = this.baseURL + fileName;
				const promise = fetch(fileURL)
					.then(checkStatus)
					.then(response => response.arrayBuffer())
					.then(data => new Promise(resolve => {
						this.ctx.decodeAudioData(data, resolve);
					}));

				filePromises.push(promise);
				allFilePromises.push(promise);
			});

			Promise.all(filePromises)
				.then(buffers => {
					source.buffers = buffers;
				});
		});

		return Promise.all(allFilePromises);
	},
	pauseAll() {
		this.ctx.suspend();
	},
	resumeAll() {
		this.playSound('lift', 0);
		setTimeout(() => {
			this.ctx.resume();
		}, 250);
	},
	_lastSmallBurstTime: 0,

	//播放声音
	//type:声音类型
	//scale:音量大小
	//播放声音的函数 传入声音类型和音量大小 会随机选择一个文件播放
	playSound(type, scale = 1) {
		scale = MyMath.clamp(scale, 0, 1);//音量大小限制在0-1之间
		if (!canPlaySoundSelector() || simSpeed < 0.95) {
			return;
		}
		if (type === 'burstSmall') {
			const now = Date.now();
			if (now - this._lastSmallBurstTime < 20) {
				return;
			}
			this._lastSmallBurstTime = now;
		}
		const source = this.sources[type];
		if (!source) {
			throw new Error(`Sound of type "${type}" doesn't exist.`);
		}
		const initialVolume = source.volume;
		const initialPlaybackRate = MyMath.random(
			source.playbackRateMin,
			source.playbackRateMax
		);
		const scaledVolume = initialVolume * scale;
		const scaledPlaybackRate = initialPlaybackRate * (2 - scale);
		const gainNode = this.ctx.createGain();
		gainNode.gain.value = scaledVolume;
		const buffer = MyMath.randomChoice(source.buffers);
		const bufferSource = this.ctx.createBufferSource();
		bufferSource.playbackRate.value = scaledPlaybackRate;
		bufferSource.buffer = buffer;
		bufferSource.connect(gainNode);
		gainNode.connect(this.ctx.destination);
		bufferSource.start(0);
	}
};



// const url = "ws://localhost:8080/websocket";
// //建立一个websocket连接
// const socket = new WebSocket(url);
// //如果连接成功就发送一个信息
// socket.onopen = () => {
// 	socket.send(JSON.stringify({ type: 'init', data: { isHeader } }));
// };
// //如果收到消息就根据消息的类型来执行不同的操作
// socket.onmessage = event => {
// 	// const { type, data } = JSON.parse(event.data);
// 	console.log(event);
// };
// //如果连接失败就报错
// socket.onerror = () => {
// 	console.error('WebSocket error');
// };
// //如果连接关闭就开启随机烟花
// socket.onclose = () => {
// 	// state.config.autoLaunch;
// 	state.config.autoLaunch = true;
// 	updateConfig();

// };






function setLoadingStatus(status) {
	document.querySelector('.loading-init__status').textContent = status;//设置加载状态
}
if (IS_HEADER) {
	init();//如果是第一次的话就直接初始化
} else {
	setLoadingStatus('正在点燃导火线');
	setTimeout(() => {//如果不是第一次的话就加载声音
		soundManager.preload().then(init, reason => {
			init();
			return Promise.reject(reason);//return Promise.reject(reason)是为了防止报错
		}
		);
	}, 0);
}