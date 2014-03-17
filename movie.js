var child_process = require('child_process');
var matelight = require('matelight');

//var file = '/Users/michomachine/Downloads/mac_mini_home/Star Trek - TNG - 1x17 - When the Bough Breaks.mkv';
var file = '/Users/michomachine/Downloads/mac_mini_home/tng210.mkv';
file = file.replace(/\ /g, '\\ ');

var m = matelight.connect();

var buffer = false;

var video = child_process.spawn('ffmpeg', [
	//'-loglevel','debug',
	'-re',
	'-i',file,
	'-an',
	'-vcodec','rawvideo',
	'-pix_fmt','rgb24',
	'-sws_flags','bilinear',
	//'-s','40x16',
	'-s','40x16',
	'-f','rawvideo',
	'-'
]
);

//console.log(video);

video.stdout.on('data', function (data) {
	buffer = data;
})

video.stderr.on('data', function (data) {
	console.log(data.toString());
})

m.startLoop(function () {
	if (buffer) {
		m.setArray(buffer);
	}
}, 40)





