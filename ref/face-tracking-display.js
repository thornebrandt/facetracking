import React, {
	Component,
	PropTypes
}
from 'react';
import fs from 'fs';
import path from 'path';
import styles from '../photobooth-styles';
import FaceTracking from '../../../../../common/js/global/utils/facetracking/facetracking';
import pModel from '../../../../../common/js/global/utils/facetracking/vendor/model_pca_20_svm.js';
import faceDeformer from '../utils/face-deformer';
import autoBind from 'class-autobind';
import clownMask from '../masks/clown-mask';


class FaceTrackingDisplay extends React.Component {
	constructor(props) {
		super(props);
		this.getFacePoints();
		autoBind(this);
	}

	getFacePoints(){
		this.leftEye = 27;
		this.rightEye = 32;
		this.nose = 62;
		this.mouth = 57;
	}


	componentDidMount() {
		//1440 x 1080
		this.width = 1440;
		this.height = 1080;
	}

	startTracking() {
		this.canvas = this.refs.facetracking_canvas;
		this.composition = this.refs.composition;
		this.context = this.composition.getContext('2d');
		this.webcam = this.state.camera.webcam;
		this.facetracking = new FaceTracking(this.state.src);
		this.createMask();
		this.tracking = true;
		this.facetracking.startTracking();
		this.trackFace();
	}

	createMesh(){
		let eyemask = this.refs.eyemask;
		this.glcanvas = this.refs.face_deformer_canvas;
		this.fd = new faceDeformer();
		this.fd.init(this.glcanvas);
		this.fd.load(eyemask, clownMask, pModel);
	}


	createMask() {
		this.createMesh();
		this.stage = new createjs.Stage(this.canvas);
		this.mask = {};
		this.maskComponents = [];
		this.mask.hair_left = new createjs.Bitmap('src/img/masks/clown/clown_hair_left_real.png');
		this.mask.hair_left.scaleX = -1;
		this.mask.hair_left.regX = 580;
		this.mask.hair_left.regY = 990;
		this.stage.addChild(this.mask.hair_left);
		this.mask.hair_right = new createjs.Bitmap('src/img/masks/clown/clown_hair_right_real.png');
		this.mask.hair_right.scaleX = -1;
		this.mask.hair_right.regX = 600;
		this.mask.hair_right.regY = 920;
		this.stage.addChild(this.mask.hair_right);
		this.mask.nose = new createjs.Bitmap('src/img/masks/clown/nose_real.png');
		this.mask.nose.regX = 198;
		this.mask.nose.regY = 190;
		this.stage.addChild(this.mask.nose);
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


	onUserMedia(src, camera){
		this.setState({ src: src});
		this.setState({ camera : camera });
		this.startTracking();
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

	drawEmptyComposition(){
		const camera = this.webcam.getCam();
		this.context.drawImage(camera, 0, 0, this.width, this.height);
	}

	drawComposition(relativePositions){
		this.stage.update();
		const camera = this.webcam.getCam();
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

	drawNumbersConverted(positions) {
		//200 * 150;
		this.context.font = "20px Arial";
		for (let i = 0; i < positions.length; i++) {
			let floatX = positions[i][0];
			let floatY = positions[i][1];
			let newX = this.width - (this.width * floatX);
			let newY = this.height * floatY;
			if (i === 27 || i === 32 || i === 62 || i === 57) {
				//eyes, nose, mouse
				this.context.fillStyle = "white";
			} else {
				this.context.fillStyle = "black";
			}
			this.context.fillText(i, newX, newY);
		}
	}

	render() {
		return (
			<div style = { styles.faceTrackingDisplay } >
				<div style={styles.offscreen}>
					<img
						ref="eyemask"
						src="src/img/masks/clown/clown_paint.png"
						style={styles.hidden}
					/>
					<canvas ref="face_deformer_canvas"
						style={styles.faceTrackingCanvas}
						width = {this.width}
						height = {this.height}
					/>
					<canvas ref="facetracking_canvas"
					style = { styles.faceTrackingCanvas}
					width = {this.width}
					height = {this.height}
					/>
				</div>
				<canvas ref="composition"
					style={styles.faceTrackingCanvas}
					width={this.width}
					height={this.height}
				/>
			</div>
		);
	}

}
export default FaceTrackingDisplay;
