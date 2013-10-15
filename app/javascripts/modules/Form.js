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