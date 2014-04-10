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