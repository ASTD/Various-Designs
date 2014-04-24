// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

	// Set plugin name
	var pluginName = "bring";

	// Set default options
	var defaults = {
			action: "show",
			animation: "random",
			speed: 1,
			delay: 0,
			offset: 1,
		};

	// Define a base variable to avoid scope issues
	var _this = "";

	// Define global vars so that we can use them with ease and yet better readability
	// Downside: It requires to be called on each method
	var $elem,
		action,
		speed,
		delay,
		offset,
		animation;

	// The actual plugin constructor
	function Bring ( element, options ) {
		_this = this;
		_this.element = element;
		_this.settings = $.extend( {}, defaults, options );
		_this._defaults = defaults;
		_this._name = pluginName;
		_this.repeat = false;
		_this.callOver = false;
		_this.init();
	}

	Bring.prototype = {
		init: function () {

			// Update global vaiables
			updateGlobalVars(this);

			// Check if animation is random or not
			animation = ( animation === 'random' ? getRandomInt(0,6) : animation);
			
			// Check if animation is a set of animations
			if ( animation instanceof Array ) {
				animationArray = animation;
				random_index = getRandomInt(0,animationArray.length-1);
				animation = animationArray[random_index];
			}

			if ( action === "show" ) {
				console.log("show");
				// TweenLite.killTweensOf($elem, false);
				_this.show(animation);
			} else if ( action === "hide" ) {
				console.log("hide");
				_this.hide(animation);
			}

		},
		show: function (animation) {

			// Update global vaiables
			updateGlobalVars(this);
			
			switch(animation) {
				case 0:
				case 'fade':
					if ( _this.callOver || !_this.repeat  ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
						TweenLite.to( $elem, speed, { css: { 'opacity': '1' }, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
					break;
				case 1:
				case 'fade-from-top':
					if ( _this.callOver || !_this.repeat ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', y: -35 * offset, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0 }, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
					break;
				case 2:
				case 'fade-from-right':
					if ( _this.callOver || !_this.repeat ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', x: 35 * offset, y: 0, scaleX: 1, scaleY: 1 } } );
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', x: 0 }, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
					break;
				case 3:
				case 'fade-from-bottom':
					if ( _this.callOver || !_this.repeat ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', y: 35 * offset, x: 0, scaleX: 1, scaleY: 1 } } );
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0 }, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
					break;
				case 4:
				case 'fade-from-left':
					if ( _this.callOver || !_this.repeat ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', x: -35 * offset, y: 0, scaleX: 1, scaleY: 1 } } );
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', x: 0 }, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
					break;
				case 5:
				case 'scale-up':
					if ( _this.callOver || !_this.repeat ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', scaleX: 0.9 * offset, scaleY: 0.9 * offset, x: 0, y: 0 } } );
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', scaleX: 1, scaleY: 1}, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
					break;
				case 6:
				case 'scale-down':
					if ( _this.callOver || !_this.repeat ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', scaleX: 1.1 * offset, scaleY: 1.1 * offset, x: 0, y: 0 } } );
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', scaleX: 1, scaleY: 1}, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
					break;
				default:
					if ( _this.callOver || !_this.repeat ) {
						TweenLite.to( $elem, 0, { css: { 'opacity': '0', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
						TweenLite.to( $elem, speed, { css: { 'opacity': '1' }, ease: Expo.easeOut, delay: delay });
						_this.callOver = false;
					} else {
						TweenLite.to( $elem, speed, { css: { 'opacity': '1', y: 0, x: 0, scaleX: 1, scaleY: 1 }, ease: Expo.easeOut, delay: 0 });
					}
			}

		}, // End show()
		hide: function (animation) {

			// Update global vaiables
			updateGlobalVars(this);

			switch(animation) {
				case 0:
				case 'fade':
					TweenLite.to( $elem, speed, { css: { 'opacity': '0' }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					} });
					break;
				case 1:
				case 'fade-from-top':
					TweenLite.to( $elem, speed, { css: { 'opacity': '0', y: -35 * offset }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					} });
					// TweenLite.to( $elem, 0, { css: { 'opacity': '0', y: 0 }, ease: Expo.easeOut, delay: speed });
					break;
				case 2:
				case 'fade-from-right':
					TweenLite.to( $elem, speed, { css: { 'opacity': '0', x: 35 * offset }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					} });
					// TweenLite.to( $elem, 0, { css: { 'opacity': '0', x: 0 }, ease: Expo.easeOut, delay: speed });
					break;
				case 3:
				case 'fade-from-bottom':
					TweenLite.to( $elem, speed, { css: { 'opacity': '0', y: 35 * offset }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					}});
					// TweenLite.to( $elem, 0, { css: { 'opacity': '0', y: 0 }, ease: Expo.easeOut, delay: speed });
					break;
				case 4:
				case 'fade-from-left':
					TweenLite.to( $elem, speed, { css: { 'opacity': '0', x: -35 * offset }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					} });
					// TweenLite.to( $elem, 0, { css: { 'opacity': '0', x: 0 }, ease: Expo.easeOut, delay: speed });
					break;
				case 5:
				case 'scale-up':
					TweenLite.to( $elem, speed, { css: { 'opacity': '0', scaleX: 0.9 * offset, scaleY: 0.9 * offset }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					} });
					// TweenLite.to( $elem, 0, { css: { 'opacity': '0', scaleX: 1, scaleY: 1}, ease: Expo.easeOut, delay: speed });
					break;
				case 6:
				case 'scale-down':
					TweenLite.to( $elem, speed, { css: { 'opacity': '0', scaleX: 0.9 * offset, scaleY: 0.9 * offset }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					} });
					// TweenLite.to( $elem, 0, { css: { 'opacity': '0', scaleX: 1, scaleY: 1}, ease: Expo.easeOut, delay: speed });
					break;
				default:
					TweenLite.to( $elem, speed, { css: { 'opacity': '0' }, ease: Expo.easeOut, delay: delay, onComplete: function() {
						_this.callOver = true;
					} });
			}

		}  // End hide()
	};	// End Bring.prototype

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( options ) {
		return this.each(function() {
			if ( !$.data( this, "plugin_" + pluginName ) ) {
				$.data( this, "plugin_" + pluginName, new Bring( this, options ) );
			} else {
				$(this).data("plugin_" + pluginName).repeat = true;
				$(this).data("plugin_" + pluginName).settings = $.extend( {}, defaults, options );
				$(this).data("plugin_" + pluginName).init();
			}
		});
	};

	// Private function that is only called by the plugin
    var toArray = function(obj) {
		var array = $.map(obj, function(value, index) {
		    return [value];
		});
		return array;
    }

	var getRandomInt = function(min, max) {
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	var updateGlobalVars = function(that) {
		_this = that;
		$elem = that.element;
		action = that.settings.action;
		speed = that.settings.speed;
		delay = that.settings.delay;
		offset = that.settings.offset;
		animation = that.settings.animation;
	}


})( jQuery, window, document );