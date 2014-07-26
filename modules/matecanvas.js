var matelight = require('matelight');
var m = matelight.connect();

var canvas = require('canvas');

var aa = 4;
var width = 40;
var height = 16;

exports.canvas = function () {
	var me = this;

	var buf = new Array(width*height*3);

	canvas = new canvas(width*aa, height*aa);
	var ctx = canvas.getContext('2d');
	ctx.font = (10*aa)+'pt sans-serif';

	me.loop = function (callback) {
		m.startLoop(function () {
			callback();

			var b = ctx.getImageData(0, 0, width*aa, height*aa).data;

			for (var i = 0; i < width*height*3; i++) buf[i] = 0;

			for (var y = 0; y < height*aa; y++) {
				for (var x = 0; x < width*aa; x++) {
					var i0 = (x + y*width*aa)*4;
					var i1 = (Math.floor(x/aa) + Math.floor(y/aa)*width)*3;

					buf[i1+0] += b[i0+0];
					buf[i1+1] += b[i0+1];
					buf[i1+2] += b[i0+2];
				}
			}

			for (var i = 0; i < width*height*3; i++) buf[i] = Math.round(buf[i]/(aa*aa));
		
			m.setArray(buf);
		}, 10)
	}

	me.reset = function () {
		ctx.clearRect(0, 0, width*aa, height*aa);
	}

	me.path = function (path, attr) {
		ctx.strokeStyle = attr.color || 'rgb(255,255,255)';
		ctx.lineWidth = aa*(attr.width || 1);
		ctx.beginPath();

		path.forEach(function (point, index) {
			var x = point[0]*aa;
			var y = point[1]*aa;
			if (index == 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		})

		ctx.stroke();
	}

	me.text = function (text, x, y, color) {
		ctx.fillStyle = color;
		ctx.fillText(text, x*aa, y*aa);
	}

	me.circle = function (x, y, r, color) {
		ctx.beginPath();
		ctx.arc(x*aa, y*aa, r*aa, 0, 2 * Math.PI, false);
		ctx.fillStyle = color;
		ctx.fill();
	}

	return me;
}