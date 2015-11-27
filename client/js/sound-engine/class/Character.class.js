



	/**
	*
	*	Character.class.js
	*	------------------
	*	DESC | Manage a character on the map with its sounds
	*
	*/






	/*----------  DEFINITION  ----------*/



	// Object
	
	var Character = function (config, settings, dimensions)
	{

		// Config
		this.config = config;
		this.settings = settings;

		// Dimensions
		this.dimensions = dimensions;

		// Audio
		this.audio = {};

		// Position
		this.position = { x: 0, y: 0};

	};


	// Init
	
	Character.prototype.init = function (sound, audio, success, error)
	{

		// Reference
		var that = this;

		// Audio
		this.audio.source = audio.context.createBufferSource();
		this.audio.source.loop = true;
		this.audio.panner = audio.context.createPanner();
		this.audio.volume = audio.context.createGain();
		this.audio.source.connect(this.audio.volume);
		this.audio.volume.connect(this.audio.panner);
		this.audio.panner.connect(audio.context.destination);

		// Panner
		this.audio.panner.distanceModel = this.settings.panner.distanceModel;
		this.audio.panner.rolloffFactor = this.settings.panner.rolloffFactor;
		this.audio.panner.refDistance = this.settings.panner.refDistance;

		// No volume
		this.audio.volume.gain.value = 0;

		// Load
		var request = new XMLHttpRequest();
		request.open('GET', sound, true);
		request.responseType = "arraybuffer";
		request.onload = function ()
		{
			// Bufferize
			audio.context.decodeAudioData(request.response,
				function (buffer)
				{
					// Buffer
					that.audio.buffer = buffer;
					that.audio.source.buffer = that.audio.buffer;

					that.audio.source.start(0);

					// Callback
					success();
				},
				function (){ error('Error with audio buffer'); }
			);
		};
		request.send();

	};











	/*----------  METHODS  ----------*/




	//  Volume
	
	Character.prototype.setVolume = function (volume)
	{

		this.audio.volume.gain.value = volume;

	};


	// Fade
	
	Character.prototype.fadeIn = function (duration, callback, started)
	{

		// Reference
		var that = this;

		// Callback
		if(!callback){ callback = null; }

		// Time
		var time = new Date().getTime();
		if(!duration){ duration = 1000; }
		if(!started){ started = time; }

		// Volume
		if(time - started >= duration)
		{
			this.setVolume(1);
			if(callback){ callback(); } 
		}
		else
		{
			this.setVolume(((time-started)/duration)*this.config.sound.volume);
			window.requestAnimationFrame(function (){ that.fadeIn(duration, callback, started); });
		}

	};

	Character.prototype.fadeOut = function (duration, callback, started)
	{

		// Reference
		var that = this;

		// Callback
		if(!callback){ callback = null; }

		// Time
		var time = new Date().getTime();
		if(!duration){ duration = 1000; }
		if(!started){ started = time; }

		// Volume
		if(time - started >= duration)
		{
			this.setVolume(0);
			if(callback){ callback(); } 
		}
		else
		{
			this.setVolume((1-((time-started)/duration))*this.config.sound.volume);
			window.requestAnimationFrame(function (){ that.fadeOut(duration, callback, started); });
		}

	};


	// Position
	
	Character.prototype.move = function (x, y)
	{
		
		// Check
		if(parseInt(x) >= 0 && parseInt(x) <= this.dimensions.widthDistance)
		{
			// Properties
			this.position.x = x;
			this.position.y = y;

			// Audio
			this.audio.panner.setPosition(x, y, 1);
		}
		else
		{
			// Properties
			this.position.y = y;

			// Audio
			this.audio.panner.setPosition(this.position.x, y, 1);
		}

	};













	