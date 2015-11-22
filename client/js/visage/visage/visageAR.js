/**
* VisageAR
* <br/><br/>
* @constructor
*/
function VisageAR() {

	var v_width;
	var v_height;
	var v_renderer;
	var v_scene, v_backgroundScene, v_maskScene, v_candideScene;
	var v_camera, v_backgroundCamera, v_maskCamera, v_candideCamera;
	var v_time;

	var V_ppixels;
	var v_pixels;
	
	var v_video;
	var v_videoCanvas;
	var v_videoContext;
	var v_videoTexture;

	var v_glasses;
	var v_mask, v_candideMask;
	
	var v_z_offset;
	var v_z_increment;
	var v_scale_factor;
	var v_scale_increment;

	this.v_tracker_pom = 0;
	var v_tracker;
	var v_faceData;
	var v_trackingStatus;
	var v_tracking = false;
	
	var v_calibCallback;
	var v_calibrate = false;
	var v_calibTimeoutMs = 10000;
	var v_calibTO_ID;
	
	var v_nVarSamples = 4;
	var v_varThreshold = 0.000001;
	var v_varianceSamples = [];
	
	var v_nMedSamples = 4;
	var v_medThreshold = 0.001;
	var v_medianSamples = [];

	/** 
	*	Initializes Visage AR and sets up rendering and tracking. The video resolution is used for the canvas resolution.
	*	@param {element}container - The HTML element in which to put the rendering canvas.
	*	@param {element}video - The HTML video element required for camera access.
	*/
	this.initialize = function(container, video) {

		// get canvas size
		v_width = video.width;
		v_height = video.height;
		
		v_ppixels = Module._malloc(v_width*v_height*4);
		v_pixels = new Uint8Array(Module.HEAPU8.buffer, v_ppixels, v_width*v_height*4);

		// create webcam canvas
		v_video = video;
		v_videoCanvas = document.createElement('canvas');
		v_videoCanvas.width = v_width;
		v_videoCanvas.height = v_height;
		v_videoContext = v_videoCanvas.getContext('2d');
		v_videoCanvas.setAttribute('style', 'display: none');
		v_videoTexture = new THREE.Texture(v_video)

		// init tracker
		this.v_tracker_pom = new Tracker("../../lib/HT - HighPerformance.cfg");
		//initialize licensing
		//example how to initialize license key
		this.v_tracker_pom.initializeLicenseManager("875-893-646-943-333-618-462-531-738-162-435.vlc");
		v_faceData = new FaceData();
		v_tracker = this.v_tracker_pom;

		// setup renderer
		v_renderer = new THREE.WebGLRenderer({antialias: true});
		v_renderer.setClearColor(0x0055FF, 1);
		v_renderer.autoClearDepth = false;
		v_renderer.autoClear = false;
		v_renderer.autoClearColor = false;
		v_renderer.setSize(v_width, v_height);
		v_renderer.sortObject = false;
		container.appendChild(v_renderer.domElement);

		// setup scenes
		v_scene = new THREE.Scene();
		v_backgroundScene = new THREE.Scene();
		v_maskScene = new THREE.Scene();
		v_candideScene = new THREE.Scene();
		v_time = new THREE.Clock(true);

		// setup video plane camera
		v_backgroundCamera = new THREE.OrthographicCamera(-v_width/2, v_width/2, v_height/2, -v_height/2, 0.1, 1000);
		v_backgroundCamera.lookAt(new THREE.Vector3(0, 0, -1));
		v_backgroundScene.add(v_backgroundCamera);

		// setup video plane
		var plane = new THREE.Mesh(new THREE.PlaneGeometry(v_width, v_height, 1, 1), new THREE.MeshBasicMaterial({color: 0xFFFFFF, map: v_videoTexture}));
		plane.position.set(0, 0, -500);
		v_backgroundScene.add(plane);

		// setup glasses camera
		v_camera = new THREE.PerspectiveCamera(36.869, v_width/v_height, 0.1, 1000);
		v_camera.lookAt(new THREE.Vector3(0, 0, 1));
		v_scene.add(v_camera);

		// setup mask camera
		v_maskCamera = new THREE.PerspectiveCamera(36.869, v_width/v_height, 0.1, 1000);
		v_maskCamera.lookAt(new THREE.Vector3(0, 0, 1));
		v_maskScene.add(v_maskCamera);
		v_candideCamera = new THREE.PerspectiveCamera(36.869, v_width/v_height, 0.1, 1000);
		v_candideCamera.lookAt(new THREE.Vector3(0, 0, 1));
		v_candideScene.add(v_candideCamera);

		// setup masking cube
		var geometry = new THREE.CubeGeometry(0.1, 1, 0.2);
		var geometry2 = new THREE.CubeGeometry(0.5, 1, 0.2);
		var material = new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0, transparent: true});
		v_mask = new THREE.Object3D();
		var v_maskChild = new THREE.Mesh(geometry, material);
		v_maskChild.position.set(0, 0, -0.1);
		var v_maskChild2 = new THREE.Mesh(geometry2, material);
		v_maskChild2.position.set(0, 0, -0.18);
		//v_mask.add(v_maskChild);
		//v_mask.add(v_maskChild2);
		v_maskScene.add(v_mask);

		// setup ambient light
		var ambientLight = new THREE.AmbientLight(0x808080);
		v_scene.add(ambientLight);

		// setup point light
		var pointLight = new THREE.PointLight(0xA0A0A0);
		pointLight.position.set(0, 0, 0);
		v_scene.add(pointLight);
	}

	/** 
	*	Loads the 3D object to be rendered from the given URL and makes it active. The object should be in OBJ format and the material should be in MTL format. The MTL file should have the same name as the OBJ file.
	*	See the <a href="eyewear_model_guide.html">modeling guide</a> on how to prepare models for use with VisageAR.
	*	@param {string} url - The URL from which to load the model, without the extension.
	*/
	this.loadObject = function(url) {
		//Show "Glasses Loading" text
		var glass_text = document.getElementById("glass_text");
		if (glass_text)
			glass_text.hidden = false;
		
		//Remove old glasses
		v_scene.remove(v_glasses);
		
		v_glasses = new THREE.Object3D();
		var glassesLoader = new THREE.OBJMTLLoader();
		glassesLoader.addEventListener('load', function(event) {
			var object = event.content;
			
			if (v_candideMask)
				v_mask.remove(v_candideMask);
			
			object.traverse(function(child){
					//find the occluder object
					if (child.name.search("occluder_mat")!== -1 && child instanceof THREE.Mesh){
						//remove the occluder object left from previous glasses
						v_mask.remove(v_candideMask);
						
						//append occluder object to the created mask object and set material properties
						v_candideMask = new THREE.Object3D();
						child.material.transparent = true;
						child.material.opacity = 0;
						v_candideMask.add(child);						
						v_mask.add(v_candideMask);
						
						//remove the occluder object from original glasses
						object.remove(child);
				}
			})
			v_glasses.children.length = 0;
			v_glasses.add(object);
			
			//Hide "Glasses Loading" text
			if (glass_text)
				glass_text.hidden = true;
		});

		glassesLoader.load(url + ".obj", url + ".mtl");
		v_glasses.position.set(0, 1, -5);
		v_scene.add(v_glasses);
	}

	/**
	*	Starts tracking the face and displaying (rendering) any 3D objects loaded using loadObject(). Object is 
	*   overlayed on the face.
	*/
	this.startTracking = function() {
		v_tracking = true;
	}

	/**
	*	Stops tracking.
	*/
	this.stopTracking = function() {
		v_tracking = false;
	}
	
	/**
	*   Initialize the size calibration process.
    *   <br/><br/>
    *   Calibration is based on placing a reference object of known size on the face; 
    *   specifically, a standard card with magnetic strip, such as a credit card, is used. 
	*   After successful calibration, the virtual object will appear in real-life size relative to the face - providing that it has been correctly
    *   modelled according to the <a href="eyewear_model_guide.html">Modelling guide</a>. See the eyewear try-on sample project 
	*   for example implementation.
	*   <br/><br/>
	*   Calibration can either complete successfully or it can time-out. In either case, the callback function is called. On success, 
	*   its argument will contain the calculated inter-pupillary distance (IPD) in meters, i.e. the distance between the eyes; on failure it will be -1.
	*   If callbackFunction parameter is omitted the result will be printed in the console. 
	*  <br/><br/>
    *  Sample usage:
    *  <br/>
    *  <pre class="prettyprint source"><code>
	* 
	*   //callback function
	*   function callbackDetectStrip(IPD){
	*       //if time-out occurred - failed calibration
	*       if (IPD === -1){
	*   	    //Clear text or write a message
	*   	    //...
	*       }
	*       //calibration is successful
	*       else{
	*           //Report IPD value
	*           //...
	*       }
	*   }
	*   //
	*   function onClickCalibrate(){
	*       v_ar.calibrateSize(callbackDetectStrip, 10000);
	*
    * </code></pre>
    * <br/>
	* NOTE: The code provided in this example is using functions from visage|SDK to automatically compute the Inter-Pupillary Distance (IPD) based on comparison 
    * with an object of known size. Such implementation may infringe on existing patents, including US Patent no. 6,535,223. Developers should be aware of this and/or other patents 
	* if including this or similar IPD computation code in commercial products. visage|SDK API and libraries do not in themselves infringe on any patents.
	* <br/>
	* @param {function} callbackFunction - Function that will be called when calibration is complete or has timed-out. This function must be implemented in the application.
    * @param {int} [timeoutMs=10000] - Time in milliseconds before calibration is declared unsuccessful
	*/
	this.calibrateSize = function(callbackFunction, timeoutMs){
		if (v_calibrate === true)
			return;
		v_calibrate = true;
		v_calibTimeoutMs = typeof timeoutMs !== 'undefined' ? timeoutMs : 10000;
		v_calibCallback = typeof callbackFunction !== 'undefined' ? callbackFunction : function(val){var eyeD = getValue(val,'float');console.log(eyeD)};
		v_calibTO_ID = setTimeout(calibTimeout,v_calibTimeoutMs);
	}
	
	/**
	*   Stop the size calibration process.
	*/
	this.stopCalibration = function(){
		v_calibrate = false;
		clearTimeout(v_calibTO_ID);
	}
	/*
	*
	*/
	var eyeDistanceVariance = function(samples, average){
		var a = 0;
		for (var s = 0; s < samples.length; s+=1)
			a += (samples[s] - average) * (samples[s] - average);
    
		return a / samples.length;
	}
	
	/*
	*
	*/
	var averageEyeDistance = function(samples){
		var a = 0;
		for (var s = 0; s < samples.length; s+=1)
			a += samples[s];
    
		return a / samples.length;
	}
	
	/*
	*
	*/
	var testMedianNeighbours = function(samples,numNeigh,threshold){
		var num = 0;
		var medianIndex = Math.floor(samples.length/2);
		var median = samples[medianIndex];
		for (var down = medianIndex - 1; down >= 0; down-=1)
		{
			if ((median - samples[down]) < threshold){
				num++;
				if (num === numNeigh)
					return true;
			}
			else
				break;
		}
		for (var up = medianIndex + 1; up < samples.length; up+=1){
			if ((samples[up] - median) < threshold){
				num++;
				if (num === numNeigh)
					return true;
			}
			else
				break;
		}	
		return false;
	}
	
	/*
	*	
	*/
	var calcRealEyeDistance = function(){
		var floatVal = Module._malloc(1*8); 
		if (v_tracker.detectStrip(floatVal)===1){
			var stripSizeInPx = getValue(floatVal,'double');
			
			var irisPoints = [
			3,	5,
			3,	6,
			]
			
			//
			var rightEye = v_faceData.featurePoints2D.fp[irisPoints[0]][irisPoints[1]-1];
			var leftEye = v_faceData.featurePoints2D.fp[irisPoints[2]][irisPoints[3]-1];
			
			//
			var rightEye_x = rightEye.pos[0] * v_width;
			var rightEye_y = rightEye.pos[1] * v_height;
			
			var leftEye_x = leftEye.pos[0] * v_width;
			var leftEye_y = leftEye.pos[1] * v_height;
			
			//
			var pixelEyeDistance = Math.sqrt((rightEye_x - leftEye_x) * (rightEye_x - leftEye_x) + (rightEye_y - leftEye_y) * (rightEye_y - leftEye_y));
			
			//
			var ppm = stripSizeInPx / 0.0856;
			
			//
			var cardOffset = 0.01;
			var eps = Math.abs(v_faceData.faceTranslation[2])/(Math.abs(v_faceData.faceTranslation[2]) - cardOffset);
            var realEyeDistance = pixelEyeDistance / ppm * eps;
			
			Module._free(floatVal);
			//
			if (0.05 < realEyeDistance && realEyeDistance < 0.08)
            {
				v_medianSamples.push(realEyeDistance);
				
				if (window.console) console.log("real eye distance: " + realEyeDistance);
				

				if (v_medianSamples.length >= v_nMedSamples)
				{
					//sort the array
					v_medianSamples.sort();
					
					//
					var median = v_medianSamples[Math.floor(v_medianSamples.length/2)];
					
					//get medium value
					if (testMedianNeighbours(v_medianSamples,v_nMedSamples,v_medThreshold) === true)
					{
						v_medianSamples.length = 0;
						v_calibrate = false;
						clearTimeout(v_calibTO_ID);
						return median;
					}
					
					
				}
			}
		}
		return 0;
	}
	
	/*
	*	Updates the tracker with a new video image.
	*/
	var updateTracker = function() {

		// update video texture
		if (v_video.readyState === v_video.HAVE_ENOUGH_DATA) {
			v_videoContext.drawImage(v_video, 0, 0, v_width, v_height);
			v_videoTexture.needsUpdate = true;
		}

		if (!v_tracking)
			return;
		
		// fetch image data from canvas
		var imageData = v_videoContext.getImageData(0, 0, v_width, v_height).data;
		
		// 
		v_pixels.set(imageData);
		
		// 
		v_trackingStatus = v_tracker.track(v_width, v_height, v_ppixels, v_faceData);
	}

	/*
	*   Triggered if calibration is not done after 10 seconds
	*/
	var calibTimeout = function(){
		if (v_calibrate === false)
			return;
		v_calibrate = false;
		v_calibCallback(-1);
	}
	/*
	*	Updates the glasses model position and the face mask position.
	*/
	var update = function() {

		if (v_tracking && v_trackingStatus === "TRACK_STAT_OK") {

			if (v_calibrate === true){
				var IPD = calcRealEyeDistance();
				if (IPD > 0){
					v_tracker.setIPD(IPD);
					v_calibCallback(IPD);
				}
			}
	
			
			// move mask
			v_mask.position.set(v_faceData.faceTranslation[0], v_faceData.faceTranslation[1], v_faceData.faceTranslation[2]);
			v_mask.rotation.set(-v_faceData.faceRotation[0], v_faceData.faceRotation[1] + 3.14, v_faceData.faceRotation[2]);

			// move glasses
			v_glasses.position.set(v_faceData.faceTranslation[0], v_faceData.faceTranslation[1], v_faceData.faceTranslation[2]);
			v_glasses.rotation.set(-v_faceData.faceRotation[0], v_faceData.faceRotation[1] + 3.14, v_faceData.faceRotation[2]);
		} else {

			v_mask.position.set(0, 0, -5);
			v_glasses.position.set(0, 0, -5);
		}

	}

	/*
	*	Renders the scene.
	*/
	var render = function() {
		v_renderer.clear(1, 1, 1);
		v_renderer.render(v_backgroundScene, v_backgroundCamera);
		v_renderer.clear(0, 1, 1);
		v_renderer.render(v_maskScene, v_maskCamera);
		v_renderer.render(v_scene, v_camera);
	}

	/*
	*	Main loop.
	*/
	var loop = function() {
		var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
								  window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
		requestAnimationFrame(loop);
		
		if (!v_video)
			return;

		updateTracker();
		update();
		render();
	};
	/**
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*<br/><br/>
	*/
	loop();
}