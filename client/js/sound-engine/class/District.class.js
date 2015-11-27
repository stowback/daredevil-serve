



	/**
	*
	*	DISTRICT|JS
	*	------------------
	*	DESC | Manage district
	*
	*/










	/*----------  DEFINITION  ----------*/



	// Object
	
	var District = function (distance, properties, audio, config)
	{

		// Url
		this.url = null;

		// Properties
		this.distance = distance;
		this.properties = properties;

		// Context
		this.context = audio.context;

		// Config
		this.config = config;

		// Audio
		this.source = audio.context.createBufferSource();
		this.source.loop = true;
		this.volume = audio.context.createGain();
		this.source.connect(this.volume);
		this.volume.connect(audio.volume);

		// No sound
		this.setVolume(0);

	};


	// Init
	
	District.prototype.init = function (url, callback)
	{

		// Self
		var self = this;

		// Store
		this.url = url;

		// Request
		var request = new XMLHttpRequest();
		request.open('GET', this.url, true);
		request.responseType = "arraybuffer";
		request.onload = function ()
		{
			// Bufferize
			self.context.decodeAudioData(request.response,
				function (buffer)
				{
					// Buffer
					self.buffer = buffer;
					self.source.buffer = self.buffer;

					// Play
					self.source.start(0);

					// Callback
					callback();
				}
			);
		};
		request.send();

	};










	/*----------  METHODS  ----------*/



	// Volume
	
	District.prototype.setVolume = function (volume)
	{

		this.volume.gain.value = volume*this.config.map.districts.volume;

	};


	// Fade
	
	District.prototype.fadeIn = function (duration, callback, started)
	{

		// Reference
		var that = this;

		// Time
		var time = new Date().getTime();
		if(!duration){ duration = 1000; }
		if(!started){ started = time; }

		// Volume
		if(time - started >= duration)
		{
			this.setVolume(this.properties.volume);
			if(callback){ callback(); } 
		}
		else
		{
			this.setVolume(((time-started)/duration)*this.properties.volume);
			window.requestAnimationFrame(function (){ that.fadeIn(duration, callback, started); });
		}

	};

	District.prototype.fadeOut = function (duration, callback, started)
	{

		// Reference
		var that = this;

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
			this.setVolume(this.properties.volume - (((time-started)/duration)*this.properties.volume));
			// console.log(this.properties.volume - (((time-started)/duration)*this.properties.volume));
			window.requestAnimationFrame(function (){ that.fadeOut(duration, callback, started); });
		}

	};











	
	