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