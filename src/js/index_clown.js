console.log(pModel);

class FaceTracker {
  constructor(props) {
    this.width = 1440;
    this.height = 1080;
    this.vid = document.getElementById('vid');
    this.small_vid = document.getElementById('small_vid');
    this.webcam = this.small_vid;
    this.vid.addEventListener('canplay', this.startTracking.bind(this), false);
    this.getWebCamStream(this.webcam)
      .then((stream) => {
          if(vid.mozCaptureStream){
            vid.mozSrcObject = stream;
          } else {
            let src = (window.URL && window.URL.createObjectURL(stream)) || stream;
            this.src = src;
            small_vid.src = src;
            vid.src = src;
          }
          small_vid.play();
          vid.play();
        }, (error) => {
          console.log(error);
        });
  }

  getFacePoints(){
    this.leftEye = 27;
    this.rightEye = 32;
    this.nose = 62;
    this.mouth = 57;
  }

  resizeCanvas(_canvas){
    _canvas.width = this.width;
    _canvas.height = this.height;
  }

  flipCanvas(_canvas){
    _canvas.className = 'mirrored';
  }

  startTracking(e) {
    console.log('starting to track', e);
    this.canvas = document.getElementById('facetracking_canvas');
    this.composition = document.getElementById('composition');
    this.context = this.composition.getContext('2d');
    this.facetracking = new FaceTracking(this.src);
    this.createMask();
    this.resizeCanvas(this.canvas);
    this.resizeCanvas(this.composition);
    this.flipCanvas(this.composition);
    this.getFacePoints();
    this.facetracking.startTracking();
    this.tracking = true;
    this.trackFace();
  }

  createMesh(){
    this.eyemask = document.getElementById('eyemask');
    this.glcanvas = document.getElementById('face_deformer_canvas');
    this.resizeCanvas(this.glcanvas);
    this.fd = new faceDeformer();
    this.fd.init(this.glcanvas);
    this.fd.load(eyemask, clown_mask, pModel);
  }

  createMask() {
    this.createMesh();
    this.stage = new createjs.Stage(this.canvas);
    this.mask = {};
    this.maskComponents = [];
    this.mask.hair_left = new createjs.Bitmap('img/clown/clown_hair_left_real.png');
    this.mask.hair_left.scaleX = -1;
    this.mask.hair_left.regX = 580;
    this.mask.hair_left.regY = 990;
    this.stage.addChild(this.mask.hair_left);
    this.mask.hair_right = new createjs.Bitmap('img/clown/clown_hair_right_real.png');
    this.mask.hair_right.scaleX = -1;
    this.mask.hair_right.regX = 600;
    this.mask.hair_right.regY = 920;
    this.stage.addChild(this.mask.hair_right);
    this.mask.nose = new createjs.Bitmap('img/clown/nose_real.png');
    this.mask.nose.regX = 120;
    this.mask.nose.regY = 140;
    this.stage.addChild(this.mask.nose);
  }

  drawMask(positions) {
    let noseX, noseY;
    let hair_leftX, hair_leftY;
    let hair_rightX, hair_rightY;
    let leftEyeX, leftEyeY;
    let rightEyeX, rightEyeY;
    let relativePositions = [];
    this.hideMask();
    if(positions.length > 0){
      this.showMask();
      for(let i = 0; i < positions.length; i++){
        let floatX = positions[i][0];
        let floatY = positions[i][1];
        let newX = this.width * floatX;
        let newY = this.height * floatY;
        relativePositions.push([newX, newY]);
        if(i === this.leftEye){
          leftEyeX = floatX;
          leftEyeY = floatY;
        }
        if(i === this.rightEye){
          rightEyeX = floatX;
          rightEyeY = floatY;
        }
        if(i === this.nose){
          noseX = newX;
          noseY = newY;
        }
        if(i === 14){
          hair_rightX = newX;
          hair_rightY = newY;
        }
        if(i === 0){
          hair_leftX = newX;
          hair_leftY = newY;
        }
      }
      let dX = rightEyeX - leftEyeX;
      let dY = rightEyeY - leftEyeY;
      var d = Math.sqrt( (dX * dX) + (dY * dY));
      let maskAngle = Math.atan2(rightEyeY - leftEyeY, rightEyeX - leftEyeX) * 180 / Math.PI;
      this.mask.nose.x = noseX;
      this.mask.nose.y = noseY;
      this.mask.nose.scaleX = this.mask.nose.scaleY = d * 4.5;

      this.mask.hair_left.x = hair_leftX;
      this.mask.hair_left.y = hair_leftY;
      this.mask.hair_left.scaleX = this.mask.hair_left.scaleY = d * 4.5;
      this.mask.hair_left.rotation = maskAngle;

      this.mask.hair_right.x = hair_rightX;
      this.mask.hair_right.y = hair_rightY;
      this.mask.hair_right.scaleX = this.mask.hair_right.scaleY = d * 4.5;
      this.mask.hair_right.rotation = maskAngle;

      this.fd.draw(relativePositions);

      this.drawComposition(relativePositions);
    } else {
      this.drawEmptyComposition();
    }
  }

  getCanvas(){
    return this.composition;
  }

  hideMask(){
    this.mask.nose.visible = false;
    this.mask.hair_left.visible = false;
    this.mask.hair_right.visible = false;
  }

  showMask(){
    this.mask.nose.visible = true;
    this.mask.hair_left.visible = true;
    this.mask.hair_right.visible = true;
  }

  trackFace() {
    if (this.tracking) {
      let loopTrackFace = this.trackFace.bind(this);
      requestAnimFrame(loopTrackFace);
      this.clearCanvas();
      let positions = this.facetracking.getPositions();
      this.drawMask(positions);
    }
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.width, this.height);
    if(this.fd){
      this.fd.clear();
    }
  }


  drawEmptyComposition(){
    const camera = this.webcam;
    this.context.drawImage(camera, 0, 0, this.width, this.height);
  }

  drawComposition(relativePositions){
    this.stage.update();
    const camera = this.webcam;
    let score = this.facetracking.getScore();
    this.context.globalAlpha = 1;
    if(camera){
      this.context.drawImage(camera, 0, 0, this.width, this.height);
      this.context.globalCompositeOperation = "soft-light";
      this.context.drawImage(this.glcanvas, 0, 0);
      this.context.globalCompositeOperation = "multiply";
      this.context.drawImage(this.glcanvas, 0, 0);
    }
    this.context.globalCompositeOperation = "source-over";
    this.context.drawImage(this.canvas, 0, 0);
  }

  getWebCamStream() {
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

}

const facetracker = new FaceTracker();


