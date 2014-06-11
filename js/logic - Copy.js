WebFontConfig = {
	custom: {
    	families: ['Cabin Sketch', 'Open Sans', 'EB Garamond'],
        urls: ['./fonts/fonts.css']
	}
};

// Helpers
shuffle = function(o) {
	for ( var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
		;
	return o;
};

String.prototype.hashCode = function(){
	// See http://www.cse.yorku.ca/~oz/hash.html
	var hash = 5381;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)+hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}



function comenzar() {
	//alert('comenzar !!');
	
	$(function() {

		var venueContainer = $('#venues ul');
		$.each(venues, function(key, item) {
			venueContainer.append(
		        $(document.createElement("li"))
		        .append(
	                $(document.createElement("input")).attr({
                         id:    'venue-' + key
                        ,name:  item
                        ,value: item
                        ,type:  'checkbox'
                        ,checked:true
	                })
	                .change( function() {
	                	var cbox = $(this)[0];
	                	var segments = wheel.segments;
	                	var i = segments.indexOf(cbox.value);

	                	if (cbox.checked && i == -1) {
	                		segments.push(cbox.value);

	                	} else if ( !cbox.checked && i != -1 ) {
	                		segments.splice(i, 1);
	                	}

	                	segments.sort();
	                	wheel.update();
	                } )

		        ).append(
	                $(document.createElement('label')).attr({
	                    'for':  'venue-' + key
	                })
	                .text( item )
		        )
		    )
		});

		$('#venues ul>li').tsort("input", {attr: "value"});
	});
	
	// WHEEL!
	var wheel = {

		timerHandle : 0,
		timerDelay : 33,

		angleCurrent : 0,
		angleDelta : 0,

		size : 290,

		canvasContext : null,

		//colors : [ '#F32B36', '#F93490', '#8E45B7', '#2879C9', '#4DD2FF', '#25CA68', '#FADE41', '#F8952E' ],//colores preguntados
		colors : [ '#FFF100', '#E5E400', '#C4D60B', '#898E31', '#CB001F', '#DF4321', '#EA8D12', '#FBDF00' ],//colores caro

		segments : [],

		seg_colors : [], // Cache of segments to colors
		
		maxSpeed : Math.PI / 16,

		upTime : 1000, // How long to spin up for (in ms)
		downTime : 17000, // How long to slow down for (in ms)

		spinStart : 0,

		frames : 0,

		centerX : 320,
		centerY : 320,

		spin : function() {

			// Start the wheel only if it's not already spinning
			if (wheel.timerHandle == 0) {
				wheel.spinStart = new Date().getTime();
				wheel.maxSpeed = Math.PI / (16 + Math.random()); // Randomly vary how hard the spin is
				wheel.frames = 0;
				wheel.sound.play();

				wheel.timerHandle = setInterval(wheel.onTimerTick, wheel.timerDelay);
			}
		},

		onTimerTick : function() {

			wheel.frames++;

			wheel.draw();

			var duration = (new Date().getTime() - wheel.spinStart);
			var progress = 0;
			var finished = false;

			if (duration < wheel.upTime) {
				progress = duration / wheel.upTime;
				wheel.angleDelta = wheel.maxSpeed
						* Math.sin(progress * Math.PI / 2);
			} else {
				progress = duration / wheel.downTime;
				wheel.angleDelta = wheel.maxSpeed
						* Math.sin(progress * Math.PI / 2 + Math.PI / 2);
				if (progress >= 1)
					finished = true;
			}

			wheel.angleCurrent += wheel.angleDelta;
			while (wheel.angleCurrent >= Math.PI * 2)
				// Keep the angle in a reasonable range
				wheel.angleCurrent -= Math.PI * 2;

			if (finished) {
				clearInterval(wheel.timerHandle);
				wheel.timerHandle = 0;
				wheel.angleDelta = 0;
				
				setTimeout(function() {
					resultado();
				}, 2000);
			}

			/*
			// Display RPM
			var rpm = (wheel.angleDelta * (1000 / wheel.timerDelay) * 60) / (Math.PI * 2);
			$("#counter").html( Math.round(rpm) + " RPM" );
			*/
		},

		init : function(optionList) {
			try {
				//wheel.initWheel();//omite shuffle colors
				wheel.initAudio();
				wheel.initCanvas();
				wheel.draw();

				$.extend(wheel, optionList);

			} catch (exceptionData) {
				alert('Wheel is not loaded ' + exceptionData);
			}

		},

		initAudio : function() {
			var sound = document.createElement('audio');
			sound.setAttribute('src', './msc/wheel.mp3');
			wheel.sound = sound;
		},

		initCanvas : function() {
			var canvas = $('#wheel #canvas').get(0);

			if ($.browser.msie) {
				canvas = document.createElement('canvas');
				$(canvas).attr('width', 900).attr('height', 639).attr('id', 'canvas').appendTo('.wheel');
				canvas = G_vmlCanvasManager.initElement(canvas);
			}

			canvas.addEventListener("click", wheel.spin, false);
			wheel.canvasContext = canvas.getContext("2d");
		},

		initWheel : function() {
			shuffle(wheel.colors);
		},

		// Called when segments have changed
		update : function() {
			// Ensure we start mid way on a item
			//var r = Math.floor(Math.random() * wheel.segments.length);
			var r = 0;
			wheel.angleCurrent = ((r + 0.5) / wheel.segments.length) * Math.PI * 2;

			var segments = wheel.segments;
			var len      = segments.length;
			var colors   = wheel.colors;
			var colorLen = colors.length;

			// Generate a color cache (so we have consistant coloring)
			var seg_color = new Array();
			for (var i = 0; i < len; i++)
				seg_color.push( colors[i] );
				
			wheel.seg_color = seg_color;

			wheel.draw();
		},

		draw : function() {
			wheel.clear();
			wheel.drawWheel();
			wheel.drawNeedle();
		},

		clear : function() {
			var ctx = wheel.canvasContext;
			ctx.clearRect(0, 0, 1000, 800);
		},

		drawNeedle : function() {
			var ctx = wheel.canvasContext;
			var centerX = wheel.centerX;
			var centerY = wheel.centerY;
			var size = wheel.size;

			ctx.lineWidth = 5;
			ctx.strokeStyle = '#333333';
			ctx.fillStyle = '#FFFFFF';

			ctx.beginPath();

			ctx.moveTo(centerX + size - 10, centerY);
			ctx.lineTo(centerX + size + 35, centerY - 10);
			ctx.lineTo(centerX + size + 35, centerY + 10);
			ctx.lineJoin = "round";
			ctx.closePath();

			ctx.stroke();
			ctx.fill();

			// Which segment is being pointed to?
			var i = wheel.segments.length - Math.floor((wheel.angleCurrent / (Math.PI * 2))	* wheel.segments.length) - 1;

			// Now draw the winning name
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = '#E10915';
			/*ctx.font = "1.8em Cabin Sketch";
			ctx.fillText(wheel.segments[i], centerX + size + 165, centerY);*/
			if(wheel.segments[i] === "Porción pastel Hershey's" || wheel.segments[i] === "Gracias por participar") {
				ctx.font = "1.4em Cabin Sketch";
				ctx.fillText(wheel.segments[i], centerX + size + 165, centerY);
			} else {
				ctx.font = "1.8em Cabin Sketch";
				ctx.fillText(wheel.segments[i], centerX + size + 165, centerY);
			}
			
			$("#premio").html(wheel.segments[i]);
			
		},

		drawSegment : function(key, lastAngle, angle) {
			var ctx = wheel.canvasContext;
			var centerX = wheel.centerX;
			var centerY = wheel.centerY;
			var size = wheel.size;

			var segments = wheel.segments;
			var len = wheel.segments.length;
			var colors = wheel.seg_color;

			var value = segments[key];
			
			ctx.save();
			ctx.beginPath();

			// Start in the centre
			ctx.moveTo(centerX, centerY);
			ctx.arc(centerX, centerY, size, lastAngle, angle, false); // Draw a arc around the edge
			ctx.lineTo(centerX, centerY); // Now draw a line back to the centre

			// Clip anything that follows to this area
			//ctx.clip(); // It would be best to clip, but we can double performance without it
			ctx.closePath();
			
			ctx.shadowBlur=15;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';//ctx.shadowColor="#000000";
			
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#222222';
			
			ctx.fillStyle = colors[key];//ctx.fillStyle = gradient1;
			ctx.fill();
			ctx.stroke();

			// Now draw the text
			ctx.save(); // The save ensures this works on Android devices
			ctx.translate(centerX, centerY);
			ctx.rotate((lastAngle + angle) / 2);

			ctx.fillStyle = '#000000';//ctx.fillStyle = '#ffffff';
			//ctx.font = "1.4em Cabin Sketch";
			//ctx.fillText(value.substr(0, 20), size / 2 + 28, 0);
			if(value === "Porción pastel Hershey's" || value === "Gracias por participar") {
				ctx.font = "1.2em Cabin Sketch";
				ctx.fillText(value.substr(0, 27), size / 2 + 28, 0);
			} else {
				ctx.font = "1.4em Cabin Sketch";
				ctx.fillText(value.substr(0, 20), size / 2 + 28, 0);
			}
			
			ctx.restore();

			ctx.restore();
		},

		drawWheel : function() {
			var ctx = wheel.canvasContext;

			var angleCurrent = wheel.angleCurrent;
			var lastAngle    = angleCurrent;

			var segments  = wheel.segments;
			var len       = wheel.segments.length;
			var colors    = wheel.colors;
			var colorsLen = wheel.colors.length;

			var centerX = wheel.centerX;
			var centerY = wheel.centerY;
			var size    = wheel.size;

			var PI2 = Math.PI * 2;

			ctx.lineWidth    = 2;
			ctx.strokeStyle  = '#999999';
			ctx.textBaseline = "middle";
			ctx.textAlign    = "center";
			//ctx.font = "1.3em Open Sans";//ctx.font = "1.4em Arial";

			for (var i = 1; i <= len; i++) {
				var angle = PI2 * (i / len) + angleCurrent;
				wheel.drawSegment(i - 1, lastAngle, angle);
				lastAngle = angle;
			}
			// Draw a center circle
			ctx.beginPath();
			ctx.arc(centerX, centerY, 60, 0, PI2, false);
			ctx.closePath();
			var gradButton = ctx.createRadialGradient(300,300,10,300,300,80);
			gradButton.addColorStop("0","#FFFFFF");
			gradButton.addColorStop("1","#D0D0D0");
			ctx.fillStyle = gradButton;
			ctx.strokeStyle = '#333333';//ctx.strokeStyle = '#B0B0B0';
			/*ctx.shadowBlur=10;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';*/
			
			ctx.fill();
			ctx.stroke();
			
			// Draw the spin text
			ctx.save();
			//ctx.textAlign = "center";//ctx.textBaseline = "middle";
			ctx.fillStyle = '#000000';
			ctx.font = "2.4em Cabin Sketch";//ctx.font = "2.4em Luckiest Guy";
			ctx.shadowBlur=0;
			ctx.fillText('GIRAR', centerX, centerY);//ctx.fillText('GIRAR', centerX + size - 290, centerY + 10);
		},
	}
	
	wheel.init();
	var segments = new Array();
	var img = new Image();
	$.each($('#venues input:checked'), function(key, cbox) {
		segments.push( cbox.value );
	});
	
	/*Random al vector de premios o  venues*/
	revolverPremios(segments);
	
	wheel.segments = segments;
	wheel.update();
	
	$("#opciones").fadeIn();
	
}//comenzar()

function revolverPremios ( myArray ) {
  var i = myArray.length;
  if ( i == 0 ) return false;
  while ( --i ) {
     var j = Math.floor( Math.random() * ( i + 1 ) );
     var tempi = myArray[i];
     var tempj = myArray[j];
     myArray[i] = tempj;
     myArray[j] = tempi;
   }
}

window.onload = function() {
	// Hide the address bar (for mobile devices)!
	/*setTimeout(function() {
		window.scrollTo(0, 1);
	}, 0);*/
	
	opcion1();
	
	setTimeout(function() {
		$("#opciones").fadeIn();
	}, 1000);
}

function opcion1() {
	$("#monto").fadeOut();
	venues = {
		"116208"   : "Certificado ¢5 mil",
		"66271"    : "Cobb Salad",
		"414570"   : "Premio Coca Cola 1",
		"392360"   : "Porción pastel Hershey's",
		"2210952"  : "French Toast Slam",
		"207306"   : "10% descuento",
		"41457"    : "Premio Coca Cola 2",
		"101161"   : "Gracias por participar"
	}
	comenzar();
}//opcion1()

function mostrarRuleta() {
	setTimeout(function() {
		$("#opciones").fadeOut(100);
		$("#wheel").fadeIn(400);
	}, 500);
}

function inicio() {
	window.location.reload();
	//history.go(0);
	//window.location.href=window.location.href;
}

function resultado() {
	var flag = true;
	
	if( $("#premio").html() === "Porción pastel Hershey's") {
		$("#premio").html("1 porción de pastel Hershey's");
	} else 
	if( $("#premio").html() === '10% descuento') {
		$("#premio").html('10% de descuento en su cuenta');
	} else 
	if( $("#premio").html() === 'Certificado ¢5 mil') {
		$("#premio").html('Certificado de regalo por ¢5000 colones');
	} else 
	if( $("#premio").html() === 'Gracias por participar') {
		$("#premio2").html('Mejor suerte la próxima vez.');
		$("#mensaje_lo_sentimos").css({ 'height':'285px' });
		$("#mensaje_lo_sentimos").css({ 'margin-top':'-143px' });
		flag = false;
	} else 
	if( $("#premio").html() === 'Premio Coca Cola 1') {
		//logo Coca Cola
		$("#logoCoca").css({ 'display':'block' });
		$("#mensaje_felicidades").css({ 'height':'345px' });
		$("#mensaje_felicidades").css({ 'margin-top':'-175px' });
	} else 
	if( $("#premio").html() === 'Premio Coca Cola 2') {
		//logo Coca Cola
		$("#logoCoca").css({ 'display':'block' });
		$("#mensaje_felicidades").css({ 'height':'345px' });
		$("#mensaje_felicidades").css({ 'margin-top':'-175px' });
	}
	sonar_musicapremio(flag);
	if (flag){
		$("#mensaje_felicidades").fadeIn();
	}else{
		$("#mensaje_lo_sentimos").fadeIn();
	}
	$("#wheel").fadeOut();
	
}//resultado()

function sonar_musicapremio(flag) {
	var sonido = document.createElement('audio');
	if (flag)
		sonido.setAttribute('src', './msc/maquina.mp3');
	else
		sonido.setAttribute('src', './msc/fail.mp3');
	sonido.play();
}