var app = require('http').createServer(handler);
var io = require('socket.io').listen(app, {log:false});

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
var textureRotation = 3.14;
var gamma = 0.7;
var pi2 = Math.PI/2;

var camRotationY, camRotationX, camShiftX, camShiftY, camShiftZ;

app.listen(8080);

function handler (req, res) {
	var filename = 'touchevents.html';
	if (req.url == '/icon.png') filename = 'icon.png';

	fs.readFile(
		__dirname + '/web/' + filename,
		function (err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}

			res.writeHead(200);
			res.end(data);
		}
	);
}

io.sockets.on('connection', function (socket) {
	socket.on('set', function (data) {
		setData(data);
	});
	socket.on('add', function (data) {
		setData(data, true);
	});
	socket.on('reset', function (data) {
		setData();
	});
});

function setData(data, add) {
	if (!data) data = {};
	if (add) {
		camRotationY += data.camRotationY || 0;
		camRotationX += data.camRotationX || 0;
		camShiftX    += data.camShiftX    || 0;
		camShiftY    += data.camShiftY    || 0;
		camShiftZ    += data.camShiftZ    || 0;
	} else {
		camRotationY = data.camRotationY || 0.0;
		camRotationX = data.camRotationX || 0.0;
		camShiftX    = data.camShiftX    || 0.0;
		camShiftY    = data.camShiftY    || 0.5;
		camShiftZ    = data.camShiftZ    || 0.9;
	}
	if (camRotationX < -pi2) camRotationX = -pi2;
	if (camRotationX >  pi2) camRotationX =  pi2;
}

setData();

m.startLoop(function () {

	img.reset();

	var position = Vec.vector(camShiftX, camShiftY, Math.exp(camShiftZ));

	position = Vec.vecRotateX(position, camRotationX);
	position = Vec.vecRotateY(position, camRotationY);

	textureRotation += 0.006;
	if (textureRotation > 2*Math.PI) textureRotation -= 2*Math.PI;

	for (var y = 0; y < heightBig; y++) {
		for (var x = 0; x < widthBig; x++) {
			var direction = Vec.vector(x - widthBig/2, heightBig/2-y, -40*aa);

			direction = Vec.vecRotateX(direction, camRotationX);
			direction = Vec.vecRotateY(direction, camRotationY);
			
			var c = [0,0,0];
			var hitInfo = Vec.hitsSphere(position, direction, sphere);
			if (hitInfo) {
				var tx = hitInfo.texturePos[0]/Math.PI;
				var ty = hitInfo.texturePos[1]/Math.PI;

				tx = tx/2 + textureRotation/(2*Math.PI);
				ty = ty + 1;
				tx = Math.round(textureWidth *tx) % textureWidth;
				ty = Math.round(textureHeight*ty) % textureHeight;
				var ti = (tx+ty*textureWidth)*3;
				
				var sunStrength = Math.atan2(
					hitInfo.normal[0],
					hitInfo.normal[2]
				);

				sunStrength = -Math.cos(sunStrength+4.0);
				if (sunStrength < 0) sunStrength = 0;
				var brightness = sunStrength;

				c = [
					Math.pow(textureDay[ti+0]*brightness/255, gamma)*255,
					Math.pow(textureDay[ti+1]*brightness/255, gamma)*255,
					Math.pow(textureDay[ti+2]*brightness/255, gamma)*255
				];
			}
			img.setSubPixel(x,y,c);
		}
	}

	m.setBuffer(img.getBuffer());
}, 10)



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
	me.vecRotateX = function (v, a) {
		return [
			v[0],
			v[1]*Math.cos(a) + v[2]*Math.sin(a),
			v[2]*Math.cos(a) - v[1]*Math.sin(a)
		]
	}
	me.vecRotateY = function (v, a) {
		return [
			v[0]*Math.cos(a) + v[2]*Math.sin(a),
			v[1],
			v[2]*Math.cos(a) - v[0]*Math.sin(a)
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