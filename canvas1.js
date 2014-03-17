var canvas = new (require('matecanvas')).canvas();

var buf = new Array(1920);

var x = 40;

canvas.loop(function () {
	canvas.reset();
/*
	canvas.path(
		[[0,0],[40,16]],
		{ width:3, color:'rgb(255,0,0)' }
	)*/

	canvas.text('c-base',x,13,'rgb(0,0,255)');
	/*
	canvas.circle(x, 8, 8, 'rgb(255,0,0)');
*/
	x -= 1/10;
	//if (x < -9) x = 53
})

/*
var c = 0;

m.startLoop(function () {
	c = (c+1) % (40*aa);

	ctx.strokeStyle = 'rgb(255,255,255)';
	ctx.lineWidth = aa*3;
	ctx.beginPath();
	ctx.moveTo(c, 0);
	ctx.lineTo(c, 16*aa);
	ctx.stroke();
}, 10)

*/