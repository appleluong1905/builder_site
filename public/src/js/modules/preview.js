(function () {
	"use strict";

	var bConfig = require('./config.js');
	var siteBuilder = require('./builder.js');
    var publisher = require('../vendor/publisher');

	var preview = {

        modalPreview: document.getElementById('previewModal'),
        buttonPreview: document.getElementById('buttonPreview'),

        init: function() {

            //events
            $(this.modalPreview).on('shown.bs.modal', this.prepPreview);
            $(this.modalPreview).on('show.bs.modal', this.prepPreviewLink);

            //reveal preview button
            $(this.buttonPreview).show();

        },


        /*
            prepares the preview data
        */
        prepPreview: function() {

            publisher.publish('onBeforePreview');

            $('#previewModal form input[type="hidden"]').remove();

            //build the page
            siteBuilder.site.activePage.fullPage();

            var newInput;

            //markup
            newInput = $('<input type="hidden" name="page" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( "<html>"+$('iframe#skeleton').contents().find('html').html()+"</html>" );

            //page title
            newInput = $('<input type="hidden" name="meta_title" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.title );
            //alert(JSON.stringify(siteBuilder.site.activePage.pageSettings));

            //page meta description
            newInput = $('<input type="hidden" name="meta_description" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.meta_description );

            //page meta keywords
            newInput = $('<input type="hidden" name="meta_keywords" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.meta_keywords );

            //page header includes
            newInput = $('<input type="hidden" name="header_includes" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.header_includes );

            //page css
            newInput = $('<input type="hidden" name="page_css" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.page_css );

            //site ID
            newInput = $('<input type="hidden" name="siteID" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.data.id );

            //CSRF token
            newInput = $('<input type="hidden" name="_token" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( $('meta[name="csrf-token"]').attr('content') );

        },


        /*
            prepares the actual preview link
        */
        prepPreviewLink: function() {

            $('#pagePreviewLink').attr( 'href', $('#pagePreviewLink').attr('data-defurl')+$('#pages li.active a').text() );

        }

    };

    preview.init();

}());