(function () {
	"use strict";

	var appUI = require('./ui.js').appUI;

	var siteSettings = {

        //buttonSiteSettings: document.getElementById('siteSettingsButton'),
		buttonSiteSettings2: $('.siteSettingsModalButton'),
        buttonSaveSiteSettings: document.getElementById('saveSiteSettingsButton'),

        init: function() {

            //$(this.buttonSiteSettings).on('click', this.siteSettingsModal);
			this.buttonSiteSettings2.on('click', this.siteSettingsModal);
            $(this.buttonSaveSiteSettings).on('click', this.saveSiteSettings);

        },

        /*
            loads the site settings data
        */
        siteSettingsModal: function(e) {

            e.preventDefault();

    		$('#siteSettings').modal('show');

    		//destroy all alerts
    		$('#siteSettings .alert').fadeOut(500, function(){

    			$(this).remove();

    		});

    		//set the siteID
    		$('input#siteID').val( $(this).attr('data-siteid') );

    		//destroy current forms
    		$('#siteSettings .modal-body-content > *').each(function(){
    			$(this).remove();
    		});

            //show loader, hide rest
    		$('#siteSettingsWrapper .loader').show();
    		$('#siteSettingsWrapper > *:not(.loader)').hide();

    		//load site data using ajax
    		$.ajax({
                url: appUI.siteUrl+"siteAjax/"+$(this).attr('data-siteid'),
    			type: 'get',
    			dataType: 'json'
    		}).done(function(ret){

    			if( ret.responseCode === 0 ) {//error

    				//hide loader, show error message
    				$('#siteSettings .loader').fadeOut(500, function(){

    					$('#siteSettings .modal-alerts').append( $(ret.responseHTML) );

    				});

    				//disable submit button
    				$('#saveSiteSettingsButton').addClass('disabled');


    			} else if( ret.responseCode === 1 ) {//all well :)

    				//hide loader, show data

    				$('#siteSettings .loader').fadeOut(500, function(){

    					$('#siteSettings .modal-body-content').append( $(ret.responseHTML) );

                        $('body').trigger('siteSettingsLoad');

    				});

    				//enable submit button
    				$('#saveSiteSettingsButton').removeClass('disabled');

    			}

    		});

        },


        /*
            saves the site settings
        */
        saveSiteSettings: function() {

            //destroy all alerts
    		$('#siteSettings .alert').fadeOut(500, function(){

    			$(this).remove();

    		});

    		//disable button
    		$('#saveSiteSettingsButton').addClass('disabled');

    		//hide form data
    		$('#siteSettings .modal-body-content > *').hide();

    		//show loader
    		$('#siteSettings .loader').show();

    		$.ajax({
                url: appUI.siteUrl+"siteAjaxUpdate",
    			type: 'post',
    			dataType: 'json',
    			data: $('form#siteSettingsForm').serializeArray()
    		}).done(function(ret){

    			if( ret.responseCode === 0 ) {//error

    				$('#siteSettings .loader').fadeOut(500, function(){

    					$('#siteSettings .modal-alerts').append( ret.responseHTML );

    					//show form data
    					$('#siteSettings .modal-body-content > *').show();

    					//enable button
    					$('#saveSiteSettingsButton').removeClass('disabled');

    				});


    			} else if( ret.responseCode === 1 ) {//all is well

    				$('#siteSettings .loader').fadeOut(500, function(){


    					//update site name in top menu
    					$('#siteTitle').text( ret.siteName );

    					$('#siteSettings .modal-alerts').append( ret.responseHTML );

    					//hide form data
    					$('#siteSettings .modal-body-content > *').remove();
    					$('#siteSettings .modal-body-content').append( ret.responseHTML2 );

    					//enable button
    					$('#saveSiteSettingsButton').removeClass('disabled');

    					//is the FTP stuff all good?

    					if( ret.ftpOk === 1 ) {//yes, all good

    						$('#publishPage').removeAttr('data-toggle');
    						$('#publishPage span.text-danger').hide();

    						$('#publishPage').tooltip('destroy');

    					} else {//nope, can't use FTP

    						$('#publishPage').attr('data-toggle', 'tooltip');
    						$('#publishPage span.text-danger').show();

    						$('#publishPage').tooltip('show');

    					}


    					//update the site name in the small window
    					$('#site_'+ret.siteID+' .window .top b').text( ret.siteName );

    				});


    			}

    		});

        },


    };

    siteSettings.init();

}());