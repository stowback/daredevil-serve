



	/**
	*
	*	Map.class.js
	*	------------------
	*	DESC | Manage the map width different districts/objects sounds
	*
	*/






	/*----------  DEFINITION  ----------*/



	// Object
	
	var Map = function (config)
	{

		// Config
		this.config = config;

		// Properties
		this.name,
		this.dimensions,
		this.sources,
		this.objects,
		this.districts = null;

		// Audio
		this.audio = {};

		// Sounds
		this.buffers = null;
		this.sounds = { objects: [], districts: [] };

		// Characters
		this.daredevil,
		this.vilain = null;

	};


	// Init
	
	Map.prototype.init = function (progress, success, error)
	{

		// Uniform	
		window.AudioContext = (
	 		window.AudioContext ||
	  		window.webkitAudioContext ||
	  		null
		);
		if(!AudioContext){ error("AudioContext not supported"); return false; }
		
		// Audio
		this.audio.context = new AudioContext();
		this.audio.volume = this.audio.context.createGain();
		this.audio.mixer = this.audio.context.createGain();
		this.audio.flatGain = this.audio.context.createGain();
		this.audio.mixer.connect(this.audio.flatGain);
		this.audio.flatGain.connect(this.audio.volume);
		this.audio.volume.connect(this.audio.context.destination);

		// Disable sound
		this.audio.volume.gain.value = 0;

		// Data
		this.loadData(progress, success, error);

	};

	Map.prototype.loadData = function (progress, success, error)
	{

		// Reference
		var that = this;

		// Request
		$.getJSON(this.config.paths.maps + this.config.map.model + '.map')
		.success(function (data)
			{
				// Store
				that.name = data.name;
				that.dimensions = data.dimensions;
				that.sources = data.sounds;
				that.objects = data.objects;
				that.districts = data.districts;

				// Dimensions
				that.dimensions.total = that.dimensions.width*that.dimensions.length;
				that.dimensions.totalIndexs = that.dimensions.total - that.dimensions.width;
				that.dimensions.widthDistance = that.dimensions.width*that.config.map.points.width;

				// Callback
				progress('Loading of districts');
				that.createDistricts(0, progress, success, error);
			})
		.error(function (err){ error("Failed to load data"); });

	};

	Map.prototype.createDistricts = function (i, progress, success, error)
	{

		// Reference
		var that = this;

		// No more districts ?
		if(i >= this.districts.length)
		{ 
			progress('Loading of objects');
			this.createObjects(0, 0, progress, success, error); 
			return;
		}

		// Manage district
		if(this.districts[i])
		{
			// Audio object
			var district = new District(i, this.districts[i], this.audio, this.config);
			district.init(this.config.paths.sounds + this.sources[this.districts[i].sound],
				function ()
				{
					// Store
					that.districts[i].audio = district;
					that.sounds.districts[that.sounds.districts.length] = district;
					//that.sounds.districts.push(district);

					// First
					if(i == 0){
						district.setVolume(district.properties.volume);
					}

					// Next
					that.createDistricts(i+1, progress, success, error);
				}
			);
		}
		else{ this.createDistricts(i+1, progress, success, error); }

	};

	Map.prototype.createObjects = function (x, y, progress, success, error)
	{

		// Reference
		var that = this;

		// No more cells
		if(x*y >= this.dimensions.totalIndexs)
		{ 
			progress('Loading of characters');
			this.createCharacters(progress, success, error); 
			return; 
		}

		// Manage cell
		if(this.objects[y][x])
		{
			// Tmp
			var tmp = this.objects[y][x];

			// Audio object
			var object = {};
			object.source = this.audio.context.createBufferSource();
			object.source.loop = true;
			object.panner = this.audio.context.createPanner();
			object.volume = this.audio.context.createGain();
			object.source.connect(object.volume);
			object.volume.connect(object.panner);
			object.panner.connect(this.audio.mixer);

			// Settings
			object.panner.distanceModel = "exponential";
			object.panner.rolloffFactor = 4;
			object.panner.refDistance = 120;

			// Position
			object.panner.setPosition(tmp.position.x*this.config.map.points.width, tmp.position.y*this.config.map.points.height, 1);

			// Volume
			// object.volume.gain.value = this.config.map.objects.volume * tmp.volume;
			object.volume.gain.value = this.config.map.objects.volume;
			// object.volume.gain.value = 0;

			// Bufferize
			this.loadBuffer(this.config.paths.sounds + this.sources[this.objects[y][x].sound],
			function (buffer)
			{
				// Update audio
				object.buffer = buffer;
				object.source.buffer = object.buffer;
				object.source.start(0);

				// Store
				that.objects[y][x].audio = object;
				that.sounds.objects.push(object);

				// Next
				if(x < that.dimensions.width){ that.createObjects(x+1, y, progress, success, error); }
				else{ that.createObjects(0, y+1, progress, success, error); }
			},
			error);
		}
		else
		{
			if(x < this.dimensions.width){ this.createObjects(x+1, y, progress, success, error); }
			else{ this.createObjects(0, y+1, progress, success, error); }
		}

	};

	Map.prototype.createCharacters = function (progress, success, error)
	{

		// Reference
		var that = this;

		// Daredevil
		this.daredevil = new Character(this.config.characters.daredevil, this.config.characters.settings, this.dimensions);
		this.daredevil.init(this.config.paths.sounds + this.config.characters.daredevil.sound.file, this.audio,
			function ()
			{
				// Vilain
				that.vilain = new Character(that.config.characters.kidnapper, this.config.characters.settings, that.dimensions);
				that.vilain.init(that.config.paths.sounds + that.config.characters.kidnapper.sound.file, that.audio,
					function ()
					{	
						// Callback
						success();
					}
				);
			}
		);

	}









	/*----------  METHODS  ----------*/




	// Volume
	
	Map.prototype.setVolume = function (volume)
	{

		this.audio.volume.gain.value = volume;

	};

	
	// Fade
	
	Map.prototype.fadeIn = function (duration, callback, started)
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
			this.setVolume(1);
			if(callback){ callback(); } 
		}
		else
		{
			this.setVolume((time-started)/duration);
			window.requestAnimationFrame(function (){ that.fadeIn(duration, callback, started); });
		}

	};

	Map.prototype.fadeOut = function (duration, callback, started)
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
			this.setVolume(1 - ((time-started)/duration));
			window.requestAnimationFrame(function (){ that.fadeOut(duration, callback, started); });
		}

	};


	



	








	/*----------  UTILS  ----------*/




	// Load sound
	
	Map.prototype.loadBuffer = function (url, success, error)
	{

		// Reference
		var that = this;

		// Request
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = "arraybuffer";
		request.onload = function ()
		{
			// Bufferize
			that.audio.context.decodeAudioData(request.response, 
				function (buffer){ success(buffer); },
				function (){ error('Unvalid buffer format'); }
			);
		};
		request.send();

	};










	
	