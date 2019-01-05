(function () {
	"use strict";

	var appUI = require('./ui.js').appUI;

	var sites = {

        wrapperSites: document.getElementById('sites'),
        selectUser: document.getElementById('userDropDown'),
        selectSort: document.getElementById('sortDropDown'),
        buttonDeleteSite: document.getElementById('deleteSiteButton'),
		buttonsDeleteSite: document.querySelectorAll('.deleteSiteButton'),

        init: function() {

            this.createThumbnails();

            $(this.selectUser).on('change', this.filterUser);
            $(this.selectSort).on('change', this.changeSorting);
            $(this.buttonsDeleteSite).on('click', this.deleteSite);
			$(this.buttonDeleteSite).on('click', this.deleteSite);

        },


        /*
            applies zoomer to create the iframe thubmnails
        */
        createThumbnails: function() {

            $(this.wrapperSites).find('iframe').each(function(){

                var theHeight = $(this).attr('data-height')*0.25;

                $(this).zoomer({
                    zoom: 0.25,
                    height: theHeight,
                    width: $(this).parent().width(),
                    message: "",
                    messageURL: appUI.siteUrl+"site/"+$(this).attr('data-siteid')
                });

                $(this).closest('.site').find('.zoomer-cover > a').attr('target', '');

            });

        },


        /*
            filters the site list by selected user
        */
        filterUser: function() {

            if( $(this).val() === 'All' || $(this).val() === '' ) {
                $('#sites .site').hide().fadeIn(500);
            } else {
                $('#sites .site').hide();
                $('#sites').find('[data-name="'+$(this).val()+'"]').fadeIn(500);
            }

        },


        /*
            chnages the sorting on the site list
        */
        changeSorting: function() {

            var sites;

            if( $(this).val() === 'NoOfPages' ) {

				sites = $('#sites .site');

				sites.sort( function(a,b){

                    var an = a.getAttribute('data-pages');
					var bn = b.getAttribute('data-pages');

					if(an > bn) {
						return 1;
					}

					if(an < bn) {
						return -1;
					}

					return 0;

				} );

				sites.detach().appendTo( $('#sites') );

			} else if( $(this).val() === 'CreationDate' ) {

				sites = $('#sites .site');

				sites.sort( function(a,b){

					var an = a.getAttribute('data-created').replace("-", "");
					var bn = b.getAttribute('data-created').replace("-", "");

					if(an > bn) {
						return 1;
					}

					if(an < bn) {
						return -1;
					}

					return 0;

				} );

				sites.detach().appendTo( $('#sites') );

			} else if( $(this).val() === 'LastUpdate' ) {

				sites = $('#sites .site');

				sites.sort( function(a,b){

					var an = a.getAttribute('data-update').replace("-", "");
					var bn = b.getAttribute('data-update').replace("-", "");

					if(an > bn) {
						return 1;
					}

					if(an < bn) {
						return -1;
					}

				return 0;

				} );

				sites.detach().appendTo( $('#sites') );

			}

        },


        /*
            deletes a site
        */
        deleteSite: function(e) {

            e.preventDefault();

            $('#deleteSiteModal .modal-content p').show();

            //remove old alerts
            $('#deleteSiteModal .modal-alerts > *').remove();
            $('#deleteSiteModal .loader').hide();

            var toDel = $(this).closest('.site');
            var delButton = $(this);

            $('#deleteSiteModal button#deleteSiteButton').show();
            $('#deleteSiteModal').modal('show');

            $('#deleteSiteModal button#deleteSiteButton').unbind('click').click(function(){

                $(this).addClass('disabled');
                $('#deleteSiteModal .loader').fadeIn(500);

                $.ajax({
                    url: appUI.siteUrl+"site/trash/"+delButton.attr('data-siteid'),
                    type: 'get',
                    dataType: 'json'
                }).done(function(ret){

                    $('#deleteSiteModal .loader').hide();
                    $('#deleteSiteModal button#deleteSiteButton').removeClass('disabled');

                    if( ret.responseCode === 0 ) {//error

                        $('#deleteSiteModal .modal-content p').hide();
                        $('#deleteSiteModal .modal-alerts').append( $(ret.responseHTML) );

                    } else if( ret.responseCode === 1 ) {//all good

                        $('#deleteSiteModal .modal-content p').hide();
                        $('#deleteSiteModal .modal-alerts').append( $(ret.responseHTML) );
                        $('#deleteSiteModal button#deleteSiteButton').hide();

                        toDel.fadeOut(800, function(){
                            $(this).remove();
                        });
                    }

                });
            });

        }

    };

    sites.init();

}());