/**
 * BxSlider v4.1.1 - Fully loaded, responsive content slider
 * http://bxslider.com
 *
 * Copyright 2013, Steven Wanderski - http://stevenwanderski.com - http://bxcreative.com
 * Written while drinking Belgian ales and listening to jazz
 *
 * Released under the MIT license - http://opensource.org/licenses/MIT
 */

;(function($){

    var plugin = {};

    var defaults = {

        // GENERAL
        mode: 'horizontal',
        slideSelector: '',
        infiniteLoop: true,
        hideControlOnEnd: false,
        speed: 500,
        easing: null,
        slideMargin: 0,
        startSlide: 0,
        randomStart: false,
        captions: false,
        ticker: false,
        tickerHover: false,
        adaptiveHeight: false,
        adaptiveHeightSpeed: 500,
        video: false,
        useCSS: true,
        preloadImages: 'visible',
        responsive: true,

        // TOUCH
        touchEnabled: true,
        swipeThreshold: 50,
        oneToOneTouch: true,
        preventDefaultSwipeX: true,
        preventDefaultSwipeY: false,

        // PAGER
        pager: true,
        pagerType: 'full',
        pagerShortSeparator: ' / ',
        pagerSelector: null,
        buildPager: null,
        pagerCustom: null,

        // CONTROLS
        controls: true,
        nextText: 'Next',
        prevText: 'Prev',
        nextSelector: null,
        prevSelector: null,
        autoControls: false,
        startText: 'Start',
        stopText: 'Stop',
        autoControlsCombine: false,
        autoControlsSelector: null,

        // AUTO
        auto: false,
        pause: 4000,
        autoStart: true,
        autoDirection: 'next',
        autoHover: false,
        autoDelay: 0,

        // CAROUSEL
        minSlides: 1,
        maxSlides: 1,
        moveSlides: 0,
        slideWidth: 0,

        // CALLBACKS
        onSliderLoad: function() {},
        onSlideBefore: function() {},
        onSlideAfter: function() {},
        onSlideNext: function() {},
        onSlidePrev: function() {}
    }

    $.fn.bxSlider = function(options){

        if(this.length == 0) return this;

        // support mutltiple elements
        if(this.length > 1){
            this.each(function(){$(this).bxSlider(options)});
            return this;
        }

        // create a namespace to be used throughout the plugin
        var slider = {};
        // set a reference to our slider element
        var el = this;
        plugin.el = this;

        /**
         * Makes slideshow responsive
         */
        // first get the original window dimens (thanks alot IE)
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();



        /**
         * ===================================================================================
         * = PRIVATE FUNCTIONS
         * ===================================================================================
         */

        /**
         * Initializes namespace settings to be used throughout plugin
         */
        var init = function(){
            // merge user-supplied options with the defaults
            slider.settings = $.extend({}, defaults, options);
            // parse slideWidth setting
            slider.settings.slideWidth = parseInt(slider.settings.slideWidth);
            // store the original children
            slider.children = el.children(slider.settings.slideSelector);
            // check if actual number of slides is less than minSlides / maxSlides
            if(slider.children.length < slider.settings.minSlides) slider.settings.minSlides = slider.children.length;
            if(slider.children.length < slider.settings.maxSlides) slider.settings.maxSlides = slider.children.length;
            // if random start, set the startSlide setting to random number
            if(slider.settings.randomStart) slider.settings.startSlide = Math.floor(Math.random() * slider.children.length);
            // store active slide information
            slider.active = { index: slider.settings.startSlide }
            // store if the slider is in carousel mode (displaying / moving multiple slides)
            slider.carousel = slider.settings.minSlides > 1 || slider.settings.maxSlides > 1;
            // if carousel, force preloadImages = 'all'
            if(slider.carousel) slider.settings.preloadImages = 'all';
            // calculate the min / max width thresholds based on min / max number of slides
            // used to setup and update carousel slides dimensions
            slider.minThreshold = (slider.settings.minSlides * slider.settings.slideWidth) + ((slider.settings.minSlides - 1) * slider.settings.slideMargin);
            slider.maxThreshold = (slider.settings.maxSlides * slider.settings.slideWidth) + ((slider.settings.maxSlides - 1) * slider.settings.slideMargin);
            // store the current state of the slider (if currently animating, working is true)
            slider.working = false;
            // initialize the controls object
            slider.controls = {};
            // initialize an auto interval
            slider.interval = null;
            // determine which property to use for transitions
            slider.animProp = slider.settings.mode == 'vertical' ? 'top' : 'left';
            // determine if hardware acceleration can be used
            slider.usingCSS = slider.settings.useCSS && slider.settings.mode != 'fade' && (function(){
                // create our test div element
                var div = document.createElement('div');
                // css transition properties
                var props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
                // test for each property
                for(var i in props){
                    if(div.style[props[i]] !== undefined){
                        slider.cssPrefix = props[i].replace('Perspective', '').toLowerCase();
                        slider.animProp = '-' + slider.cssPrefix + '-transform';
                        return true;
                    }
                }
                return false;
            }());
            // if vertical mode always make maxSlides and minSlides equal
            if(slider.settings.mode == 'vertical') slider.settings.maxSlides = slider.settings.minSlides;
            // save original style data
            el.data("origStyle", el.attr("style"));
            el.children(slider.settings.slideSelector).each(function() {
              $(this).data("origStyle", $(this).attr("style"));
            });
            // perform all DOM / CSS modifications
            setup();
        }

        /**
         * Performs all DOM and CSS modifications
         */
        var setup = function(){
            // wrap el in a wrapper
            el.wrap('<div class="bx-wrapper"><div class="bx-viewport"></div></div>');
            // store a namspace reference to .bx-viewport
            slider.viewport = el.parent();
            // add a loading div to display while images are loading
            slider.loader = $('<div class="bx-loading" />');
            slider.viewport.prepend(slider.loader);
            // set el to a massive width, to hold any needed slides
            // also strip any margin and padding from el
            el.css({
                width: slider.settings.mode == 'horizontal' ? (slider.children.length * 100 + 215) + '%' : 'auto',
                position: 'relative'
            });
            // if using CSS, add the easing property
            if(slider.usingCSS && slider.settings.easing){
                el.css('-' + slider.cssPrefix + '-transition-timing-function', slider.settings.easing);
            // if not using CSS and no easing value was supplied, use the default JS animation easing (swing)
            }else if(!slider.settings.easing){
                slider.settings.easing = 'swing';
            }
            var slidesShowing = getNumberSlidesShowing();
            // make modifications to the viewport (.bx-viewport)
            slider.viewport.css({
                width: '100%',
                overflow: 'hidden',
                position: 'relative'
            });
            slider.viewport.parent().css({
                maxWidth: getViewportMaxWidth()
            });
            // make modification to the wrapper (.bx-wrapper)
            if(!slider.settings.pager) {
                slider.viewport.parent().css({
                margin: '0 auto 0px'
                });
            }
            // apply css to all slider children
            slider.children.css({
                'float': slider.settings.mode == 'horizontal' ? 'left' : 'none',
                listStyle: 'none',
                position: 'relative'
            });
            // apply the calculated width after the float is applied to prevent scrollbar interference
            slider.children.css('width', getSlideWidth());
            // if slideMargin is supplied, add the css
            if(slider.settings.mode == 'horizontal' && slider.settings.slideMargin > 0) slider.children.css('marginRight', slider.settings.slideMargin);
            if(slider.settings.mode == 'vertical' && slider.settings.slideMargin > 0) slider.children.css('marginBottom', slider.settings.slideMargin);
            // if "fade" mode, add positioning and z-index CSS
            if(slider.settings.mode == 'fade'){
                slider.children.css({
                    position: 'absolute',
                    zIndex: 0,
                    display: 'none'
                });
                // prepare the z-index on the showing element
                slider.children.eq(slider.settings.startSlide).css({zIndex: 50, display: 'block'});
            }
            // create an element to contain all slider controls (pager, start / stop, etc)
            slider.controls.el = $('<div class="bx-controls" />');
            // if captions are requested, add them
            if(slider.settings.captions) appendCaptions();
            // check if startSlide is last slide
            slider.active.last = slider.settings.startSlide == getPagerQty() - 1;
            // if video is true, set up the fitVids plugin
            if(slider.settings.video) el.fitVids();
            // set the default preload selector (visible)
            var preloadSelector = slider.children.eq(slider.settings.startSlide);
            if (slider.settings.preloadImages == "all") preloadSelector = slider.children;
            // only check for control addition if not in "ticker" mode
            if(!slider.settings.ticker){
                // if pager is requested, add it
                if(slider.settings.pager) appendPager();
                // if controls are requested, add them
                if(slider.settings.controls) appendControls();
                // if auto is true, and auto controls are requested, add them
                if(slider.settings.auto && slider.settings.autoControls) appendControlsAuto();
                // if any control option is requested, add the controls wrapper
                if(slider.settings.controls || slider.settings.autoControls || slider.settings.pager) slider.viewport.after(slider.controls.el);
            // if ticker mode, do not allow a pager
            }else{
                slider.settings.pager = false;
            }
            // preload all images, then perform final DOM / CSS modifications that depend on images being loaded
            loadElements(preloadSelector, start);
        }

        var loadElements = function(selector, callback){
            var total = selector.find('img, iframe').length;
            if (total == 0){
                callback();
                return;
            }
            var count = 0;
            selector.find('img, iframe').each(function(){
                $(this).one('load', function() {
                  if(++count == total) callback();
                }).each(function() {
                  if(this.complete) $(this).load();
                });
            });
        }

        /**
         * Start the slider
         */
        var start = function(){
            // if infinite loop, prepare additional slides
            if(slider.settings.infiniteLoop && slider.settings.mode != 'fade' && !slider.settings.ticker){
                var slice = slider.settings.mode == 'vertical' ? slider.settings.minSlides : slider.settings.maxSlides;
                var sliceAppend = slider.children.slice(0, slice).clone().addClass('bx-clone');
                var slicePrepend = slider.children.slice(-slice).clone().addClass('bx-clone');
                el.append(sliceAppend).prepend(slicePrepend);
            }
            // remove the loading DOM element
            slider.loader.remove();
            // set the left / top position of "el"
            setSlidePosition();
            // if "vertical" mode, always use adaptiveHeight to prevent odd behavior
            if (slider.settings.mode == 'vertical') slider.settings.adaptiveHeight = true;
            // set the viewport height
            slider.viewport.height(getViewportHeight());
            // make sure everything is positioned just right (same as a window resize)
            el.redrawSlider();
            // onSliderLoad callback
            slider.settings.onSliderLoad(slider.active.index);
            // slider has been fully initialized
            slider.initialized = true;
            // bind the resize call to the window
            if (slider.settings.responsive) $(window).bind('resize', resizeWindow);
            // if auto is true, start the show
            if (slider.settings.auto && slider.settings.autoStart) initAuto();
            // if ticker is true, start the ticker
            if (slider.settings.ticker) initTicker();
            // if pager is requested, make the appropriate pager link active
            if (slider.settings.pager) updatePagerActive(slider.settings.startSlide);
            // check for any updates to the controls (like hideControlOnEnd updates)
            if (slider.settings.controls) updateDirectionControls();
            // if touchEnabled is true, setup the touch events
            if (slider.settings.touchEnabled && !slider.settings.ticker) initTouch();
        }

        /**
         * Returns the calculated height of the viewport, used to determine either adaptiveHeight or the maxHeight value
         */
        var getViewportHeight = function(){
            var height = 0;
            // first determine which children (slides) should be used in our height calculation
            var children = $();
            // if mode is not "vertical" and adaptiveHeight is false, include all children
            if(slider.settings.mode != 'vertical' && !slider.settings.adaptiveHeight){
                children = slider.children;
            }else{
                // if not carousel, return the single active child
                if(!slider.carousel){
                    children = slider.children.eq(slider.active.index);
                // if carousel, return a slice of children
                }else{
                    // get the individual slide index
                    var currentIndex = slider.settings.moveSlides == 1 ? slider.active.index : slider.active.index * getMoveBy();
                    // add the current slide to the children
                    children = slider.children.eq(currentIndex);
                    // cycle through the remaining "showing" slides
                    for (i = 1; i <= slider.settings.maxSlides - 1; i++){
                        // if looped back to the start
                        if(currentIndex + i >= slider.children.length){
                            children = children.add(slider.children.eq(i - 1));
                        }else{
                            children = children.add(slider.children.eq(currentIndex + i));
                        }
                    }
                }
            }
            // if "vertical" mode, calculate the sum of the heights of the children
            if(slider.settings.mode == 'vertical'){
                children.each(function(index) {
                  height += $(this).outerHeight();
                });
                // add user-supplied margins
                if(slider.settings.slideMargin > 0){
                    height += slider.settings.slideMargin * (slider.settings.minSlides - 1);
                }
            // if not "vertical" mode, calculate the max height of the children
            }else{
                height = Math.max.apply(Math, children.map(function(){
                    return $(this).outerHeight(false);
                }).get());
            }
            return height;
        }

        /**
         * Returns the calculated width to be used for the outer wrapper / viewport
         */
        var getViewportMaxWidth = function(){
            var width = '100%';
            if(slider.settings.slideWidth > 0){
                if(slider.settings.mode == 'horizontal'){
                    width = (slider.settings.maxSlides * slider.settings.slideWidth) + ((slider.settings.maxSlides - 1) * slider.settings.slideMargin);
                }else{
                    width = slider.settings.slideWidth;
                }
            }
            return width;
        }

        /**
         * Returns the calculated width to be applied to each slide
         */
        var getSlideWidth = function(){
            // start with any user-supplied slide width
            var newElWidth = slider.settings.slideWidth;
            // get the current viewport width
            var wrapWidth = slider.viewport.width();
            // if slide width was not supplied, or is larger than the viewport use the viewport width
            if(slider.settings.slideWidth == 0 ||
                (slider.settings.slideWidth > wrapWidth && !slider.carousel) ||
                slider.settings.mode == 'vertical'){
                newElWidth = wrapWidth;
            // if carousel, use the thresholds to determine the width
            }else if(slider.settings.maxSlides > 1 && slider.settings.mode == 'horizontal'){
                if(wrapWidth > slider.maxThreshold){
                    // newElWidth = (wrapWidth - (slider.settings.slideMargin * (slider.settings.maxSlides - 1))) / slider.settings.maxSlides;
                }else if(wrapWidth < slider.minThreshold){
                    newElWidth = (wrapWidth - (slider.settings.slideMargin * (slider.settings.minSlides - 1))) / slider.settings.minSlides;
                }
            }
            return newElWidth;
        }

        /**
         * Returns the number of slides currently visible in the viewport (includes partially visible slides)
         */
        var getNumberSlidesShowing = function(){
            var slidesShowing = 1;
            if(slider.settings.mode == 'horizontal' && slider.settings.slideWidth > 0){
                // if viewport is smaller than minThreshold, return minSlides
                if(slider.viewport.width() < slider.minThreshold){
                    slidesShowing = slider.settings.minSlides;
                // if viewport is larger than minThreshold, return maxSlides
                }else if(slider.viewport.width() > slider.maxThreshold){
                    slidesShowing = slider.settings.maxSlides;
                // if viewport is between min / max thresholds, divide viewport width by first child width
                }else{
                    var childWidth = slider.children.first().width();
                    slidesShowing = Math.floor(slider.viewport.width() / childWidth);
                }
            // if "vertical" mode, slides showing will always be minSlides
            }else if(slider.settings.mode == 'vertical'){
                slidesShowing = slider.settings.minSlides;
            }
            return slidesShowing;
        }

        /**
         * Returns the number of pages (one full viewport of slides is one "page")
         */
        var getPagerQty = function(){
            var pagerQty = 0;
            // if moveSlides is specified by the user
            if(slider.settings.moveSlides > 0){
                if(slider.settings.infiniteLoop){
                    pagerQty = slider.children.length / getMoveBy();
                }else{
                    // use a while loop to determine pages
                    var breakPoint = 0;
                    var counter = 0
                    // when breakpoint goes above children length, counter is the number of pages
                    while (breakPoint < slider.children.length){
                        ++pagerQty;
                        breakPoint = counter + getNumberSlidesShowing();
                        counter += slider.settings.moveSlides <= getNumberSlidesShowing() ? slider.settings.moveSlides : getNumberSlidesShowing();
                    }
                }
            // if moveSlides is 0 (auto) divide children length by sides showing, then round up
            }else{
                pagerQty = Math.ceil(slider.children.length / getNumberSlidesShowing());
            }
            return pagerQty;
        }

        /**
         * Returns the number of indivual slides by which to shift the slider
         */
        var getMoveBy = function(){
            // if moveSlides was set by the user and moveSlides is less than number of slides showing
            if(slider.settings.moveSlides > 0 && slider.settings.moveSlides <= getNumberSlidesShowing()){
                return slider.settings.moveSlides;
            }
            // if moveSlides is 0 (auto)
            return getNumberSlidesShowing();
        }

        /**
         * Sets the slider's (el) left or top position
         */
        var setSlidePosition = function(){
            // if last slide, not infinite loop, and number of children is larger than specified maxSlides
            if(slider.children.length > slider.settings.maxSlides && slider.active.last && !slider.settings.infiniteLoop){
                if (slider.settings.mode == 'horizontal'){
                    // get the last child's position
                    var lastChild = slider.children.last();
                    var position = lastChild.position();
                    // set the left position
                    setPositionProperty(-(position.left - (slider.viewport.width() - lastChild.width())), 'reset', 0);
                }else if(slider.settings.mode == 'vertical'){
                    // get the last showing index's position
                    var lastShowingIndex = slider.children.length - slider.settings.minSlides;
                    var position = slider.children.eq(lastShowingIndex).position();
                    // set the top position
                    setPositionProperty(-position.top, 'reset', 0);
                }
            // if not last slide
            }else{
                // get the position of the first showing slide
                var position = slider.children.eq(slider.active.index * getMoveBy()).position();
                // check for last slide
                if (slider.active.index == getPagerQty() - 1) slider.active.last = true;
                // set the repective position
                if (position != undefined){
                    if (slider.settings.mode == 'horizontal') setPositionProperty(-position.left, 'reset', 0);
                    else if (slider.settings.mode == 'vertical') setPositionProperty(-position.top, 'reset', 0);
                }
            }
        }

        /**
         * Sets the el's animating property position (which in turn will sometimes animate el).
         * If using CSS, sets the transform property. If not using CSS, sets the top / left property.
         *
         * @param value (int)
         *  - the animating property's value
         *
         * @param type (string) 'slider', 'reset', 'ticker'
         *  - the type of instance for which the function is being
         *
         * @param duration (int)
         *  - the amount of time (in ms) the transition should occupy
         *
         * @param params (array) optional
         *  - an optional parameter containing any variables that need to be passed in
         */
        var setPositionProperty = function(value, type, duration, params){
            // use CSS transform
            if(slider.usingCSS){
                // determine the translate3d value
                var propValue = slider.settings.mode == 'vertical' ? 'translate3d(0, ' + value + 'px, 0)' : 'translate3d(' + value + 'px, 0, 0)';
                // add the CSS transition-duration
                el.css('-' + slider.cssPrefix + '-transition-duration', duration / 1000 + 's');
                if(type == 'slide'){
                    // set the property value
                    el.css(slider.animProp, propValue);
                    // bind a callback method - executes when CSS transition completes
                    el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
                        // unbind the callback
                        el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
                        updateAfterSlideTransition();
                    });
                }else if(type == 'reset'){
                    el.css(slider.animProp, propValue);
                }else if(type == 'ticker'){
                    // make the transition use 'linear'
                    el.css('-' + slider.cssPrefix + '-transition-timing-function', 'linear');
                    el.css(slider.animProp, propValue);
                    // bind a callback method - executes when CSS transition completes
                    el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
                        // unbind the callback
                        el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
                        // reset the position
                        setPositionProperty(params['resetValue'], 'reset', 0);
                        // start the loop again
                        tickerLoop();
                    });
                }
            // use JS animate
            }else{
                var animateObj = {};
                animateObj[slider.animProp] = value;
                if(type == 'slide'){
                    el.animate(animateObj, duration, slider.settings.easing, function(){
                        updateAfterSlideTransition();
                    });
                }else if(type == 'reset'){
                    el.css(slider.animProp, value)
                }else if(type == 'ticker'){
                    el.animate(animateObj, speed, 'linear', function(){
                        setPositionProperty(params['resetValue'], 'reset', 0);
                        // run the recursive loop after animation
                        tickerLoop();
                    });
                }
            }
        }

        /**
         * Populates the pager with proper amount of pages
         */
        var populatePager = function(){
            var pagerHtml = '';
            var pagerQty = getPagerQty();
            // loop through each pager item
            for(var i=0; i < pagerQty; i++){
                var linkContent = '';
                // if a buildPager function is supplied, use it to get pager link value, else use index + 1
                if(slider.settings.buildPager && $.isFunction(slider.settings.buildPager)){
                    linkContent = slider.settings.buildPager(i);
                    slider.pagerEl.addClass('bx-custom-pager');
                }else{
                    linkContent = i + 1;
                    slider.pagerEl.addClass('bx-default-pager');
                }
                // var linkContent = slider.settings.buildPager && $.isFunction(slider.settings.buildPager) ? slider.settings.buildPager(i) : i + 1;
                // add the markup to the string
                pagerHtml += '<div class="bx-pager-item"><a href="" data-slide-index="' + i + '" class="bx-pager-link">' + linkContent + '</a></div>';
            };
            // populate the pager element with pager links
            slider.pagerEl.html(pagerHtml);
        }

        /**
         * Appends the pager to the controls element
         */
        var appendPager = function(){
            if(!slider.settings.pagerCustom){
                // create the pager DOM element
                slider.pagerEl = $('<div class="bx-pager" />');
                // if a pager selector was supplied, populate it with the pager
                if(slider.settings.pagerSelector){
                    $(slider.settings.pagerSelector).html(slider.pagerEl);
                // if no pager selector was supplied, add it after the wrapper
                }else{
                    slider.controls.el.addClass('bx-has-pager').append(slider.pagerEl);
                }
                // populate the pager
                populatePager();
            }else{
                slider.pagerEl = $(slider.settings.pagerCustom);
            }
            // assign the pager click binding
            slider.pagerEl.delegate('a', 'click', clickPagerBind);
        }

        /**
         * Appends prev / next controls to the controls element
         */
        var appendControls = function(){
            slider.controls.next = $('<a class="bx-next" href="">' + slider.settings.nextText + '</a>');
            slider.controls.prev = $('<a class="bx-prev" href="">' + slider.settings.prevText + '</a>');
            // bind click actions to the controls
            slider.controls.next.bind('click', clickNextBind);
            slider.controls.prev.bind('click', clickPrevBind);
            // if nextSlector was supplied, populate it
            if(slider.settings.nextSelector){
                $(slider.settings.nextSelector).append(slider.controls.next);
            }
            // if prevSlector was supplied, populate it
            if(slider.settings.prevSelector){
                $(slider.settings.prevSelector).append(slider.controls.prev);
            }
            // if no custom selectors were supplied
            if(!slider.settings.nextSelector && !slider.settings.prevSelector){
                // add the controls to the DOM
                slider.controls.directionEl = $('<div class="bx-controls-direction" />');
                // add the control elements to the directionEl
                slider.controls.directionEl.append(slider.controls.prev).append(slider.controls.next);
                // slider.viewport.append(slider.controls.directionEl);
                slider.controls.el.addClass('bx-has-controls-direction').append(slider.controls.directionEl);
            }
        }

        /**
         * Appends start / stop auto controls to the controls element
         */
        var appendControlsAuto = function(){
            slider.controls.start = $('<div class="bx-controls-auto-item"><a class="bx-start" href="">' + slider.settings.startText + '</a></div>');
            slider.controls.stop = $('<div class="bx-controls-auto-item"><a class="bx-stop" href="">' + slider.settings.stopText + '</a></div>');
            // add the controls to the DOM
            slider.controls.autoEl = $('<div class="bx-controls-auto" />');
            // bind click actions to the controls
            slider.controls.autoEl.delegate('.bx-start', 'click', clickStartBind);
            slider.controls.autoEl.delegate('.bx-stop', 'click', clickStopBind);
            // if autoControlsCombine, insert only the "start" control
            if(slider.settings.autoControlsCombine){
                slider.controls.autoEl.append(slider.controls.start);
            // if autoControlsCombine is false, insert both controls
            }else{
                slider.controls.autoEl.append(slider.controls.start).append(slider.controls.stop);
            }
            // if auto controls selector was supplied, populate it with the controls
            if(slider.settings.autoControlsSelector){
                $(slider.settings.autoControlsSelector).html(slider.controls.autoEl);
            // if auto controls selector was not supplied, add it after the wrapper
            }else{
                slider.controls.el.addClass('bx-has-controls-auto').append(slider.controls.autoEl);
            }
            // update the auto controls
            updateAutoControls(slider.settings.autoStart ? 'stop' : 'start');
        }

        /**
         * Appends image captions to the DOM
         */
        var appendCaptions = function(){
            // cycle through each child
            slider.children.each(function(index){
                // get the image title attribute
                var title = $(this).find('img:first').attr('title');
                // append the caption
                if (title != undefined && ('' + title).length) {
                    $(this).append('<div class="bx-caption"><span>' + title + '</span></div>');
                }
            });
        }

        /**
         * Click next binding
         *
         * @param e (event)
         *  - DOM event object
         */
        var clickNextBind = function(e){
            // if auto show is running, stop it
            if (slider.settings.auto) el.stopAuto();
            el.goToNextSlide();
            e.preventDefault();
        }

        /**
         * Click prev binding
         *
         * @param e (event)
         *  - DOM event object
         */
        var clickPrevBind = function(e){
            // if auto show is running, stop it
            if (slider.settings.auto) el.stopAuto();
            el.goToPrevSlide();
            e.preventDefault();
        }

        /**
         * Click start binding
         *
         * @param e (event)
         *  - DOM event object
         */
        var clickStartBind = function(e){
            el.startAuto();
            e.preventDefault();
        }

        /**
         * Click stop binding
         *
         * @param e (event)
         *  - DOM event object
         */
        var clickStopBind = function(e){
            el.stopAuto();
            e.preventDefault();
        }

        /**
         * Click pager binding
         *
         * @param e (event)
         *  - DOM event object
         */
        var clickPagerBind = function(e){
            // if auto show is running, stop it
            if (slider.settings.auto) el.stopAuto();
            var pagerLink = $(e.currentTarget);
            var pagerIndex = parseInt(pagerLink.attr('data-slide-index'));
            // if clicked pager link is not active, continue with the goToSlide call
            if(pagerIndex != slider.active.index) el.goToSlide(pagerIndex);
            e.preventDefault();
        }

        /**
         * Updates the pager links with an active class
         *
         * @param slideIndex (int)
         *  - index of slide to make active
         */
        var updatePagerActive = function(slideIndex){
            // if "short" pager type
            var len = slider.children.length; // nb of children
            if(slider.settings.pagerType == 'short'){
                if(slider.settings.maxSlides > 1) {
                    len = Math.ceil(slider.children.length/slider.settings.maxSlides);
                }
                slider.pagerEl.html( (slideIndex + 1) + slider.settings.pagerShortSeparator + len);
                return;
            }
            // remove all pager active classes
            slider.pagerEl.find('a').removeClass('active');
            // apply the active class for all pagers
            slider.pagerEl.each(function(i, el) { $(el).find('a').eq(slideIndex).addClass('active'); });
        }

        /**
         * Performs needed actions after a slide transition
         */
        var updateAfterSlideTransition = function(){
            // if infinte loop is true
            if(slider.settings.infiniteLoop){
                var position = '';
                // first slide
                if(slider.active.index == 0){
                    // set the new position
                    position = slider.children.eq(0).position();
                // carousel, last slide
                }else if(slider.active.index == getPagerQty() - 1 && slider.carousel){
                    position = slider.children.eq((getPagerQty() - 1) * getMoveBy()).position();
                // last slide
                }else if(slider.active.index == slider.children.length - 1){
                    position = slider.children.eq(slider.children.length - 1).position();
                }
                if (slider.settings.mode == 'horizontal') { setPositionProperty(-position.left, 'reset', 0);; }
                else if (slider.settings.mode == 'vertical') { setPositionProperty(-position.top, 'reset', 0);; }
            }
            // declare that the transition is complete
            slider.working = false;
            // onSlideAfter callback
            slider.settings.onSlideAfter(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
        }

        /**
         * Updates the auto controls state (either active, or combined switch)
         *
         * @param state (string) "start", "stop"
         *  - the new state of the auto show
         */
        var updateAutoControls = function(state){
            // if autoControlsCombine is true, replace the current control with the new state
            if(slider.settings.autoControlsCombine){
                slider.controls.autoEl.html(slider.controls[state]);
            // if autoControlsCombine is false, apply the "active" class to the appropriate control
            }else{
                slider.controls.autoEl.find('a').removeClass('active');
                slider.controls.autoEl.find('a:not(.bx-' + state + ')').addClass('active');
            }
        }

        /**
         * Updates the direction controls (checks if either should be hidden)
         */
        var updateDirectionControls = function(){
            if(getPagerQty() == 1){
                slider.controls.prev.addClass('disabled');
                slider.controls.next.addClass('disabled');
            }else if(!slider.settings.infiniteLoop && slider.settings.hideControlOnEnd){
                // if first slide
                if (slider.active.index == 0){
                    slider.controls.prev.addClass('disabled');
                    slider.controls.next.removeClass('disabled');
                // if last slide
                }else if(slider.active.index == getPagerQty() - 1){
                    slider.controls.next.addClass('disabled');
                    slider.controls.prev.removeClass('disabled');
                // if any slide in the middle
                }else{
                    slider.controls.prev.removeClass('disabled');
                    slider.controls.next.removeClass('disabled');
                }
            }
        }

        /**
         * Initialzes the auto process
         */
        var initAuto = function(){
            // if autoDelay was supplied, launch the auto show using a setTimeout() call
            if(slider.settings.autoDelay > 0){
                var timeout = setTimeout(el.startAuto, slider.settings.autoDelay);
            // if autoDelay was not supplied, start the auto show normally
            }else{
                el.startAuto();
            }
            // if autoHover is requested
            if(slider.settings.autoHover){
                // on el hover
                el.hover(function(){
                    // if the auto show is currently playing (has an active interval)
                    if(slider.interval){
                        // stop the auto show and pass true agument which will prevent control update
                        el.stopAuto(true);
                        // create a new autoPaused value which will be used by the relative "mouseout" event
                        slider.autoPaused = true;
                    }
                }, function(){
                    // if the autoPaused value was created be the prior "mouseover" event
                    if(slider.autoPaused){
                        // start the auto show and pass true agument which will prevent control update
                        el.startAuto(true);
                        // reset the autoPaused value
                        slider.autoPaused = null;
                    }
                });
            }
        }

        /**
         * Initialzes the ticker process
         */
        var initTicker = function(){
            var startPosition = 0;
            // if autoDirection is "next", append a clone of the entire slider
            if(slider.settings.autoDirection == 'next'){
                el.append(slider.children.clone().addClass('bx-clone'));
            // if autoDirection is "prev", prepend a clone of the entire slider, and set the left position
            }else{
                el.prepend(slider.children.clone().addClass('bx-clone'));
                var position = slider.children.first().position();
                startPosition = slider.settings.mode == 'horizontal' ? -position.left : -position.top;
            }
            setPositionProperty(startPosition, 'reset', 0);
            // do not allow controls in ticker mode
            slider.settings.pager = false;
            slider.settings.controls = false;
            slider.settings.autoControls = false;
            // if autoHover is requested
            if(slider.settings.tickerHover && !slider.usingCSS){
                // on el hover
                slider.viewport.hover(function(){
                    el.stop();
                }, function(){
                    // calculate the total width of children (used to calculate the speed ratio)
                    var totalDimens = 0;
                    slider.children.each(function(index){
                      totalDimens += slider.settings.mode == 'horizontal' ? $(this).outerWidth(true) : $(this).outerHeight(true);
                    });
                    // calculate the speed ratio (used to determine the new speed to finish the paused animation)
                    var ratio = slider.settings.speed / totalDimens;
                    // determine which property to use
                    var property = slider.settings.mode == 'horizontal' ? 'left' : 'top';
                    // calculate the new speed
                    var newSpeed = ratio * (totalDimens - (Math.abs(parseInt(el.css(property)))));
                    tickerLoop(newSpeed);
                });
            }
            // start the ticker loop
            tickerLoop();
        }

        /**
         * Runs a continuous loop, news ticker-style
         */
        var tickerLoop = function(resumeSpeed){
            speed = resumeSpeed ? resumeSpeed : slider.settings.speed;
            var position = {left: 0, top: 0};
            var reset = {left: 0, top: 0};
            // if "next" animate left position to last child, then reset left to 0
            if(slider.settings.autoDirection == 'next'){
                position = el.find('.bx-clone').first().position();
            // if "prev" animate left position to 0, then reset left to first non-clone child
            }else{
                reset = slider.children.first().position();
            }
            var animateProperty = slider.settings.mode == 'horizontal' ? -position.left : -position.top;
            var resetValue = slider.settings.mode == 'horizontal' ? -reset.left : -reset.top;
            var params = {resetValue: resetValue};
            setPositionProperty(animateProperty, 'ticker', speed, params);
        }

        /**
         * Initializes touch events
         */
        var initTouch = function(){
            // initialize object to contain all touch values
            slider.touch = {
                start: {x: 0, y: 0},
                end: {x: 0, y: 0}
            }
            slider.viewport.bind('touchstart', onTouchStart);
        }

        /**
         * Event handler for "touchstart"
         *
         * @param e (event)
         *  - DOM event object
         */
        var onTouchStart = function(e){
            if(slider.working){
                e.preventDefault();
            }else{
                // record the original position when touch starts
                slider.touch.originalPos = el.position();
                var orig = e.originalEvent;
                // record the starting touch x, y coordinates
                slider.touch.start.x = orig.changedTouches[0].pageX;
                slider.touch.start.y = orig.changedTouches[0].pageY;
                // bind a "touchmove" event to the viewport
                slider.viewport.bind('touchmove', onTouchMove);
                // bind a "touchend" event to the viewport
                slider.viewport.bind('touchend', onTouchEnd);
            }
        }

        /**
         * Event handler for "touchmove"
         *
         * @param e (event)
         *  - DOM event object
         */
        var onTouchMove = function(e){
            var orig = e.originalEvent;
            // if scrolling on y axis, do not prevent default
            var xMovement = Math.abs(orig.changedTouches[0].pageX - slider.touch.start.x);
            var yMovement = Math.abs(orig.changedTouches[0].pageY - slider.touch.start.y);
            // x axis swipe
            if((xMovement * 3) > yMovement && slider.settings.preventDefaultSwipeX){
                e.preventDefault();
            // y axis swipe
            }else if((yMovement * 3) > xMovement && slider.settings.preventDefaultSwipeY){
                e.preventDefault();
            }
            if(slider.settings.mode != 'fade' && slider.settings.oneToOneTouch){
                var value = 0;
                // if horizontal, drag along x axis
                if(slider.settings.mode == 'horizontal'){
                    var change = orig.changedTouches[0].pageX - slider.touch.start.x;
                    value = slider.touch.originalPos.left + change;
                // if vertical, drag along y axis
                }else{
                    var change = orig.changedTouches[0].pageY - slider.touch.start.y;
                    value = slider.touch.originalPos.top + change;
                }
                setPositionProperty(value, 'reset', 0);
            }
        }

        /**
         * Event handler for "touchend"
         *
         * @param e (event)
         *  - DOM event object
         */
        var onTouchEnd = function(e){
            slider.viewport.unbind('touchmove', onTouchMove);
            var orig = e.originalEvent;
            var value = 0;
            // record end x, y positions
            slider.touch.end.x = orig.changedTouches[0].pageX;
            slider.touch.end.y = orig.changedTouches[0].pageY;
            // if fade mode, check if absolute x distance clears the threshold
            if(slider.settings.mode == 'fade'){
                var distance = Math.abs(slider.touch.start.x - slider.touch.end.x);
                if(distance >= slider.settings.swipeThreshold){
                    slider.touch.start.x > slider.touch.end.x ? el.goToNextSlide() : el.goToPrevSlide();
                    el.stopAuto();
                }
            // not fade mode
            }else{
                var distance = 0;
                // calculate distance and el's animate property
                if(slider.settings.mode == 'horizontal'){
                    distance = slider.touch.end.x - slider.touch.start.x;
                    value = slider.touch.originalPos.left;
                }else{
                    distance = slider.touch.end.y - slider.touch.start.y;
                    value = slider.touch.originalPos.top;
                }
                // if not infinite loop and first / last slide, do not attempt a slide transition
                if(!slider.settings.infiniteLoop && ((slider.active.index == 0 && distance > 0) || (slider.active.last && distance < 0))){
                    setPositionProperty(value, 'reset', 200);
                }else{
                    // check if distance clears threshold
                    if(Math.abs(distance) >= slider.settings.swipeThreshold){
                        distance < 0 ? el.goToNextSlide() : el.goToPrevSlide();
                        el.stopAuto();
                    }else{
                        // el.animate(property, 200);
                        setPositionProperty(value, 'reset', 200);
                    }
                }
            }
            slider.viewport.unbind('touchend', onTouchEnd);
        }

        /**
         * Window resize event callback
         */
        var resizeWindow = function(e){
            // get the new window dimens (again, thank you IE)
            var windowWidthNew = $(window).width();
            var windowHeightNew = $(window).height();
            // make sure that it is a true window resize
            // *we must check this because our dinosaur friend IE fires a window resize event when certain DOM elements
            // are resized. Can you just die already?*
            if(windowWidth != windowWidthNew || windowHeight != windowHeightNew){
                // set the new window dimens
                windowWidth = windowWidthNew;
                windowHeight = windowHeightNew;
                // update all dynamic elements
                el.redrawSlider();
            }
        }

        /**
         * ===================================================================================
         * = PUBLIC FUNCTIONS
         * ===================================================================================
         */

        /**
         * Performs slide transition to the specified slide
         *
         * @param slideIndex (int)
         *  - the destination slide's index (zero-based)
         *
         * @param direction (string)
         *  - INTERNAL USE ONLY - the direction of travel ("prev" / "next")
         */
        el.goToSlide = function(slideIndex, direction){
            // if plugin is currently in motion, ignore request
            if(slider.working || slider.active.index == slideIndex) return;
            // declare that plugin is in motion
            slider.working = true;
            // store the old index
            slider.oldIndex = slider.active.index;
            // if slideIndex is less than zero, set active index to last child (this happens during infinite loop)
            if(slideIndex < 0){
                slider.active.index = getPagerQty() - 1;
            // if slideIndex is greater than children length, set active index to 0 (this happens during infinite loop)
            }else if(slideIndex >= getPagerQty()){
                slider.active.index = 0;
            // set active index to requested slide
            }else{
                slider.active.index = slideIndex;
            }
            // onSlideBefore, onSlideNext, onSlidePrev callbacks
            slider.settings.onSlideBefore(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
            if(direction == 'next'){
                slider.settings.onSlideNext(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
            }else if(direction == 'prev'){
                slider.settings.onSlidePrev(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
            }
            // check if last slide
            slider.active.last = slider.active.index >= getPagerQty() - 1;
            // update the pager with active class
            if(slider.settings.pager) updatePagerActive(slider.active.index);
            // // check for direction control update
            if(slider.settings.controls) updateDirectionControls();
            // if slider is set to mode: "fade"
            if(slider.settings.mode == 'fade'){
                // if adaptiveHeight is true and next height is different from current height, animate to the new height
                if(slider.settings.adaptiveHeight && slider.viewport.height() != getViewportHeight()){
                    slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
                }
                // fade out the visible child and reset its z-index value
                slider.children.filter(':visible').fadeOut(slider.settings.speed).css({zIndex: 0});
                // fade in the newly requested slide
                slider.children.eq(slider.active.index).css('zIndex', 51).fadeIn(slider.settings.speed, function(){
                    $(this).css('zIndex', 50);
                    updateAfterSlideTransition();
                });
            // slider mode is not "fade"
            }else{
                // if adaptiveHeight is true and next height is different from current height, animate to the new height
                if(slider.settings.adaptiveHeight && slider.viewport.height() != getViewportHeight()){
                    slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
                }
                var moveBy = 0;
                var position = {left: 0, top: 0};
                // if carousel and not infinite loop
                if(!slider.settings.infiniteLoop && slider.carousel && slider.active.last){
                    if(slider.settings.mode == 'horizontal'){
                        // get the last child position
                        var lastChild = slider.children.eq(slider.children.length - 1);
                        position = lastChild.position();
                        // calculate the position of the last slide
                        moveBy = slider.viewport.width() - lastChild.outerWidth();
                    }else{
                        // get last showing index position
                        var lastShowingIndex = slider.children.length - slider.settings.minSlides;
                        position = slider.children.eq(lastShowingIndex).position();
                    }
                    // horizontal carousel, going previous while on first slide (infiniteLoop mode)
                }else if(slider.carousel && slider.active.last && direction == 'prev'){
                    // get the last child position
                    var eq = slider.settings.moveSlides == 1 ? slider.settings.maxSlides - getMoveBy() : ((getPagerQty() - 1) * getMoveBy()) - (slider.children.length - slider.settings.maxSlides);
                    var lastChild = el.children('.bx-clone').eq(eq);
                    position = lastChild.position();
                // if infinite loop and "Next" is clicked on the last slide
                }else if(direction == 'next' && slider.active.index == 0){
                    // get the last clone position
                    position = el.find('> .bx-clone').eq(slider.settings.maxSlides).position();
                    slider.active.last = false;
                // normal non-zero requests
                }else if(slideIndex >= 0){
                    var requestEl = slideIndex * getMoveBy();
                    position = slider.children.eq(requestEl).position();
                }

                /* If the position doesn't exist
                 * (e.g. if you destroy the slider on a next click),
                 * it doesn't throw an error.
                 */
                if ("undefined" !== typeof(position)) {
                    var value = slider.settings.mode == 'horizontal' ? -(position.left - moveBy) : -position.top;
                    // plugin values to be animated
                    setPositionProperty(value, 'slide', slider.settings.speed);
                }
            }
        }

        /**
         * Transitions to the next slide in the show
         */
        el.goToNextSlide = function(){
            // if infiniteLoop is false and last page is showing, disregard call
            if (!slider.settings.infiniteLoop && slider.active.last) return;
            var pagerIndex = parseInt(slider.active.index) + 1;
            el.goToSlide(pagerIndex, 'next');
        }

        /**
         * Transitions to the prev slide in the show
         */
        el.goToPrevSlide = function(){
            // if infiniteLoop is false and last page is showing, disregard call
            if (!slider.settings.infiniteLoop && slider.active.index == 0) return;
            var pagerIndex = parseInt(slider.active.index) - 1;
            el.goToSlide(pagerIndex, 'prev');
        }

        /**
         * Starts the auto show
         *
         * @param preventControlUpdate (boolean)
         *  - if true, auto controls state will not be updated
         */
        el.startAuto = function(preventControlUpdate){
            // if an interval already exists, disregard call
            if(slider.interval) return;
            // create an interval
            slider.interval = setInterval(function(){
                slider.settings.autoDirection == 'next' ? el.goToNextSlide() : el.goToPrevSlide();
            }, slider.settings.pause);
            // if auto controls are displayed and preventControlUpdate is not true
            if (slider.settings.autoControls && preventControlUpdate != true) updateAutoControls('stop');
        }

        /**
         * Stops the auto show
         *
         * @param preventControlUpdate (boolean)
         *  - if true, auto controls state will not be updated
         */
        el.stopAuto = function(preventControlUpdate){
            // if no interval exists, disregard call
            if(!slider.interval) return;
            // clear the interval
            clearInterval(slider.interval);
            slider.interval = null;
            // if auto controls are displayed and preventControlUpdate is not true
            if (slider.settings.autoControls && preventControlUpdate != true) updateAutoControls('start');
        }

        /**
         * Returns current slide index (zero-based)
         */
        el.getCurrentSlide = function(){
            return slider.active.index;
        }

        /**
         * Returns number of slides in show
         */
        el.getSlideCount = function(){
            return slider.children.length;
        }

        /**
         * Update all dynamic slider elements
         */
        el.redrawSlider = function(){
            // resize all children in ratio to new screen size
            slider.children.add(el.find('.bx-clone')).outerWidth(getSlideWidth());
            // adjust the height
            slider.viewport.css('height', getViewportHeight());
            // update the slide position
            if(!slider.settings.ticker) setSlidePosition();
            // if active.last was true before the screen resize, we want
            // to keep it last no matter what screen size we end on
            if (slider.active.last) slider.active.index = getPagerQty() - 1;
            // if the active index (page) no longer exists due to the resize, simply set the index as last
            if (slider.active.index >= getPagerQty()) slider.active.last = true;
            // if a pager is being displayed and a custom pager is not being used, update it
            if(slider.settings.pager && !slider.settings.pagerCustom){
                populatePager();
                updatePagerActive(slider.active.index);
            }
        }

        /**
         * Destroy the current instance of the slider (revert everything back to original state)
         */
        el.destroySlider = function(){
            // don't do anything if slider has already been destroyed
            if(!slider.initialized) return;
            slider.initialized = false;
            $('.bx-clone', this).remove();
            slider.children.each(function() {
                $(this).data("origStyle") != undefined ? $(this).attr("style", $(this).data("origStyle")) : $(this).removeAttr('style');
            });
            $(this).data("origStyle") != undefined ? this.attr("style", $(this).data("origStyle")) : $(this).removeAttr('style');
            $(this).unwrap().unwrap();
            if(slider.controls.el) slider.controls.el.remove();
            if(slider.controls.next) slider.controls.next.remove();
            if(slider.controls.prev) slider.controls.prev.remove();
            if(slider.pagerEl) slider.pagerEl.remove();
            $('.bx-caption', this).remove();
            if(slider.controls.autoEl) slider.controls.autoEl.remove();
            clearInterval(slider.interval);
            if(slider.settings.responsive) $(window).unbind('resize', resizeWindow);
        }

        /**
         * Reload the slider (revert all DOM changes, and re-initialize)
         */
        el.reloadSlider = function(settings){
            if (settings != undefined) options = settings;
            el.destroySlider();
            init();
        }

        init();

        // returns the current jQuery object
        return this;
    }

})(jQuery);
/*!
    Colorbox v1.4.31 - 2013-09-25
    jQuery lightbox and modal window plugin
    (c) 2013 Jack Moore - http://www.jacklmoore.com/colorbox
    license: http://www.opensource.org/licenses/mit-license.php
*/
(function ($, document, window) {
    var
    // Default settings object.
    // See http://jacklmoore.com/colorbox for details.
    defaults = {
        // data sources
        html: false,
        photo: false,
        iframe: false,
        inline: false,

        // behavior and appearance
        transition: "elastic",
        speed: 300,
        fadeOut: 300,
        width: false,
        initialWidth: "600",
        innerWidth: false,
        maxWidth: false,
        height: false,
        initialHeight: "450",
        innerHeight: false,
        maxHeight: false,
        scalePhotos: true,
        scrolling: true,
        href: false,
        title: false,
        rel: false,
        opacity: 0.9,
        preloading: true,
        className: false,
        overlayClose: true,
        escKey: true,
        arrowKey: true,
        top: false,
        bottom: false,
        left: false,
        right: false,
        fixed: false,
        data: undefined,
        closeButton: true,
        fastIframe: true,
        open: false,
        reposition: true,
        loop: true,
        slideshow: false,
        slideshowAuto: true,
        slideshowSpeed: 2500,
        slideshowStart: "start slideshow",
        slideshowStop: "stop slideshow",
        photoRegex: /\.(gif|png|jp(e|g|eg)|bmp|ico|webp)((#|\?).*)?$/i,

        // alternate image paths for high-res displays
        retinaImage: false,
        retinaUrl: false,
        retinaSuffix: '@2x.$1',

        // internationalization
        current: "image {current} of {total}",
        previous: "previous",
        next: "next",
        close: "close",
        xhrError: "This content failed to load.",
        imgError: "This image failed to load.",

        // accessbility
        returnFocus: true,
        trapFocus: true,

        // callbacks
        onOpen: false,
        onLoad: false,
        onComplete: false,
        onCleanup: false,
        onClosed: false
    },
    
    // Abstracting the HTML and event identifiers for easy rebranding
    colorbox = 'colorbox',
    prefix = 'cbox',
    boxElement = prefix + 'Element',
    
    // Events
    event_open = prefix + '_open',
    event_load = prefix + '_load',
    event_complete = prefix + '_complete',
    event_cleanup = prefix + '_cleanup',
    event_closed = prefix + '_closed',
    event_purge = prefix + '_purge',

    // Cached jQuery Object Variables
    $overlay,
    $box,
    $wrap,
    $content,
    $topBorder,
    $leftBorder,
    $rightBorder,
    $bottomBorder,
    $related,
    $window,
    $loaded,
    $loadingBay,
    $loadingOverlay,
    $title,
    $current,
    $slideshow,
    $next,
    $prev,
    $close,
    $groupControls,
    $events = $('<a/>'),
    
    // Variables for cached values or use across multiple functions
    settings,
    interfaceHeight,
    interfaceWidth,
    loadedHeight,
    loadedWidth,
    element,
    index,
    photo,
    open,
    active,
    closing,
    loadingTimer,
    publicMethod,
    div = "div",
    className,
    requests = 0,
    previousCSS = {},
    init;

    // ****************
    // HELPER FUNCTIONS
    // ****************
    
    // Convenience function for creating new jQuery objects
    function $tag(tag, id, css) {
        var element = document.createElement(tag);

        if (id) {
            element.id = prefix + id;
        }

        if (css) {
            element.style.cssText = css;
        }

        return $(element);
    }
    
    // Get the window height using innerHeight when available to avoid an issue with iOS
    // http://bugs.jquery.com/ticket/6724
    function winheight() {
        return window.innerHeight ? window.innerHeight : $(window).height();
    }

    // Determine the next and previous members in a group.
    function getIndex(increment) {
        var
        max = $related.length,
        newIndex = (index + increment) % max;
        
        return (newIndex < 0) ? max + newIndex : newIndex;
    }

    // Convert '%' and 'px' values to integers
    function setSize(size, dimension) {
        return Math.round((/%/.test(size) ? ((dimension === 'x' ? $window.width() : winheight()) / 100) : 1) * parseInt(size, 10));
    }
    
    // Checks an href to see if it is a photo.
    // There is a force photo option (photo: true) for hrefs that cannot be matched by the regex.
    function isImage(settings, url) {
        return settings.photo || settings.photoRegex.test(url);
    }

    function retinaUrl(settings, url) {
        return settings.retinaUrl && window.devicePixelRatio > 1 ? url.replace(settings.photoRegex, settings.retinaSuffix) : url;
    }

    function trapFocus(e) {
        if ('contains' in $box[0] && !$box[0].contains(e.target)) {
            e.stopPropagation();
            $box.focus();
        }
    }

    // Assigns function results to their respective properties
    function makeSettings() {
        var i,
            data = $.data(element, colorbox);
        
        if (data == null) {
            settings = $.extend({}, defaults);
            if (console && console.log) {
                console.log('Error: cboxElement missing settings object');
            }
        } else {
            settings = $.extend({}, data);
        }
        
        for (i in settings) {
            if ($.isFunction(settings[i]) && i.slice(0, 2) !== 'on') { // checks to make sure the function isn't one of the callbacks, they will be handled at the appropriate time.
                settings[i] = settings[i].call(element);
            }
        }
        
        settings.rel = settings.rel || element.rel || $(element).data('rel') || 'nofollow';
        settings.href = settings.href || $(element).attr('href');
        settings.title = settings.title || element.title;
        
        if (typeof settings.href === "string") {
            settings.href = $.trim(settings.href);
        }
    }

    function trigger(event, callback) {
        // for external use
        $(document).trigger(event);

        // for internal use
        $events.trigger(event);

        if ($.isFunction(callback)) {
            callback.call(element);
        }
    }


    var slideshow = (function(){
        var active,
            className = prefix + "Slideshow_",
            click = "click." + prefix,
            timeOut;

        function clear () {
            clearTimeout(timeOut);
        }

        function set() {
            if (settings.loop || $related[index + 1]) {
                clear();
                timeOut = setTimeout(publicMethod.next, settings.slideshowSpeed);
            }
        }

        function start() {
            $slideshow
                .html(settings.slideshowStop)
                .unbind(click)
                .one(click, stop);

            $events
                .bind(event_complete, set)
                .bind(event_load, clear);

            $box.removeClass(className + "off").addClass(className + "on");
        }

        function stop() {
            clear();
            
            $events
                .unbind(event_complete, set)
                .unbind(event_load, clear);

            $slideshow
                .html(settings.slideshowStart)
                .unbind(click)
                .one(click, function () {
                    publicMethod.next();
                    start();
                });

            $box.removeClass(className + "on").addClass(className + "off");
        }

        function reset() {
            active = false;
            $slideshow.hide();
            clear();
            $events
                .unbind(event_complete, set)
                .unbind(event_load, clear);
            $box.removeClass(className + "off " + className + "on");
        }

        return function(){
            if (active) {
                if (!settings.slideshow) {
                    $events.unbind(event_cleanup, reset);
                    reset();
                }
            } else {
                if (settings.slideshow && $related[1]) {
                    active = true;
                    $events.one(event_cleanup, reset);
                    if (settings.slideshowAuto) {
                        start();
                    } else {
                        stop();
                    }
                    $slideshow.show();
                }
            }
        };

    }());


    function launch(target) {
        if (!closing) {
            
            element = target;
            
            makeSettings();
            
            $related = $(element);
            
            index = 0;
            
            if (settings.rel !== 'nofollow') {
                $related = $('.' + boxElement).filter(function () {
                    var data = $.data(this, colorbox),
                        relRelated;

                    if (data) {
                        relRelated =  $(this).data('rel') || data.rel || this.rel;
                    }
                    
                    return (relRelated === settings.rel);
                });
                index = $related.index(element);
                
                // Check direct calls to Colorbox.
                if (index === -1) {
                    $related = $related.add(element);
                    index = $related.length - 1;
                }
            }
            
            $overlay.css({
                opacity: parseFloat(settings.opacity),
                cursor: settings.overlayClose ? "pointer" : "auto",
                visibility: 'visible'
            }).show();
            

            if (className) {
                $box.add($overlay).removeClass(className);
            }
            if (settings.className) {
                $box.add($overlay).addClass(settings.className);
            }
            className = settings.className;

            if (settings.closeButton) {
                $close.html(settings.close).appendTo($content);
            } else {
                $close.appendTo('<div/>');
            }

            if (!open) {
                open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.
                
                // Show colorbox so the sizes can be calculated in older versions of jQuery
                $box.css({visibility:'hidden', display:'block'});
                
                $loaded = $tag(div, 'LoadedContent', 'width:0; height:0; overflow:hidden');
                $content.css({width:'', height:''}).append($loaded);

                // Cache values needed for size calculations
                interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(true) - $content.height();
                interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(true) - $content.width();
                loadedHeight = $loaded.outerHeight(true);
                loadedWidth = $loaded.outerWidth(true);

                // Opens inital empty Colorbox prior to content being loaded.
                settings.w = setSize(settings.initialWidth, 'x');
                settings.h = setSize(settings.initialHeight, 'y');
                $loaded.css({width:'', height:settings.h});
                publicMethod.position();

                trigger(event_open, settings.onOpen);
                
                $groupControls.add($title).hide();

                $box.focus();
                
                if (settings.trapFocus) {
                    // Confine focus to the modal
                    // Uses event capturing that is not supported in IE8-
                    if (document.addEventListener) {

                        document.addEventListener('focus', trapFocus, true);
                        
                        $events.one(event_closed, function () {
                            document.removeEventListener('focus', trapFocus, true);
                        });
                    }
                }

                // Return focus on closing
                if (settings.returnFocus) {
                    $events.one(event_closed, function () {
                        $(element).focus();
                    });
                }
            }
            load();
        }
    }

    // Colorbox's markup needs to be added to the DOM prior to being called
    // so that the browser will go ahead and load the CSS background images.
    function appendHTML() {
        if (!$box && document.body) {
            init = false;
            $window = $(window);
            $box = $tag(div).attr({
                id: colorbox,
                'class': $.support.opacity === false ? prefix + 'IE' : '', // class for optional IE8 & lower targeted CSS.
                role: 'dialog',
                tabindex: '-1'
            }).hide();
            $overlay = $tag(div, "Overlay").hide();
            $loadingOverlay = $([$tag(div, "LoadingOverlay")[0],$tag(div, "LoadingGraphic")[0]]);
            $wrap = $tag(div, "Wrapper");
            $content = $tag(div, "Content").append(
                $title = $tag(div, "Title"),
                $current = $tag(div, "Current"),
                $prev = $('<button type="button"/>').attr({id:prefix+'Previous'}),
                $next = $('<button type="button"/>').attr({id:prefix+'Next'}),
                $slideshow = $tag('button', "Slideshow"),
                $loadingOverlay
            );

            $close = $('<button type="button"/>').attr({id:prefix+'Close'});
            
            $wrap.append( // The 3x3 Grid that makes up Colorbox
                $tag(div).append(
                    $tag(div, "TopLeft"),
                    $topBorder = $tag(div, "TopCenter"),
                    $tag(div, "TopRight")
                ),
                $tag(div, false, 'clear:left').append(
                    $leftBorder = $tag(div, "MiddleLeft"),
                    $content,
                    $rightBorder = $tag(div, "MiddleRight")
                ),
                $tag(div, false, 'clear:left').append(
                    $tag(div, "BottomLeft"),
                    $bottomBorder = $tag(div, "BottomCenter"),
                    $tag(div, "BottomRight")
                )
            ).find('div div').css({'float': 'left'});
            
            $loadingBay = $tag(div, false, 'position:absolute; width:9999px; visibility:hidden; display:none');
            
            $groupControls = $next.add($prev).add($current).add($slideshow);

            $(document.body).append($overlay, $box.append($wrap, $loadingBay));
        }
    }

    // Add Colorbox's event bindings
    function addBindings() {
        function clickHandler(e) {
            // ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
            // See: http://jacklmoore.com/notes/click-events/
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                launch(this);
            }
        }

        if ($box) {
            if (!init) {
                init = true;

                // Anonymous functions here keep the public method from being cached, thereby allowing them to be redefined on the fly.
                $next.click(function () {
                    publicMethod.next();
                });
                $prev.click(function () {
                    publicMethod.prev();
                });
                $close.click(function () {
                    publicMethod.close();
                });
                $overlay.click(function () {
                    if (settings.overlayClose) {
                        publicMethod.close();
                    }
                });
                
                // Key Bindings
                $(document).bind('keydown.' + prefix, function (e) {
                    var key = e.keyCode;
                    if (open && settings.escKey && key === 27) {
                        e.preventDefault();
                        publicMethod.close();
                    }
                    if (open && settings.arrowKey && $related[1] && !e.altKey) {
                        if (key === 37) {
                            e.preventDefault();
                            $prev.click();
                        } else if (key === 39) {
                            e.preventDefault();
                            $next.click();
                        }
                    }
                });

                if ($.isFunction($.fn.on)) {
                    // For jQuery 1.7+
                    $(document).on('click.'+prefix, '.'+boxElement, clickHandler);
                } else {
                    // For jQuery 1.3.x -> 1.6.x
                    // This code is never reached in jQuery 1.9, so do not contact me about 'live' being removed.
                    // This is not here for jQuery 1.9, it's here for legacy users.
                    $('.'+boxElement).live('click.'+prefix, clickHandler);
                }
            }
            return true;
        }
        return false;
    }

    // Don't do anything if Colorbox already exists.
    if ($.colorbox) {
        return;
    }

    // Append the HTML when the DOM loads
    $(appendHTML);


    // ****************
    // PUBLIC FUNCTIONS
    // Usage format: $.colorbox.close();
    // Usage from within an iframe: parent.jQuery.colorbox.close();
    // ****************
    
    publicMethod = $.fn[colorbox] = $[colorbox] = function (options, callback) {
        var $this = this;
        
        options = options || {};
        
        appendHTML();

        if (addBindings()) {
            if ($.isFunction($this)) { // assume a call to $.colorbox
                $this = $('<a/>');
                options.open = true;
            } else if (!$this[0]) { // colorbox being applied to empty collection
                return $this;
            }
            
            if (callback) {
                options.onComplete = callback;
            }
            
            $this.each(function () {
                $.data(this, colorbox, $.extend({}, $.data(this, colorbox) || defaults, options));
            }).addClass(boxElement);
            
            if (($.isFunction(options.open) && options.open.call($this)) || options.open) {
                launch($this[0]);
            }
        }
        
        return $this;
    };

    publicMethod.position = function (speed, loadedCallback) {
        var
        css,
        top = 0,
        left = 0,
        offset = $box.offset(),
        scrollTop,
        scrollLeft;
        
        $window.unbind('resize.' + prefix);

        // remove the modal so that it doesn't influence the document width/height
        $box.css({top: -9e4, left: -9e4});

        scrollTop = $window.scrollTop();
        scrollLeft = $window.scrollLeft();

        if (settings.fixed) {
            offset.top -= scrollTop;
            offset.left -= scrollLeft;
            $box.css({position: 'fixed'});
        } else {
            top = scrollTop;
            left = scrollLeft;
            $box.css({position: 'absolute'});
        }

        // keeps the top and left positions within the browser's viewport.
        if (settings.right !== false) {
            left += Math.max($window.width() - settings.w - loadedWidth - interfaceWidth - setSize(settings.right, 'x'), 0);
        } else if (settings.left !== false) {
            left += setSize(settings.left, 'x');
        } else {
            left += Math.round(Math.max($window.width() - settings.w - loadedWidth - interfaceWidth, 0) / 2);
        }
        
        if (settings.bottom !== false) {
            top += Math.max(winheight() - settings.h - loadedHeight - interfaceHeight - setSize(settings.bottom, 'y'), 0);
        } else if (settings.top !== false) {
            top += setSize(settings.top, 'y');
        } else {
            top += Math.round(Math.max(winheight() - settings.h - loadedHeight - interfaceHeight, 0) / 2);
        }

        $box.css({top: offset.top, left: offset.left, visibility:'visible'});
        
        // this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
        // but it has to be shrank down around the size of div#colorbox when it's done.  If not,
        // it can invoke an obscure IE bug when using iframes.
        $wrap[0].style.width = $wrap[0].style.height = "9999px";
        
        function modalDimensions() {
            $topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = (parseInt($box[0].style.width,10) - interfaceWidth)+'px';
            $content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = (parseInt($box[0].style.height,10) - interfaceHeight)+'px';
        }

        css = {width: settings.w + loadedWidth + interfaceWidth, height: settings.h + loadedHeight + interfaceHeight, top: top, left: left};

        // setting the speed to 0 if the content hasn't changed size or position
        if (speed) {
            var tempSpeed = 0;
            $.each(css, function(i){
                if (css[i] !== previousCSS[i]) {
                    tempSpeed = speed;
                    return;
                }
            });
            speed = tempSpeed;
        }

        previousCSS = css;

        if (!speed) {
            $box.css(css);
        }

        $box.dequeue().animate(css, {
            duration: speed || 0,
            complete: function () {
                modalDimensions();
                
                active = false;
                
                // shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
                $wrap[0].style.width = (settings.w + loadedWidth + interfaceWidth) + "px";
                $wrap[0].style.height = (settings.h + loadedHeight + interfaceHeight) + "px";
                
                if (settings.reposition) {
                    setTimeout(function () {  // small delay before binding onresize due to an IE8 bug.
                        $window.bind('resize.' + prefix, publicMethod.position);
                    }, 1);
                }

                if (loadedCallback) {
                    loadedCallback();
                }
            },
            step: modalDimensions
        });
    };

    publicMethod.resize = function (options) {
        var scrolltop;
        
        if (open) {
            options = options || {};
            
            if (options.width) {
                settings.w = setSize(options.width, 'x') - loadedWidth - interfaceWidth;
            }

            if (options.innerWidth) {
                settings.w = setSize(options.innerWidth, 'x');
            }

            $loaded.css({width: settings.w});
            
            if (options.height) {
                settings.h = setSize(options.height, 'y') - loadedHeight - interfaceHeight;
            }

            if (options.innerHeight) {
                settings.h = setSize(options.innerHeight, 'y');
            }

            if (!options.innerHeight && !options.height) {
                scrolltop = $loaded.scrollTop();
                $loaded.css({height: "auto"});
                settings.h = $loaded.height();
            }

            $loaded.css({height: settings.h});

            if(scrolltop) {
                $loaded.scrollTop(scrolltop);
            }
            
            publicMethod.position(settings.transition === "none" ? 0 : settings.speed);
        }
    };

    publicMethod.prep = function (object) {
        if (!open) {
            return;
        }
        
        var callback, speed = settings.transition === "none" ? 0 : settings.speed;

        $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.

        $loaded = $tag(div, 'LoadedContent').append(object);
        
        function getWidth() {
            settings.w = settings.w || $loaded.width();
            settings.w = settings.mw && settings.mw < settings.w ? settings.mw : settings.w;
            return settings.w;
        }
        function getHeight() {
            settings.h = settings.h || $loaded.height();
            settings.h = settings.mh && settings.mh < settings.h ? settings.mh : settings.h;
            return settings.h;
        }
        
        $loaded.hide()
        .appendTo($loadingBay.show())// content has to be appended to the DOM for accurate size calculations.
        .css({width: getWidth(), overflow: settings.scrolling ? 'auto' : 'hidden'})
        .css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
        .prependTo($content);
        
        $loadingBay.hide();
        
        // floating the IMG removes the bottom line-height and fixed a problem where IE miscalculates the width of the parent element as 100% of the document width.
        
        $(photo).css({'float': 'none'});

        callback = function () {
            var total = $related.length,
                iframe,
                frameBorder = 'frameBorder',
                allowTransparency = 'allowTransparency',
                complete;
            
            if (!open) {
                return;
            }
            
            function removeFilter() { // Needed for IE7 & IE8 in versions of jQuery prior to 1.7.2
                if ($.support.opacity === false) {
                    $box[0].style.removeAttribute('filter');
                }
            }
            
            complete = function () {
                clearTimeout(loadingTimer);
                $loadingOverlay.hide();
                trigger(event_complete, settings.onComplete);
            };

            
            $title.html(settings.title).add($loaded).show();
            
            if (total > 1) { // handle grouping
                if (typeof settings.current === "string") {
                    $current.html(settings.current.replace('{current}', index + 1).replace('{total}', total)).show();
                }
                
                $next[(settings.loop || index < total - 1) ? "show" : "hide"]().html(settings.next);
                $prev[(settings.loop || index) ? "show" : "hide"]().html(settings.previous);
                
                slideshow();
                
                // Preloads images within a rel group
                if (settings.preloading) {
                    $.each([getIndex(-1), getIndex(1)], function(){
                        var src,
                            img,
                            i = $related[this],
                            data = $.data(i, colorbox);

                        if (data && data.href) {
                            src = data.href;
                            if ($.isFunction(src)) {
                                src = src.call(i);
                            }
                        } else {
                            src = $(i).attr('href');
                        }

                        if (src && isImage(data, src)) {
                            src = retinaUrl(data, src);
                            img = document.createElement('img');
                            img.src = src;
                        }
                    });
                }
            } else {
                $groupControls.hide();
            }
            
            if (settings.iframe) {
                iframe = $tag('iframe')[0];
                
                if (frameBorder in iframe) {
                    iframe[frameBorder] = 0;
                }
                
                if (allowTransparency in iframe) {
                    iframe[allowTransparency] = "true";
                }

                if (!settings.scrolling) {
                    iframe.scrolling = "no";
                }
                
                $(iframe)
                    .attr({
                        src: settings.href,
                        name: (new Date()).getTime(), // give the iframe a unique name to prevent caching
                        'class': prefix + 'Iframe',
                        allowFullScreen : true, // allow HTML5 video to go fullscreen
                        webkitAllowFullScreen : true,
                        mozallowfullscreen : true
                    })
                    .one('load', complete)
                    .appendTo($loaded);
                
                $events.one(event_purge, function () {
                    iframe.src = "//about:blank";
                });

                if (settings.fastIframe) {
                    $(iframe).trigger('load');
                }
            } else {
                complete();
            }
            
            if (settings.transition === 'fade') {
                $box.fadeTo(speed, 1, removeFilter);
            } else {
                removeFilter();
            }
        };
        
        if (settings.transition === 'fade') {
            $box.fadeTo(speed, 0, function () {
                publicMethod.position(0, callback);
            });
        } else {
            publicMethod.position(speed, callback);
        }
    };

    function load () {
        var href, setResize, prep = publicMethod.prep, $inline, request = ++requests;
        
        active = true;
        
        photo = false;
        
        element = $related[index];
        
        makeSettings();
        
        trigger(event_purge);
        
        trigger(event_load, settings.onLoad);
        
        settings.h = settings.height ?
                setSize(settings.height, 'y') - loadedHeight - interfaceHeight :
                settings.innerHeight && setSize(settings.innerHeight, 'y');
        
        settings.w = settings.width ?
                setSize(settings.width, 'x') - loadedWidth - interfaceWidth :
                settings.innerWidth && setSize(settings.innerWidth, 'x');
        
        // Sets the minimum dimensions for use in image scaling
        settings.mw = settings.w;
        settings.mh = settings.h;
        
        // Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
        // If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
        if (settings.maxWidth) {
            settings.mw = setSize(settings.maxWidth, 'x') - loadedWidth - interfaceWidth;
            settings.mw = settings.w && settings.w < settings.mw ? settings.w : settings.mw;
        }
        if (settings.maxHeight) {
            settings.mh = setSize(settings.maxHeight, 'y') - loadedHeight - interfaceHeight;
            settings.mh = settings.h && settings.h < settings.mh ? settings.h : settings.mh;
        }
        
        href = settings.href;
        
        loadingTimer = setTimeout(function () {
            $loadingOverlay.show();
        }, 100);
        
        if (settings.inline) {
            // Inserts an empty placeholder where inline content is being pulled from.
            // An event is bound to put inline content back when Colorbox closes or loads new content.
            $inline = $tag(div).hide().insertBefore($(href)[0]);

            $events.one(event_purge, function () {
                $inline.replaceWith($loaded.children());
            });

            prep($(href));
        } else if (settings.iframe) {
            // IFrame element won't be added to the DOM until it is ready to be displayed,
            // to avoid problems with DOM-ready JS that might be trying to run in that iframe.
            prep(" ");
        } else if (settings.html) {
            prep(settings.html);
        } else if (isImage(settings, href)) {

            href = retinaUrl(settings, href);

            photo = document.createElement('img');

            $(photo)
            .addClass(prefix + 'Photo')
            .bind('error',function () {
                settings.title = false;
                prep($tag(div, 'Error').html(settings.imgError));
            })
            .one('load', function () {
                var percent;

                if (request !== requests) {
                    return;
                }

                $.each(['alt', 'longdesc', 'aria-describedby'], function(i,val){
                    var attr = $(element).attr(val) || $(element).attr('data-'+val);
                    if (attr) {
                        photo.setAttribute(val, attr);
                    }
                });

                if (settings.retinaImage && window.devicePixelRatio > 1) {
                    photo.height = photo.height / window.devicePixelRatio;
                    photo.width = photo.width / window.devicePixelRatio;
                }

                if (settings.scalePhotos) {
                    setResize = function () {
                        photo.height -= photo.height * percent;
                        photo.width -= photo.width * percent;
                    };
                    if (settings.mw && photo.width > settings.mw) {
                        percent = (photo.width - settings.mw) / photo.width;
                        setResize();
                    }
                    if (settings.mh && photo.height > settings.mh) {
                        percent = (photo.height - settings.mh) / photo.height;
                        setResize();
                    }
                }
                
                if (settings.h) {
                    photo.style.marginTop = Math.max(settings.mh - photo.height, 0) / 2 + 'px';
                }
                
                if ($related[1] && (settings.loop || $related[index + 1])) {
                    photo.style.cursor = 'pointer';
                    photo.onclick = function () {
                        publicMethod.next();
                    };
                }

                photo.style.width = photo.width + 'px';
                photo.style.height = photo.height + 'px';

                setTimeout(function () { // A pause because Chrome will sometimes report a 0 by 0 size otherwise.
                    prep(photo);
                }, 1);
            });
            
            setTimeout(function () { // A pause because Opera 10.6+ will sometimes not run the onload function otherwise.
                photo.src = href;
            }, 1);
        } else if (href) {
            $loadingBay.load(href, settings.data, function (data, status) {
                if (request === requests) {
                    prep(status === 'error' ? $tag(div, 'Error').html(settings.xhrError) : $(this).contents());
                }
            });
        }
    }
        
    // Navigates to the next page/image in a set.
    publicMethod.next = function () {
        if (!active && $related[1] && (settings.loop || $related[index + 1])) {
            index = getIndex(1);
            launch($related[index]);
        }
    };
    
    publicMethod.prev = function () {
        if (!active && $related[1] && (settings.loop || index)) {
            index = getIndex(-1);
            launch($related[index]);
        }
    };

    // Note: to use this within an iframe use the following format: parent.jQuery.colorbox.close();
    publicMethod.close = function () {
        if (open && !closing) {
            
            closing = true;
            
            open = false;
            
            trigger(event_cleanup, settings.onCleanup);
            
            $window.unbind('.' + prefix);
            
            $overlay.fadeTo(settings.fadeOut || 0, 0);
            
            $box.stop().fadeTo(settings.fadeOut || 0, 0, function () {
            
                $box.add($overlay).css({'opacity': 1, cursor: 'auto'}).hide();
                
                trigger(event_purge);
                
                $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.
                
                setTimeout(function () {
                    closing = false;
                    trigger(event_closed, settings.onClosed);
                }, 1);
            });
        }
    };

    // Removes changes Colorbox made to the document, but does not remove the plugin.
    publicMethod.remove = function () {
        if (!$box) { return; }

        $box.stop();
        $.colorbox.close();
        $box.stop().remove();
        $overlay.remove();
        closing = false;
        $box = null;
        $('.' + boxElement)
            .removeData(colorbox)
            .removeClass(boxElement);

        $(document).unbind('click.'+prefix);
    };

    // A method for fetching the current element Colorbox is referencing.
    // returns a jQuery object.
    publicMethod.element = function () {
        return $(element);
    };

    publicMethod.settings = defaults;

}(jQuery, document, window));

/*! http://mths.be/placeholder v2.0.7 by @mathias */
;(function(window, document, $) {

    var isInputSupported = 'placeholder' in document.createElement('input');
    var isTextareaSupported = 'placeholder' in document.createElement('textarea');
    var prototype = $.fn;
    var valHooks = $.valHooks;
    var propHooks = $.propHooks;
    var hooks;
    var placeholder;

    if (isInputSupported && isTextareaSupported) {

        placeholder = prototype.placeholder = function() {
            return this;
        };

        placeholder.input = placeholder.textarea = true;

    } else {

        placeholder = prototype.placeholder = function() {
            var $this = this;
            $this
                .filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
                .not('.placeholder')
                .bind({
                    'focus.placeholder': clearPlaceholder,
                    'blur.placeholder': setPlaceholder
                })
                .data('placeholder-enabled', true)
                .trigger('blur.placeholder');
            return $this;
        };

        placeholder.input = isInputSupported;
        placeholder.textarea = isTextareaSupported;

        hooks = {
            'get': function(element) {
                var $element = $(element);

                var $passwordInput = $element.data('placeholder-password');
                if ($passwordInput) {
                    return $passwordInput[0].value;
                }

                return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
            },
            'set': function(element, value) {
                var $element = $(element);

                var $passwordInput = $element.data('placeholder-password');
                if ($passwordInput) {
                    return $passwordInput[0].value = value;
                }

                if (!$element.data('placeholder-enabled')) {
                    return element.value = value;
                }
                if (value == '') {
                    element.value = value;
                    // Issue #56: Setting the placeholder causes problems if the element continues to have focus.
                    if (element != document.activeElement) {
                        // We can't use `triggerHandler` here because of dummy text/password inputs :(
                        setPlaceholder.call(element);
                    }
                } else if ($element.hasClass('placeholder')) {
                    clearPlaceholder.call(element, true, value) || (element.value = value);
                } else {
                    element.value = value;
                }
                // `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
                return $element;
            }
        };

        if (!isInputSupported) {
            valHooks.input = hooks;
            propHooks.value = hooks;
        }
        if (!isTextareaSupported) {
            valHooks.textarea = hooks;
            propHooks.value = hooks;
        }

        $(function() {
            // Look for forms
            $(document).delegate('form', 'submit.placeholder', function() {
                // Clear the placeholder values so they don't get submitted
                var $inputs = $('.placeholder', this).each(clearPlaceholder);
                setTimeout(function() {
                    $inputs.each(setPlaceholder);
                }, 10);
            });
        });

        // Clear placeholder values upon page reload
        $(window).bind('beforeunload.placeholder', function() {
            $('.placeholder').each(function() {
                this.value = '';
            });
        });

    }

    function args(elem) {
        // Return an object of element attributes
        var newAttrs = {};
        var rinlinejQuery = /^jQuery\d+$/;
        $.each(elem.attributes, function(i, attr) {
            if (attr.specified && !rinlinejQuery.test(attr.name)) {
                newAttrs[attr.name] = attr.value;
            }
        });
        return newAttrs;
    }

    function clearPlaceholder(event, value) {
        var input = this;
        var $input = $(input);
        if (input.value == $input.attr('placeholder') && $input.hasClass('placeholder')) {
            if ($input.data('placeholder-password')) {
                $input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
                // If `clearPlaceholder` was called from `$.valHooks.input.set`
                if (event === true) {
                    return $input[0].value = value;
                }
                $input.focus();
            } else {
                input.value = '';
                $input.removeClass('placeholder');
                input == document.activeElement && input.select();
            }
        }
    }

    function setPlaceholder() {
        var $replacement;
        var input = this;
        var $input = $(input);
        var id = this.id;
        if (input.value == '') {
            if (input.type == 'password') {
                if (!$input.data('placeholder-textinput')) {
                    try {
                        $replacement = $input.clone().attr({ 'type': 'text' });
                    } catch(e) {
                        $replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
                    }
                    $replacement
                        .removeAttr('name')
                        .data({
                            'placeholder-password': $input,
                            'placeholder-id': id
                        })
                        .bind('focus.placeholder', clearPlaceholder);
                    $input
                        .data({
                            'placeholder-textinput': $replacement,
                            'placeholder-id': id
                        })
                        .before($replacement);
                }
                $input = $input.removeAttr('id').hide().prev().attr('id', id).show();
                // Note: `$input[0] != input` now!
            }
            $input.addClass('placeholder');
            $input[0].value = $input.attr('placeholder');
        } else {
            $input.removeClass('placeholder');
        }
    }

}(this, document, jQuery));

var ASTD = ASTD || {};

ASTD = {
    initialize: function () {
        'use strict';

        ASTD.expanders.initialize();
        ASTD.form.initialize();
        ASTD.modals.initialize();
        ASTD.sliders.initialize();
    }
};

;(function ($) {
    $(function () {
        ASTD.initialize();
    });
}) (jQuery);
ASTD.expanders = (function ($) {
   'use strict';

    var self = {};

    self.expand = function () {

        $('.og-grid > li > a').on('click', function (e) {
            e.preventDefault();

            // Clear all expanders
            $('.og-grid > li').removeClass('active');
            
            $(this).closest('li').addClass('active');
        });
    };

    self.collapse = function () {
        $('.og-expander .close-expander').on('click', function (e) {
            e.preventDefault();
            $(this).closest('.og-expander').closest('li').removeClass('active');
        });
    };

    self.initialize = function () {
        self.expand();
        self.collapse();
    };

    return self;

})(jQuery);
ASTD.form = (function ($) {
   'use strict';

    var self = {};

    self.placeholder = function () {
        $('.input-text').placeholder();
    };

    self.initialize = function () {
        self.placeholder();
    };

    return self;

})(jQuery);
ASTD.modals = (function ($) {
   'use strict';

    var self = {},
        carousel;

    self.modals = function () {

        $('.modal-link').colorbox({
            inline: true,
            close: '<span class="icon icon-x-black"></span>'
        }); 
    };

    self.benefitsModal = function () {

        $('a.benefits-modal-link').on('click', function() {
            var $this = $(this),
                rowNum = $this.closest('tr').index();

            $this.colorbox({
                innerHeight: 228,
                inline: true,
                close: '<span class="icon icon-x-black"></span>',
                onComplete: function () {
                    $('.carousel').bxSlider({
                        infiniteLoop: false,
                        hideControlOnEnd: true,
                        nextText: '<span class="icon icon-arrow-right"></span>',
                        prevText: '<span class="icon icon-arrow-left"></span>',
                        pager: false,
                        startSlide: rowNum
                    });
                },
                onClosed: function () {
                    $('.carousel').bxSlider().destroySlider();
                }
            });
        });

    };

    self.chatModal = function () {
        var modal = $('#modal-chat');

        if (modal.length > 0 && modal.hasClass('hidden')) {
            window.setInterval( function () {
                modal.removeClass('hidden');
            }, 30000);
        }

        self.closeModal();
    };

    self.closeModal = function () {
        $('a.modal-close').on('click', function(e) {
            e.preventDefault();
            $(this).closest('.modal').addClass('hidden');
        });
    };

    self.initialize = function () {
        self.modals();
        self.benefitsModal();
        self.chatModal();
    };

    return self;

})(jQuery);
ASTD.sliders = (function ($) {
   'use strict';

    var self = {};

    self.testimonials = function () {

        $('.slider').bxSlider({
            infiniteLoop: false,
            hideControlOnEnd: true,
            nextText: '<span class="icon icon-arrow-right"></span>',
            prevText: '<span class="icon icon-arrow-left"></span>',
            pager: false
        });
    };

    self.initialize = function () {
        self.testimonials();
    };

    return self;

})(jQuery);