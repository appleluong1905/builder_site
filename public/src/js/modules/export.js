(function () {
	"use strict";

	var bConfig = require('./config.js');

	var bexport = {
        
        modalExport: document.getElementById('exportModal'),
        buttonExport: document.getElementById('exportPage'),
        
        init: function() {
            
            $(this.modalExport).on('show.bs.modal', this.doExportModal);
            $(this.modalExport).on('shown.bs.modal', this.prepExport);
            $(this.modalExport).find('form').on('submit', this.exportFormSubmit);
            
            //reveal export button
            $(this.buttonExport).show();
        
        },
        
        doExportModal: function() {
                        
            $('#exportModal > form #exportSubmit').show('');
            $('#exportModal > form #exportCancel').text('Cancel & Close');
            
        },
        
        
        /*
            prepares the export data
        */
        prepExport: function(e) {
            
            //delete older hidden fields
            $('#exportModal form input[type="hidden"].pages').remove();
            
            //loop through all pages
            $('#pageList > ul').each(function(){

                var theContents;
				
                //grab the skeleton markup
                var newDocMainParent = $('iframe#skeleton').contents().find( bConfig.pageContainer );
                
                //empty out the skeleto
                newDocMainParent.find('*').remove();
			
                //loop through page iframes and grab the body stuff
                $(this).find('iframe').each(function(){
                                        
                    var attr = $(this).attr('data-sandbox');
                    
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
				
                    for ( var i = 0; i < bConfig.editableContent.length; ++i) {
                        
                        $(this).contents().find( bConfig.editableContent[i] ).each(function(){
                            $(this).removeAttr('data-selector');
                        });
                    }
			
                    var toAdd = theContents.html();
				
                    //grab scripts
                    var scripts = $(this).contents().find( bConfig.pageContainer ).find('script');
                    
                    if( scripts.size() > 0 ) {
				
                        var theIframe = document.getElementById("skeleton"), script;
                        
                        scripts.each(function(){
					
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
                
                var newInput = $('<input type="hidden" name="pages['+$('#pages li:eq('+($(this).index()+1)+') a:first').text()+']" class="pages" value="">');
                $('#exportModal form').prepend( newInput );
                newInput.val( "<html>"+$('iframe#skeleton').contents().find('html').html()+"</html>" );
            
            });
        },
        
        
        /*
            event handler for the export from submit
        */
        exportFormSubmit: function() {
                        
            $('#exportModal > form #exportSubmit').hide('');
            $('#exportModal > form #exportCancel').text('Close Window');
        
        }
    
    };
        
    bexport.init();

}());