var originalWidth = 720;
var originalHeight = 520;


class FaceTracker {
  constructor(props) {
    this.vid = document.getElementById('vid');
    this.image_src = document.getElementById('image_src');
    this.small_vid = document.getElementById('small_vid');
    this.canvas = document.getElementById('facetracking_canvas');
    this.composition = document.getElementById('composition');
    this.context = this.composition.getContext('2d');
    this.webcam_btn = document.getElementById('useWebcamBtn');
    this.webcam = this.small_vid;
    this.width = originalWidth;
    this.height = originalHeight;
    //this.getImage();
    this.setupFileLoader();
    this.events();
    
  }

  events(){
    this.webcam_btn.addEventListener('click', this.webcamBtnClickHandler.bind(this));
  }

  webcamBtnClickHandler(e){
    e.preventDefault();
    this.image = null;
    this.styleCanvasSize(this.composition, this.width, this.height);
    this.startTrackingWebcam();
  }

  setupFileLoader(){
    document.getElementById('files')
      .addEventListener('change', this.handleFileSelect.bind(this), false);
  }

  handleFileSelect(evt){
    const files = evt.target.files;
    const fileList = [];
    const reader = new FileReader();
    reader.onload = this.getImage.bind(this);
    for (var i = 0;i < files.length;i++) {
      if (!files[i].type.match('image.*')) {
        continue;
      }
      fileList.push(files[i]);
    }
    if (files.length > 0) {
      reader.readAsDataURL(fileList[0]);
    } else {
      console.log('not a recognized filetype');
    }
  }

  error(msg){
    console.log(msg);
  }

  getImage(e){
    this.image = new Image();
    this.image.onload = this.imageLoadHandler.bind(this);
    this.image.src = e.target.result;
  }

  imageLoadHandler(){
    this.styleCanvasSize(this.composition, this.image.width, this.image.height);
    this.startTrackingImage();
  }

  getFacePoints(){
    this.leftEye = 27;
    this.rightEye = 32;
    this.nose = 62;
    this.mouth = 57;
  }

  scaleImage(){
    if(this.image.width > this.image.height){
      this.image_src.width = this.image.width;
    } else if(this.image.width < this.image.height){
    }
  }

  styleCanvasSize(_canvas, width, height){
    _canvas.style.width = width + "px";
    _canvas.style.height = height + "px";
  }

  resizeCanvas(_canvas){
    _canvas.width = this.width;
    _canvas.height = this.height;
  }

  flipCanvas(_canvas){
    _canvas.className = 'mirrored';
  }

  startTrackingWebcam() {
    this.tracking = true;
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

  startTrackingImage(){
    this.facetracking = new FaceTracking(this.image);
    this.createMask();
    this.resizeCanvas(this.canvas);
    this.resizeCanvas(this.composition);
    this.flipCanvas(this.composition);
    this.getFacePoints();
    this.facetracking.startTracking();
    this.tracking = true;
    this.trackFace();
  }

  startTracking(e) {
    this.facetracking = new FaceTracking(this.src);
    this.createMask();
    this.resizeCanvas(this.canvas);
    this.resizeCanvas(this.composition);
    this.flipCanvas(this.composition);
    this.getFacePoints();
    this.facetracking.startTracking();
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
    this.mask.hair_left = new createjs.Bitmap('img/leopard/leopard_ear_left.png');
    this.mask.hair_left.scaleX = -1;
    this.mask.hair_left.regX = 100;
    this.mask.hair_left.regY = 100;
    this.stage.addChild(this.mask.hair_left);
    this.mask.hair_right = new createjs.Bitmap('img/leopard/leopard_ear_right.png');
    this.mask.hair_right.scaleX = -1;
    this.mask.hair_right.regX = 100;
    this.mask.hair_right.regY = 100;
    this.stage.addChild(this.mask.hair_right);
    this.mask.nose = new createjs.Bitmap('img/clown/nose_real.png');
    this.mask.nose.regX = 120;
    this.mask.nose.regY = 140;
    //this.stage.addChild(this.mask.nose);
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

      this.mask.hair_left.x = hair_leftX - (100 * d);
      this.mask.hair_left.y = hair_leftY - (600 * d);
      this.mask.hair_left.scaleX = this.mask.hair_left.scaleY = d * 5;
      this.mask.hair_left.rotation = maskAngle;

      this.mask.hair_right.x = hair_rightX + (100 * d);
      this.mask.hair_right.y = hair_rightY - (600 * d);
      this.mask.hair_right.scaleX = this.mask.hair_right.scaleY = d * 5;
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
    if(!this.image){
      this.context.drawImage(this.webcam, 0, 0, this.width, this.height);

    }
  }

  drawComposition(relativePositions){
    this.stage.update();
    const camera = this.webcam;
    let score = this.facetracking.getScore();
    this.context.globalAlpha = 1;
    if(camera){
      if(this.image){
        this.context.drawImage(this.image, 0, 0, this.width, this.height);
      } else {
        this.context.drawImage(camera, 0, 0, this.width, this.height);
      }
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


