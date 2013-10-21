ASTD.form = (function ($) {
   'use strict';

    var self = {};

    self.placeholder = function () {
        $('.input-text').placeholder();
    };

    // REMOVE CODE BELOW WHEN INTEGRATING
    self.openRenewModal = function () {
        $('form').submit( function(e) {
            e.preventDefault();
            
            $.colorbox({
                href: '#modal-renew',
                inline: true,
                close: '<span class="icon icon-x-black"></span>',
                onComplete: function () {
                    $('.modal-slider').bxSlider({
                        infiniteLoop: false,
                        hideControlOnEnd: true,
                        nextText: '<span class="icon icon-arrow-right"></span>',
                        prevText: '<span class="icon icon-arrow-left"></span>',
                        pager: false
                    });
                }
            });
        });
    };

    self.initialize = function () {
        self.placeholder();

        // REMOVE CODE BELOW WHEN INTEGRATING
        self.openRenewModal();
    };

    return self;

})(jQuery);