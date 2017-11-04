let vid = document.getElementById('vid');
let hidden_vid;
let overlay = document.getElementById('overlay');
let overlayCC = overlay.getContext('2d');
let width = 1440;
let height = 1080;
//1440 x 1080
//720 x 540
//640 x 480
let hidVidWidth = 400;
let hidVidHeight = 300;
let tracking = false;
var ctrack = new clm.tracker({useWebGL : true});
let startbutton, videobutton;
let gl, gl_canvas, fd;
let triangleVertexPositionBuffer;
let squareVertexPositionBuffer;
let relativePositions;
let canvasWidth, canvasHeight;
let clown_el;

let clown_model = [[26.416248681267973, 69.287261104729708], [24.481184011083002, 109.1589911732479], [29.947934496257105, 148.57677024306452], [40.60811914491601, 185.45355598250219], [58.738097832656997, 216.6373204614957], [81.913770252207783, 237.8126294428132], [109.98606755351314, 257.32753166261085], [146.73017889094805, 264.20702756677571], [176.39901111159972, 257.35535351543069], [205.55603543434725, 238.34973455076488], [230.2355979713912, 210.41080746713624], [246.42195156813636, 177.61588628182037], [256.27933737115922, 136.43585286772219], [257.59862842161016, 101.26962757170907], [254.73574762861881, 63.296736154716768], [231.99351427704215, 39.831219799322724], [211.74886735135794, 29.357561061634286], [185.76946624427666, 32.692120457915841], [164.22794828410485, 39.057255405015212], [46.913242738637145, 44.216922272932521], [67.285057768685547, 32.598869110365555], [94.508786161963428, 34.746232646423401], [114.82786184548833, 39.533999746268229], [65.935953298843103, 69.239210402794683], [84.787589310043472, 58.321913189471772], [107.1385272571674, 69.051184056088701], [84.265668561805413, 74.447322016970119], [86.02844527485162, 66.55652441349649], [215.49276321482714, 66.02198446506911], [194.41225043477402, 56.580567518322354], [173.10349613934835, 67.506651798297085], [193.89655333472706, 70.825843235112714], [194.97190332017632, 64.213669799586413], [140.21544525228168, 50.532541524375866], [115.12210668936649, 112.86816444161286], [106.91733219119472, 128.11159519340237], [116.15332322527513, 140.65598165170533], [143.55679637420633, 142.73810254422773], [167.66884888729888, 137.95626733353842], [177.01070972200523, 125.94118566337217], [167.72534960722709, 111.07005102224311], [141.09391638922847, 89.711267100602939], [125.01121871692496, 134.01776882451776], [158.83114482022663, 132.84441173561655], [98.530013119819074, 181.49830160240677], [114.57531577249451, 172.88988327185314], [130.69321885263625, 168.51487947819879], [140.91575863744487, 170.62230018050224], [150.99524791299294, 168.10359663640762], [166.86355823591094, 171.92886610080987], [186.52748819945225, 179.57395522560827], [172.54811810821857, 193.62104452332397], [161.34374255744575, 203.55652478332667], [143.04951921782722, 206.98995295806665], [122.71362572694508, 202.88542194975037], [109.36831831524565, 194.44995485842813], [121.30529318118789, 187.44959256875671], [141.15688782807084, 190.12567632986739], [161.94486681509784, 187.9983882494468], [161.78346166803792, 178.31913412814549], [141.60005262336557, 178.73596022750081], [121.19014424606702, 179.74550271876572], [142.06000674291235, 125.94776468631429], [74.161858259749053, 61.982126979168953], [99.563603953011338, 61.887044688264439], [97.202478466508737, 72.650836394381287], [74.199064214851546, 73.344884154018885], [204.65317864223729, 59.203268807746532], [180.45823699179422, 60.544222235843449], [183.20168844348697, 70.667846856664895], [204.99820389502713, 70.525790218266522]];

let videoLoaded = function() {
	createMask();
	startVideo();
}


let createMask = function(){
	fd = new faceDeformer();
	clown_el = document.getElementById('clown');
	fd.init(gl_canvas);
	fd.load(clown_el, clown_model, pModel);
}


let startVideo = function() {
	tracking = true;
	hidden_vid.play();
	ctrack.start(hidden_vid);
	drawLoop();
}

let stopVideo = function(){
	ctrack.stop(hidden_vid);
	tracking = false;
	overlayCC.clearRect(0, 0, width, height);
}

let drawRectangles = function(positions){
	for(let i = 0; i < positions.length; i++){
		//let x = width - positions[i][0]; //if mirrored
		let x = positions[i][1];
		let y = positions[i][1];
		if(i === 27 || i === 32 || i === 62 || i === 57){
			//eyes nose mouth
			overlayCC.fillStyle = "white";
		} else {
			overlayCC.fillStyle = "green";
		}
		overlayCC.fillRect(x, y, 5, 5);
	}
}

let drawNumbersConverted = function(positions){
	overlayCC.font = "10px Arial";
	for(let i = 0; i < positions.length; i++){
		let floatX = positions[i][0] / hidVidWidth;
		let floatY = positions[i][1] / hidVidHeight;
		let newX = width * floatX;
		let newY = height * floatY;

		if(i === 27 || i === 32 || i === 62 || i === 57){
			//eyes, nose, mouse
			overlayCC.fillStyle = "white";
		} else {
			overlayCC.fillStyle = "black";
		}

		overlayCC.fillText(i, newX, newY);
		//relativePositions.push([newX, newY]);
	}
}

let getRelativePositions = function(positions){
	relativePositions = [];
	overlayCC.font = "10px Arial";
	for(let i = 0; i < positions.length; i++){
		let floatX = positions[i][0] / hidVidWidth;
		let floatY = positions[i][1] / hidVidHeight;
		let newX = width * floatX;
		let newY = height * floatY;
		if(i === 27 || i === 32 || i === 62 || i === 57){
			overlayCC.fillStyle = "white";
		} else {
			overlayCC.fillStyle = "black";
		}
		//overlayCC.fillText(i, newX, newY);
		relativePositions.push([newX, newY]);
	}
	return relativePositions;
}


let standardFaceDraw = function(){
	//requires mirroring
	ctrack.draw(overlay);
}

let drawLoop = function() {
	if(tracking){
		overlayCC.clearRect(0, 0, width, height);
		let positions = ctrack.getCurrentPosition();
		relativePositions = getRelativePositions(positions);
		if(positions){
			fd.draw(relativePositions);
			overlayCC.drawImage(vid, 0, 0, width, height);
			overlayCC.globalApha = 0.3;
			overlayCC.globalCompositeOperation = "soft-light";
			overlayCC.drawImage(gl_canvas, 0, 0);
			overlayCC.globalApha = 1;
			overlayCC.globalCompositeOperation = "multiply";
			overlayCC.drawImage(gl_canvas, 0, 0);
		}
		requestAnimFrame(drawLoop);
	}
}


let createHiddenWebcam = function(){
	let hidden_vid = document.createElement('video');
	hidden_vid.width = hidVidWidth
	hidden_vid.height = hidVidHeight;
	hidden_vid.loop = true;
	hidden_vid.autoPlay = true;
	hidden_vid.style.display = 'none';
	return hidden_vid;
}


let getWebCamStream = function(){
	//vid - any video object - to detect browser capabilities
	return new Promise((resolve, reject) => {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
		if (navigator.getUserMedia) {
			let videoSelector = {video : true};
			if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
				let chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
				if (chromeVersion < 20) {
					videoSelector = "video";
				}
			};
			navigator.getUserMedia(videoSelector, function( stream ) {
				resolve(stream);
			}, function() {
				reject("There was some problem trying to fetch video from your webcam.");
			});
		} else {
			reject("Your browser does not seem to support getUserMedia");
		}
	});
}

let initialize = function(){
	gl_canvas = document.getElementById("gl_canvas");
	vid.width = width;
	vid.height = height;
	overlay.width = width;
	overlay.height = height;
	gl_canvas.width = width;
	gl_canvas.height = height;
	ctrack.init(pModel);
	hidden_vid = createHiddenWebcam();



	getWebCamStream(hidden_vid)
		.then((stream) => {
			if(vid.mozCaptureStream){
				vid.mozSrcObject = stream;
			} else {
				let src = (window.URL && window.URL.createObjectURL(stream)) || stream;
				hidden_vid.src = src;
				vid.src = src;
			}
			hidden_vid.play();
			vid.play();
		}, (error) => {
			alert(error);
		});
	hidden_vid.addEventListener('canplay', videoLoaded, false);
}


initialize();



