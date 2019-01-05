(function () {
	"use strict";

	require('./modules/account');

	$('#configHelp').affix({
        offset: {
            top: 200
        }
    });
    
    //set the width for the configHelp
    $('.configHelp').width( $('.configHelp').width() )
    	    	
    //help info
    $('form.settingsForm textarea').focus(function(){
	    	
        $('#configHelp > div:first').html( $(this).next().html() );
	    	
        $('#configHelp').fadeIn(500);
	    	
        //set the width for the configHelp
        $('.configHelp').width( $('.configHelp').width() )
	    	
    });
    	
    $('form.settingsForm textarea').blur(function(){
	    	
        $('#configHelp').hide();
	    	
    });

}());