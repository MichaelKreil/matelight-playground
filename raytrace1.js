var fs = require('fs');
var m = new MateLight();
var Vec = new VecLib();

var width = 40;
var height = 16;
var aa = 6;
var widthBig = width*aa;
var heightBig = height*aa;

var textureDay   = fs.readFileSync('data/earth.raw');
var textureWidth = 1024;
var textureHeight = 512;

var img = new Image();

var sphere = Vec.sphere([0,0,0],1);

var rot = 0;



m.startLoop(function () {

	img.reset();

	var position = Vec.vector(0,0.6,2);

	position = Vec.vecRotateY(position, rot);

	rot += 0.006;
	if (rot > 2*Math.PI) rot -= 2*Math.PI;

	var time = new Date();
	time = (time.getTime()/86400000 + 1/24);
	time = time - Math.floor(time);
	time = time*2*Math.PI;

	for (var y = 0; y < heightBig; y++) {
		for (var x = 0; x < widthBig; x++) {
			var direction = Vec.vector(x - widthBig/2, heightBig/2-y, -40*aa);
			direction = Vec.vecRotateY(direction, rot);
			var c = [0,0,0];
			var hitInfo = Vec.hitsSphere(position, direction, sphere);
			if (hitInfo) {
				var tx = hitInfo.texturePos[0]/Math.PI;
				var ty = hitInfo.texturePos[1]/Math.PI;

				tx = Math.round(textureWidth*( 1+(tx+1)/2)) % textureWidth;
				ty = Math.round(textureHeight*(1+(ty))) % textureHeight;
				var ti = (tx+ty*textureWidth)*3;
				
				var sunStrength = Math.atan2(
					hitInfo.normal[0],
					hitInfo.normal[2]
				);

				sunStrength = -Math.cos(sunStrength+time);
				if (sunStrength < 0) sunStrength = 0;
				var brightness = sunStrength;

				c = [
					textureDay[ti+0]*brightness,
					textureDay[ti+1]*brightness,
					textureDay[ti+2]*brightness
				];
			}
			img.setSubPixel(x,y,c);
		}
	}

	m.setBuffer(img.getBuffer());
}, 30)



function Image() {
	var me = this;

	var buffer = new Buffer(width*height*3);
	var bufferBig = new Array(widthBig*heightBig*3);

	me.reset = function () {
		var n = widthBig*heightBig*3;
		for (var i = 0; i < n; i++) bufferBig[i] = 0;
	}

	me.setSubPixel = function (x0, y0, c) {
		x0 = Math.round(x0);
		y0 = Math.round(y0);
		if ((y0 >= 0) && (y0 < heightBig)) {
			if ((x0 >= 0) && (x0 < widthBig)) {
				var i = (x0 + y0*widthBig)*3;
				bufferBig[i+0] = c[0];
				bufferBig[i+1] = c[1];
				bufferBig[i+2] = c[2];
			}
		}
	}

	me.setPixel = function (x0, y0, c) {
		x0 = Math.round((x0-0.5)*aa);
		y0 = Math.round((y0-0.5)*aa);

		for (var dy = 0; dy < aa; dy++) {
			var y = y0 + dy;
			if ((y >= 0) && (y < heightBig)) {
				for (var dx = 0; dx < aa; dx++) {
					var x = x0 + dx;
					if ((x >= 0) && (x < widthBig)) {
						var i = (x + y*widthBig)*3;
						bufferBig[i+0] = c[0];
						bufferBig[i+1] = c[1];
						bufferBig[i+2] = c[2];
					}
				}
			}
		}
	}

	me.getBuffer = function () {
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				for (var c = 0; c < 3; c++) {
					var sum = 0;
					var i1 = (x + y*width)*3 + c;
					for (var dy = 0; dy < aa; dy++) {
						for (var dx = 0; dx < aa; dx++) {
							var i2 = ((x*aa+dx) + (y*aa+dy)*widthBig)*3 + c;
							sum += bufferBig[i2];
						}
					}
					sum /= aa*aa;
					if (sum <   0) sum =   0;
					if (sum > 255) sum = 255;
					buffer[i1] = sum;
				}
			}
		}

		return buffer;
	}

	return me;
}

function VecLib() {
	var me = this;

	me.vector = function (x,y,z) {
		return [x,y,z]
	}

	me.vecAdd = function (v0, v1) {
		return [ v0[0]+v1[0], v0[1]+v1[1], v0[2]+v1[2] ]
	}
	me.vecDiff = function (v0, v1) {
		return [ v0[0]-v1[0], v0[1]-v1[1], v0[2]-v1[2] ]
	}
	me.vecMult = function (v0, v1) {
		return v0[0]*v1[0] + v0[1]*v1[1] + v0[2]*v1[2];
	}
	me.vecScale = function (v0, s) {
		return [ v0[0]*s, v0[1]*s, v0[2]*s ];
	}
	me.vecRotateY = function (v, a) {
		return [
			v[0]*Math.cos(a) + v[2]*Math.sin(a),
			v[1],
			-v[0]*Math.sin(a) + v[2]*Math.cos(a)
		]
	}

	me.sphere = function (center, radius) {
		return {
			center:center,
			radius:radius
		}
	}

	me.hitsSphere = function (v0, vd, sphere) {
		//var p = me.vecDiff(v0, sphere.center);
		var a = me.vecMult(vd, vd);
		var b = me.vecMult(vd, me.vecScale(me.vecDiff(v0, sphere.center), 2));
		var c = me.vecMult(sphere.center, sphere.center) + me.vecMult(v0, v0) - 2*me.vecMult(v0, sphere.center) - sphere.radius*sphere.radius;
		var D = b*b - 4*a*c;
		if (D <= 0) return false;

		D = Math.sqrt(D);

		// Ray can intersect the sphere, solve the closer hitpoint
		var t = -(b+D)/(2*a);
		if (t > 0) {
			var result = {
				distance: Math.sqrt(a)*t,
				hitPoint: me.vecAdd(v0, me.vecScale(vd, t))
			}
			result.normal = me.vecScale(me.vecDiff(result.hitPoint, sphere.center), 1 / sphere.radius);

			var texturePos = me.vecDiff(result.hitPoint, sphere.center);
			result.texturePos = [
				Math.atan2(texturePos[0], texturePos[2]),
				Math.acos(texturePos[1] / sphere.radius)
			]
			return result;
		}
		return false;
	}

	return me;
}

function MateLight () {
	var me = {};

	var bytes = 1920;

	var dgram = require('dgram');

	var message = new Buffer(bytes);

	me.HOST = '10.0.1.39';
	me.PORT = 1337;

	me.udpClient = dgram.createSocket('udp4');

	me.setBuffer = function(b) {
		for (var i = 0; i < bytes; i++) {
			message[i] = b[i];
		}
	};

	me.startLoop = function(cb, interval) {
		interval = interval || 300;
		setInterval(function(){
			if (cb) cb();
			me.udpClient.send(message, 0, message.length, me.PORT, me.HOST, function(err, bytes) {
				if (err) throw err;
			});
		}, interval);
	};

	return me;
}