$(function(){

    //checkboxes
    $(':checkbox').radiocheck();

    //tabs
    $(".nav-tabs a").on('click', function (e) {
        e.preventDefault();
        $(this).tab("show");
    });

    $('.portfolio a.over').each(function(){

        overlay = $('<span class="overlay"><span class="fui-eye"></span></span>');

        $(this).append( overlay );
    });

});