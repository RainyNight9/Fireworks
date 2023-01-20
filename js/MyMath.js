
const MyMath = (function MyMathFactory(Math) {
	const MyMath = {};
	//角度/弧度转换常量
	MyMath.toDeg = 180 / Math.PI;
	MyMath.toRad = Math.PI / 180;
	MyMath.halfPI = Math.PI / 2;
	MyMath.twoPI = Math.PI * 2;

	//勾股定理距离计算
	MyMath.dist = (width, height) => {
		return Math.sqrt(width * width + height * height);
	};

	//同上，但是使用坐标而不是尺寸
	MyMath.pointDist = (x1, y1, x2, y2) => {
		const distX = x2 - x1;
		const distY = y2 - y1;
		return Math.sqrt(distX * distX + distY * distY);
	};

	//返回2D向量的角度（以弧度为单位）
	MyMath.angle = (width, height) => (MyMath.halfPI + Math.atan2(height, width));

	//返回两点之间的角度（以弧度为单位）
	//同上，但是使用坐标而不是尺寸
	MyMath.pointAngle = (x1, y1, x2, y2) => (MyMath.halfPI + Math.atan2(y2 - y1, x2 - x1));

	MyMath.splitVector = (speed, angle) => ({
		x: Math.sin(angle) * speed,
		y: -Math.cos(angle) * speed
	});

	//在最小值（包括）和最大值（不包括）之间生成一个随机数
	MyMath.random = (min, max) => Math.random() * (max - min) + min;

	// 生成一个随机整数，包括最小值和最大值
	MyMath.randomInt = (min, max) => ((Math.random() * (max - min + 1)) | 0) + min;

	//从数组中返回一个随机元素，或者当调用时，从提供的参数中返回一个随机元素
	MyMath.randomChoice = function randomChoice(choices) {
		if (arguments.length === 1 && Array.isArray(choices)) {
			return choices[(Math.random() * choices.length) | 0];
		}
		return arguments[(Math.random() * arguments.length) | 0];
	};

	//将数字限制在最小值和最大值之间
	MyMath.clamp = function clamp(num, min, max) {
		return Math.min(Math.max(num, min), max);
	};


	return MyMath;

})(Math);