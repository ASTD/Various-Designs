(function($){
    $(function(){

        $('a.logo').on('click', function(e){
            e.preventDefault();
            $('#scrollUp').trigger('click');
        });

    });
})(jQuery);