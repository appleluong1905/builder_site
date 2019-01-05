(function () {
	"use strict";

	require('./modules/ui');
	require('./modules/users');
	require('./modules/account');
	require('./modules/sitesettings');
	require('./modules/sites');

	$('.userSites .site iframe').each(function(){
    	    	
        var theHeight = $(this).attr('data-height')*0.25;
    		
        //alert($(this).closest('.tab-content').innerWidth())
    		    	    	
        $(this).zoomer({
            zoom: 0.20,
            height: theHeight,
            width: $(this).closest('.tab-content').width(),
            message: "",
            messageURL: "<?php echo site_url('sites')?>/"+$(this).attr('data-siteid')
        });
    		
        $(this).closest('.site').find('.zoomer-cover > a').attr('target', '');
    	
    })

}());