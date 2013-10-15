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