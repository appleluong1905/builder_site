(function () {
	"use strict";

	var bConfig = require('./config.js');
	var siteBuilder = require('./builder.js');
	var appUI = require('./ui.js').appUI;

	var publish = {

        buttonPublish: document.getElementById('publishPage'),
        buttonSavePendingBeforePublishing: document.getElementById('buttonSavePendingBeforePublishing'),
        publishModal: document.getElementById('publishModal'),
        buttonPublishSubmit: document.getElementById('publishSubmit'),
        publishActive: 0,
        theItem: {},
        modalSiteSettings: document.getElementById('siteSettings'),

        init: function() {

            $(this.buttonPublish).on('click', this.loadPublishModal);
            $(this.buttonSavePendingBeforePublishing).on('click', this.saveBeforePublishing);
            $(this.publishModal).on('change', 'input[type=checkbox]', this.publishCheckboxEvent);
            $(this.buttonPublishSubmit).on('click', this.publishSite);
            $(this.modalSiteSettings).on('click', '#siteSettingsBrowseFTPButton, .link', this.browseFTP);
            $(this.modalSiteSettings).on('click', '#ftpListItems .close', this.closeFtpBrowser);
            $(this.modalSiteSettings).on('click', '#siteSettingsTestFTP', this.testFTPConnection);

            //show the publish button
            $(this.buttonPublish).show();

            //listen to site settings load event
            $('body').on('siteSettingsLoad', this.showPublishSettings);

            //publish hash?
            if( window.location.hash === "#publish" ) {
                $(this.buttonPublish).click();
            }

            // header tooltips
            //if( this.buttonPublish.hasAttribute('data-toggle') && this.buttonPublish.getAttribute('data-toggle') == 'tooltip' ) {
            //   $(this.buttonPublish).tooltip('show');
            //   setTimeout(function(){$(this.buttonPublish).tooltip('hide')}, 5000);
            //}

        },


        /*
            loads the publish modal
        */
        loadPublishModal: function(e) {

            e.preventDefault();

            if( publish.publishActive === 0 ) {//check if we're currently publishing anything

                //hide alerts
                $('#publishModal .modal-alerts > *').each(function(){
                    $(this).remove();
                });

                $('#publishModal .modal-body > .alert-success').hide();

                //hide loaders
                $('#publishModal_assets .publishing').each(function(){
                    $(this).hide();
                    $(this).find('.working').show();
                    $(this).find('.done').hide();
                });

                //remove published class from asset checkboxes
                $('#publishModal_assets input').each(function(){
                    $(this).removeClass('published');
                });

                //do we have pending changes?
                if( siteBuilder.site.pendingChanges === true ) {//we've got changes, save first

                    $('#publishModal #publishPendingChangesMessage').show();
                    $('#publishModal .modal-body-content').hide();

                } else {//all set, get on it with publishing

                    //get the correct pages in the Pages section of the publish modal
                    $('#publishModal_pages tbody > *').remove();

                    $('#pages li:visible').each(function(){

                        var thePage = $(this).find('a:first').text();
                        var theRow = $('<tr><td class="text-center" style="width: 30px;"><label class="checkbox no-label"><input type="checkbox" value="'+thePage+'" id="" data-type="page" name="pages[]" data-toggle="checkbox"></label></td><td>'+thePage+'<span class="publishing"><span class="working">Publishing... <img src="'+appUI.baseUrl+'src/images/publishLoader.gif"></span><span class="done text-primary">Published &nbsp;<span class="fui-check"></span></span></span></td></tr>');

                        //checkboxify
                        theRow.find('input').radiocheck();
                        theRow.find('input').on('check uncheck toggle', function(){
                            $(this).closest('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected-row');
                        });

                        $('#publishModal_pages tbody').append( theRow );

                    });

                    $('#publishModal #publishPendingChangesMessage').hide();
                    $('#publishModal .modal-body-content').show();

                }
            }

            //enable/disable publish button

            var activateButton = false;

            $('#publishModal input[type=checkbox]').each(function(){

                if( $(this).prop('checked') ) {
                    activateButton = true;
                    return false;
                }
            });

            if( activateButton ) {
                $('#publishSubmit').removeClass('disabled');
            } else {
                $('#publishSubmit').addClass('disabled');
            }

            $('#publishModal').modal('show');

        },


        /*
            saves pending changes before publishing
        */
        saveBeforePublishing: function() {

            $('#publishModal #publishPendingChangesMessage').hide();
            $('#publishModal .loader').show();
            $(this).addClass('disabled');

            siteBuilder.site.prepForSave(false);

            var serverData = {};
            serverData.pages = siteBuilder.site.sitePagesReadyForServer;
            if( siteBuilder.site.pagesToDelete.length > 0 ) {
                serverData.toDelete = siteBuilder.site.pagesToDelete;
            }
            serverData.siteData = siteBuilder.site.data;

            $.ajax({
                url: appUI.siteUrl+"site/save/1",
                type: "POST",
                dataType: "json",
                data: serverData,
            }).done(function(res){

                $('#publishModal .loader').fadeOut(500, function(){

                    $('#publishModal .modal-alerts').append( $(res.responseHTML) );

                    //self-destruct success messages
                    setTimeout(function(){$('#publishModal .modal-alerts .alert-success').fadeOut(500, function(){$(this).remove();});}, 2500);

                    //enable button
                    $('#publishModal #publishPendingChangesMessage .btn.save').removeClass('disabled');

                });

                if( res.responseCode === 1 ) {//changes were saved without issues

                    //no more pending changes
                    siteBuilder.site.setPendingChanges(false);

                    //get the correct pages in the Pages section of the publish modal
                    $('#publishModal_pages tbody > *').remove();

                    $('#pages li:visible').each(function(){

                        var thePage = $(this).find('a:first').text();
                        var theRow = $('<tr><td class="text-center" style="width: 0px;"><label class="checkbox"><input type="checkbox" value="'+thePage+'" id="" data-type="page" name="pages[]" data-toggle="checkbox"></label></td><td>'+thePage+'<span class="publishing"><span class="working">Publishing... <img src="'+appUI.baseUrl+'images/publishLoader.gif"></span><span class="done text-primary">Published &nbsp;<span class="fui-check"></span></span></span></td></tr>');

                        //checkboxify
                        theRow.find('input').radiocheck();
                        theRow.find('input').on('check uncheck toggle', function(){
                            $(this).closest('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected-row');
                        });

                        $('#publishModal_pages tbody').append( theRow );

                    });

                    //show content
                    $('#publishModal .modal-body-content').fadeIn(500);

                }

            });

        },


        /*
            event handler for the checkboxes inside the publish modal
        */
        publishCheckboxEvent: function() {

            var activateButton = false;

            $('#publishModal input[type=checkbox]').each(function(){

                if( $(this).prop('checked') ) {
                    activateButton = true;
                    return false;
                }

            });

            if( activateButton ) {

                $('#publishSubmit').removeClass('disabled');

            } else {

                $('#publishSubmit').addClass('disabled');

            }

        },


        /*
            publishes the selected items
        */
        publishSite: function() {

            //track the publishing state
            publish.publishActive = 1;

            //disable button
            $('#publishSubmit, #publishCancel').addClass('disabled');

            //remove existing alerts
            $('#publishModal .modal-alerts > *').remove();

            //prepare stuff
            $('#publishModal form input[type="hidden"].page').remove();

            //loop through all pages
            $('#pageList > ul').each(function(){

                //export this page?
                if( $('#publishModal #publishModal_pages input:eq('+($(this).index()+1)+')').prop('checked') ) {

                    //grab the skeleton markup
                    var newDocMainParent = $('iframe#skeleton').contents().find( bConfig.pageContainer );

                    //empty out the skeleton
                    newDocMainParent.find('*').remove();

                    //loop through page iframes and grab the body stuff
                    $(this).find('iframe').each(function(){

                        var attr = $(this).attr('data-sandbox');

                        var theContents;

                        if (typeof attr !== typeof undefined && attr !== false) {
                            theContents = $('#sandboxes #'+attr).contents().find( bConfig.pageContainer );
                        } else {
                            theContents = $(this).contents().find( bConfig.pageContainer );
                        }

                        theContents.find('.frameCover').each(function(){
                            $(this).remove();
                        });

                        //remove inline styling leftovers
                        for( var key in bConfig.editableItems ) {

                            theContents.find( key ).each(function(){

                                $(this).removeAttr('data-selector');

                                if( $(this).attr('style') === '' ) {
                                    $(this).removeAttr('style');
                                }

                            });

                        }

                        for (var i = 0; i < bConfig.editableContent.length; ++i) {

                            $(this).contents().find( bConfig.editableContent[i] ).each(function(){
                                $(this).removeAttr('data-selector');
                            });

                        }

                        var toAdd = theContents.html();

                        //grab scripts

                        var scripts = $(this).contents().find( bConfig.pageContainer ).find('script');

                        if( scripts.size() > 0 ) {

                            var theIframe = document.getElementById("skeleton");

                            scripts.each(function(){

                                var script;

                                if( $(this).text() !== '' ) {//script tags with content

                                    script = theIframe.contentWindow.document.createElement("script");
                                    script.type = 'text/javascript';
                                    script.innerHTML = $(this).text();
                                    theIframe.contentWindow.document.getElementById( bConfig.pageContainer.substring(1) ).appendChild(script);

                                } else if( $(this).attr('src') !== null ) {

                                    script = theIframe.contentWindow.document.createElement("script");
                                    script.type = 'text/javascript';
                                    script.src = $(this).attr('src');
                                    theIframe.contentWindow.document.getElementById( bConfig.pageContainer.substring(1) ).appendChild(script);
                                }

                            });

                        }

                        newDocMainParent.append( $(toAdd) );

                    });

                    var newInput = $('<input type="hidden" class="page" name="xpages['+$('#pages li:eq('+($(this).index()+1)+') a:first').text()+']" value="">');

                    $('#publishModal form').prepend( newInput );

                    newInput.val( "<html>"+$('iframe#skeleton').contents().find('html').html()+"</html>" );

                }

            });

            publish.publishAsset();

        },

        publishAsset: function() {

            var toPublish = $('#publishModal_assets input[type=checkbox]:checked:not(.published, .toggleAll), #publishModal_pages input[type=checkbox]:checked:not(.published, .toggleAll)');

            if( toPublish.size() > 0 ) {

                publish.theItem = toPublish.first();

                //display the asset loader
                publish.theItem.closest('td').next().find('.publishing').fadeIn(500);

                var theData;

                if( publish.theItem.attr('data-type') === 'page' ) {

                    theData = {site_id: $('form#publishForm input[name=site_id]').val(), item: publish.theItem.val(), pageContent: $('form#publishForm input[name="xpages['+publish.theItem.val()+']"]').val()};

                } else if( publish.theItem.attr('data-type') === 'asset' ) {

                    theData = {site_id: $('form#publishForm input[name=site_id]').val(), item: publish.theItem.val()};

                }

                $.ajax({
                    url: $('form#publishForm').attr('action')+"/"+publish.theItem.attr('data-type'),
                    type: 'post',
                    data: theData,
                    dataType: 'json'
                }).done(function(ret){

                    if( ret.responseCode === 0 ) {//fatal error, publishing will stop

                        //hide indicators
                        publish.theItem.closest('td').next().find('.working').hide();

                        //enable buttons
                        $('#publishSubmit, #publishCancel').removeClass('disabled');
                        $('#publishModal .modal-alerts').append( $(ret.responseHTML) );

                    } else if( ret.responseCode === 1 ) {//no issues

                        //show done
                        publish.theItem.closest('td').next().find('.working').hide();
                        publish.theItem.closest('td').next().find('.done').fadeIn();
                        publish.theItem.addClass('published');

                        publish.publishAsset();

                    }

                });

            } else {

                //publishing is done
                publish.publishActive = 0;

                //enable buttons
                $('#publishSubmit, #publishCancel').removeClass('disabled');

                //show message
                $('#publishModal .modal-body > .alert-success').fadeIn(500, function(){
                    setTimeout(function(){$('#publishModal .modal-body > .alert-success').fadeOut(500);}, 2500);
                });

            }

        },

        showPublishSettings: function() {

            $('#siteSettingsPublishing').show();
        },


        /*
            browse the FTP connection
        */
        browseFTP: function(e) {

            e.preventDefault();

    		//got all we need?

    		if( $('#siteSettings_ftpServer').val() === '' || $('#siteSettings_ftpUser').val() === '' || $('#siteSettings_ftpPassword').val() === '' ) {
                alert('Please make sure all FTP connection details are present');
                return false;
            }

            //check if this is a deeper level link
    		if( $(this).hasClass('link') ) {

    			if( $(this).hasClass('back') ) {

    				$('#siteSettings_ftpPath').val( $(this).attr('href') );

    			} else {

    				//if so, we'll change the path before connecting

    				if( $('#siteSettings_ftpPath').val().substr( $('#siteSettings_ftpPath').val.length - 1 ) === '/' ) {//prepend "/"

    					$('#siteSettings_ftpPath').val( $('#siteSettings_ftpPath').val()+$(this).attr('href') );

    				} else {

    					$('#siteSettings_ftpPath').val( $('#siteSettings_ftpPath').val()+"/"+$(this).attr('href') );

    				}

    			}


    		}

    		//destroy all alerts

    		$('#ftpAlerts .alert').fadeOut(500, function(){
    			$(this).remove();
    		});

    		//disable button
    		$(this).addClass('disabled');

    		//remove existing links
    		$('#ftpListItems > *').remove();

    		//show ftp section
    		$('#ftpBrowse .loaderFtp').show();
    		$('#ftpBrowse').slideDown(500);

    		var theButton = $(this);

    		$.ajax({
                url: appUI.siteUrl+"site/connect",
    			type: 'post',
    			dataType: 'json',
    			data: $('form#siteSettingsForm').serializeArray()
    		}).done(function(ret){

    			//enable button
    			theButton.removeClass('disabled');

    			//hide loading
    			$('#ftpBrowse .loaderFtp').hide();

    			if( ret.responseCode === 0 ) {//error
    				$('#ftpAlerts').append( $(ret.responseHTML) );
    			} else if( ret.responseCode === 1 ) {//all good
    				$('#ftpListItems').append( $(ret.responseHTML) );
    			}

    		});

        },


        /*
            hides/closes the FTP browser
        */
        closeFtpBrowser: function(e) {

            e.preventDefault();
    		$(this).closest('#ftpBrowse').slideUp(500);

        },


         /*
            tests the FTP connection with the provided details
        */
        testFTPConnection: function() {

            //got all we need?
    		if( $('#siteSettings_ftpServer').val() === '' || $('#siteSettings_ftpUser').val() === '' || $('#siteSettings_ftpPassword').val() === '' ) {
                alert('Please make sure all FTP connection details are present');
                return false;
            }

    		//destroy all alerts
            $('#ftpTestAlerts .alert').fadeOut(500, function(){
                $(this).remove();
            });

    		//disable button
    		$(this).addClass('disabled');

    		//show loading indicator
    		$(this).next().fadeIn(500);

            var theButton = $(this);

    		$.ajax({
                url: appUI.siteUrl+"site/ftptest",
    			type: 'post',
    			dataType: 'json',
    			data: $('form#siteSettingsForm').serializeArray()
    		}).done(function(ret){

    			//enable button
    			theButton.removeClass('disabled');
                theButton.next().fadeOut(500);

    			if( ret.responseCode === 0 ) {//error
                    $('#ftpTestAlerts').append( $(ret.responseHTML) );
                } else if( ret.responseCode === 1 ) {//all good
                    $('#ftpTestAlerts').append( $(ret.responseHTML) );
                }

    		});

        }

    };

    publish.init();

}());