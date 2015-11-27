



	/**
	*
	*	Game.class.js
	*	------------------
	*	DESC | Manage a game with players, map and results
	*
	*/






	/*----------  DEFINITION  ----------*/



	// Object
	
	var Game = function (map)
	{

		// Map
		this.map = map;

		// Properties
		this.properties = {
			clues: 0,
			district: 0,
			cell: 0,
			advancing: 0,
		};

		// Shorcuts
		this.kidnapperAdvance = this.map.config.characters.kidnapper.advance;

		// Navigation
		
		this.move = {
			daredevil: {
				moving: false,
				direction: null,
				started: null,
				position: null,
			},
			vilain: {
				started: null,
				previous: null,
				next: null,
				position: null,
			}
		};

		// Ride
		this.ride = null;

		// Time
		this.time = {
			current: null,
			started: null,
			offset: 0,
		};

		// Track
		this.track = null;

		// Loop
		this.loop = null;
		this.pause = false;

		// Callbacks
		this.callbacks = {
			onWin: null,
			onLose: null,
			onClue: null,
		};

	};


	// Init
	
	Game.prototype.init = function (callback)
	{

		// Create ride
		this.ride = this.createRide();
		
		// Positions
		this.map.daredevil.move(parseInt(this.map.dimensions.width/2)*this.map.config.map.points.width, 0);
		this.map.vilain.move(parseInt(this.map.dimensions.width/2)*this.map.config.map.points.width, this.map.config.characters.kidnapper.advance);
		this.map.audio.context.listener.setPosition(parseInt(this.map.dimensions.width/2)*this.map.config.map.points.width, 0, 0);

		
		// Callback
		callback();

	};


	// Ride
	
	Game.prototype.createRide = function ()
	{

		// Path
		var path = new Array(this.map.dimensions.length);

		// Start
		path[0] = parseInt(this.map.dimensions.width/2);

		// Generate
		for(var i=0; i<this.map.dimensions.length; i++)
		{
			if(path[i] == null)
			{
				// Previous
				var previous = path[i-1];

				// Trajectory
				var models = ["right", "ahead", "left"];
				if(previous<=0){ models = ["ahead", "left"]; }
				if(previous>=this.map.dimensions.width-1){ models = ["right", "ahead"]; }
				var trajectory = models[Math.floor(Math.random()*(models.length))];

				// Length
				var trajectory_length = Math.floor(Math.random()*this.map.config.map.ride.trajectory_max_length) + this.map.config.map.ride.trajectory_min_length;

				// Create path
				for(var j=0; j<trajectory_length; j++)
				{
					// Previous
					var trajectory_previous = path[(i+j)-1];

					// Add path
					if(trajectory == "right"){
						if(trajectory_previous-1 < 0){ path[i+j] = trajectory_previous; break; }
						else{ path[i+j] = trajectory_previous-1; }
					}
					if(trajectory == "left"){
						if(trajectory_previous+1 >= this.map.dimensions.width){ path[i+j] = trajectory_previous; break; }
						else{ path[i+j] = trajectory_previous+1; }
					}
					if(trajectory == "ahead"){ path[i+j] = trajectory_previous; }
				}

			}
		}

		// Return
		return path;

	};










	/*----------  METHODS  ----------*/




	// Start
	
	Game.prototype.start = function ()
	{

		// Self
		var self = this;

		// Map sound
		this.map.fadeIn(3000, function ()
		{
			
			// Characters sounds
			this.map.daredevil.fadeIn(1000);
			this.map.vilain.fadeIn(1200);

			// Time
			self.time.started = new Date().getTime();

			// Daredevil moves
			self.move.daredevil.started = self.time.started;
			self.move.daredevil.position = self.map.daredevil.position.x;

			// Vilain moves
			self.move.vilain.started = self.time.started;
			self.move.vilain.previous = self.ride[0];
			self.move.vilain.next = self.ride[1];
			self.move.vilain.distance = self.move.vilain.next - self.move.vilain.previous;
			self.move.vilain.position = self.map.vilain.position.x;

			// Update loop
			self.update();

		});		

	};


	// Update
	
	Game.prototype.update = function ()
	{

		// Self
		var self = this;

		// Time
		this.time.current = new Date().getTime();
		var elapsed = (this.time.current - this.time.started) + this.time.offset;
		
		// Length
		var distance = (elapsed/1000)*this.map.config.characters.speed;
		this.properties.cell = parseInt(distance/this.map.config.map.points.height);

		// Dardevil
		var daredevil_x = this.map.daredevil.position.x;
		if(this.move.daredevil.moving)
		{
			if(this.time.current > this.move.daredevil.started + this.map.config.characters.daredevil.moves.duration)
			{
				this.move.daredevil.moving = false;
				this.move.daredevil.direction = null;
				this.move.daredevil.started = null;
			}
			else
			{
				var move_distance = ((this.time.current - this.move.daredevil.started)/this.map.config.characters.daredevil.moves.duration)*this.map.config.characters.daredevil.moves.distance;
				if(this.move.daredevil.direction == "left"){ move_distance = -move_distance; }
				daredevil_x = this.move.daredevil.position + move_distance;
			}
		}

		// Vilain
		var vilain_x = this.map.vilain.position.x;
		if(this.time.current > this.move.vilain.started + this.map.config.characters.kidnapper.moves.duration)
		{
			this.move.vilain.started = this.time.current;
			this.move.vilain.previous = this.move.vilain.next;
			this.move.vilain.next = this.ride[this.properties.cell];
			this.move.vilain.distance = this.move.vilain.next - this.move.vilain.previous;
			this.move.vilain.position = this.map.vilain.position.x;
		}
		else
		{
			var move_vilain = parseInt(((this.time.current - this.move.vilain.started)/this.map.config.characters.kidnapper.moves.duration)*this.map.config.characters.kidnapper.moves.distance*this.move.vilain.distance);
			vilain_x = this.move.vilain.position + move_vilain;
			 
		}

		// Positions
		this.map.daredevil.move(daredevil_x, distance);
		this.map.audio.context.listener.setPosition(this.map.daredevil.position.x, distance, 0);
		this.map.vilain.move(vilain_x, distance + this.kidnapperAdvance);

		// District
		if(this.properties.district < this.map.sounds.districts.length-1)
		{
			if(distance/this.map.config.map.points.height > this.map.sounds.districts[this.properties.district+1].distance)
			{
				console.log('ca change');
				// Fades
				this.map.sounds.districts[this.properties.district].fadeOut(10000);
				this.map.sounds.districts[this.properties.district+1].fadeIn(10000);

				// Store
				this.properties.district++;
			}
		}

		// Loop
		console.log(parseInt(elapsed/1000));
		this.loop = window.requestAnimationFrame(function (){ self.update(); });

		// Track
		var offset = Math.abs(daredevil_x - vilain_x);
		if(offset >= this.map.config.characters.daredevil.lose.distance)
		{
			if(this.track == null){ this.track = this.time.current; }
			if(this.time.current-this.track >= this.map.config.characters.daredevil.lose.duration)
			{
				this.giveClue();
				window.cancelAnimationFrame(this.loop);
			}
		}
		else{ this.track = null; }

		// Pause
		if(this.pause){ window.cancelAnimationFrame(this.loop); }

		// Win ?
		if(this.properties.cell >= this.map.dimensions.length)
		{
			window.cancelAnimationFrame(this.loop);
			this.win(); 
		}

	};


	// Navigation
	
	Game.prototype.setDaredevilMove = function (move)
	{

		if(!this.move.daredevil.moving)
		{
			this.move.daredevil.moving = true;
			this.move.daredevil.direction = move;
			this.move.daredevil.started = new Date().getTime();
			this.move.daredevil.position = this.map.daredevil.position.x;
		}

	};


	// Pause
	
	Game.prototype.setPause = function (state)
	{

		// Self
		var self = this;

		// State
		this.pause = state;

		// Players
		if(state)
		{
			this.map.daredevil.fadeOut(1000);
			this.map.vilain.fadeOut(1000);
			this.map.fadeOut(2000);
		}
		else
		{
			this.map.fadeIn(1000);
			this.map.daredevil.fadeIn(2000);
			this.map.vilain.fadeIn(2000, function ()
			{
				// Time
				self.time.offset += self.time.current - self.time.started;
				self.time.started = new Date().getTime();
				self.time.current = self.time.started;

				// Update
				self.update();
			});
		}

	};


	// Clue
	
	Game.prototype.giveClue = function ()
	{

		// Sounds
		this.map.daredevil.fadeOut(1000);
		this.map.vilain.fadeOut(1000);
		this.map.fadeOut(2000);

		// Give clue
		if(this.properties.clues < this.map.config.characters.daredevil.lose.clues)
		{
			// Count
			this.properties.clues++;

			// Callback
			if(this.callbacks.onClue){ this.callbacks.onClue(this.map.config.clues[this.properties.district]); }
		}

		// End
		else
		{
			// Callback
			if(this.callbacks.onLose){ this.callbacks.onLose(this.map.config.messages.lose); }
		}

	};

	Game.prototype.resume = function ()
	{

		// Reference
		var self = this;

		// Position
		this.map.daredevil.move(this.map.vilain.position.x, this.map.daredevil.position.y);
		this.map.audio.context.listener.setPosition(this.map.daredevil.position.x, this.map.daredevil.position.y, 0);

		// Sounds
		this.map.fadeIn(1000);
		this.map.vilain.fadeIn(2000);
		this.map.daredevil.fadeIn(2000, function ()
		{
			// Times
			self.time.offset += self.time.current - self.time.started;
			self.time.started = new Date().getTime();
			self.time.current = self.time.started;

			// Update
			self.update();
		});

	};


	// Win
	
	Game.prototype.win = function ()
	{

		// Sounds
		this.map.daredevil.fadeOut(1000);
		this.map.vilain.fadeOut(1000);
		this.map.fadeOut(3000);

		// Callback
		this.callbacks.onWin(this.map.config.messages.win);

	};
	



















