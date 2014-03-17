var matelight = require('matelight');
var m = matelight.connect();

var pic = new Array(1920);
for (var i = 0; i < 1920; i++) pic[i] = 0.5;

var blur1 = 0.5, blur2 = 0.5;

m.startLoop(function () {
	var arr = new Array(1920);
	var arr2 = new Array(1920);

	for (var i = 0; i < 1920; i++) {
		pic[i] = Math.max(0, Math.min(1, pic[i]+0.003*(2*Math.random()-1)));
	}

	var i = 0;
	for (var y = 0; y < 16; y++) {
		for (var x = 0; x < 40; x++) {
			var sum = [0,0,0], count = 0;
			count += add(sum, pic, x-1, y, blur1);
			count += add(sum, pic, x  , y, 1);
			count += add(sum, pic, x+1, y, blur1);
			arr[i+0] = sum[0]/count;
			arr[i+1] = sum[1]/count;
			arr[i+2] = sum[2]/count;
			i+=3;
		}
	}

	var i = 0;
	for (var y = 0; y < 16; y++) {
		for (var x = 0; x < 40; x++) {
			var sum = [0,0,0], count = 0;
			count += add(sum, arr, x, y-1, blur1);
			count += add(sum, arr, x, y  , 1);
			count += add(sum, arr, x, y+1, blur1);
			pic[i+0] = sum[0]/count;
			pic[i+1] = sum[1]/count;
			pic[i+2] = sum[2]/count;
			i+=3;
		}
	}

	var i = 0;
	for (var y = 0; y < 16; y++) {
		for (var x = 0; x < 40; x++) {
			var sum = [0,0,0], count = 0;
			count += add(sum, pic, x-1, y, blur2);
			count += add(sum, pic, x  , y, 1);
			count += add(sum, pic, x+1, y, blur2);
			arr[i+0] = sum[0]/count;
			arr[i+1] = sum[1]/count;
			arr[i+2] = sum[2]/count;
			i+=3;
		}
	}

	var i = 0;
	for (var y = 0; y < 16; y++) {
		for (var x = 0; x < 40; x++) {
			var sum = [0,0,0], count = 0;
			count += add(sum, arr, x, y-1, blur2);
			count += add(sum, arr, x, y  , 1);
			count += add(sum, arr, x, y+1, blur2);
			arr2[i+0] = sum[0]/count;
			arr2[i+1] = sum[1]/count;
			arr2[i+2] = sum[2]/count;
			i+=3;
		}
	}

	var i = 0;
	for (var i = 0; i < 1920; i++) {
		arr[i] = Math.max(0, Math.min(255, Math.round(((arr2[i]-0.5)*50+0.5)*255)));
	}
	//console.log(arr);
	m.setArray(arr);
}, 40)


function add(sum, pic, x, y, value) {
	if (x < 0) return 0;
	if (y < 0) return 0;
	if (x >= 40) return 0;
	if (y >= 16) return 0;

	var i = (x + y*40)*3;
	sum[0] += pic[i+0]*value;
	sum[1] += pic[i+1]*value;
	sum[2] += pic[i+2]*value;
	return value;
}


