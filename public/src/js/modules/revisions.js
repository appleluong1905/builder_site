(function () {
	"use strict";

	var siteBuilder = require('./builder.js');
	var appUI = require('./ui.js').appUI;

	var revisions = {

        selectRevisions: document.getElementById('dropdown_revisions'),
        buttonRevisions: document.getElementById('button_revisionsDropdown'),

        init: function() {

            $(this.selectRevisions).on('click', 'a.link_deleteRevision', this.deleteRevision);
            $(this.selectRevisions).on('click', 'a.link_restoreRevision', this.restoreRevision);
            $(document).on('changePage', 'body', this.loadRevisions);

            //reveal the revisions dropdown
            $(this.buttonRevisions).show();

        },


        /*
            deletes a single revision
        */
        deleteRevision: function(e) {

            e.preventDefault();

            var theLink = $(this);

            if( confirm('Are you sure you want to delete this revision?') ) {

                $.ajax({
                    url: $(this).attr('href'),
                    method: 'get',
                    dataType: 'json'
                }).done(function(ret){

                    if( ret.code === 1 ) {//if successfull, remove LI from list

                        theLink.parent().fadeOut(function(){

                            $(this).remove();

                            if( $('ul#dropdown_revisions li').size() === 0 ) {//list is empty, hide revisions dropdown
                                $('#button_revisionsDropdown button').addClass('disabled');
                                $('#button_revisionsDropdown').dropdown('toggle');
                            }

                        });

                    }

                });

            }

            return false;

        },


        /*
            restores a revision
        */
        restoreRevision: function() {

            if( confirm('Are you sure you want to restore this revision? This would overwrite the current page. Continue?') ) {
                return true;
            } else {
                return false;
            }

        },


        /*
            loads revisions for the active page
        */
        loadRevisions: function() {

            $.ajax({
                url: appUI.siteUrl+"site/getRevisions/"+siteBuilder.site.data.id+"/"+siteBuilder.site.activePage.name
            }).done(function(ret){

                if( ret === '' ) {

                    $('#button_revisionsDropdown button').each(function(){
                        $(this).addClass('disabled');
                    });

                    $('ul#dropdown_revisions').html( '' );

                } else {

                    $('ul#dropdown_revisions').html( ret );
                    $('#button_revisionsDropdown button').each(function(){
                        $(this).removeClass('disabled');
                    });

                }
            });

        }

    };

    revisions.init();

}());