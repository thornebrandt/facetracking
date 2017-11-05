let _switch = false;

class FaceTracking {
	constructor(src){
		this.global_functions();
		//this.init(src);
		this.src = src;
		this.hiddenWidth = 400;
		this.hiddenHeight = 300;
		this.confidenceThreshold = .4;
		this.initialize(src);
	}

	global_functions(){
		window.requestAnimFrame = (function() {
		  return window.requestAnimationFrame ||
		         window.webkitRequestAnimationFrame ||
		         window.mozRequestAnimationFrame ||
		         window.oRequestAnimationFrame ||
		         window.msRequestAnimationFrame ||
		         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
		           return window.setTimeout(callback, 1000/60);
		         };
		})();

		window.cancelRequestAnimFrame = (function() {
		/**
		 * Provides cancelRequestAnimationFrame in a cross browser way.
		 */
		  return window.cancelAnimationFrame ||
		         window.webkitCancelRequestAnimationFrame ||
		         window.mozCancelRequestAnimationFrame ||
		         window.oCancelRequestAnimationFrame ||
		         window.msCancelRequestAnimationFrame ||
		         window.clearTimeout;
		})();

		window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
	}

	supports_video(){
		// video support utility functions
	  	return !!document.createElement('video').canPlayType;
	}

	supports_h264_baseline_video(){
		if (!supports_video()) { return false; }
		var v = document.createElement("video");
		return v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
	}

	supports_ogg_theora_video() {
		if (!supports_video()) { return false; }
		var v = document.createElement("video");
		return v.canPlayType('video/ogg; codecs="theora, vorbis"');
	}

	initialize(){
		this.ctrack = new clm.tracker({useWebGL : true});
		this.ctrack.init(pModel);
		this.hidden_cam = this.createHiddenWebcam();
		this.hidden_cam.src = this.src;
		this.hidden_cam.play();
		this.hidden_cam.addEventListener('canplay', function(){ this.videoLoaded }, false);
	}

	videoLoaded(){
		this.startTracking();
	}

	getWebCamStream(){
		//vid - any video object - to detect browser capabilities
		//in case no source is provided, use this method
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

	createHiddenWebcam(){
		let hidden_cam = document.createElement('video');
		hidden_cam.width = this.hiddenWidth;
		hidden_cam.height = this.hiddenHeight;
		hidden_cam.loop = true;
		hidden_cam.autoPlay = true;
		hidden_cam.style.display = 'none';
		return hidden_cam;
	}

	startTracking(){
		if(this.hidden_cam){
			this.ctrack.start(this.hidden_cam);
		} else {
			console.log("cant find vid");
		}
		//drawLoop();
	}

	getScore(){
		return this.ctrack.getScore();
	}

	getPositions(){
		let pos = this.ctrack.getCurrentPosition();
		let convergence = this.ctrack.getConvergence();
		let score = this.ctrack.getScore();
		let floatPos = [];
		if(score > this.confidenceThreshold){
			for(let i = 0; i < pos.length; i++){
				floatPos.push([
					pos[i][0]/this.hidden_cam.width,
					pos[i][1]/this.hidden_cam.height
				]);
			}
		}
		return floatPos;
	}


	drawLoop(){
		if(this.tracking){
			requestAnimFrame(drawLoop);
			return this.ctrack.getCurrentPosition();
		} else {
			return false;
		}
	}
}
