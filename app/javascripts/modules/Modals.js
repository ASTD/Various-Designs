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