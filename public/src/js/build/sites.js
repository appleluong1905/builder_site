(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {
    "use strict";

    var appUI = require('./ui.js').appUI;

    var account = {

        buttonUpdateAccountDetails: document.getElementById('accountDetailsSubmit'),
        buttonUpdateLoginDetails: document.getElementById('accountLoginSubmit'),

        init: function() {

            $(this.buttonUpdateAccountDetails).on('click', this.updateAccountDetails);
            $(this.buttonUpdateLoginDetails).on('click', this.updateLoginDetails);

        },


        /*
            updates account details
        */
        updateAccountDetails: function() {

            //all fields filled in?

            var allGood = 1;

            if( $('#account_details input#firstname').val() === '' ) {
                $('#account_details input#firstname').closest('.form-group').addClass('has-error');
                allGood = 0;
            } else {
                $('#account_details input#firstname').closest('.form-group').removeClass('has-error');
                allGood = 1;
            }

            if( $('#account_details input#lastname').val() === '' ) {
                $('#account_details input#lastname').closest('.form-group').addClass('has-error');
                allGood = 0;
            } else {
                $('#account_details input#lastname').closest('.form-group').removeClass('has-error');
                allGood = 1;
            }

            if( allGood === 1 ) {

                var theButton = $(this);

                //disable button
                $(this).addClass('disabled');

                //show loader
                $('#account_details .loader').fadeIn(500);

                //remove alerts
                $('#account_details .alerts > *').remove();

                $.ajax({
                    url: appUI.siteUrl+"user/uaccount",
                    type: 'post',
                    dataType: 'json',
                    data: $('#account_details').serialize()
                }).done(function(ret){

                    //enable button
                    theButton.removeClass('disabled');

                    //hide loader
                    $('#account_details .loader').hide();
                    $('#account_details .alerts').append( $(ret.responseHTML) );

                    if( ret.responseCode === 1 ) {//success
                        setTimeout(function () {
                            $('#account_details .alerts > *').fadeOut(500, function () { $(this).remove(); });
                        }, 3000);
                    }
                });

            }

        },


        /*
            updates account login details
        */
        updateLoginDetails: function() {

            //console.log(appUI);

            var allGood = 1;

            if( $('#account_login input#email').val() === '' ) {
                $('#account_login input#email').closest('.form-group').addClass('has-error');
                allGood = 0;
            } else {
                $('#account_login input#email').closest('.form-group').removeClass('has-error');
                allGood = 1;
            }

            if( $('#account_login input#password').val() === '' ) {
                $('#account_login input#password').closest('.form-group').addClass('has-error');
                allGood = 0;
            } else {
                $('#account_login input#password').closest('.form-group').removeClass('has-error');
                allGood = 1;
            }

            if( allGood === 1 ) {

                var theButton = $(this);

                //disable button
                $(this).addClass('disabled');

                //show loader
                $('#account_login .loader').fadeIn(500);

                //remove alerts
                $('#account_login .alerts > *').remove();

                $.ajax({
                    url: appUI.siteUrl+"user/ulogin",
                    type: 'post',
                    dataType: 'json',
                    data: $('#account_login').serialize()
                }).done(function(ret){

                    //enable button
                    theButton.removeClass('disabled');

                    //hide loader
                    $('#account_login .loader').hide();
                    $('#account_login .alerts').append( $(ret.responseHTML) );

                    if( ret.responseCode === 1 ) {//success
                        setTimeout(function () {
                            $('#account_login .alerts > *').fadeOut(500, function () { $(this).remove(); });
                        }, 3000);
                    }

                });

            }

        }

    };

    account.init();

}());
},{"./ui.js":7}],2:[function(require,module,exports){
(function () {
	"use strict";

    var siteBuilderUtils = require('./utils.js');
    var bConfig = require('./config.js');
    var appUI = require('./ui.js').appUI;
    var publisher = require('../vendor/publisher');


	 /*
        Basic Builder UI initialisation
    */
    var builderUI = {

        allBlocks: {},                                              //holds all blocks loaded from the server
        menuWrapper: document.getElementById('menu'),
        primarySideMenuWrapper: document.getElementById('main'),
        buttonBack: document.getElementById('backButton'),
        buttonBackConfirm: document.getElementById('leavePageButton'),

        aceEditors: {},
        frameContents: '',                                      //holds frame contents
        templateID: 0,                                          //holds the template ID for a page (???)

        modalDeleteBlock: document.getElementById('deleteBlock'),
        modalResetBlock: document.getElementById('resetBlock'),
        modalDeletePage: document.getElementById('deletePage'),
        buttonDeletePageConfirm: document.getElementById('deletePageConfirm'),

        dropdownPageLinks: document.getElementById('internalLinksDropdown'),

        pageInUrl: null,

        tempFrame: {},

        currentResponsiveMode: {},

        init: function(){

            //load blocks
            $.getJSON(appUI.baseUrl+'elements.json?v=12345678', function(data){ builderUI.allBlocks = data; builderUI.implementBlocks(); });

            //sitebar hover animation action
            $(this.menuWrapper).on('mouseenter', function(){

                $(this).stop().animate({'left': '0px'}, 500);

            }).on('mouseleave', function(){

                $(this).stop().animate({'left': '-190px'}, 500);

                $('#menu #main a').removeClass('active');
                $('.menu .second').stop().animate({
                    width: 0
                }, 500, function(){
                    $('#menu #second').hide();
                });

            });

            //prevent click event on ancors in the block section of the sidebar
            $(this.primarySideMenuWrapper).on('click', 'a:not(.actionButtons)', function(e){e.preventDefault();});

            $(this.buttonBack).on('click', this.backButton);
            $(this.buttonBackConfirm).on('click', this.backButtonConfirm);

            //notify the user of pending chnages when clicking the back button
            $(window).bind('beforeunload', function(){
                if( site.pendingChanges === true ) {
                    return 'Your site contains changed which haven\'t been saved yet. Are you sure you want to leave?';
                }
            });

            //URL parameters
            builderUI.pageInUrl = siteBuilderUtils.getParameterByName('p');

        },


        /*
            builds the blocks into the site bar
        */
        implementBlocks: function() {

            var newItem, loaderFunction;

            for( var key in this.allBlocks.elements ) {
                //console.log(this.allBlocks.elements);
                var niceKey = key.toLowerCase().replace(" ", "_");

                $('<li><a href="" id="'+niceKey+'">'+key+'</a></li>').appendTo('#menu #main ul#elementCats');

                for( var x = 0; x < this.allBlocks.elements[key].length; x++ ) {

                    if( this.allBlocks.elements[key][x].thumbnail === null ) {//we'll need an iframe

                        //build us some iframes!

                        if( this.allBlocks.elements[key][x].sandbox ) {

                            if( this.allBlocks.elements[key][x].loaderFunction ) {
                                loaderFunction = 'data-loaderfunction="'+this.allBlocks.elements[key][x].loaderFunction+'"';
                            }

                            newItem = $('<li class="element '+niceKey+'"><iframe src="'+appUI.baseUrl+this.allBlocks.elements[key][x].url+'" scrolling="no" sandbox="allow-same-origin"></iframe></li>');

                        } else {

                            newItem = $('<li class="element '+niceKey+'"><iframe src="about:blank" scrolling="no"></iframe></li>');

                        }

                        newItem.find('iframe').uniqueId();
                        newItem.find('iframe').attr('src', appUI.baseUrl+this.allBlocks.elements[key][x].original_url);

                    } else {//we've got a thumbnail

                        if( this.allBlocks.elements[key][x].sandbox ) {

                            if( this.allBlocks.elements[key][x].loaderFunction ) {
                                loaderFunction = 'data-loaderfunction="'+this.allBlocks.elements[key][x].loaderFunction+'"';
                            }

                            newItem = $('<li class="element '+niceKey+'"><img src="'+appUI.baseUrl+this.allBlocks.elements[key][x].thumbnail+'" data-srcc="'+appUI.baseUrl+this.allBlocks.elements[key][x].url+'" data-height="'+this.allBlocks.elements[key][x].height+'" data-sandbox="" '+loaderFunction+'></li>');

                        } else {

                            newItem = $('<li class="element '+niceKey+'"><img src="'+appUI.baseUrl+this.allBlocks.elements[key][x].thumbnail+'" data-srcc="'+appUI.baseUrl+this.allBlocks.elements[key][x].url+'" data-height="'+this.allBlocks.elements[key][x].height+'"></li>');

                        }
                    }

                    newItem.appendTo('#menu #second ul#elements');

                    //zoomer works

                    var theHeight;

                    if( this.allBlocks.elements[key][x].height ) {

                        theHeight = this.allBlocks.elements[key][x].height*0.25;

                    } else {

                        theHeight = 'auto';

                    }

                    newItem.find('iframe').zoomer({
                        zoom: 0.25,
                        width: 270,
                        height: theHeight,
                        message: "Drag&Drop Me!"
                    });

                }

            }

            //draggables
            builderUI.makeDraggable();

        },


        /*
            event handler for when the back link is clicked
        */
        backButton: function() {

            if( site.pendingChanges === true ) {
                $('#backModal').modal('show');
                return false;
            }

        },


        /*
            button for confirming leaving the page
        */
        backButtonConfirm: function() {

            site.pendingChanges = false;//prevent the JS alert after confirming user wants to leave

        },


        /*
            makes the blocks and templates in the sidebar draggable onto the canvas
        */
        makeDraggable: function() {

            $('#elements li, #templates li').each(function(){

                $(this).draggable({
                    helper: function() {
                        return $('<div style="height: 100px; width: 300px; background: #F9FAFA; box-shadow: 5px 5px 1px rgba(0,0,0,0.1); text-align: center; line-height: 100px; font-size: 28px; color: #16A085"><span class="fui-list"></span></div>');
                    },
                    revert: 'invalid',
                    appendTo: 'body',
                    connectToSortable: '#pageList > ul',
                    start: function () {
                        site.moveMode('on');
                    },
                    stop: function () {}
                });

            });

            $('#elements li a').each(function(){

                $(this).unbind('click').bind('click', function(e){
                    e.preventDefault();
                });

            });

        },


        /*
            Implements the site on the canvas, called from the Site object when the siteData has completed loading
        */
        populateCanvas: function() {

            var i,
            counter = 1;

            //loop through the pages

            for( i in site.pages ) {

                var newPage = new Page(i, site.pages[i], counter);

                counter++;

                //set this page as active?
                if( builderUI.pageInUrl === i ) {
                    newPage.selectPage();
                }

            }

            //activate the first page
            if(site.sitePages.length > 0 && builderUI.pageInUrl === null) {
                site.sitePages[0].selectPage();
            }

        },


        /*
            Canvas loading on/off
        */
        canvasLoading: function (value) {

            if ( value === 'on' && document.getElementById('frameWrapper').querySelectorAll('#canvasOverlay').length === 0 ) {

                var overlay = document.createElement('DIV');

                overlay.style.display = 'flex';
                $(overlay).hide();
                overlay.id = 'canvasOverlay';

                overlay.innerHTML = '<div class="loader"><span>{</span><span>}</span></div>';

                document.getElementById('frameWrapper').appendChild(overlay);

                $('#canvasOverlay').fadeIn(500);

            } else if ( value === 'off' && document.getElementById('frameWrapper').querySelectorAll('#canvasOverlay').length === 1 ) {

                site.loaded();

                $('#canvasOverlay').fadeOut(500, function () {
                    this.remove();
                });

            }

        }

    };


    /*
        Page constructor
    */
    function Page (pageName, page, counter) {

        this.name = pageName || "";
        this.pageID = page.pages_id || 0;
        this.blocks = [];
        this.parentUL = {}; //parent UL on the canvas
        this.status = '';//'', 'new' or 'changed'
        this.scripts = [];//tracks script URLs used on this page

        this.pageSettings = {
            title: page.pages_title || '',
            meta_description: page.meta_description || '',
            meta_keywords: page.meta_keywords || '',
            header_includes: page.header_includes || '',
            page_css: page.page_css || ''
        };

        this.pageMenuTemplate = '<a href="" class="menuItemLink">page</a><span class="pageButtons"><a href="" class="fileEdit fui-new"></a><a href="" class="fileDel fui-cross"><a class="btn btn-xs btn-primary btn-embossed fileSave fui-check" href="#"></a></span></a></span>';

        this.menuItem = {};//reference to the pages menu item for this page instance
        this.linksDropdownItem = {};//reference to the links dropdown item for this page instance

        this.parentUL = document.createElement('UL');
        this.parentUL.setAttribute('id', "page"+counter);

        /*
            makes the clicked page active
        */
        this.selectPage = function() {

            //console.log('select:');
            //console.log(this.pageSettings);

            //mark the menu item as active
            site.deActivateAll();
            $(this.menuItem).addClass('active');

            //let Site know which page is currently active
            site.setActive(this);

            //display the name of the active page on the canvas
            site.pageTitle.innerHTML = this.name;

            //load the page settings into the page settings modal
            site.inputPageSettingsTitle.value = this.pageSettings.title;
            site.inputPageSettingsMetaDescription.value = this.pageSettings.meta_description;
            site.inputPageSettingsMetaKeywords.value = this.pageSettings.meta_keywords;
            site.inputPageSettingsIncludes.value = this.pageSettings.header_includes;
            site.inputPageSettingsPageCss.value = this.pageSettings.page_css;

            //trigger custom event
            $('body').trigger('changePage');

            //reset the heights for the blocks on the current page
            for( var i in this.blocks ) {

                if( Object.keys(this.blocks[i].frameDocument).length > 0 ){
                    this.blocks[i].heightAdjustment();
                }

            }

            //show the empty message?
            this.isEmpty();

        };

        /*
            changed the location/order of a block within a page
        */
        this.setPosition = function(frameID, newPos) {

            //we'll need the block object connected to iframe with frameID

            for(var i in this.blocks) {

                if( this.blocks[i].frame.getAttribute('id') === frameID ) {

                    //change the position of this block in the blocks array
                    this.blocks.splice(newPos, 0, this.blocks.splice(i, 1)[0]);

                }

            }

        };

        /*
            delete block from blocks array
        */
        this.deleteBlock = function(block) {

            //remove from blocks array
            for( var i in this.blocks ) {
                if( this.blocks[i] === block ) {
                    //found it, remove from blocks array
                    this.blocks.splice(i, 1);
                }
            }

            site.setPendingChanges(true);

        };

        /*
            toggles all block frameCovers on this page
        */
        this.toggleFrameCovers = function(onOrOff) {

            for( var i in this.blocks ) {

                this.blocks[i].toggleCover(onOrOff);

            }

        };

        /*
            setup for editing a page name
        */
        this.editPageName = function() {

            if( !this.menuItem.classList.contains('edit') ) {

                //hide the link
                this.menuItem.querySelector('a.menuItemLink').style.display = 'none';

                //insert the input field
                var newInput = document.createElement('input');
                newInput.type = 'text';
                newInput.setAttribute('name', 'page');
                newInput.setAttribute('value', this.name);
                this.menuItem.insertBefore(newInput, this.menuItem.firstChild);

                newInput.focus();

                var tmpStr = newInput.getAttribute('value');
                newInput.setAttribute('value', '');
                newInput.setAttribute('value', tmpStr);

                this.menuItem.classList.add('edit');

            }

        };

        /*
            Updates this page's name (event handler for the save button)
        */
        this.updatePageNameEvent = function(el) {

            if( this.menuItem.classList.contains('edit') ) {

                //el is the clicked button, we'll need access to the input
                var theInput = this.menuItem.querySelector('input[name="page"]');

                //make sure the page's name is OK
                if( site.checkPageName(theInput.value) ) {

                    this.name = site.prepPageName( theInput.value );

                    this.menuItem.querySelector('input[name="page"]').remove();
                    this.menuItem.querySelector('a.menuItemLink').innerHTML = this.name;
                    this.menuItem.querySelector('a.menuItemLink').style.display = 'block';

                    this.menuItem.classList.remove('edit');

                    //update the links dropdown item
                    this.linksDropdownItem.text = this.name;
                    this.linksDropdownItem.setAttribute('value', this.name+".html");

                    //update the page name on the canvas
                    site.pageTitle.innerHTML = this.name;

                    //changed page title, we've got pending changes
                    site.setPendingChanges(true);

                } else {

                    alert(site.pageNameError);

                }

            }

        };

        /*
            deletes this entire page
        */
        this.delete = function() {

            //delete from the Site
            for( var i in site.sitePages ) {

                if( site.sitePages[i] === this ) {//got a match!

                    //delete from site.sitePages
                    site.sitePages.splice(i, 1);

                    //delete from canvas
                    this.parentUL.remove();

                    //add to deleted pages
                    site.pagesToDelete.push(this.name);

                    //delete the page's menu item
                    this.menuItem.remove();

                    //delet the pages link dropdown item
                    this.linksDropdownItem.remove();

                    //activate the first page
                    site.sitePages[0].selectPage();

                    //page was deleted, so we've got pending changes
                    site.setPendingChanges(true);

                }

            }

        };

        /*
            checks if the page is empty, if so show the 'empty' message
        */
        this.isEmpty = function() {

            if( this.blocks.length === 0 ) {

                site.messageStart.style.display = 'block';
                site.divFrameWrapper.classList.add('empty');

            } else {

                site.messageStart.style.display = 'none';
                site.divFrameWrapper.classList.remove('empty');

            }

        };

        /*
            preps/strips this page data for a pending ajax request
        */
        this.prepForSave = function() {

            var page = {};

            page.name = this.name;
            page.pageSettings = this.pageSettings;
            page.status = this.status;
            page.pageID = this.pageID;
            page.blocks = [];

            //process the blocks

            for( var x = 0; x < this.blocks.length; x++ ) {

                var block = {};

                if( this.blocks[x].sandbox ) {

                    block.frameContent = "<html>"+$('#sandboxes #'+this.blocks[x].sandbox).contents().find('html').html()+"</html>";
                    block.sandbox = true;
                    block.loaderFunction = this.blocks[x].sandbox_loader;

                } else {

                    block.frameContent = this.blocks[x].getSource();
                    block.sandbox = false;
                    block.loaderFunction = '';

                }

                block.frameHeight = this.blocks[x].frameHeight;
                block.original_url = this.blocks[x].original_url;
                if ( this.blocks[x].global ) block.frames_global = true;

                page.blocks.push(block);

            }

            return page;

        };

        /*
            generates the full page, using skeleton.html
        */
        this.fullPage = function() {

            var page = this;//reference to self for later
            page.scripts = [];//make sure it's empty, we'll store script URLs in there later

            var newDocMainParent = $('iframe#skeleton').contents().find( bConfig.pageContainer );

            //empty out the skeleton first
            $('iframe#skeleton').contents().find( bConfig.pageContainer ).html('');

            //remove old script tags
            $('iframe#skeleton').contents().find( 'script' ).each(function(){
                $(this).remove();
            });

            var theContents;

            for( var i in this.blocks ) {

                //grab the block content
                if (this.blocks[i].sandbox !== false) {

                    theContents = $('#sandboxes #'+this.blocks[i].sandbox).contents().find( bConfig.pageContainer ).clone();

                } else {

                    theContents = $(this.blocks[i].frameDocument.body).find( bConfig.pageContainer ).clone();

                }

                //remove video frameCovers
                theContents.find('.frameCover').each(function () {
                    $(this).remove();
                });

                //remove video frameWrappers
                theContents.find('.videoWrapper').each(function(){

                    var cnt = $(this).contents();
                    $(this).replaceWith(cnt);

                });

                //remove style leftovers from the style editor
                for( var key in bConfig.editableItems ) {

                    theContents.find( key ).each(function(){

                        $(this).removeAttr('data-selector');

                        $(this).css('outline', '');
                        $(this).css('outline-offset', '');
                        $(this).css('cursor', '');

                        if( $(this).attr('style') === '' ) {

                            $(this).removeAttr('style');

                        }

                    });

                }

                //remove style leftovers from the content editor
                for ( var x = 0; x < bConfig.editableContent.length; ++x) {

                    theContents.find( bConfig.editableContent[x] ).each(function(){

                        $(this).removeAttr('data-selector');

                    });

                }

                //append to DOM in the skeleton
                newDocMainParent.append( $(theContents.html()) );

                //do we need to inject any scripts?
                var scripts = $(this.blocks[i].frameDocument.body).find('script');
                var theIframe = document.getElementById("skeleton");

                if( scripts.size() > 0 ) {

                    scripts.each(function(){

                        var script;

                        if( $(this).text() !== '' ) {//script tags with content

                            script = theIframe.contentWindow.document.createElement("script");
                            script.type = 'text/javascript';
                            script.innerHTML = $(this).text();

                            theIframe.contentWindow.document.body.appendChild(script);

                        } else if( $(this).attr('src') !== null && page.scripts.indexOf($(this).attr('src')) === -1 ) {
                            //use indexOf to make sure each script only appears on the produced page once

                            script = theIframe.contentWindow.document.createElement("script");
                            script.type = 'text/javascript';
                            script.src = $(this).attr('src');

                            theIframe.contentWindow.document.body.appendChild(script);

                            page.scripts.push($(this).attr('src'));

                        }

                    });

                }

            }

        };


        /*
            Checks if all blocks on this page have finished loading
        */
        this.loaded = function () {

            var i;

            for ( i = 0; i <this.blocks.length; i++ ) {

                if ( !this.blocks[i].loaded ) return false;

            }

            return true;

        };

        /*
            clear out this page
        */
        this.clear = function() {

            var block = this.blocks.pop();

            while( block !== undefined ) {

                block.delete();

                block = this.blocks.pop();

            }

        };


        /*
            Height adjustment for all blocks on the page
        */
        this.heightAdjustment = function () {

            for ( var i = 0; i < this.blocks.length; i++ ) {
                this.blocks[i].heightAdjustment();
            }

        };


        //loop through the frames/blocks

        if( page.hasOwnProperty('blocks') ) {

            for( var x = 0; x < page.blocks.length; x++ ) {

                //create new Block

                var newBlock = new Block();

                page.blocks[x].src = appUI.siteUrl+"site/getframe/"+page.blocks[x].id;

                //sandboxed block?
                if( page.blocks[x].frames_sandbox === '1') {

                    newBlock.sandbox = true;
                    newBlock.sandbox_loader = page.blocks[x].frames_loaderfunction;

                }

                newBlock.frameID = page.blocks[x].frames_id;
                if ( page.blocks[x].frames_global === '1' ) newBlock.global = true;
                newBlock.createParentLI(page.blocks[x].frames_height);
                newBlock.createFrame(page.blocks[x]);
                newBlock.createFrameCover();
                newBlock.insertBlockIntoDom(this.parentUL);

                //add the block to the new page
                this.blocks.push(newBlock);

            }

        }

        //add this page to the site object
        site.sitePages.push( this );

        //plant the new UL in the DOM (on the canvas)
        site.divCanvas.appendChild(this.parentUL);

        //make the blocks/frames in each page sortable

        var thePage = this;

        $(this.parentUL).sortable({
            revert: true,
            placeholder: "drop-hover",
            handle: '.dragBlock',
            cancel: '',
            stop: function () {
                site.moveMode('off');
                site.setPendingChanges(true);
                if ( !site.loaded() ) builderUI.canvasLoading('on');
            },
            beforeStop: function(event, ui){

                //template or regular block?
                var attr = ui.item.attr('data-frames');

                var newBlock;

                if (typeof attr !== typeof undefined && attr !== false) {//template, build it

                    $('#start').hide();

                    //clear out all blocks on this page
                    thePage.clear();

                    //create the new frames
                    var frameIDs = ui.item.attr('data-frames').split('-');
                    var heights = ui.item.attr('data-heights').split('-');
                    var urls = ui.item.attr('data-originalurls').split('-');

                    for( var x = 0; x < frameIDs.length; x++) {

                        newBlock = new Block();
                        newBlock.createParentLI(heights[x]);

                        var frameData = {};

                        frameData.src = appUI.siteUrl+'site/getframe/'+frameIDs[x];
                        frameData.original_url = appUI.siteUrl+'site/getframe/'+frameIDs[x];
                        frameData.frames_height = heights[x];

                        newBlock.createFrame( frameData );
                        newBlock.createFrameCover();
                        newBlock.insertBlockIntoDom(thePage.parentUL);

                        //add the block to the new page
                        thePage.blocks.push(newBlock);

                        //dropped element, so we've got pending changes
                        site.setPendingChanges(true);

                    }

                    //set the tempateID
                    builderUI.templateID = ui.item.attr('data-pageid');

                    //make sure nothing gets dropped in the lsit
                    ui.item.html(null);

                    //delete drag place holder
                    $('body .ui-sortable-helper').remove();

                } else {//regular block

                    //are we dealing with a new block being dropped onto the canvas, or a reordering og blocks already on the canvas?

                    if( ui.item.find('.frameCover > button').size() > 0 ) {//re-ordering of blocks on canvas

                        //no need to create a new block object, we simply need to make sure the position of the existing block in the Site object
                        //is changed to reflect the new position of the block on th canvas

                        var frameID = ui.item.find('iframe').attr('id');
                        var newPos = ui.item.index();

                        site.activePage.setPosition(frameID, newPos);

                    } else {//new block on canvas

                        //new block
                        newBlock = new Block();

                        newBlock.placeOnCanvas(ui);

                    }

                }

            },
            start: function (event, ui) {

                site.moveMode('on');

                if( ui.item.find('.frameCover').size() !== 0 ) {
                    builderUI.frameContents = ui.item.find('iframe').contents().find( bConfig.pageContainer ).html();
                }

            },
            over: function(){

                $('#start').hide();

            }
        });

        //add to the pages menu
        this.menuItem = document.createElement('LI');
        this.menuItem.innerHTML = this.pageMenuTemplate;

        $(this.menuItem).find('a:first').text(pageName).attr('href', '#page'+counter);

        var theLink = $(this.menuItem).find('a:first').get(0);

        //bind some events
        this.menuItem.addEventListener('click', this, false);

        this.menuItem.querySelector('a.fileEdit').addEventListener('click', this, false);
        this.menuItem.querySelector('a.fileSave').addEventListener('click', this, false);
        this.menuItem.querySelector('a.fileDel').addEventListener('click', this, false);

        //add to the page link dropdown
        this.linksDropdownItem = document.createElement('OPTION');
        this.linksDropdownItem.setAttribute('value', pageName+".html");
        this.linksDropdownItem.text = pageName;

        builderUI.dropdownPageLinks.appendChild( this.linksDropdownItem );

        site.pagesMenu.appendChild(this.menuItem);

    }

    Page.prototype.handleEvent = function(event) {
        switch (event.type) {
            case "click":

                if( event.target.classList.contains('fileEdit') ) {

                    this.editPageName();

                } else if( event.target.classList.contains('fileSave') ) {

                    this.updatePageNameEvent(event.target);

                } else if( event.target.classList.contains('fileDel') ) {

                    var thePage = this;

                    $(builderUI.modalDeletePage).modal('show');

                    $(builderUI.modalDeletePage).off('click', '#deletePageConfirm').on('click', '#deletePageConfirm', function() {

                        thePage.delete();

                        $(builderUI.modalDeletePage).modal('hide');

                    });

                } else {

                    this.selectPage();

                }

        }
    };


    /*
        Block constructor
    */
    function Block () {

        this.frameID = 0;
        this.loaded = false;
        this.sandbox = false;
        this.sandbox_loader = '';
        this.status = '';//'', 'changed' or 'new'
        this.global = false;
        this.original_url = '';

        this.parentLI = {};
        this.frameCover = {};
        this.frame = {};
        this.frameDocument = {};
        this.frameHeight = 0;

        this.annot = {};
        this.annotTimeout = {};

        /*
            creates the parent container (LI)
        */
        this.createParentLI = function(height) {

            this.parentLI = document.createElement('LI');
            this.parentLI.setAttribute('class', 'element');
            //this.parentLI.setAttribute('style', 'height: '+height+'px');

        };

        /*
            creates the iframe on the canvas
        */
        this.createFrame = function(frame) {
            console.log(frame);
            this.frame = document.createElement('IFRAME');
            this.frame.setAttribute('frameborder', 0);
            this.frame.setAttribute('scrolling', 0);
            this.frame.setAttribute('src', frame.src);
            this.frame.setAttribute('data-originalurl', frame.original_url);
            this.original_url = frame.original_url;
            //this.frame.setAttribute('data-height', frame.frames_height);
            //this.frameHeight = frame.frames_height;

            $(this.frame).uniqueId();

            //sandbox?
            if( this.sandbox !== false ) {

                this.frame.setAttribute('data-loaderfunction', this.sandbox_loader);
                this.frame.setAttribute('data-sandbox', this.sandbox);

                //recreate the sandboxed iframe elsewhere
                var sandboxedFrame = $('<iframe src="'+frame.src+'" id="'+this.sandbox+'" sandbox="allow-same-origin"></iframe>');
                $('#sandboxes').append( sandboxedFrame );

            }

        };

        /*
            insert the iframe into the DOM on the canvas
        */
        this.insertBlockIntoDom = function(theUL) {

            this.parentLI.appendChild(this.frame);
            theUL.appendChild( this.parentLI );

            this.frame.addEventListener('load', this, false);

            builderUI.canvasLoading('on');

        };

        /*
            sets the frame document for the block's iframe
        */
        this.setFrameDocument = function() {
            console.log(this.frame);
            //set the frame document as well
            if( this.frame.contentDocument ) {
                this.frameDocument = this.frame.contentDocument;
            } else {
                this.frameDocument = this.frame.contentWindow.document;
            }

            //this.heightAdjustment();

        };

        /*
            creates the frame cover and block action button
        */
        this.createFrameCover = function() {

            //build the frame cover and block action buttons
            this.frameCover = document.createElement('DIV');
            this.frameCover.classList.add('frameCover');
            this.frameCover.classList.add('fresh');

            var delButton = document.createElement('BUTTON');
            delButton.setAttribute('class', 'btn btn-inverse btn-sm deleteBlock');
            delButton.setAttribute('type', 'button');
            delButton.innerHTML = '<i class="fui-trash"></i> <span>remove</span>';
            delButton.addEventListener('click', this, false);

            var resetButton = document.createElement('BUTTON');
            resetButton.setAttribute('class', 'btn btn-inverse btn-sm resetBlock');
            resetButton.setAttribute('type', 'button');
            resetButton.innerHTML = '<i class="fa fa-refresh"></i> <span>reset</span>';
            resetButton.addEventListener('click', this, false);

            var htmlButton = document.createElement('BUTTON');
            htmlButton.setAttribute('class', 'btn btn-inverse btn-sm htmlBlock');
            htmlButton.setAttribute('type', 'button');
            htmlButton.innerHTML = '<i class="fa fa-code"></i> <span>source</span>';
            htmlButton.addEventListener('click', this, false);

            var dragButton = document.createElement('BUTTON');
            dragButton.setAttribute('class', 'btn btn-inverse btn-sm dragBlock');
            dragButton.setAttribute('type', 'button');
            dragButton.innerHTML = '<i class="fa fa-arrows"></i> <span>Move</span>';
            dragButton.addEventListener('click', this, false);

            var globalLabel = document.createElement('LABEL');
            globalLabel.classList.add('checkbox');
            globalLabel.classList.add('primary');
            var globalCheckbox = document.createElement('INPUT');
            globalCheckbox.type = 'checkbox';
            globalCheckbox.setAttribute('data-toggle', 'checkbox');
            globalCheckbox.checked = this.global;
            globalLabel.appendChild(globalCheckbox);
            var globalText = document.createTextNode('Global');
            globalLabel.appendChild(globalText);

            var trigger = document.createElement('span');
            trigger.classList.add('fui-gear');

            this.frameCover.appendChild(delButton);
            this.frameCover.appendChild(resetButton);
            this.frameCover.appendChild(htmlButton);
            this.frameCover.appendChild(dragButton);
            this.frameCover.appendChild(globalLabel);
            this.frameCover.appendChild(trigger);

            this.parentLI.appendChild(this.frameCover);

            var theBlock = this;

            $(globalCheckbox).on('change', function (e) {

                theBlock.toggleGlobal(e);

            }).radiocheck();

        };


        /*

        */
        this.toggleGlobal = function (e) {

            if ( e.currentTarget.checked ) this.global = true;
            else this.global = false;

            //we've got pending changes
            site.setPendingChanges(true);

            console.log(this);

        };


        /*
            automatically corrects the height of the block's iframe depending on its content
        */
        this.heightAdjustment = function() {

            if ( Object.keys(this.frameDocument).length !== 0 ) {

                var height,
                    bodyHeight = this.frameDocument.body.offsetHeight,
                    pageContainerHeight = this.frameDocument.body.querySelector( bConfig.pageContainer ).offsetHeight;

                if ( bodyHeight > pageContainerHeight && !this.frameDocument.body.classList.contains( bConfig.bodyPaddingClass ) ) height = pageContainerHeight;
                else height = bodyHeight;

                this.frame.style.height = height+"px";
                this.parentLI.style.height = height+"px";
                //this.frameCover.style.height = height+"px";

                this.frameHeight = height;

            }

        };

        /*
            deletes a block
        */
        this.delete = function() {

            //remove from DOM/canvas with a nice animation
            $(this.frame.parentNode).fadeOut(500, function(){

                this.remove();

                site.activePage.isEmpty();

            });

            //remove from blocks array in the active page
            site.activePage.deleteBlock(this);

            //sanbox
            if( this.sanbdox ) {
                document.getElementById( this.sandbox ).remove();
            }

            //element was deleted, so we've got pending change
            site.setPendingChanges(true);

        };

        /*
            resets a block to it's orignal state
        */
        this.reset = function (fireEvent) {

            if ( typeof fireEvent === 'undefined') fireEvent = true;

            //reset frame by reloading it
            this.frame.contentWindow.location = this.frame.getAttribute('data-originalurl');

            //sandbox?
            if( this.sandbox ) {
                var sandboxFrame = document.getElementById(this.sandbox).contentWindow.location.reload();
            }

            //element was deleted, so we've got pending changes
            site.setPendingChanges(true);

            builderUI.canvasLoading('on');

            if ( fireEvent ) publisher.publish('onBlockChange', this, 'reload');

        };

        /*
            launches the source code editor
        */
        this.source = function() {

            //hide the iframe
            this.frame.style.display = 'none';

            //disable sortable on the parentLI
            $(this.parentLI.parentNode).sortable('disable');

            //built editor element
            var theEditor = document.createElement('DIV');
            theEditor.classList.add('aceEditor');
            $(theEditor).uniqueId();

            this.parentLI.appendChild(theEditor);

            //build and append error drawer
            var newLI = document.createElement('LI');
            var errorDrawer = document.createElement('DIV');
            errorDrawer.classList.add('errorDrawer');
            errorDrawer.setAttribute('id', 'div_errorDrawer');
            errorDrawer.innerHTML = '<button type="button" class="btn btn-xs btn-embossed btn-default button_clearErrorDrawer" id="button_clearErrorDrawer">CLEAR</button>';
            newLI.appendChild(errorDrawer);
            errorDrawer.querySelector('button').addEventListener('click', this, false);
            this.parentLI.parentNode.insertBefore(newLI, this.parentLI.nextSibling);

            ace.config.set("basePath", "/js/vendor/ace");

            var theId = theEditor.getAttribute('id');
            var editor = ace.edit( theId );

            //editor.getSession().setUseWrapMode(true);

            var pageContainer = this.frameDocument.querySelector( bConfig.pageContainer );
            var theHTML = pageContainer.innerHTML;


            editor.setValue( theHTML );
            editor.setTheme("ace/theme/twilight");
            editor.getSession().setMode("ace/mode/html");

            var block = this;


            editor.getSession().on("changeAnnotation", function(){

                block.annot = editor.getSession().getAnnotations();

                clearTimeout(block.annotTimeout);

                var timeoutCount;

                if( $('#div_errorDrawer p').size() === 0 ) {
                    timeoutCount = bConfig.sourceCodeEditSyntaxDelay;
                } else {
                    timeoutCount = 100;
                }

                block.annotTimeout = setTimeout(function(){

                    for (var key in block.annot){

                        if (block.annot.hasOwnProperty(key)) {

                            if( block.annot[key].text !== "Start tag seen without seeing a doctype first. Expected e.g. <!DOCTYPE html>." ) {

                                var newLine = $('<p></p>');
                                var newKey = $('<b>'+block.annot[key].type+': </b>');
                                var newInfo = $('<span> '+block.annot[key].text + "on line " + " <b>" + block.annot[key].row+'</b></span>');
                                newLine.append( newKey );
                                newLine.append( newInfo );

                                $('#div_errorDrawer').append( newLine );

                            }

                        }

                    }

                    if( $('#div_errorDrawer').css('display') === 'none' && $('#div_errorDrawer').find('p').size() > 0 ) {
                        $('#div_errorDrawer').slideDown();
                    }

                }, timeoutCount);


            });

            //buttons
            var cancelButton = document.createElement('BUTTON');
            cancelButton.setAttribute('type', 'button');
            cancelButton.classList.add('btn');
            cancelButton.classList.add('btn-danger');
            cancelButton.classList.add('editCancelButton');
            cancelButton.classList.add('btn-sm');
            cancelButton.innerHTML = '<i class="fui-cross"></i> <span>Cancel</span>';
            cancelButton.addEventListener('click', this, false);

            var saveButton = document.createElement('BUTTON');
            saveButton.setAttribute('type', 'button');
            saveButton.classList.add('btn');
            saveButton.classList.add('btn-primary');
            saveButton.classList.add('editSaveButton');
            saveButton.classList.add('btn-sm');
            saveButton.innerHTML = '<i class="fui-check"></i> <span>Save</span>';
            saveButton.addEventListener('click', this, false);

            var buttonWrapper = document.createElement('DIV');
            buttonWrapper.classList.add('editorButtons');

            buttonWrapper.appendChild( cancelButton );
            buttonWrapper.appendChild( saveButton );

            this.parentLI.appendChild( buttonWrapper );

            builderUI.aceEditors[ theId ] = editor;

        };

        /*
            cancels the block source code editor
        */
        this.cancelSourceBlock = function() {

            //enable draggable on the LI
            $(this.parentLI.parentNode).sortable('enable');

            //delete the errorDrawer
            $(this.parentLI.nextSibling).remove();

            //delete the editor
            this.parentLI.querySelector('.aceEditor').remove();
            $(this.frame).fadeIn(500);

            $(this.parentLI.querySelector('.editorButtons')).fadeOut(500, function(){
                $(this).remove();
            });

        };

        /*
            updates the blocks source code
        */
        this.saveSourceBlock = function() {

            //enable draggable on the LI
            $(this.parentLI.parentNode).sortable('enable');

            var theId = this.parentLI.querySelector('.aceEditor').getAttribute('id');
            var theContent = builderUI.aceEditors[theId].getValue();

            //delete the errorDrawer
            document.getElementById('div_errorDrawer').parentNode.remove();

            //delete the editor
            this.parentLI.querySelector('.aceEditor').remove();

            //update the frame's content
            this.frameDocument.querySelector( bConfig.pageContainer ).innerHTML = theContent;
            this.frame.style.display = 'block';

            //sandboxed?
            if( this.sandbox ) {

                var sandboxFrame = document.getElementById( this.sandbox );
                var sandboxFrameDocument = sandboxFrame.contentDocument || sandboxFrame.contentWindow.document;

                builderUI.tempFrame = sandboxFrame;

                sandboxFrameDocument.querySelector( bConfig.pageContainer ).innerHTML = theContent;

                //do we need to execute a loader function?
                if( this.sandbox_loader !== '' ) {

                    /*
                    var codeToExecute = "sandboxFrame.contentWindow."+this.sandbox_loader+"()";
                    var tmpFunc = new Function(codeToExecute);
                    tmpFunc();
                    */

                }

            }

            $(this.parentLI.querySelector('.editorButtons')).fadeOut(500, function(){
                $(this).remove();
            });

            //adjust height of the frame
            this.heightAdjustment();

            //new page added, we've got pending changes
            site.setPendingChanges(true);

            //block has changed
            this.status = 'changed';

            publisher.publish('onBlockChange', this, 'change');
            publisher.publish('onBlockLoaded', this);

        };

        /*
            clears out the error drawer
        */
        this.clearErrorDrawer = function() {

            var ps = this.parentLI.nextSibling.querySelectorAll('p');

            for( var i = 0; i < ps.length; i++ ) {
                ps[i].remove();
            }

        };

        /*
            toggles the visibility of this block's frameCover
        */
        this.toggleCover = function(onOrOff) {

            if( onOrOff === 'On' ) {

                this.parentLI.querySelector('.frameCover').style.display = 'block';

            } else if( onOrOff === 'Off' ) {

                this.parentLI.querySelector('.frameCover').style.display = 'none';

            }

        };

        /*
            returns the full source code of the block's frame
        */
        this.getSource = function() {

            var source = "<html>";
            source += this.frameDocument.head.outerHTML;
            source += this.frameDocument.body.outerHTML;

            return source;

        };

        /*
            places a dragged/dropped block from the left sidebar onto the canvas
        */
        this.placeOnCanvas = function(ui) {

            //frame data, we'll need this before messing with the item's content HTML
            var frameData = {}, attr;

            if( ui.item.find('iframe').size() > 0 ) {//iframe thumbnail

                frameData.src = ui.item.find('iframe').attr('src');
                frameData.original_url = ui.item.find('iframe').attr('src');
                frameData.frames_height = ui.item.height();

                //sandboxed block?
                attr = ui.item.find('iframe').attr('sandbox');

                if (typeof attr !== typeof undefined && attr !== false) {
                    this.sandbox = siteBuilderUtils.getRandomArbitrary(10000, 1000000000);
                    this.sandbox_loader = ui.item.find('iframe').attr('data-loaderfunction');
                }

            } else {//image thumbnail

                frameData.src = ui.item.find('img').attr('data-srcc');
                frameData.original_url = ui.item.find('img').attr('data-srcc');
                frameData.frames_height = ui.item.find('img').attr('data-height');

                //sandboxed block?
                attr = ui.item.find('img').attr('data-sandbox');

                if (typeof attr !== typeof undefined && attr !== false) {
                    this.sandbox = siteBuilderUtils.getRandomArbitrary(10000, 1000000000);
                    this.sandbox_loader = ui.item.find('img').attr('data-loaderfunction');
                }

            }

            //create the new block object
            this.frameID = 0;
            this.parentLI = ui.item.get(0);
            this.parentLI.innerHTML = '';
            this.status = 'new';
            this.createFrame(frameData);
            this.parentLI.style.height = this.frameHeight+"px";
            this.createFrameCover();

            this.frame.addEventListener('load', this);

            //insert the created iframe
            ui.item.append($(this.frame));

            //add the block to the current page
            site.activePage.blocks.splice(ui.item.index(), 0, this);

            //custom event
            ui.item.find('iframe').trigger('canvasupdated');

            //dropped element, so we've got pending changes
            site.setPendingChanges(true);

        };

        /*
            injects external JS (defined in config.js) into the block
        */
        this.loadJavascript = function () {

            var i,
                old,
                newScript;

            //remove old ones
            old = this.frameDocument.querySelectorAll('script.builder');

            for ( i = 0; i < old.length; i++ ) old[i].remove();

            //inject
            for ( i = 0; i < bConfig.externalJS.length; i++ ) {

                newScript = document.createElement('SCRIPT');
                newScript.classList.add('builder');
                newScript.src = bConfig.externalJS[i];

                this.frameDocument.querySelector('body').appendChild(newScript);

            }

        };


        /*
            Checks if this block has external stylesheet
        */
        this.hasExternalCSS = function (src) {

            var externalCss,
                x;

            externalCss = this.frameDocument.querySelectorAll('link[href*="' + src + '"]');

            return externalCss.length !== 0;

        };

    }

    Block.prototype.handleEvent = function(event) {
        switch (event.type) {
            case "load":
                this.setFrameDocument();
                this.heightAdjustment();
                this.loadJavascript();

                $(this.frameCover).removeClass('fresh', 500);

                publisher.publish('onBlockLoaded', this);

                this.loaded = true;

                builderUI.canvasLoading('off');

                break;

            case "click":

                var theBlock = this;

                //figure out what to do next

                if( event.target.classList.contains('deleteBlock') || event.target.parentNode.classList.contains('deleteBlock') ) {//delete this block

                    $(builderUI.modalDeleteBlock).modal('show');

                    $(builderUI.modalDeleteBlock).off('click', '#deleteBlockConfirm').on('click', '#deleteBlockConfirm', function(){
                        theBlock.delete(event);
                        $(builderUI.modalDeleteBlock).modal('hide');
                    });

                } else if( event.target.classList.contains('resetBlock') || event.target.parentNode.classList.contains('resetBlock') ) {//reset the block

                    $(builderUI.modalResetBlock).modal('show');

                    $(builderUI.modalResetBlock).off('click', '#resetBlockConfirm').on('click', '#resetBlockConfirm', function(){
                        theBlock.reset();
                        $(builderUI.modalResetBlock).modal('hide');
                    });

                } else if( event.target.classList.contains('htmlBlock') || event.target.parentNode.classList.contains('htmlBlock') ) {//source code editor

                    theBlock.source();

                } else if( event.target.classList.contains('editCancelButton') || event.target.parentNode.classList.contains('editCancelButton') ) {//cancel source code editor

                    theBlock.cancelSourceBlock();

                } else if( event.target.classList.contains('editSaveButton') || event.target.parentNode.classList.contains('editSaveButton') ) {//save source code

                    theBlock.saveSourceBlock();

                } else if( event.target.classList.contains('button_clearErrorDrawer') ) {//clear error drawer

                    theBlock.clearErrorDrawer();

                }

        }
    };


    /*
        Site object literal
    */
    /*jshint -W003 */
    var site = {

        pendingChanges: false,      //pending changes or no?
        pages: {},                  //array containing all pages, including the child frames, loaded from the server on page load
        is_admin: 0,                //0 for non-admin, 1 for admin
        data: {},                   //container for ajax loaded site data
        pagesToDelete: [],          //contains pages to be deleted

        sitePages: [],              //this is the only var containing the recent canvas contents

        sitePagesReadyForServer: {},     //contains the site data ready to be sent to the server

        activePage: {},             //holds a reference to the page currently open on the canvas

        pageTitle: document.getElementById('pageTitle'),//holds the page title of the current page on the canvas

        divCanvas: document.getElementById('pageList'),//DIV containing all pages on the canvas

        pagesMenu: document.getElementById('pages'), //UL containing the pages menu in the sidebar

        buttonNewPage: document.getElementById('addPage'),
        liNewPage: document.getElementById('newPageLI'),

        inputPageSettingsTitle: document.getElementById('pageData_title'),
        inputPageSettingsMetaDescription: document.getElementById('pageData_metaDescription'),
        inputPageSettingsMetaKeywords: document.getElementById('pageData_metaKeywords'),
        inputPageSettingsIncludes: document.getElementById('pageData_headerIncludes'),
        inputPageSettingsPageCss: document.getElementById('pageData_headerCss'),

        buttonSubmitPageSettings: document.getElementById('pageSettingsSubmittButton'),

        modalPageSettings: document.getElementById('pageSettingsModal'),

        buttonSave: document.getElementById('savePage'),

        messageStart: document.getElementById('start'),
        divFrameWrapper: document.getElementById('frameWrapper'),

        skeleton: document.getElementById('skeleton'),

		autoSaveTimer: {},

        init: function() {

            $.getJSON(appUI.siteUrl+"siteData", function(data){

                if( data.site !== undefined ) {
                    site.data = data.site;
                }
                if( data.pages !== undefined ) {
                    site.pages = data.pages;
                }

                site.is_admin = data.is_admin;

				if( $('#pageList').size() > 0 ) {
                	builderUI.populateCanvas();
				}

                if( data.site.viewmode ) {
                    publisher.publish('onSetMode', data.site.viewmode);
                }

                //fire custom event
                $('body').trigger('siteDataLoaded');

            });

            $(this.buttonNewPage).on('click', site.newPage);
            $(this.modalPageSettings).on('show.bs.modal', site.loadPageSettings);
            $(this.buttonSubmitPageSettings).on('click', site.updatePageSettings);
            $(this.buttonSave).on('click', function(){site.save(true);});

            //auto save time
            this.autoSaveTimer = setTimeout(site.autoSave, bConfig.autoSaveTimeout);

            publisher.subscribe('onBlockChange', function (block, type) {

                if ( block.global ) {

                    for ( var i = 0; i < site.sitePages.length; i++ ) {

                        for ( var y = 0; y < site.sitePages[i].blocks.length; y ++ ) {

                            if ( site.sitePages[i].blocks[y] !== block && site.sitePages[i].blocks[y].original_url === block.original_url && site.sitePages[i].blocks[y].global ) {

                                if ( type === 'change' ) {

                                    site.sitePages[i].blocks[y].frameDocument.body = block.frameDocument.body.cloneNode(true);

                                    publisher.publish('onBlockLoaded', site.sitePages[i].blocks[y]);

                                } else if ( type === 'reload' ) {

                                    site.sitePages[i].blocks[y].reset(false);

                                }

                            }

                        }

                    }

                }

            });

        },

        autoSave: function(){

            if(site.pendingChanges) {
                site.save(false);
            }

			window.clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(site.autoSave, bConfig.autoSaveTimeout);

        },

        setPendingChanges: function(value) {

            this.pendingChanges = value;

            if( value === true ) {

				//reset timer
				window.clearInterval(this.autoSaveTimer);
            	this.autoSaveTimer = setTimeout(site.autoSave, bConfig.autoSaveTimeout);

                $('#savePage .bLabel').text("Save now (!)");

                if( site.activePage.status !== 'new' ) {

                    site.activePage.status = 'changed';

                }

            } else {

                $('#savePage .bLabel').text("Nothing to save");

                site.updatePageStatus('');

            }

        },

        save: function(showConfirmModal) {

            publisher.publish('onBeforeSave');

            //fire custom event
            $('body').trigger('beforeSave');

            //disable button
            $("a#savePage").addClass('disabled');

            //remove old alerts
            $('#errorModal .modal-body > *, #successModal .modal-body > *').each(function(){
                $(this).remove();
            });

            site.prepForSave(false);

            var serverData = {};
            serverData.pages = this.sitePagesReadyForServer;
            if( this.pagesToDelete.length > 0 ) {
                serverData.toDelete = this.pagesToDelete;
            }

            console.log(this.data);

            serverData.siteData = this.data;

            //store current responsive mode as well
            serverData.siteData.responsiveMode = builderUI.currentResponsiveMode;

            $.ajax({
                url: appUI.siteUrl+"site/save",
                type: "POST",
                dataType: "json",
                data: serverData,
            }).done(function(res){

                //enable button
                $("a#savePage").removeClass('disabled');

                if( res.responseCode === 0 ) {

                    if( showConfirmModal ) {

                        $('#errorModal .modal-body').append( $(res.responseHTML) );
                        $('#errorModal').modal('show');

                    }

                } else if( res.responseCode === 1 ) {

                    if( showConfirmModal ) {

                        $('#successModal .modal-body').append( $(res.responseHTML) );
                        $('#successModal').modal('show');

                    }


                    //no more pending changes
                    site.setPendingChanges(false);


                    //update revisions?
                    $('body').trigger('changePage');

                }
            });

        },

        /*
            preps the site data before sending it to the server
        */
        prepForSave: function(template) {

            this.sitePagesReadyForServer = {};

            if( template ) {//saving template, only the activePage is needed

                this.sitePagesReadyForServer[this.activePage.name] = this.activePage.prepForSave();

                this.activePage.fullPage();

            } else {//regular save

                //find the pages which need to be send to the server
                for( var i = 0; i < this.sitePages.length; i++ ) {

                    if( this.sitePages[i].status !== '' ) {

                        this.sitePagesReadyForServer[this.sitePages[i].name] = this.sitePages[i].prepForSave();

                    }

                }

            }

        },


        /*
            sets a page as the active one
        */
        setActive: function(page) {

            //reference to the active page
            this.activePage = page;

            //hide other pages
            for(var i in this.sitePages) {
                this.sitePages[i].parentUL.style.display = 'none';
            }

            //display active one
            this.activePage.parentUL.style.display = 'block';

        },


        /*
            de-active all page menu items
        */
        deActivateAll: function() {

            var pages = this.pagesMenu.querySelectorAll('li');

            for( var i = 0; i < pages.length; i++ ) {
                pages[i].classList.remove('active');
            }

        },


        /*
            adds a new page to the site
        */
        newPage: function() {

            site.deActivateAll();

            //create the new page instance

            var pageData = [];
            var temp = {
                pages_id: 0
            };
            pageData[0] = temp;

            var newPageName = 'page'+(site.sitePages.length+1);

            var newPage = new Page(newPageName, pageData, site.sitePages.length+1);

            newPage.status = 'new';

            newPage.selectPage();
            newPage.editPageName();

            newPage.isEmpty();

            site.setPendingChanges(true);

        },


        /*
            checks if the name of a page is allowed
        */
        checkPageName: function(pageName) {

            //make sure the name is unique
            for( var i in this.sitePages ) {

                if( this.sitePages[i].name === pageName && this.activePage !== this.sitePages[i] ) {
                    this.pageNameError = "The page name must be unique.";
                    return false;
                }

            }

            return true;

        },


        /*
            removes unallowed characters from the page name
        */
        prepPageName: function(pageName) {

            pageName = pageName.replace(' ', '');
            pageName = pageName.replace(/[?*!.|&#;$%@"<>()+,]/g, "");

            return pageName;

        },


        /*
            save page settings for the current page
        */
        updatePageSettings: function() {

            site.activePage.pageSettings.title = site.inputPageSettingsTitle.value;
            site.activePage.pageSettings.meta_description = site.inputPageSettingsMetaDescription.value;
            site.activePage.pageSettings.meta_keywords = site.inputPageSettingsMetaKeywords.value;
            site.activePage.pageSettings.header_includes = site.inputPageSettingsIncludes.value;
            site.activePage.pageSettings.page_css = site.inputPageSettingsPageCss.value;

            site.setPendingChanges(true);

            $(site.modalPageSettings).modal('hide');

        },


        /*
            update page statuses
        */
        updatePageStatus: function(status) {

            for( var i in this.sitePages ) {
                this.sitePages[i].status = status;
            }

        },


        /*
            Checks all the blocks in this site have finished loading
        */
        loaded: function () {

            var i;

            for ( i = 0; i < this.sitePages.length; i++ ) {

                if ( !this.sitePages[i].loaded() ) return false;

            }

            return true;

        },


        /*
            Make every block have an overlay during dragging to prevent mouse event issues
        */
        moveMode: function (value) {

            var i;

            for ( i = 0; i < this.activePage.blocks.length; i++ ) {

                if ( value === 'on' ) this.activePage.blocks[i].frameCover.classList.add('move');
                else if ( value === 'off' ) this.activePage.blocks[i].frameCover.classList.remove('move');

            }

        }

    };

    builderUI.init(); site.init();


    //**** EXPORTS
    module.exports.site = site;
    module.exports.builderUI = builderUI;

}());
},{"../vendor/publisher":10,"./config.js":3,"./ui.js":7,"./utils.js":8}],3:[function(require,module,exports){
(function () {
	"use strict";

    module.exports.pageContainer = "#page";

    module.exports.bodyPaddingClass = "bPadding";

    module.exports.editableItems = {
        'span.fa': ['color', 'font-size'],
        '.bg.bg1': ['background-color'],
        'nav a': ['color', 'font-weight', 'text-transform'],
        'img': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-color', 'border-style', 'border-width'],
        'hr.dashed': ['border-color', 'border-width'],
        '.divider > span': ['color', 'font-size'],
        'hr.shadowDown': ['margin-top', 'margin-bottom'],
        '.footer a': ['color'],
        '.social a': ['color'],
        '.bg.bg1, .bg.bg2, .header10, .header11': ['background-image', 'background-color'],
        '.frameCover': [],
        '.editContent': ['content', 'color', 'font-size', 'background-color', 'font-family'],
        'a.btn, button.btn': ['border-radius', 'font-size', 'background-color'],
        '#pricing_table2 .pricing2 .bottom li': ['content']
    };

    module.exports.editableItemOptions = {
        'nav a : font-weight': ['400', '700'],
        'a.btn : border-radius': ['0px', '4px', '10px'],
        'img : border-style': ['none', 'dotted', 'dashed', 'solid'],
        'img : border-width': ['1px', '2px', '3px', '4px'],
        'h1, h2, h3, h4, h5, p : font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman'],
        'h2 : font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman'],
        'h3 : font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman'],
        'p : font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman']
    };

    module.exports.responsiveModes = {
        desktop: '97%',
        mobile: '480px',
        tablet: '1024px'
    };

    module.exports.editableContent = ['.editContent', '.navbar a', 'button', 'a.btn', '.footer a:not(.fa)', '.tableWrapper', 'h1', 'h2'];

    module.exports.autoSaveTimeout = 300000;

    module.exports.sourceCodeEditSyntaxDelay = 10000;

    module.exports.mediumCssUrls = [
        '//cdn.jsdelivr.net/medium-editor/latest/css/medium-editor.min.css',
        '/src/css/medium-bootstrap.css'
    ];
    module.exports.mediumButtons = ['bold', 'italic', 'underline', 'anchor', 'orderedlist', 'unorderedlist', 'h1', 'h2', 'h3', 'h4', 'removeFormat'];

    module.exports.externalJS = [
        'src/js/builder_in_block.js'
    ];

}());
},{}],4:[function(require,module,exports){
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
},{"./builder.js":2,"./config.js":3,"./ui.js":7}],5:[function(require,module,exports){
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
},{"./ui.js":7}],6:[function(require,module,exports){
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
},{"./ui.js":7}],7:[function(require,module,exports){
(function () {

/* globals siteUrl:false, baseUrl:false */
    "use strict";
        
    var appUI = {
        
        firstMenuWidth: 190,
        secondMenuWidth: 300,
        loaderAnimation: document.getElementById('loader'),
        secondMenuTriggerContainers: $('#menu #main #elementCats, #menu #main #templatesUl'),
        siteUrl: siteUrl,
        baseUrl: baseUrl,
        
        setup: function(){
            
            // Fade the loader animation
            $(appUI.loaderAnimation).fadeOut(function(){
                $('#menu').animate({'left': -appUI.firstMenuWidth}, 1000);
            });
            
            // Tabs
            $(".nav-tabs a").on('click', function (e) {
                e.preventDefault();
                $(this).tab("show");
            });
            
            $("select.select").select2();
            
            $(':radio, :checkbox').radiocheck();
            
            // Tooltips
            $("[data-toggle=tooltip]").tooltip("hide");
            
            // Table: Toggle all checkboxes
            $('.table .toggle-all :checkbox').on('click', function () {
                var $this = $(this);
                var ch = $this.prop('checked');
                $this.closest('.table').find('tbody :checkbox').radiocheck(!ch ? 'uncheck' : 'check');
            });
            
            // Add style class name to a tooltips
            $(".tooltip").addClass(function() {
                if ($(this).prev().attr("data-tooltip-style")) {
                    return "tooltip-" + $(this).prev().attr("data-tooltip-style");
                }
            });
            
            $(".btn-group").on('click', "a", function() {
                $(this).siblings().removeClass("active").end().addClass("active");
            });
            
            // Focus state for append/prepend inputs
            $('.input-group').on('focus', '.form-control', function () {
                $(this).closest('.input-group, .form-group').addClass('focus');
            }).on('blur', '.form-control', function () {
                $(this).closest('.input-group, .form-group').removeClass('focus');
            });
            
            // Table: Toggle all checkboxes
            $('.table .toggle-all').on('click', function() {
                var ch = $(this).find(':checkbox').prop('checked');
                $(this).closest('.table').find('tbody :checkbox').checkbox(!ch ? 'check' : 'uncheck');
            });
            
            // Table: Add class row selected
            $('.table tbody :checkbox').on('check uncheck toggle', function (e) {
                var $this = $(this)
                , check = $this.prop('checked')
                , toggle = e.type === 'toggle'
                , checkboxes = $('.table tbody :checkbox')
                , checkAll = checkboxes.length === checkboxes.filter(':checked').length;

                $this.closest('tr')[check ? 'addClass' : 'removeClass']('selected-row');
                if (toggle) $this.closest('.table').find('.toggle-all :checkbox').checkbox(checkAll ? 'check' : 'uncheck');
            });
            
            // Switch
            $("[data-toggle='switch']").wrap('<div class="switch" />').parent().bootstrapSwitch();
                        
            appUI.secondMenuTriggerContainers.on('click', 'a:not(.btn)', appUI.secondMenuAnimation);
                        
        },
        
        secondMenuAnimation: function(){
        
            $('#menu #main a').removeClass('active');
            $(this).addClass('active');
	
            //show only the right elements
            $('#menu #second ul li').hide();
            $('#menu #second ul li.'+$(this).attr('id')).show();

            if( $(this).attr('id') === 'all' ) {
                $('#menu #second ul#elements li').show();		
            }
	
            $('.menu .second').css('display', 'block').stop().animate({
                width: appUI.secondMenuWidth
            }, 500);	
                
        }
        
    };
    
    //initiate the UI
    appUI.setup();


    //**** EXPORTS
    module.exports.appUI = appUI;
    
}());
},{}],8:[function(require,module,exports){
(function () {
    "use strict";
    
    exports.getRandomArbitrary = function(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    };

    exports.getParameterByName = function (name, url) {

        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
        
    };
    
}());
},{}],9:[function(require,module,exports){
(function () {
	"use strict";

	require('./modules/ui.js');
	require('./modules/account.js');
	require('./modules/sites.js');
	require('./modules/sitesettings.js');
	require('./modules/publishing.js');

}());
},{"./modules/account.js":1,"./modules/publishing.js":4,"./modules/sites.js":5,"./modules/sitesettings.js":6,"./modules/ui.js":7}],10:[function(require,module,exports){
/*!
 * publisher.js - (c) Ryan Florence 2011
 * github.com/rpflorence/publisher.js
 * MIT License
*/

// UMD Boilerplate \o/ && D:
(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(); // node
  } else if (typeof define === 'function' && define.amd) {
    define(factory); // amd
  } else {
    // window with noConflict
    var _publisher = root.publisher;
    var publisher = root.publisher = factory();
    root.publisher.noConflict = function () {
      root.publisher = _publisher;
      return publisher;
    }
  }
}(this, function () {

  var publisher = function (obj) {
    var topics = {};
    obj = obj || {};

    obj.publish = function (topic/*, messages...*/) {
      if (!topics[topic]) return obj;
      var messages = [].slice.call(arguments, 1);
      for (var i = 0, l = topics[topic].length; i < l; i++) {
        topics[topic][i].handler.apply(topics[topic][i].context, messages);
      }
      return obj;
    };

    obj.subscribe = function (topicOrSubscriber, handlerOrTopics) {
      var firstType = typeof topicOrSubscriber;

      if (firstType === 'string') {
        return subscribe.apply(null, arguments);
      }

      if (firstType === 'object' && !handlerOrTopics) {
        return subscribeMultiple.apply(null, arguments);
      }

      if (typeof handlerOrTopics === 'string') {
        return hitch.apply(null, arguments);
      }

      return hitchMultiple.apply(null, arguments);
    };

    function subscribe (topic, handler, context) {
      var reference = { handler: handler, context: context || obj };
      topic = topics[topic] || (topics[topic] = []);
      topic.push(reference);
      return {
        attach: function () {
          topic.push(reference);
          return this;
        },
        detach: function () {
          erase(topic, reference);
          return this;
        }
      };
    };

    function subscribeMultiple (pairs) {
      var subscriptions = {};
      for (var topic in pairs) {
        if (!pairs.hasOwnProperty(topic)) continue;
        subscriptions[topic] = subscribe(topic, pairs[topic]);
      }
      return subscriptions;
    };

    function hitch (subscriber, topic) {
      return subscribe(topic, subscriber[topic], subscriber);
    };

    function hitchMultiple (subscriber, topics) {
      var subscriptions = [];
      for (var i = 0, l = topics.length; i < l; i++) {
        subscriptions.push( hitch(subscriber, topics[i]) );
      }
      return subscriptions;
    };

    function erase (arr, victim) {
      for (var i = 0, l = arr.length; i < l; i++){
        if (arr[i] === victim) arr.splice(i, 1);
      }
    }

    return obj;
  };

  // publisher is a publisher, so meta ...
  return publisher(publisher);
}));

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvc3JjL2pzL21vZHVsZXMvYWNjb3VudC5qcyIsInB1YmxpYy9zcmMvanMvbW9kdWxlcy9idWlsZGVyLmpzIiwicHVibGljL3NyYy9qcy9tb2R1bGVzL2NvbmZpZy5qcyIsInB1YmxpYy9zcmMvanMvbW9kdWxlcy9wdWJsaXNoaW5nLmpzIiwicHVibGljL3NyYy9qcy9tb2R1bGVzL3NpdGVzLmpzIiwicHVibGljL3NyYy9qcy9tb2R1bGVzL3NpdGVzZXR0aW5ncy5qcyIsInB1YmxpYy9zcmMvanMvbW9kdWxlcy91aS5qcyIsInB1YmxpYy9zcmMvanMvbW9kdWxlcy91dGlscy5qcyIsInB1YmxpYy9zcmMvanMvc2l0ZXMuanMiLCJwdWJsaWMvc3JjL2pzL3ZlbmRvci9wdWJsaXNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBhcHBVSSA9IHJlcXVpcmUoJy4vdWkuanMnKS5hcHBVSTtcblxuICAgIHZhciBhY2NvdW50ID0ge1xuXG4gICAgICAgIGJ1dHRvblVwZGF0ZUFjY291bnREZXRhaWxzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjb3VudERldGFpbHNTdWJtaXQnKSxcbiAgICAgICAgYnV0dG9uVXBkYXRlTG9naW5EZXRhaWxzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWNjb3VudExvZ2luU3VibWl0JyksXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICQodGhpcy5idXR0b25VcGRhdGVBY2NvdW50RGV0YWlscykub24oJ2NsaWNrJywgdGhpcy51cGRhdGVBY2NvdW50RGV0YWlscyk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uVXBkYXRlTG9naW5EZXRhaWxzKS5vbignY2xpY2snLCB0aGlzLnVwZGF0ZUxvZ2luRGV0YWlscyk7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICB1cGRhdGVzIGFjY291bnQgZGV0YWlsc1xuICAgICAgICAqL1xuICAgICAgICB1cGRhdGVBY2NvdW50RGV0YWlsczogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vYWxsIGZpZWxkcyBmaWxsZWQgaW4/XG5cbiAgICAgICAgICAgIHZhciBhbGxHb29kID0gMTtcblxuICAgICAgICAgICAgaWYoICQoJyNhY2NvdW50X2RldGFpbHMgaW5wdXQjZmlyc3RuYW1lJykudmFsKCkgPT09ICcnICkge1xuICAgICAgICAgICAgICAgICQoJyNhY2NvdW50X2RldGFpbHMgaW5wdXQjZmlyc3RuYW1lJykuY2xvc2VzdCgnLmZvcm0tZ3JvdXAnKS5hZGRDbGFzcygnaGFzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgYWxsR29vZCA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoJyNhY2NvdW50X2RldGFpbHMgaW5wdXQjZmlyc3RuYW1lJykuY2xvc2VzdCgnLmZvcm0tZ3JvdXAnKS5yZW1vdmVDbGFzcygnaGFzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgYWxsR29vZCA9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCAkKCcjYWNjb3VudF9kZXRhaWxzIGlucHV0I2xhc3RuYW1lJykudmFsKCkgPT09ICcnICkge1xuICAgICAgICAgICAgICAgICQoJyNhY2NvdW50X2RldGFpbHMgaW5wdXQjbGFzdG5hbWUnKS5jbG9zZXN0KCcuZm9ybS1ncm91cCcpLmFkZENsYXNzKCdoYXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICBhbGxHb29kID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCgnI2FjY291bnRfZGV0YWlscyBpbnB1dCNsYXN0bmFtZScpLmNsb3Nlc3QoJy5mb3JtLWdyb3VwJykucmVtb3ZlQ2xhc3MoJ2hhcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgIGFsbEdvb2QgPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiggYWxsR29vZCA9PT0gMSApIHtcblxuICAgICAgICAgICAgICAgIHZhciB0aGVCdXR0b24gPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgLy9kaXNhYmxlIGJ1dHRvblxuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cbiAgICAgICAgICAgICAgICAvL3Nob3cgbG9hZGVyXG4gICAgICAgICAgICAgICAgJCgnI2FjY291bnRfZGV0YWlscyAubG9hZGVyJykuZmFkZUluKDUwMCk7XG5cbiAgICAgICAgICAgICAgICAvL3JlbW92ZSBhbGVydHNcbiAgICAgICAgICAgICAgICAkKCcjYWNjb3VudF9kZXRhaWxzIC5hbGVydHMgPiAqJykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICB1cmw6IGFwcFVJLnNpdGVVcmwrXCJ1c2VyL3VhY2NvdW50XCIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwb3N0JyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJCgnI2FjY291bnRfZGV0YWlscycpLnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXQpe1xuXG4gICAgICAgICAgICAgICAgICAgIC8vZW5hYmxlIGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0aGVCdXR0b24ucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9oaWRlIGxvYWRlclxuICAgICAgICAgICAgICAgICAgICAkKCcjYWNjb3VudF9kZXRhaWxzIC5sb2FkZXInKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICQoJyNhY2NvdW50X2RldGFpbHMgLmFsZXJ0cycpLmFwcGVuZCggJChyZXQucmVzcG9uc2VIVE1MKSApO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCByZXQucmVzcG9uc2VDb2RlID09PSAxICkgey8vc3VjY2Vzc1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2FjY291bnRfZGV0YWlscyAuYWxlcnRzID4gKicpLmZhZGVPdXQoNTAwLCBmdW5jdGlvbiAoKSB7ICQodGhpcykucmVtb3ZlKCk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgdXBkYXRlcyBhY2NvdW50IGxvZ2luIGRldGFpbHNcbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlTG9naW5EZXRhaWxzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhhcHBVSSk7XG5cbiAgICAgICAgICAgIHZhciBhbGxHb29kID0gMTtcblxuICAgICAgICAgICAgaWYoICQoJyNhY2NvdW50X2xvZ2luIGlucHV0I2VtYWlsJykudmFsKCkgPT09ICcnICkge1xuICAgICAgICAgICAgICAgICQoJyNhY2NvdW50X2xvZ2luIGlucHV0I2VtYWlsJykuY2xvc2VzdCgnLmZvcm0tZ3JvdXAnKS5hZGRDbGFzcygnaGFzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgYWxsR29vZCA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoJyNhY2NvdW50X2xvZ2luIGlucHV0I2VtYWlsJykuY2xvc2VzdCgnLmZvcm0tZ3JvdXAnKS5yZW1vdmVDbGFzcygnaGFzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgYWxsR29vZCA9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCAkKCcjYWNjb3VudF9sb2dpbiBpbnB1dCNwYXNzd29yZCcpLnZhbCgpID09PSAnJyApIHtcbiAgICAgICAgICAgICAgICAkKCcjYWNjb3VudF9sb2dpbiBpbnB1dCNwYXNzd29yZCcpLmNsb3Nlc3QoJy5mb3JtLWdyb3VwJykuYWRkQ2xhc3MoJ2hhcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgIGFsbEdvb2QgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKCcjYWNjb3VudF9sb2dpbiBpbnB1dCNwYXNzd29yZCcpLmNsb3Nlc3QoJy5mb3JtLWdyb3VwJykucmVtb3ZlQ2xhc3MoJ2hhcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgIGFsbEdvb2QgPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiggYWxsR29vZCA9PT0gMSApIHtcblxuICAgICAgICAgICAgICAgIHZhciB0aGVCdXR0b24gPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgLy9kaXNhYmxlIGJ1dHRvblxuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cbiAgICAgICAgICAgICAgICAvL3Nob3cgbG9hZGVyXG4gICAgICAgICAgICAgICAgJCgnI2FjY291bnRfbG9naW4gLmxvYWRlcicpLmZhZGVJbig1MDApO1xuXG4gICAgICAgICAgICAgICAgLy9yZW1vdmUgYWxlcnRzXG4gICAgICAgICAgICAgICAgJCgnI2FjY291bnRfbG9naW4gLmFsZXJ0cyA+IConKS5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgIHVybDogYXBwVUkuc2l0ZVVybCtcInVzZXIvdWxvZ2luXCIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwb3N0JyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJCgnI2FjY291bnRfbG9naW4nKS5zZXJpYWxpemUoKVxuICAgICAgICAgICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmV0KXtcblxuICAgICAgICAgICAgICAgICAgICAvL2VuYWJsZSBidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdGhlQnV0dG9uLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vaGlkZSBsb2FkZXJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2FjY291bnRfbG9naW4gLmxvYWRlcicpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnI2FjY291bnRfbG9naW4gLmFsZXJ0cycpLmFwcGVuZCggJChyZXQucmVzcG9uc2VIVE1MKSApO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCByZXQucmVzcG9uc2VDb2RlID09PSAxICkgey8vc3VjY2Vzc1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2FjY291bnRfbG9naW4gLmFsZXJ0cyA+IConKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24gKCkgeyAkKHRoaXMpLnJlbW92ZSgpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBhY2NvdW50LmluaXQoKTtcblxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBzaXRlQnVpbGRlclV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuICAgIHZhciBiQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcuanMnKTtcbiAgICB2YXIgYXBwVUkgPSByZXF1aXJlKCcuL3VpLmpzJykuYXBwVUk7XG4gICAgdmFyIHB1Ymxpc2hlciA9IHJlcXVpcmUoJy4uL3ZlbmRvci9wdWJsaXNoZXInKTtcblxuXG5cdCAvKlxuICAgICAgICBCYXNpYyBCdWlsZGVyIFVJIGluaXRpYWxpc2F0aW9uXG4gICAgKi9cbiAgICB2YXIgYnVpbGRlclVJID0ge1xuXG4gICAgICAgIGFsbEJsb2Nrczoge30sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaG9sZHMgYWxsIGJsb2NrcyBsb2FkZWQgZnJvbSB0aGUgc2VydmVyXG4gICAgICAgIG1lbnVXcmFwcGVyOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudScpLFxuICAgICAgICBwcmltYXJ5U2lkZU1lbnVXcmFwcGVyOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbicpLFxuICAgICAgICBidXR0b25CYWNrOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFja0J1dHRvbicpLFxuICAgICAgICBidXR0b25CYWNrQ29uZmlybTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xlYXZlUGFnZUJ1dHRvbicpLFxuXG4gICAgICAgIGFjZUVkaXRvcnM6IHt9LFxuICAgICAgICBmcmFtZUNvbnRlbnRzOiAnJywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaG9sZHMgZnJhbWUgY29udGVudHNcbiAgICAgICAgdGVtcGxhdGVJRDogMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2hvbGRzIHRoZSB0ZW1wbGF0ZSBJRCBmb3IgYSBwYWdlICg/Pz8pXG5cbiAgICAgICAgbW9kYWxEZWxldGVCbG9jazogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbGV0ZUJsb2NrJyksXG4gICAgICAgIG1vZGFsUmVzZXRCbG9jazogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc2V0QmxvY2snKSxcbiAgICAgICAgbW9kYWxEZWxldGVQYWdlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsZXRlUGFnZScpLFxuICAgICAgICBidXR0b25EZWxldGVQYWdlQ29uZmlybTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbGV0ZVBhZ2VDb25maXJtJyksXG5cbiAgICAgICAgZHJvcGRvd25QYWdlTGlua3M6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnRlcm5hbExpbmtzRHJvcGRvd24nKSxcblxuICAgICAgICBwYWdlSW5Vcmw6IG51bGwsXG5cbiAgICAgICAgdGVtcEZyYW1lOiB7fSxcblxuICAgICAgICBjdXJyZW50UmVzcG9uc2l2ZU1vZGU6IHt9LFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgIC8vbG9hZCBibG9ja3NcbiAgICAgICAgICAgICQuZ2V0SlNPTihhcHBVSS5iYXNlVXJsKydlbGVtZW50cy5qc29uP3Y9MTIzNDU2NzgnLCBmdW5jdGlvbihkYXRhKXsgYnVpbGRlclVJLmFsbEJsb2NrcyA9IGRhdGE7IGJ1aWxkZXJVSS5pbXBsZW1lbnRCbG9ja3MoKTsgfSk7XG5cbiAgICAgICAgICAgIC8vc2l0ZWJhciBob3ZlciBhbmltYXRpb24gYWN0aW9uXG4gICAgICAgICAgICAkKHRoaXMubWVudVdyYXBwZXIpLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgICQodGhpcykuc3RvcCgpLmFuaW1hdGUoeydsZWZ0JzogJzBweCd9LCA1MDApO1xuXG4gICAgICAgICAgICB9KS5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAkKHRoaXMpLnN0b3AoKS5hbmltYXRlKHsnbGVmdCc6ICctMTkwcHgnfSwgNTAwKTtcblxuICAgICAgICAgICAgICAgICQoJyNtZW51ICNtYWluIGEnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgJCgnLm1lbnUgLnNlY29uZCcpLnN0b3AoKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDBcbiAgICAgICAgICAgICAgICB9LCA1MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICQoJyNtZW51ICNzZWNvbmQnKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvL3ByZXZlbnQgY2xpY2sgZXZlbnQgb24gYW5jb3JzIGluIHRoZSBibG9jayBzZWN0aW9uIG9mIHRoZSBzaWRlYmFyXG4gICAgICAgICAgICAkKHRoaXMucHJpbWFyeVNpZGVNZW51V3JhcHBlcikub24oJ2NsaWNrJywgJ2E6bm90KC5hY3Rpb25CdXR0b25zKScsIGZ1bmN0aW9uKGUpe2UucHJldmVudERlZmF1bHQoKTt9KTtcblxuICAgICAgICAgICAgJCh0aGlzLmJ1dHRvbkJhY2spLm9uKCdjbGljaycsIHRoaXMuYmFja0J1dHRvbik7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uQmFja0NvbmZpcm0pLm9uKCdjbGljaycsIHRoaXMuYmFja0J1dHRvbkNvbmZpcm0pO1xuXG4gICAgICAgICAgICAvL25vdGlmeSB0aGUgdXNlciBvZiBwZW5kaW5nIGNobmFnZXMgd2hlbiBjbGlja2luZyB0aGUgYmFjayBidXR0b25cbiAgICAgICAgICAgICQod2luZG93KS5iaW5kKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGlmKCBzaXRlLnBlbmRpbmdDaGFuZ2VzID09PSB0cnVlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1lvdXIgc2l0ZSBjb250YWlucyBjaGFuZ2VkIHdoaWNoIGhhdmVuXFwndCBiZWVuIHNhdmVkIHlldC4gQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGxlYXZlPyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vVVJMIHBhcmFtZXRlcnNcbiAgICAgICAgICAgIGJ1aWxkZXJVSS5wYWdlSW5VcmwgPSBzaXRlQnVpbGRlclV0aWxzLmdldFBhcmFtZXRlckJ5TmFtZSgncCcpO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgYnVpbGRzIHRoZSBibG9ja3MgaW50byB0aGUgc2l0ZSBiYXJcbiAgICAgICAgKi9cbiAgICAgICAgaW1wbGVtZW50QmxvY2tzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIG5ld0l0ZW0sIGxvYWRlckZ1bmN0aW9uO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBrZXkgaW4gdGhpcy5hbGxCbG9ja3MuZWxlbWVudHMgKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyh0aGlzLmFsbEJsb2Nrcy5lbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgdmFyIG5pY2VLZXkgPSBrZXkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiIFwiLCBcIl9cIik7XG5cbiAgICAgICAgICAgICAgICAkKCc8bGk+PGEgaHJlZj1cIlwiIGlkPVwiJytuaWNlS2V5KydcIj4nK2tleSsnPC9hPjwvbGk+JykuYXBwZW5kVG8oJyNtZW51ICNtYWluIHVsI2VsZW1lbnRDYXRzJyk7XG5cbiAgICAgICAgICAgICAgICBmb3IoIHZhciB4ID0gMDsgeCA8IHRoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV0ubGVuZ3RoOyB4KysgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoIHRoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0udGh1bWJuYWlsID09PSBudWxsICkgey8vd2UnbGwgbmVlZCBhbiBpZnJhbWVcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9idWlsZCB1cyBzb21lIGlmcmFtZXMhXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLnNhbmRib3ggKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiggdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5sb2FkZXJGdW5jdGlvbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGVyRnVuY3Rpb24gPSAnZGF0YS1sb2FkZXJmdW5jdGlvbj1cIicrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5sb2FkZXJGdW5jdGlvbisnXCInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0gPSAkKCc8bGkgY2xhc3M9XCJlbGVtZW50ICcrbmljZUtleSsnXCI+PGlmcmFtZSBzcmM9XCInK2FwcFVJLmJhc2VVcmwrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS51cmwrJ1wiIHNjcm9sbGluZz1cIm5vXCIgc2FuZGJveD1cImFsbG93LXNhbWUtb3JpZ2luXCI+PC9pZnJhbWU+PC9saT4nKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0gPSAkKCc8bGkgY2xhc3M9XCJlbGVtZW50ICcrbmljZUtleSsnXCI+PGlmcmFtZSBzcmM9XCJhYm91dDpibGFua1wiIHNjcm9sbGluZz1cIm5vXCI+PC9pZnJhbWU+PC9saT4nKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLmZpbmQoJ2lmcmFtZScpLnVuaXF1ZUlkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3NyYycsIGFwcFVJLmJhc2VVcmwrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5vcmlnaW5hbF91cmwpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7Ly93ZSd2ZSBnb3QgYSB0aHVtYm5haWxcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIHRoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0uc2FuZGJveCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmxvYWRlckZ1bmN0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZXJGdW5jdGlvbiA9ICdkYXRhLWxvYWRlcmZ1bmN0aW9uPVwiJyt0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmxvYWRlckZ1bmN0aW9uKydcIic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SXRlbSA9ICQoJzxsaSBjbGFzcz1cImVsZW1lbnQgJytuaWNlS2V5KydcIj48aW1nIHNyYz1cIicrYXBwVUkuYmFzZVVybCt0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLnRodW1ibmFpbCsnXCIgZGF0YS1zcmNjPVwiJythcHBVSS5iYXNlVXJsK3RoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0udXJsKydcIiBkYXRhLWhlaWdodD1cIicrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5oZWlnaHQrJ1wiIGRhdGEtc2FuZGJveD1cIlwiICcrbG9hZGVyRnVuY3Rpb24rJz48L2xpPicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SXRlbSA9ICQoJzxsaSBjbGFzcz1cImVsZW1lbnQgJytuaWNlS2V5KydcIj48aW1nIHNyYz1cIicrYXBwVUkuYmFzZVVybCt0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLnRodW1ibmFpbCsnXCIgZGF0YS1zcmNjPVwiJythcHBVSS5iYXNlVXJsK3RoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0udXJsKydcIiBkYXRhLWhlaWdodD1cIicrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5oZWlnaHQrJ1wiPjwvbGk+Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0uYXBwZW5kVG8oJyNtZW51ICNzZWNvbmQgdWwjZWxlbWVudHMnKTtcblxuICAgICAgICAgICAgICAgICAgICAvL3pvb21lciB3b3Jrc1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGVIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoIHRoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0uaGVpZ2h0ICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVIZWlnaHQgPSB0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmhlaWdodCowLjI1O1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZUhlaWdodCA9ICdhdXRvJztcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5maW5kKCdpZnJhbWUnKS56b29tZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogMC4yNSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNzAsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoZUhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiRHJhZyZEcm9wIE1lIVwiXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vZHJhZ2dhYmxlc1xuICAgICAgICAgICAgYnVpbGRlclVJLm1ha2VEcmFnZ2FibGUoKTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGV2ZW50IGhhbmRsZXIgZm9yIHdoZW4gdGhlIGJhY2sgbGluayBpcyBjbGlja2VkXG4gICAgICAgICovXG4gICAgICAgIGJhY2tCdXR0b246IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpZiggc2l0ZS5wZW5kaW5nQ2hhbmdlcyA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgICAgICAkKCcjYmFja01vZGFsJykubW9kYWwoJ3Nob3cnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBidXR0b24gZm9yIGNvbmZpcm1pbmcgbGVhdmluZyB0aGUgcGFnZVxuICAgICAgICAqL1xuICAgICAgICBiYWNrQnV0dG9uQ29uZmlybTogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHNpdGUucGVuZGluZ0NoYW5nZXMgPSBmYWxzZTsvL3ByZXZlbnQgdGhlIEpTIGFsZXJ0IGFmdGVyIGNvbmZpcm1pbmcgdXNlciB3YW50cyB0byBsZWF2ZVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgbWFrZXMgdGhlIGJsb2NrcyBhbmQgdGVtcGxhdGVzIGluIHRoZSBzaWRlYmFyIGRyYWdnYWJsZSBvbnRvIHRoZSBjYW52YXNcbiAgICAgICAgKi9cbiAgICAgICAgbWFrZURyYWdnYWJsZTogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICQoJyNlbGVtZW50cyBsaSwgI3RlbXBsYXRlcyBsaScpLmVhY2goZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgICQodGhpcykuZHJhZ2dhYmxlKHtcbiAgICAgICAgICAgICAgICAgICAgaGVscGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OiAxMDBweDsgd2lkdGg6IDMwMHB4OyBiYWNrZ3JvdW5kOiAjRjlGQUZBOyBib3gtc2hhZG93OiA1cHggNXB4IDFweCByZ2JhKDAsMCwwLDAuMSk7IHRleHQtYWxpZ246IGNlbnRlcjsgbGluZS1oZWlnaHQ6IDEwMHB4OyBmb250LXNpemU6IDI4cHg7IGNvbG9yOiAjMTZBMDg1XCI+PHNwYW4gY2xhc3M9XCJmdWktbGlzdFwiPjwvc3Bhbj48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0OiAnaW52YWxpZCcsXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFRvOiAnYm9keScsXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3RUb1NvcnRhYmxlOiAnI3BhZ2VMaXN0ID4gdWwnLFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2l0ZS5tb3ZlTW9kZSgnb24nKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge31cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQoJyNlbGVtZW50cyBsaSBhJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgJCh0aGlzKS51bmJpbmQoJ2NsaWNrJykuYmluZCgnY2xpY2snLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIEltcGxlbWVudHMgdGhlIHNpdGUgb24gdGhlIGNhbnZhcywgY2FsbGVkIGZyb20gdGhlIFNpdGUgb2JqZWN0IHdoZW4gdGhlIHNpdGVEYXRhIGhhcyBjb21wbGV0ZWQgbG9hZGluZ1xuICAgICAgICAqL1xuICAgICAgICBwb3B1bGF0ZUNhbnZhczogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgY291bnRlciA9IDE7XG5cbiAgICAgICAgICAgIC8vbG9vcCB0aHJvdWdoIHRoZSBwYWdlc1xuXG4gICAgICAgICAgICBmb3IoIGkgaW4gc2l0ZS5wYWdlcyApIHtcblxuICAgICAgICAgICAgICAgIHZhciBuZXdQYWdlID0gbmV3IFBhZ2UoaSwgc2l0ZS5wYWdlc1tpXSwgY291bnRlcik7XG5cbiAgICAgICAgICAgICAgICBjb3VudGVyKys7XG5cbiAgICAgICAgICAgICAgICAvL3NldCB0aGlzIHBhZ2UgYXMgYWN0aXZlP1xuICAgICAgICAgICAgICAgIGlmKCBidWlsZGVyVUkucGFnZUluVXJsID09PSBpICkge1xuICAgICAgICAgICAgICAgICAgICBuZXdQYWdlLnNlbGVjdFBhZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9hY3RpdmF0ZSB0aGUgZmlyc3QgcGFnZVxuICAgICAgICAgICAgaWYoc2l0ZS5zaXRlUGFnZXMubGVuZ3RoID4gMCAmJiBidWlsZGVyVUkucGFnZUluVXJsID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2l0ZS5zaXRlUGFnZXNbMF0uc2VsZWN0UGFnZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgQ2FudmFzIGxvYWRpbmcgb24vb2ZmXG4gICAgICAgICovXG4gICAgICAgIGNhbnZhc0xvYWRpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgICAgICAgICBpZiAoIHZhbHVlID09PSAnb24nICYmIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmcmFtZVdyYXBwZXInKS5xdWVyeVNlbGVjdG9yQWxsKCcjY2FudmFzT3ZlcmxheScpLmxlbmd0aCA9PT0gMCApIHtcblxuICAgICAgICAgICAgICAgIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG5cbiAgICAgICAgICAgICAgICBvdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgICAgICAgICAgJChvdmVybGF5KS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgb3ZlcmxheS5pZCA9ICdjYW52YXNPdmVybGF5JztcblxuICAgICAgICAgICAgICAgIG92ZXJsYXkuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJsb2FkZXJcIj48c3Bhbj57PC9zcGFuPjxzcGFuPn08L3NwYW4+PC9kaXY+JztcblxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmcmFtZVdyYXBwZXInKS5hcHBlbmRDaGlsZChvdmVybGF5KTtcblxuICAgICAgICAgICAgICAgICQoJyNjYW52YXNPdmVybGF5JykuZmFkZUluKDUwMCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHZhbHVlID09PSAnb2ZmJyAmJiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZnJhbWVXcmFwcGVyJykucXVlcnlTZWxlY3RvckFsbCgnI2NhbnZhc092ZXJsYXknKS5sZW5ndGggPT09IDEgKSB7XG5cbiAgICAgICAgICAgICAgICBzaXRlLmxvYWRlZCgpO1xuXG4gICAgICAgICAgICAgICAgJCgnI2NhbnZhc092ZXJsYXknKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuXG4gICAgLypcbiAgICAgICAgUGFnZSBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gUGFnZSAocGFnZU5hbWUsIHBhZ2UsIGNvdW50ZXIpIHtcblxuICAgICAgICB0aGlzLm5hbWUgPSBwYWdlTmFtZSB8fCBcIlwiO1xuICAgICAgICB0aGlzLnBhZ2VJRCA9IHBhZ2UucGFnZXNfaWQgfHwgMDtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSBbXTtcbiAgICAgICAgdGhpcy5wYXJlbnRVTCA9IHt9OyAvL3BhcmVudCBVTCBvbiB0aGUgY2FudmFzXG4gICAgICAgIHRoaXMuc3RhdHVzID0gJyc7Ly8nJywgJ25ldycgb3IgJ2NoYW5nZWQnXG4gICAgICAgIHRoaXMuc2NyaXB0cyA9IFtdOy8vdHJhY2tzIHNjcmlwdCBVUkxzIHVzZWQgb24gdGhpcyBwYWdlXG5cbiAgICAgICAgdGhpcy5wYWdlU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICB0aXRsZTogcGFnZS5wYWdlc190aXRsZSB8fCAnJyxcbiAgICAgICAgICAgIG1ldGFfZGVzY3JpcHRpb246IHBhZ2UubWV0YV9kZXNjcmlwdGlvbiB8fCAnJyxcbiAgICAgICAgICAgIG1ldGFfa2V5d29yZHM6IHBhZ2UubWV0YV9rZXl3b3JkcyB8fCAnJyxcbiAgICAgICAgICAgIGhlYWRlcl9pbmNsdWRlczogcGFnZS5oZWFkZXJfaW5jbHVkZXMgfHwgJycsXG4gICAgICAgICAgICBwYWdlX2NzczogcGFnZS5wYWdlX2NzcyB8fCAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucGFnZU1lbnVUZW1wbGF0ZSA9ICc8YSBocmVmPVwiXCIgY2xhc3M9XCJtZW51SXRlbUxpbmtcIj5wYWdlPC9hPjxzcGFuIGNsYXNzPVwicGFnZUJ1dHRvbnNcIj48YSBocmVmPVwiXCIgY2xhc3M9XCJmaWxlRWRpdCBmdWktbmV3XCI+PC9hPjxhIGhyZWY9XCJcIiBjbGFzcz1cImZpbGVEZWwgZnVpLWNyb3NzXCI+PGEgY2xhc3M9XCJidG4gYnRuLXhzIGJ0bi1wcmltYXJ5IGJ0bi1lbWJvc3NlZCBmaWxlU2F2ZSBmdWktY2hlY2tcIiBocmVmPVwiI1wiPjwvYT48L3NwYW4+PC9hPjwvc3Bhbj4nO1xuXG4gICAgICAgIHRoaXMubWVudUl0ZW0gPSB7fTsvL3JlZmVyZW5jZSB0byB0aGUgcGFnZXMgbWVudSBpdGVtIGZvciB0aGlzIHBhZ2UgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbSA9IHt9Oy8vcmVmZXJlbmNlIHRvIHRoZSBsaW5rcyBkcm9wZG93biBpdGVtIGZvciB0aGlzIHBhZ2UgaW5zdGFuY2VcblxuICAgICAgICB0aGlzLnBhcmVudFVMID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVUwnKTtcbiAgICAgICAgdGhpcy5wYXJlbnRVTC5zZXRBdHRyaWJ1dGUoJ2lkJywgXCJwYWdlXCIrY291bnRlcik7XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIG1ha2VzIHRoZSBjbGlja2VkIHBhZ2UgYWN0aXZlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2VsZWN0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZWxlY3Q6Jyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMucGFnZVNldHRpbmdzKTtcblxuICAgICAgICAgICAgLy9tYXJrIHRoZSBtZW51IGl0ZW0gYXMgYWN0aXZlXG4gICAgICAgICAgICBzaXRlLmRlQWN0aXZhdGVBbGwoKTtcbiAgICAgICAgICAgICQodGhpcy5tZW51SXRlbSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgICAvL2xldCBTaXRlIGtub3cgd2hpY2ggcGFnZSBpcyBjdXJyZW50bHkgYWN0aXZlXG4gICAgICAgICAgICBzaXRlLnNldEFjdGl2ZSh0aGlzKTtcblxuICAgICAgICAgICAgLy9kaXNwbGF5IHRoZSBuYW1lIG9mIHRoZSBhY3RpdmUgcGFnZSBvbiB0aGUgY2FudmFzXG4gICAgICAgICAgICBzaXRlLnBhZ2VUaXRsZS5pbm5lckhUTUwgPSB0aGlzLm5hbWU7XG5cbiAgICAgICAgICAgIC8vbG9hZCB0aGUgcGFnZSBzZXR0aW5ncyBpbnRvIHRoZSBwYWdlIHNldHRpbmdzIG1vZGFsXG4gICAgICAgICAgICBzaXRlLmlucHV0UGFnZVNldHRpbmdzVGl0bGUudmFsdWUgPSB0aGlzLnBhZ2VTZXR0aW5ncy50aXRsZTtcbiAgICAgICAgICAgIHNpdGUuaW5wdXRQYWdlU2V0dGluZ3NNZXRhRGVzY3JpcHRpb24udmFsdWUgPSB0aGlzLnBhZ2VTZXR0aW5ncy5tZXRhX2Rlc2NyaXB0aW9uO1xuICAgICAgICAgICAgc2l0ZS5pbnB1dFBhZ2VTZXR0aW5nc01ldGFLZXl3b3Jkcy52YWx1ZSA9IHRoaXMucGFnZVNldHRpbmdzLm1ldGFfa2V5d29yZHM7XG4gICAgICAgICAgICBzaXRlLmlucHV0UGFnZVNldHRpbmdzSW5jbHVkZXMudmFsdWUgPSB0aGlzLnBhZ2VTZXR0aW5ncy5oZWFkZXJfaW5jbHVkZXM7XG4gICAgICAgICAgICBzaXRlLmlucHV0UGFnZVNldHRpbmdzUGFnZUNzcy52YWx1ZSA9IHRoaXMucGFnZVNldHRpbmdzLnBhZ2VfY3NzO1xuXG4gICAgICAgICAgICAvL3RyaWdnZXIgY3VzdG9tIGV2ZW50XG4gICAgICAgICAgICAkKCdib2R5JykudHJpZ2dlcignY2hhbmdlUGFnZScpO1xuXG4gICAgICAgICAgICAvL3Jlc2V0IHRoZSBoZWlnaHRzIGZvciB0aGUgYmxvY2tzIG9uIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAgICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5ibG9ja3MgKSB7XG5cbiAgICAgICAgICAgICAgICBpZiggT2JqZWN0LmtleXModGhpcy5ibG9ja3NbaV0uZnJhbWVEb2N1bWVudCkubGVuZ3RoID4gMCApe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJsb2Nrc1tpXS5oZWlnaHRBZGp1c3RtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vc2hvdyB0aGUgZW1wdHkgbWVzc2FnZT9cbiAgICAgICAgICAgIHRoaXMuaXNFbXB0eSgpO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGNoYW5nZWQgdGhlIGxvY2F0aW9uL29yZGVyIG9mIGEgYmxvY2sgd2l0aGluIGEgcGFnZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oZnJhbWVJRCwgbmV3UG9zKSB7XG5cbiAgICAgICAgICAgIC8vd2UnbGwgbmVlZCB0aGUgYmxvY2sgb2JqZWN0IGNvbm5lY3RlZCB0byBpZnJhbWUgd2l0aCBmcmFtZUlEXG5cbiAgICAgICAgICAgIGZvcih2YXIgaSBpbiB0aGlzLmJsb2Nrcykge1xuXG4gICAgICAgICAgICAgICAgaWYoIHRoaXMuYmxvY2tzW2ldLmZyYW1lLmdldEF0dHJpYnV0ZSgnaWQnKSA9PT0gZnJhbWVJRCApIHtcblxuICAgICAgICAgICAgICAgICAgICAvL2NoYW5nZSB0aGUgcG9zaXRpb24gb2YgdGhpcyBibG9jayBpbiB0aGUgYmxvY2tzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmxvY2tzLnNwbGljZShuZXdQb3MsIDAsIHRoaXMuYmxvY2tzLnNwbGljZShpLCAxKVswXSk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBkZWxldGUgYmxvY2sgZnJvbSBibG9ja3MgYXJyYXlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZWxldGVCbG9jayA9IGZ1bmN0aW9uKGJsb2NrKSB7XG5cbiAgICAgICAgICAgIC8vcmVtb3ZlIGZyb20gYmxvY2tzIGFycmF5XG4gICAgICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMuYmxvY2tzICkge1xuICAgICAgICAgICAgICAgIGlmKCB0aGlzLmJsb2Nrc1tpXSA9PT0gYmxvY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vZm91bmQgaXQsIHJlbW92ZSBmcm9tIGJsb2NrcyBhcnJheVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJsb2Nrcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHRvZ2dsZXMgYWxsIGJsb2NrIGZyYW1lQ292ZXJzIG9uIHRoaXMgcGFnZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRvZ2dsZUZyYW1lQ292ZXJzID0gZnVuY3Rpb24ob25Pck9mZikge1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMuYmxvY2tzICkge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja3NbaV0udG9nZ2xlQ292ZXIob25Pck9mZik7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBzZXR1cCBmb3IgZWRpdGluZyBhIHBhZ2UgbmFtZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmVkaXRQYWdlTmFtZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpZiggIXRoaXMubWVudUl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0JykgKSB7XG5cbiAgICAgICAgICAgICAgICAvL2hpZGUgdGhlIGxpbmtcbiAgICAgICAgICAgICAgICB0aGlzLm1lbnVJdGVtLnF1ZXJ5U2VsZWN0b3IoJ2EubWVudUl0ZW1MaW5rJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgICAgICAgICAgICAgIC8vaW5zZXJ0IHRoZSBpbnB1dCBmaWVsZFxuICAgICAgICAgICAgICAgIHZhciBuZXdJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgbmV3SW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICAgICAgICAgICAgICBuZXdJbnB1dC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAncGFnZScpO1xuICAgICAgICAgICAgICAgIG5ld0lucHV0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB0aGlzLm5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMubWVudUl0ZW0uaW5zZXJ0QmVmb3JlKG5ld0lucHV0LCB0aGlzLm1lbnVJdGVtLmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgICAgICAgICAgbmV3SW5wdXQuZm9jdXMoKTtcblxuICAgICAgICAgICAgICAgIHZhciB0bXBTdHIgPSBuZXdJbnB1dC5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgbmV3SW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsICcnKTtcbiAgICAgICAgICAgICAgICBuZXdJbnB1dC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdG1wU3RyKTtcblxuICAgICAgICAgICAgICAgIHRoaXMubWVudUl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdCcpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgVXBkYXRlcyB0aGlzIHBhZ2UncyBuYW1lIChldmVudCBoYW5kbGVyIGZvciB0aGUgc2F2ZSBidXR0b24pXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudXBkYXRlUGFnZU5hbWVFdmVudCA9IGZ1bmN0aW9uKGVsKSB7XG5cbiAgICAgICAgICAgIGlmKCB0aGlzLm1lbnVJdGVtLmNsYXNzTGlzdC5jb250YWlucygnZWRpdCcpICkge1xuXG4gICAgICAgICAgICAgICAgLy9lbCBpcyB0aGUgY2xpY2tlZCBidXR0b24sIHdlJ2xsIG5lZWQgYWNjZXNzIHRvIHRoZSBpbnB1dFxuICAgICAgICAgICAgICAgIHZhciB0aGVJbnB1dCA9IHRoaXMubWVudUl0ZW0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInBhZ2VcIl0nKTtcblxuICAgICAgICAgICAgICAgIC8vbWFrZSBzdXJlIHRoZSBwYWdlJ3MgbmFtZSBpcyBPS1xuICAgICAgICAgICAgICAgIGlmKCBzaXRlLmNoZWNrUGFnZU5hbWUodGhlSW5wdXQudmFsdWUpICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSA9IHNpdGUucHJlcFBhZ2VOYW1lKCB0aGVJbnB1dC52YWx1ZSApO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVudUl0ZW0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInBhZ2VcIl0nKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZW51SXRlbS5xdWVyeVNlbGVjdG9yKCdhLm1lbnVJdGVtTGluaycpLmlubmVySFRNTCA9IHRoaXMubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZW51SXRlbS5xdWVyeVNlbGVjdG9yKCdhLm1lbnVJdGVtTGluaycpLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVudUl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnZWRpdCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vdXBkYXRlIHRoZSBsaW5rcyBkcm9wZG93biBpdGVtXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlua3NEcm9wZG93bkl0ZW0udGV4dCA9IHRoaXMubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdGhpcy5uYW1lK1wiLmh0bWxcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgLy91cGRhdGUgdGhlIHBhZ2UgbmFtZSBvbiB0aGUgY2FudmFzXG4gICAgICAgICAgICAgICAgICAgIHNpdGUucGFnZVRpdGxlLmlubmVySFRNTCA9IHRoaXMubmFtZTtcblxuICAgICAgICAgICAgICAgICAgICAvL2NoYW5nZWQgcGFnZSB0aXRsZSwgd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBhbGVydChzaXRlLnBhZ2VOYW1lRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgZGVsZXRlcyB0aGlzIGVudGlyZSBwYWdlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vZGVsZXRlIGZyb20gdGhlIFNpdGVcbiAgICAgICAgICAgIGZvciggdmFyIGkgaW4gc2l0ZS5zaXRlUGFnZXMgKSB7XG5cbiAgICAgICAgICAgICAgICBpZiggc2l0ZS5zaXRlUGFnZXNbaV0gPT09IHRoaXMgKSB7Ly9nb3QgYSBtYXRjaCFcblxuICAgICAgICAgICAgICAgICAgICAvL2RlbGV0ZSBmcm9tIHNpdGUuc2l0ZVBhZ2VzXG4gICAgICAgICAgICAgICAgICAgIHNpdGUuc2l0ZVBhZ2VzLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2RlbGV0ZSBmcm9tIGNhbnZhc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudFVMLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vYWRkIHRvIGRlbGV0ZWQgcGFnZXNcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5wYWdlc1RvRGVsZXRlLnB1c2godGhpcy5uYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2RlbGV0ZSB0aGUgcGFnZSdzIG1lbnUgaXRlbVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lbnVJdGVtLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vZGVsZXQgdGhlIHBhZ2VzIGxpbmsgZHJvcGRvd24gaXRlbVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmtzRHJvcGRvd25JdGVtLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vYWN0aXZhdGUgdGhlIGZpcnN0IHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5zaXRlUGFnZXNbMF0uc2VsZWN0UGFnZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vcGFnZSB3YXMgZGVsZXRlZCwgc28gd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgY2hlY2tzIGlmIHRoZSBwYWdlIGlzIGVtcHR5LCBpZiBzbyBzaG93IHRoZSAnZW1wdHknIG1lc3NhZ2VcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0VtcHR5ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlmKCB0aGlzLmJsb2Nrcy5sZW5ndGggPT09IDAgKSB7XG5cbiAgICAgICAgICAgICAgICBzaXRlLm1lc3NhZ2VTdGFydC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICBzaXRlLmRpdkZyYW1lV3JhcHBlci5jbGFzc0xpc3QuYWRkKCdlbXB0eScpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgc2l0ZS5tZXNzYWdlU3RhcnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICBzaXRlLmRpdkZyYW1lV3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCdlbXB0eScpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgcHJlcHMvc3RyaXBzIHRoaXMgcGFnZSBkYXRhIGZvciBhIHBlbmRpbmcgYWpheCByZXF1ZXN0XG4gICAgICAgICovXG4gICAgICAgIHRoaXMucHJlcEZvclNhdmUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIHBhZ2UgPSB7fTtcblxuICAgICAgICAgICAgcGFnZS5uYW1lID0gdGhpcy5uYW1lO1xuICAgICAgICAgICAgcGFnZS5wYWdlU2V0dGluZ3MgPSB0aGlzLnBhZ2VTZXR0aW5ncztcbiAgICAgICAgICAgIHBhZ2Uuc3RhdHVzID0gdGhpcy5zdGF0dXM7XG4gICAgICAgICAgICBwYWdlLnBhZ2VJRCA9IHRoaXMucGFnZUlEO1xuICAgICAgICAgICAgcGFnZS5ibG9ja3MgPSBbXTtcblxuICAgICAgICAgICAgLy9wcm9jZXNzIHRoZSBibG9ja3NcblxuICAgICAgICAgICAgZm9yKCB2YXIgeCA9IDA7IHggPCB0aGlzLmJsb2Nrcy5sZW5ndGg7IHgrKyApIHtcblxuICAgICAgICAgICAgICAgIHZhciBibG9jayA9IHt9O1xuXG4gICAgICAgICAgICAgICAgaWYoIHRoaXMuYmxvY2tzW3hdLnNhbmRib3ggKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZnJhbWVDb250ZW50ID0gXCI8aHRtbD5cIiskKCcjc2FuZGJveGVzICMnK3RoaXMuYmxvY2tzW3hdLnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnaHRtbCcpLmh0bWwoKStcIjwvaHRtbD5cIjtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suc2FuZGJveCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmxvYWRlckZ1bmN0aW9uID0gdGhpcy5ibG9ja3NbeF0uc2FuZGJveF9sb2FkZXI7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmZyYW1lQ29udGVudCA9IHRoaXMuYmxvY2tzW3hdLmdldFNvdXJjZSgpO1xuICAgICAgICAgICAgICAgICAgICBibG9jay5zYW5kYm94ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmxvYWRlckZ1bmN0aW9uID0gJyc7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBibG9jay5mcmFtZUhlaWdodCA9IHRoaXMuYmxvY2tzW3hdLmZyYW1lSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGJsb2NrLm9yaWdpbmFsX3VybCA9IHRoaXMuYmxvY2tzW3hdLm9yaWdpbmFsX3VybDtcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuYmxvY2tzW3hdLmdsb2JhbCApIGJsb2NrLmZyYW1lc19nbG9iYWwgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgcGFnZS5ibG9ja3MucHVzaChibG9jayk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBhZ2U7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgZ2VuZXJhdGVzIHRoZSBmdWxsIHBhZ2UsIHVzaW5nIHNrZWxldG9uLmh0bWxcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mdWxsUGFnZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgcGFnZSA9IHRoaXM7Ly9yZWZlcmVuY2UgdG8gc2VsZiBmb3IgbGF0ZXJcbiAgICAgICAgICAgIHBhZ2Uuc2NyaXB0cyA9IFtdOy8vbWFrZSBzdXJlIGl0J3MgZW1wdHksIHdlJ2xsIHN0b3JlIHNjcmlwdCBVUkxzIGluIHRoZXJlIGxhdGVyXG5cbiAgICAgICAgICAgIHZhciBuZXdEb2NNYWluUGFyZW50ID0gJCgnaWZyYW1lI3NrZWxldG9uJykuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKTtcblxuICAgICAgICAgICAgLy9lbXB0eSBvdXQgdGhlIHNrZWxldG9uIGZpcnN0XG4gICAgICAgICAgICAkKCdpZnJhbWUjc2tlbGV0b24nKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciApLmh0bWwoJycpO1xuXG4gICAgICAgICAgICAvL3JlbW92ZSBvbGQgc2NyaXB0IHRhZ3NcbiAgICAgICAgICAgICQoJ2lmcmFtZSNza2VsZXRvbicpLmNvbnRlbnRzKCkuZmluZCggJ3NjcmlwdCcgKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgdGhlQ29udGVudHM7XG5cbiAgICAgICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5ibG9ja3MgKSB7XG5cbiAgICAgICAgICAgICAgICAvL2dyYWIgdGhlIGJsb2NrIGNvbnRlbnRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ibG9ja3NbaV0uc2FuZGJveCAhPT0gZmFsc2UpIHtcblxuICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cyA9ICQoJyNzYW5kYm94ZXMgIycrdGhpcy5ibG9ja3NbaV0uc2FuZGJveCkuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKS5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cyA9ICQodGhpcy5ibG9ja3NbaV0uZnJhbWVEb2N1bWVudC5ib2R5KS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKS5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9yZW1vdmUgdmlkZW8gZnJhbWVDb3ZlcnNcbiAgICAgICAgICAgICAgICB0aGVDb250ZW50cy5maW5kKCcuZnJhbWVDb3ZlcicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy9yZW1vdmUgdmlkZW8gZnJhbWVXcmFwcGVyc1xuICAgICAgICAgICAgICAgIHRoZUNvbnRlbnRzLmZpbmQoJy52aWRlb1dyYXBwZXInKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNudCA9ICQodGhpcykuY29udGVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZXBsYWNlV2l0aChjbnQpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvL3JlbW92ZSBzdHlsZSBsZWZ0b3ZlcnMgZnJvbSB0aGUgc3R5bGUgZWRpdG9yXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIga2V5IGluIGJDb25maWcuZWRpdGFibGVJdGVtcyApIHtcblxuICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cy5maW5kKCBrZXkgKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQXR0cignZGF0YS1zZWxlY3RvcicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcygnb3V0bGluZScsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKCdvdXRsaW5lLW9mZnNldCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKCdjdXJzb3InLCAnJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCAkKHRoaXMpLmF0dHIoJ3N0eWxlJykgPT09ICcnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKCdzdHlsZScpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL3JlbW92ZSBzdHlsZSBsZWZ0b3ZlcnMgZnJvbSB0aGUgY29udGVudCBlZGl0b3JcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgeCA9IDA7IHggPCBiQ29uZmlnLmVkaXRhYmxlQ29udGVudC5sZW5ndGg7ICsreCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoZUNvbnRlbnRzLmZpbmQoIGJDb25maWcuZWRpdGFibGVDb250ZW50W3hdICkuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoJ2RhdGEtc2VsZWN0b3InKTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vYXBwZW5kIHRvIERPTSBpbiB0aGUgc2tlbGV0b25cbiAgICAgICAgICAgICAgICBuZXdEb2NNYWluUGFyZW50LmFwcGVuZCggJCh0aGVDb250ZW50cy5odG1sKCkpICk7XG5cbiAgICAgICAgICAgICAgICAvL2RvIHdlIG5lZWQgdG8gaW5qZWN0IGFueSBzY3JpcHRzP1xuICAgICAgICAgICAgICAgIHZhciBzY3JpcHRzID0gJCh0aGlzLmJsb2Nrc1tpXS5mcmFtZURvY3VtZW50LmJvZHkpLmZpbmQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgICAgIHZhciB0aGVJZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNrZWxldG9uXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYoIHNjcmlwdHMuc2l6ZSgpID4gMCApIHtcblxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRzLmVhY2goZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjcmlwdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoICQodGhpcykudGV4dCgpICE9PSAnJyApIHsvL3NjcmlwdCB0YWdzIHdpdGggY29udGVudFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0ID0gdGhlSWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC5pbm5lckhUTUwgPSAkKHRoaXMpLnRleHQoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZUlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCAkKHRoaXMpLmF0dHIoJ3NyYycpICE9PSBudWxsICYmIHBhZ2Uuc2NyaXB0cy5pbmRleE9mKCQodGhpcykuYXR0cignc3JjJykpID09PSAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VzZSBpbmRleE9mIHRvIG1ha2Ugc3VyZSBlYWNoIHNjcmlwdCBvbmx5IGFwcGVhcnMgb24gdGhlIHByb2R1Y2VkIHBhZ2Ugb25jZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0ID0gdGhlSWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC5zcmMgPSAkKHRoaXMpLmF0dHIoJ3NyYycpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlSWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFnZS5zY3JpcHRzLnB1c2goJCh0aGlzKS5hdHRyKCdzcmMnKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgQ2hlY2tzIGlmIGFsbCBibG9ja3Mgb24gdGhpcyBwYWdlIGhhdmUgZmluaXNoZWQgbG9hZGluZ1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLmxvYWRlZCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDx0aGlzLmJsb2Nrcy5sZW5ndGg7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIGlmICggIXRoaXMuYmxvY2tzW2ldLmxvYWRlZCApIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBjbGVhciBvdXQgdGhpcyBwYWdlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2xlYXIgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja3MucG9wKCk7XG5cbiAgICAgICAgICAgIHdoaWxlKCBibG9jayAhPT0gdW5kZWZpbmVkICkge1xuXG4gICAgICAgICAgICAgICAgYmxvY2suZGVsZXRlKCk7XG5cbiAgICAgICAgICAgICAgICBibG9jayA9IHRoaXMuYmxvY2tzLnBvcCgpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBIZWlnaHQgYWRqdXN0bWVudCBmb3IgYWxsIGJsb2NrcyBvbiB0aGUgcGFnZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmhlaWdodEFkanVzdG1lbnQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMuYmxvY2tzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHRoaXMuYmxvY2tzW2ldLmhlaWdodEFkanVzdG1lbnQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG5cbiAgICAgICAgLy9sb29wIHRocm91Z2ggdGhlIGZyYW1lcy9ibG9ja3NcblxuICAgICAgICBpZiggcGFnZS5oYXNPd25Qcm9wZXJ0eSgnYmxvY2tzJykgKSB7XG5cbiAgICAgICAgICAgIGZvciggdmFyIHggPSAwOyB4IDwgcGFnZS5ibG9ja3MubGVuZ3RoOyB4KysgKSB7XG5cbiAgICAgICAgICAgICAgICAvL2NyZWF0ZSBuZXcgQmxvY2tcblxuICAgICAgICAgICAgICAgIHZhciBuZXdCbG9jayA9IG5ldyBCbG9jaygpO1xuXG4gICAgICAgICAgICAgICAgcGFnZS5ibG9ja3NbeF0uc3JjID0gYXBwVUkuc2l0ZVVybCtcInNpdGUvZ2V0ZnJhbWUvXCIrcGFnZS5ibG9ja3NbeF0uaWQ7XG5cbiAgICAgICAgICAgICAgICAvL3NhbmRib3hlZCBibG9jaz9cbiAgICAgICAgICAgICAgICBpZiggcGFnZS5ibG9ja3NbeF0uZnJhbWVzX3NhbmRib3ggPT09ICcxJykge1xuXG4gICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLnNhbmRib3ggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBuZXdCbG9jay5zYW5kYm94X2xvYWRlciA9IHBhZ2UuYmxvY2tzW3hdLmZyYW1lc19sb2FkZXJmdW5jdGlvbjtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmZyYW1lSUQgPSBwYWdlLmJsb2Nrc1t4XS5mcmFtZXNfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKCBwYWdlLmJsb2Nrc1t4XS5mcmFtZXNfZ2xvYmFsID09PSAnMScgKSBuZXdCbG9jay5nbG9iYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmNyZWF0ZVBhcmVudExJKHBhZ2UuYmxvY2tzW3hdLmZyYW1lc19oZWlnaHQpO1xuICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmNyZWF0ZUZyYW1lKHBhZ2UuYmxvY2tzW3hdKTtcbiAgICAgICAgICAgICAgICBuZXdCbG9jay5jcmVhdGVGcmFtZUNvdmVyKCk7XG4gICAgICAgICAgICAgICAgbmV3QmxvY2suaW5zZXJ0QmxvY2tJbnRvRG9tKHRoaXMucGFyZW50VUwpO1xuXG4gICAgICAgICAgICAgICAgLy9hZGQgdGhlIGJsb2NrIHRvIHRoZSBuZXcgcGFnZVxuICAgICAgICAgICAgICAgIHRoaXMuYmxvY2tzLnB1c2gobmV3QmxvY2spO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vYWRkIHRoaXMgcGFnZSB0byB0aGUgc2l0ZSBvYmplY3RcbiAgICAgICAgc2l0ZS5zaXRlUGFnZXMucHVzaCggdGhpcyApO1xuXG4gICAgICAgIC8vcGxhbnQgdGhlIG5ldyBVTCBpbiB0aGUgRE9NIChvbiB0aGUgY2FudmFzKVxuICAgICAgICBzaXRlLmRpdkNhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLnBhcmVudFVMKTtcblxuICAgICAgICAvL21ha2UgdGhlIGJsb2Nrcy9mcmFtZXMgaW4gZWFjaCBwYWdlIHNvcnRhYmxlXG5cbiAgICAgICAgdmFyIHRoZVBhZ2UgPSB0aGlzO1xuXG4gICAgICAgICQodGhpcy5wYXJlbnRVTCkuc29ydGFibGUoe1xuICAgICAgICAgICAgcmV2ZXJ0OiB0cnVlLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiZHJvcC1ob3ZlclwiLFxuICAgICAgICAgICAgaGFuZGxlOiAnLmRyYWdCbG9jaycsXG4gICAgICAgICAgICBjYW5jZWw6ICcnLFxuICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNpdGUubW92ZU1vZGUoJ29mZicpO1xuICAgICAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCAhc2l0ZS5sb2FkZWQoKSApIGJ1aWxkZXJVSS5jYW52YXNMb2FkaW5nKCdvbicpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJlZm9yZVN0b3A6IGZ1bmN0aW9uKGV2ZW50LCB1aSl7XG5cbiAgICAgICAgICAgICAgICAvL3RlbXBsYXRlIG9yIHJlZ3VsYXIgYmxvY2s/XG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSB1aS5pdGVtLmF0dHIoJ2RhdGEtZnJhbWVzJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgbmV3QmxvY2s7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF0dHIgIT09IHR5cGVvZiB1bmRlZmluZWQgJiYgYXR0ciAhPT0gZmFsc2UpIHsvL3RlbXBsYXRlLCBidWlsZCBpdFxuXG4gICAgICAgICAgICAgICAgICAgICQoJyNzdGFydCcpLmhpZGUoKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2NsZWFyIG91dCBhbGwgYmxvY2tzIG9uIHRoaXMgcGFnZVxuICAgICAgICAgICAgICAgICAgICB0aGVQYWdlLmNsZWFyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGUgdGhlIG5ldyBmcmFtZXNcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZyYW1lSURzID0gdWkuaXRlbS5hdHRyKCdkYXRhLWZyYW1lcycpLnNwbGl0KCctJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHRzID0gdWkuaXRlbS5hdHRyKCdkYXRhLWhlaWdodHMnKS5zcGxpdCgnLScpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJscyA9IHVpLml0ZW0uYXR0cignZGF0YS1vcmlnaW5hbHVybHMnKS5zcGxpdCgnLScpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciggdmFyIHggPSAwOyB4IDwgZnJhbWVJRHMubGVuZ3RoOyB4KyspIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3QmxvY2sgPSBuZXcgQmxvY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmNyZWF0ZVBhcmVudExJKGhlaWdodHNbeF0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnJhbWVEYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lRGF0YS5zcmMgPSBhcHBVSS5zaXRlVXJsKydzaXRlL2dldGZyYW1lLycrZnJhbWVJRHNbeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZURhdGEub3JpZ2luYWxfdXJsID0gYXBwVUkuc2l0ZVVybCsnc2l0ZS9nZXRmcmFtZS8nK2ZyYW1lSURzW3hdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWVEYXRhLmZyYW1lc19oZWlnaHQgPSBoZWlnaHRzW3hdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdCbG9jay5jcmVhdGVGcmFtZSggZnJhbWVEYXRhICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdCbG9jay5jcmVhdGVGcmFtZUNvdmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdCbG9jay5pbnNlcnRCbG9ja0ludG9Eb20odGhlUGFnZS5wYXJlbnRVTCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYWRkIHRoZSBibG9jayB0byB0aGUgbmV3IHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZVBhZ2UuYmxvY2tzLnB1c2gobmV3QmxvY2spO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2Ryb3BwZWQgZWxlbWVudCwgc28gd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICAgICAgc2l0ZS5zZXRQZW5kaW5nQ2hhbmdlcyh0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy9zZXQgdGhlIHRlbXBhdGVJRFxuICAgICAgICAgICAgICAgICAgICBidWlsZGVyVUkudGVtcGxhdGVJRCA9IHVpLml0ZW0uYXR0cignZGF0YS1wYWdlaWQnKTtcblxuICAgICAgICAgICAgICAgICAgICAvL21ha2Ugc3VyZSBub3RoaW5nIGdldHMgZHJvcHBlZCBpbiB0aGUgbHNpdFxuICAgICAgICAgICAgICAgICAgICB1aS5pdGVtLmh0bWwobnVsbCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9kZWxldGUgZHJhZyBwbGFjZSBob2xkZXJcbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keSAudWktc29ydGFibGUtaGVscGVyJykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Ugey8vcmVndWxhciBibG9ja1xuXG4gICAgICAgICAgICAgICAgICAgIC8vYXJlIHdlIGRlYWxpbmcgd2l0aCBhIG5ldyBibG9jayBiZWluZyBkcm9wcGVkIG9udG8gdGhlIGNhbnZhcywgb3IgYSByZW9yZGVyaW5nIG9nIGJsb2NrcyBhbHJlYWR5IG9uIHRoZSBjYW52YXM/XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoIHVpLml0ZW0uZmluZCgnLmZyYW1lQ292ZXIgPiBidXR0b24nKS5zaXplKCkgPiAwICkgey8vcmUtb3JkZXJpbmcgb2YgYmxvY2tzIG9uIGNhbnZhc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL25vIG5lZWQgdG8gY3JlYXRlIGEgbmV3IGJsb2NrIG9iamVjdCwgd2Ugc2ltcGx5IG5lZWQgdG8gbWFrZSBzdXJlIHRoZSBwb3NpdGlvbiBvZiB0aGUgZXhpc3RpbmcgYmxvY2sgaW4gdGhlIFNpdGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2lzIGNoYW5nZWQgdG8gcmVmbGVjdCB0aGUgbmV3IHBvc2l0aW9uIG9mIHRoZSBibG9jayBvbiB0aCBjYW52YXNcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZyYW1lSUQgPSB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ2lkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3UG9zID0gdWkuaXRlbS5pbmRleCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXRlLmFjdGl2ZVBhZ2Uuc2V0UG9zaXRpb24oZnJhbWVJRCwgbmV3UG9zKTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Ugey8vbmV3IGJsb2NrIG9uIGNhbnZhc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL25ldyBibG9ja1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3QmxvY2sgPSBuZXcgQmxvY2soKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3QmxvY2sucGxhY2VPbkNhbnZhcyh1aSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcblxuICAgICAgICAgICAgICAgIHNpdGUubW92ZU1vZGUoJ29uJyk7XG5cbiAgICAgICAgICAgICAgICBpZiggdWkuaXRlbS5maW5kKCcuZnJhbWVDb3ZlcicpLnNpemUoKSAhPT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgYnVpbGRlclVJLmZyYW1lQ29udGVudHMgPSB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICkuaHRtbCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG92ZXI6IGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAkKCcjc3RhcnQnKS5oaWRlKCk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9hZGQgdG8gdGhlIHBhZ2VzIG1lbnVcbiAgICAgICAgdGhpcy5tZW51SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0xJJyk7XG4gICAgICAgIHRoaXMubWVudUl0ZW0uaW5uZXJIVE1MID0gdGhpcy5wYWdlTWVudVRlbXBsYXRlO1xuXG4gICAgICAgICQodGhpcy5tZW51SXRlbSkuZmluZCgnYTpmaXJzdCcpLnRleHQocGFnZU5hbWUpLmF0dHIoJ2hyZWYnLCAnI3BhZ2UnK2NvdW50ZXIpO1xuXG4gICAgICAgIHZhciB0aGVMaW5rID0gJCh0aGlzLm1lbnVJdGVtKS5maW5kKCdhOmZpcnN0JykuZ2V0KDApO1xuXG4gICAgICAgIC8vYmluZCBzb21lIGV2ZW50c1xuICAgICAgICB0aGlzLm1lbnVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMubWVudUl0ZW0ucXVlcnlTZWxlY3RvcignYS5maWxlRWRpdCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLm1lbnVJdGVtLnF1ZXJ5U2VsZWN0b3IoJ2EuZmlsZVNhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5tZW51SXRlbS5xdWVyeVNlbGVjdG9yKCdhLmZpbGVEZWwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMsIGZhbHNlKTtcblxuICAgICAgICAvL2FkZCB0byB0aGUgcGFnZSBsaW5rIGRyb3Bkb3duXG4gICAgICAgIHRoaXMubGlua3NEcm9wZG93bkl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdPUFRJT04nKTtcbiAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgcGFnZU5hbWUrXCIuaHRtbFwiKTtcbiAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbS50ZXh0ID0gcGFnZU5hbWU7XG5cbiAgICAgICAgYnVpbGRlclVJLmRyb3Bkb3duUGFnZUxpbmtzLmFwcGVuZENoaWxkKCB0aGlzLmxpbmtzRHJvcGRvd25JdGVtICk7XG5cbiAgICAgICAgc2l0ZS5wYWdlc01lbnUuYXBwZW5kQ2hpbGQodGhpcy5tZW51SXRlbSk7XG5cbiAgICB9XG5cbiAgICBQYWdlLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImNsaWNrXCI6XG5cbiAgICAgICAgICAgICAgICBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZmlsZUVkaXQnKSApIHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRQYWdlTmFtZSgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKCBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaWxlU2F2ZScpICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUGFnZU5hbWVFdmVudChldmVudC50YXJnZXQpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKCBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaWxlRGVsJykgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoZVBhZ2UgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgICAgICQoYnVpbGRlclVJLm1vZGFsRGVsZXRlUGFnZSkubW9kYWwoJ3Nob3cnKTtcblxuICAgICAgICAgICAgICAgICAgICAkKGJ1aWxkZXJVSS5tb2RhbERlbGV0ZVBhZ2UpLm9mZignY2xpY2snLCAnI2RlbGV0ZVBhZ2VDb25maXJtJykub24oJ2NsaWNrJywgJyNkZWxldGVQYWdlQ29uZmlybScsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVQYWdlLmRlbGV0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGJ1aWxkZXJVSS5tb2RhbERlbGV0ZVBhZ2UpLm1vZGFsKCdoaWRlJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0UGFnZSgpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvKlxuICAgICAgICBCbG9jayBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gQmxvY2sgKCkge1xuXG4gICAgICAgIHRoaXMuZnJhbWVJRCA9IDA7XG4gICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2FuZGJveCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNhbmRib3hfbG9hZGVyID0gJyc7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gJyc7Ly8nJywgJ2NoYW5nZWQnIG9yICduZXcnXG4gICAgICAgIHRoaXMuZ2xvYmFsID0gZmFsc2U7XG4gICAgICAgIHRoaXMub3JpZ2luYWxfdXJsID0gJyc7XG5cbiAgICAgICAgdGhpcy5wYXJlbnRMSSA9IHt9O1xuICAgICAgICB0aGlzLmZyYW1lQ292ZXIgPSB7fTtcbiAgICAgICAgdGhpcy5mcmFtZSA9IHt9O1xuICAgICAgICB0aGlzLmZyYW1lRG9jdW1lbnQgPSB7fTtcbiAgICAgICAgdGhpcy5mcmFtZUhlaWdodCA9IDA7XG5cbiAgICAgICAgdGhpcy5hbm5vdCA9IHt9O1xuICAgICAgICB0aGlzLmFubm90VGltZW91dCA9IHt9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBjcmVhdGVzIHRoZSBwYXJlbnQgY29udGFpbmVyIChMSSlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jcmVhdGVQYXJlbnRMSSA9IGZ1bmN0aW9uKGhlaWdodCkge1xuXG4gICAgICAgICAgICB0aGlzLnBhcmVudExJID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnTEknKTtcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkuc2V0QXR0cmlidXRlKCdjbGFzcycsICdlbGVtZW50Jyk7XG4gICAgICAgICAgICAvL3RoaXMucGFyZW50TEkuc2V0QXR0cmlidXRlKCdzdHlsZScsICdoZWlnaHQ6ICcraGVpZ2h0KydweCcpO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGNyZWF0ZXMgdGhlIGlmcmFtZSBvbiB0aGUgY2FudmFzXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY3JlYXRlRnJhbWUgPSBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZnJhbWUpO1xuICAgICAgICAgICAgdGhpcy5mcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0lGUkFNRScpO1xuICAgICAgICAgICAgdGhpcy5mcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lYm9yZGVyJywgMCk7XG4gICAgICAgICAgICB0aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnc2Nyb2xsaW5nJywgMCk7XG4gICAgICAgICAgICB0aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnc3JjJywgZnJhbWUuc3JjKTtcbiAgICAgICAgICAgIHRoaXMuZnJhbWUuc2V0QXR0cmlidXRlKCdkYXRhLW9yaWdpbmFsdXJsJywgZnJhbWUub3JpZ2luYWxfdXJsKTtcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxfdXJsID0gZnJhbWUub3JpZ2luYWxfdXJsO1xuICAgICAgICAgICAgLy90aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnZGF0YS1oZWlnaHQnLCBmcmFtZS5mcmFtZXNfaGVpZ2h0KTtcbiAgICAgICAgICAgIC8vdGhpcy5mcmFtZUhlaWdodCA9IGZyYW1lLmZyYW1lc19oZWlnaHQ7XG5cbiAgICAgICAgICAgICQodGhpcy5mcmFtZSkudW5pcXVlSWQoKTtcblxuICAgICAgICAgICAgLy9zYW5kYm94P1xuICAgICAgICAgICAgaWYoIHRoaXMuc2FuZGJveCAhPT0gZmFsc2UgKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnZGF0YS1sb2FkZXJmdW5jdGlvbicsIHRoaXMuc2FuZGJveF9sb2FkZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuZnJhbWUuc2V0QXR0cmlidXRlKCdkYXRhLXNhbmRib3gnLCB0aGlzLnNhbmRib3gpO1xuXG4gICAgICAgICAgICAgICAgLy9yZWNyZWF0ZSB0aGUgc2FuZGJveGVkIGlmcmFtZSBlbHNld2hlcmVcbiAgICAgICAgICAgICAgICB2YXIgc2FuZGJveGVkRnJhbWUgPSAkKCc8aWZyYW1lIHNyYz1cIicrZnJhbWUuc3JjKydcIiBpZD1cIicrdGhpcy5zYW5kYm94KydcIiBzYW5kYm94PVwiYWxsb3ctc2FtZS1vcmlnaW5cIj48L2lmcmFtZT4nKTtcbiAgICAgICAgICAgICAgICAkKCcjc2FuZGJveGVzJykuYXBwZW5kKCBzYW5kYm94ZWRGcmFtZSApO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgaW5zZXJ0IHRoZSBpZnJhbWUgaW50byB0aGUgRE9NIG9uIHRoZSBjYW52YXNcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pbnNlcnRCbG9ja0ludG9Eb20gPSBmdW5jdGlvbih0aGVVTCkge1xuXG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLmFwcGVuZENoaWxkKHRoaXMuZnJhbWUpO1xuICAgICAgICAgICAgdGhlVUwuYXBwZW5kQ2hpbGQoIHRoaXMucGFyZW50TEkgKTtcblxuICAgICAgICAgICAgdGhpcy5mcmFtZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcywgZmFsc2UpO1xuXG4gICAgICAgICAgICBidWlsZGVyVUkuY2FudmFzTG9hZGluZygnb24nKTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBzZXRzIHRoZSBmcmFtZSBkb2N1bWVudCBmb3IgdGhlIGJsb2NrJ3MgaWZyYW1lXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2V0RnJhbWVEb2N1bWVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5mcmFtZSk7XG4gICAgICAgICAgICAvL3NldCB0aGUgZnJhbWUgZG9jdW1lbnQgYXMgd2VsbFxuICAgICAgICAgICAgaWYoIHRoaXMuZnJhbWUuY29udGVudERvY3VtZW50ICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJhbWVEb2N1bWVudCA9IHRoaXMuZnJhbWUuY29udGVudERvY3VtZW50O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyYW1lRG9jdW1lbnQgPSB0aGlzLmZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vdGhpcy5oZWlnaHRBZGp1c3RtZW50KCk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgY3JlYXRlcyB0aGUgZnJhbWUgY292ZXIgYW5kIGJsb2NrIGFjdGlvbiBidXR0b25cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jcmVhdGVGcmFtZUNvdmVyID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vYnVpbGQgdGhlIGZyYW1lIGNvdmVyIGFuZCBibG9jayBhY3Rpb24gYnV0dG9uc1xuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuY2xhc3NMaXN0LmFkZCgnZnJhbWVDb3ZlcicpO1xuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdmVyLmNsYXNzTGlzdC5hZGQoJ2ZyZXNoJyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdCVVRUT04nKTtcbiAgICAgICAgICAgIGRlbEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2J0biBidG4taW52ZXJzZSBidG4tc20gZGVsZXRlQmxvY2snKTtcbiAgICAgICAgICAgIGRlbEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnYnV0dG9uJyk7XG4gICAgICAgICAgICBkZWxCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZnVpLXRyYXNoXCI+PC9pPiA8c3Bhbj5yZW1vdmU8L3NwYW4+JztcbiAgICAgICAgICAgIGRlbEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMsIGZhbHNlKTtcblxuICAgICAgICAgICAgdmFyIHJlc2V0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnQlVUVE9OJyk7XG4gICAgICAgICAgICByZXNldEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2J0biBidG4taW52ZXJzZSBidG4tc20gcmVzZXRCbG9jaycpO1xuICAgICAgICAgICAgcmVzZXRCdXR0b24uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2J1dHRvbicpO1xuICAgICAgICAgICAgcmVzZXRCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtcmVmcmVzaFwiPjwvaT4gPHNwYW4+cmVzZXQ8L3NwYW4+JztcbiAgICAgICAgICAgIHJlc2V0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuXG4gICAgICAgICAgICB2YXIgaHRtbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0JVVFRPTicpO1xuICAgICAgICAgICAgaHRtbEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2J0biBidG4taW52ZXJzZSBidG4tc20gaHRtbEJsb2NrJyk7XG4gICAgICAgICAgICBodG1sQnV0dG9uLnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICAgICAgICAgIGh0bWxCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtY29kZVwiPjwvaT4gPHNwYW4+c291cmNlPC9zcGFuPic7XG4gICAgICAgICAgICBodG1sQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuXG4gICAgICAgICAgICB2YXIgZHJhZ0J1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0JVVFRPTicpO1xuICAgICAgICAgICAgZHJhZ0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2J0biBidG4taW52ZXJzZSBidG4tc20gZHJhZ0Jsb2NrJyk7XG4gICAgICAgICAgICBkcmFnQnV0dG9uLnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICAgICAgICAgIGRyYWdCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtYXJyb3dzXCI+PC9pPiA8c3Bhbj5Nb3ZlPC9zcGFuPic7XG4gICAgICAgICAgICBkcmFnQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuXG4gICAgICAgICAgICB2YXIgZ2xvYmFsTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdMQUJFTCcpO1xuICAgICAgICAgICAgZ2xvYmFsTGFiZWwuY2xhc3NMaXN0LmFkZCgnY2hlY2tib3gnKTtcbiAgICAgICAgICAgIGdsb2JhbExhYmVsLmNsYXNzTGlzdC5hZGQoJ3ByaW1hcnknKTtcbiAgICAgICAgICAgIHZhciBnbG9iYWxDaGVja2JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0lOUFVUJyk7XG4gICAgICAgICAgICBnbG9iYWxDaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcbiAgICAgICAgICAgIGdsb2JhbENoZWNrYm94LnNldEF0dHJpYnV0ZSgnZGF0YS10b2dnbGUnLCAnY2hlY2tib3gnKTtcbiAgICAgICAgICAgIGdsb2JhbENoZWNrYm94LmNoZWNrZWQgPSB0aGlzLmdsb2JhbDtcbiAgICAgICAgICAgIGdsb2JhbExhYmVsLmFwcGVuZENoaWxkKGdsb2JhbENoZWNrYm94KTtcbiAgICAgICAgICAgIHZhciBnbG9iYWxUZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ0dsb2JhbCcpO1xuICAgICAgICAgICAgZ2xvYmFsTGFiZWwuYXBwZW5kQ2hpbGQoZ2xvYmFsVGV4dCk7XG5cbiAgICAgICAgICAgIHZhciB0cmlnZ2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgdHJpZ2dlci5jbGFzc0xpc3QuYWRkKCdmdWktZ2VhcicpO1xuXG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuYXBwZW5kQ2hpbGQoZGVsQnV0dG9uKTtcbiAgICAgICAgICAgIHRoaXMuZnJhbWVDb3Zlci5hcHBlbmRDaGlsZChyZXNldEJ1dHRvbik7XG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuYXBwZW5kQ2hpbGQoaHRtbEJ1dHRvbik7XG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuYXBwZW5kQ2hpbGQoZHJhZ0J1dHRvbik7XG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuYXBwZW5kQ2hpbGQoZ2xvYmFsTGFiZWwpO1xuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdmVyLmFwcGVuZENoaWxkKHRyaWdnZXIpO1xuXG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLmFwcGVuZENoaWxkKHRoaXMuZnJhbWVDb3Zlcik7XG5cbiAgICAgICAgICAgIHZhciB0aGVCbG9jayA9IHRoaXM7XG5cbiAgICAgICAgICAgICQoZ2xvYmFsQ2hlY2tib3gpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoZSkge1xuXG4gICAgICAgICAgICAgICAgdGhlQmxvY2sudG9nZ2xlR2xvYmFsKGUpO1xuXG4gICAgICAgICAgICB9KS5yYWRpb2NoZWNrKCk7XG5cbiAgICAgICAgfTtcblxuXG4gICAgICAgIC8qXG5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50b2dnbGVHbG9iYWwgPSBmdW5jdGlvbiAoZSkge1xuXG4gICAgICAgICAgICBpZiAoIGUuY3VycmVudFRhcmdldC5jaGVja2VkICkgdGhpcy5nbG9iYWwgPSB0cnVlO1xuICAgICAgICAgICAgZWxzZSB0aGlzLmdsb2JhbCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvL3dlJ3ZlIGdvdCBwZW5kaW5nIGNoYW5nZXNcbiAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuXG4gICAgICAgIH07XG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgYXV0b21hdGljYWxseSBjb3JyZWN0cyB0aGUgaGVpZ2h0IG9mIHRoZSBibG9jaydzIGlmcmFtZSBkZXBlbmRpbmcgb24gaXRzIGNvbnRlbnRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWlnaHRBZGp1c3RtZW50ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlmICggT2JqZWN0LmtleXModGhpcy5mcmFtZURvY3VtZW50KS5sZW5ndGggIT09IDAgKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBib2R5SGVpZ2h0ID0gdGhpcy5mcmFtZURvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBwYWdlQ29udGFpbmVySGVpZ2h0ID0gdGhpcy5mcmFtZURvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvciggYkNvbmZpZy5wYWdlQ29udGFpbmVyICkub2Zmc2V0SGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgaWYgKCBib2R5SGVpZ2h0ID4gcGFnZUNvbnRhaW5lckhlaWdodCAmJiAhdGhpcy5mcmFtZURvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKCBiQ29uZmlnLmJvZHlQYWRkaW5nQ2xhc3MgKSApIGhlaWdodCA9IHBhZ2VDb250YWluZXJIZWlnaHQ7XG4gICAgICAgICAgICAgICAgZWxzZSBoZWlnaHQgPSBib2R5SGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFtZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQrXCJweFwiO1xuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50TEkuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0K1wicHhcIjtcbiAgICAgICAgICAgICAgICAvL3RoaXMuZnJhbWVDb3Zlci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQrXCJweFwiO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFtZUhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGRlbGV0ZXMgYSBibG9ja1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAvL3JlbW92ZSBmcm9tIERPTS9jYW52YXMgd2l0aCBhIG5pY2UgYW5pbWF0aW9uXG4gICAgICAgICAgICAkKHRoaXMuZnJhbWUucGFyZW50Tm9kZSkuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgc2l0ZS5hY3RpdmVQYWdlLmlzRW1wdHkoKTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vcmVtb3ZlIGZyb20gYmxvY2tzIGFycmF5IGluIHRoZSBhY3RpdmUgcGFnZVxuICAgICAgICAgICAgc2l0ZS5hY3RpdmVQYWdlLmRlbGV0ZUJsb2NrKHRoaXMpO1xuXG4gICAgICAgICAgICAvL3NhbmJveFxuICAgICAgICAgICAgaWYoIHRoaXMuc2FuYmRveCApIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggdGhpcy5zYW5kYm94ICkucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vZWxlbWVudCB3YXMgZGVsZXRlZCwgc28gd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlXG4gICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHJlc2V0cyBhIGJsb2NrIHRvIGl0J3Mgb3JpZ25hbCBzdGF0ZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24gKGZpcmVFdmVudCkge1xuXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBmaXJlRXZlbnQgPT09ICd1bmRlZmluZWQnKSBmaXJlRXZlbnQgPSB0cnVlO1xuXG4gICAgICAgICAgICAvL3Jlc2V0IGZyYW1lIGJ5IHJlbG9hZGluZyBpdFxuICAgICAgICAgICAgdGhpcy5mcmFtZS5jb250ZW50V2luZG93LmxvY2F0aW9uID0gdGhpcy5mcmFtZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3JpZ2luYWx1cmwnKTtcblxuICAgICAgICAgICAgLy9zYW5kYm94P1xuICAgICAgICAgICAgaWYoIHRoaXMuc2FuZGJveCApIHtcbiAgICAgICAgICAgICAgICB2YXIgc2FuZGJveEZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5zYW5kYm94KS5jb250ZW50V2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2VsZW1lbnQgd2FzIGRlbGV0ZWQsIHNvIHdlJ3ZlIGdvdCBwZW5kaW5nIGNoYW5nZXNcbiAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG5cbiAgICAgICAgICAgIGJ1aWxkZXJVSS5jYW52YXNMb2FkaW5nKCdvbicpO1xuXG4gICAgICAgICAgICBpZiAoIGZpcmVFdmVudCApIHB1Ymxpc2hlci5wdWJsaXNoKCdvbkJsb2NrQ2hhbmdlJywgdGhpcywgJ3JlbG9hZCcpO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGxhdW5jaGVzIHRoZSBzb3VyY2UgY29kZSBlZGl0b3JcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zb3VyY2UgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgLy9oaWRlIHRoZSBpZnJhbWVcbiAgICAgICAgICAgIHRoaXMuZnJhbWUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgICAgICAgICAgLy9kaXNhYmxlIHNvcnRhYmxlIG9uIHRoZSBwYXJlbnRMSVxuICAgICAgICAgICAgJCh0aGlzLnBhcmVudExJLnBhcmVudE5vZGUpLnNvcnRhYmxlKCdkaXNhYmxlJyk7XG5cbiAgICAgICAgICAgIC8vYnVpbHQgZWRpdG9yIGVsZW1lbnRcbiAgICAgICAgICAgIHZhciB0aGVFZGl0b3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdESVYnKTtcbiAgICAgICAgICAgIHRoZUVkaXRvci5jbGFzc0xpc3QuYWRkKCdhY2VFZGl0b3InKTtcbiAgICAgICAgICAgICQodGhlRWRpdG9yKS51bmlxdWVJZCgpO1xuXG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLmFwcGVuZENoaWxkKHRoZUVkaXRvcik7XG5cbiAgICAgICAgICAgIC8vYnVpbGQgYW5kIGFwcGVuZCBlcnJvciBkcmF3ZXJcbiAgICAgICAgICAgIHZhciBuZXdMSSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0xJJyk7XG4gICAgICAgICAgICB2YXIgZXJyb3JEcmF3ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdESVYnKTtcbiAgICAgICAgICAgIGVycm9yRHJhd2VyLmNsYXNzTGlzdC5hZGQoJ2Vycm9yRHJhd2VyJyk7XG4gICAgICAgICAgICBlcnJvckRyYXdlci5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2Rpdl9lcnJvckRyYXdlcicpO1xuICAgICAgICAgICAgZXJyb3JEcmF3ZXIuaW5uZXJIVE1MID0gJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi14cyBidG4tZW1ib3NzZWQgYnRuLWRlZmF1bHQgYnV0dG9uX2NsZWFyRXJyb3JEcmF3ZXJcIiBpZD1cImJ1dHRvbl9jbGVhckVycm9yRHJhd2VyXCI+Q0xFQVI8L2J1dHRvbj4nO1xuICAgICAgICAgICAgbmV3TEkuYXBwZW5kQ2hpbGQoZXJyb3JEcmF3ZXIpO1xuICAgICAgICAgICAgZXJyb3JEcmF3ZXIucXVlcnlTZWxlY3RvcignYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld0xJLCB0aGlzLnBhcmVudExJLm5leHRTaWJsaW5nKTtcblxuICAgICAgICAgICAgYWNlLmNvbmZpZy5zZXQoXCJiYXNlUGF0aFwiLCBcIi9qcy92ZW5kb3IvYWNlXCIpO1xuXG4gICAgICAgICAgICB2YXIgdGhlSWQgPSB0aGVFZGl0b3IuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgICAgICAgdmFyIGVkaXRvciA9IGFjZS5lZGl0KCB0aGVJZCApO1xuXG4gICAgICAgICAgICAvL2VkaXRvci5nZXRTZXNzaW9uKCkuc2V0VXNlV3JhcE1vZGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIHZhciBwYWdlQ29udGFpbmVyID0gdGhpcy5mcmFtZURvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGJDb25maWcucGFnZUNvbnRhaW5lciApO1xuICAgICAgICAgICAgdmFyIHRoZUhUTUwgPSBwYWdlQ29udGFpbmVyLmlubmVySFRNTDtcblxuXG4gICAgICAgICAgICBlZGl0b3Iuc2V0VmFsdWUoIHRoZUhUTUwgKTtcbiAgICAgICAgICAgIGVkaXRvci5zZXRUaGVtZShcImFjZS90aGVtZS90d2lsaWdodFwiKTtcbiAgICAgICAgICAgIGVkaXRvci5nZXRTZXNzaW9uKCkuc2V0TW9kZShcImFjZS9tb2RlL2h0bWxcIik7XG5cbiAgICAgICAgICAgIHZhciBibG9jayA9IHRoaXM7XG5cblxuICAgICAgICAgICAgZWRpdG9yLmdldFNlc3Npb24oKS5vbihcImNoYW5nZUFubm90YXRpb25cIiwgZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgIGJsb2NrLmFubm90ID0gZWRpdG9yLmdldFNlc3Npb24oKS5nZXRBbm5vdGF0aW9ucygpO1xuXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGJsb2NrLmFubm90VGltZW91dCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGltZW91dENvdW50O1xuXG4gICAgICAgICAgICAgICAgaWYoICQoJyNkaXZfZXJyb3JEcmF3ZXIgcCcpLnNpemUoKSA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dENvdW50ID0gYkNvbmZpZy5zb3VyY2VDb2RlRWRpdFN5bnRheERlbGF5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRDb3VudCA9IDEwMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBibG9jay5hbm5vdFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGJsb2NrLmFubm90KXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrLmFubm90Lmhhc093blByb3BlcnR5KGtleSkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBibG9jay5hbm5vdFtrZXldLnRleHQgIT09IFwiU3RhcnQgdGFnIHNlZW4gd2l0aG91dCBzZWVpbmcgYSBkb2N0eXBlIGZpcnN0LiBFeHBlY3RlZCBlLmcuIDwhRE9DVFlQRSBodG1sPi5cIiApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3TGluZSA9ICQoJzxwPjwvcD4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0tleSA9ICQoJzxiPicrYmxvY2suYW5ub3Rba2V5XS50eXBlKyc6IDwvYj4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0luZm8gPSAkKCc8c3Bhbj4gJytibG9jay5hbm5vdFtrZXldLnRleHQgKyBcIm9uIGxpbmUgXCIgKyBcIiA8Yj5cIiArIGJsb2NrLmFubm90W2tleV0ucm93Kyc8L2I+PC9zcGFuPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdMaW5lLmFwcGVuZCggbmV3S2V5ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0xpbmUuYXBwZW5kKCBuZXdJbmZvICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2Rpdl9lcnJvckRyYXdlcicpLmFwcGVuZCggbmV3TGluZSApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmKCAkKCcjZGl2X2Vycm9yRHJhd2VyJykuY3NzKCdkaXNwbGF5JykgPT09ICdub25lJyAmJiAkKCcjZGl2X2Vycm9yRHJhd2VyJykuZmluZCgncCcpLnNpemUoKSA+IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjZGl2X2Vycm9yRHJhd2VyJykuc2xpZGVEb3duKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0sIHRpbWVvdXRDb3VudCk7XG5cblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vYnV0dG9uc1xuICAgICAgICAgICAgdmFyIGNhbmNlbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0JVVFRPTicpO1xuICAgICAgICAgICAgY2FuY2VsQnV0dG9uLnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICAgICAgICAgIGNhbmNlbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdidG4nKTtcbiAgICAgICAgICAgIGNhbmNlbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdidG4tZGFuZ2VyJyk7XG4gICAgICAgICAgICBjYW5jZWxCdXR0b24uY2xhc3NMaXN0LmFkZCgnZWRpdENhbmNlbEJ1dHRvbicpO1xuICAgICAgICAgICAgY2FuY2VsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bi1zbScpO1xuICAgICAgICAgICAgY2FuY2VsQnV0dG9uLmlubmVySFRNTCA9ICc8aSBjbGFzcz1cImZ1aS1jcm9zc1wiPjwvaT4gPHNwYW4+Q2FuY2VsPC9zcGFuPic7XG4gICAgICAgICAgICBjYW5jZWxCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIHZhciBzYXZlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnQlVUVE9OJyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICAgICAgICAgIHNhdmVCdXR0b24uY2xhc3NMaXN0LmFkZCgnYnRuJyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bi1wcmltYXJ5Jyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2VkaXRTYXZlQnV0dG9uJyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bi1zbScpO1xuICAgICAgICAgICAgc2F2ZUJ1dHRvbi5pbm5lckhUTUwgPSAnPGkgY2xhc3M9XCJmdWktY2hlY2tcIj48L2k+IDxzcGFuPlNhdmU8L3NwYW4+JztcbiAgICAgICAgICAgIHNhdmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIHZhciBidXR0b25XcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG4gICAgICAgICAgICBidXR0b25XcmFwcGVyLmNsYXNzTGlzdC5hZGQoJ2VkaXRvckJ1dHRvbnMnKTtcblxuICAgICAgICAgICAgYnV0dG9uV3JhcHBlci5hcHBlbmRDaGlsZCggY2FuY2VsQnV0dG9uICk7XG4gICAgICAgICAgICBidXR0b25XcmFwcGVyLmFwcGVuZENoaWxkKCBzYXZlQnV0dG9uICk7XG5cbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkuYXBwZW5kQ2hpbGQoIGJ1dHRvbldyYXBwZXIgKTtcblxuICAgICAgICAgICAgYnVpbGRlclVJLmFjZUVkaXRvcnNbIHRoZUlkIF0gPSBlZGl0b3I7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgY2FuY2VscyB0aGUgYmxvY2sgc291cmNlIGNvZGUgZWRpdG9yXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FuY2VsU291cmNlQmxvY2sgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgLy9lbmFibGUgZHJhZ2dhYmxlIG9uIHRoZSBMSVxuICAgICAgICAgICAgJCh0aGlzLnBhcmVudExJLnBhcmVudE5vZGUpLnNvcnRhYmxlKCdlbmFibGUnKTtcblxuICAgICAgICAgICAgLy9kZWxldGUgdGhlIGVycm9yRHJhd2VyXG4gICAgICAgICAgICAkKHRoaXMucGFyZW50TEkubmV4dFNpYmxpbmcpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGUgZWRpdG9yXG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLnF1ZXJ5U2VsZWN0b3IoJy5hY2VFZGl0b3InKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICQodGhpcy5mcmFtZSkuZmFkZUluKDUwMCk7XG5cbiAgICAgICAgICAgICQodGhpcy5wYXJlbnRMSS5xdWVyeVNlbGVjdG9yKCcuZWRpdG9yQnV0dG9ucycpKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgdXBkYXRlcyB0aGUgYmxvY2tzIHNvdXJjZSBjb2RlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2F2ZVNvdXJjZUJsb2NrID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vZW5hYmxlIGRyYWdnYWJsZSBvbiB0aGUgTElcbiAgICAgICAgICAgICQodGhpcy5wYXJlbnRMSS5wYXJlbnROb2RlKS5zb3J0YWJsZSgnZW5hYmxlJyk7XG5cbiAgICAgICAgICAgIHZhciB0aGVJZCA9IHRoaXMucGFyZW50TEkucXVlcnlTZWxlY3RvcignLmFjZUVkaXRvcicpLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgICAgIHZhciB0aGVDb250ZW50ID0gYnVpbGRlclVJLmFjZUVkaXRvcnNbdGhlSWRdLmdldFZhbHVlKCk7XG5cbiAgICAgICAgICAgIC8vZGVsZXRlIHRoZSBlcnJvckRyYXdlclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Rpdl9lcnJvckRyYXdlcicpLnBhcmVudE5vZGUucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIC8vZGVsZXRlIHRoZSBlZGl0b3JcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkucXVlcnlTZWxlY3RvcignLmFjZUVkaXRvcicpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAvL3VwZGF0ZSB0aGUgZnJhbWUncyBjb250ZW50XG4gICAgICAgICAgICB0aGlzLmZyYW1lRG9jdW1lbnQucXVlcnlTZWxlY3RvciggYkNvbmZpZy5wYWdlQ29udGFpbmVyICkuaW5uZXJIVE1MID0gdGhlQ29udGVudDtcbiAgICAgICAgICAgIHRoaXMuZnJhbWUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgICAgICAgICAgIC8vc2FuZGJveGVkP1xuICAgICAgICAgICAgaWYoIHRoaXMuc2FuZGJveCApIHtcblxuICAgICAgICAgICAgICAgIHZhciBzYW5kYm94RnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggdGhpcy5zYW5kYm94ICk7XG4gICAgICAgICAgICAgICAgdmFyIHNhbmRib3hGcmFtZURvY3VtZW50ID0gc2FuZGJveEZyYW1lLmNvbnRlbnREb2N1bWVudCB8fCBzYW5kYm94RnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudDtcblxuICAgICAgICAgICAgICAgIGJ1aWxkZXJVSS50ZW1wRnJhbWUgPSBzYW5kYm94RnJhbWU7XG5cbiAgICAgICAgICAgICAgICBzYW5kYm94RnJhbWVEb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKS5pbm5lckhUTUwgPSB0aGVDb250ZW50O1xuXG4gICAgICAgICAgICAgICAgLy9kbyB3ZSBuZWVkIHRvIGV4ZWN1dGUgYSBsb2FkZXIgZnVuY3Rpb24/XG4gICAgICAgICAgICAgICAgaWYoIHRoaXMuc2FuZGJveF9sb2FkZXIgIT09ICcnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlVG9FeGVjdXRlID0gXCJzYW5kYm94RnJhbWUuY29udGVudFdpbmRvdy5cIit0aGlzLnNhbmRib3hfbG9hZGVyK1wiKClcIjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcEZ1bmMgPSBuZXcgRnVuY3Rpb24oY29kZVRvRXhlY3V0ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRtcEZ1bmMoKTtcbiAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkKHRoaXMucGFyZW50TEkucXVlcnlTZWxlY3RvcignLmVkaXRvckJ1dHRvbnMnKSkuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvL2FkanVzdCBoZWlnaHQgb2YgdGhlIGZyYW1lXG4gICAgICAgICAgICB0aGlzLmhlaWdodEFkanVzdG1lbnQoKTtcblxuICAgICAgICAgICAgLy9uZXcgcGFnZSBhZGRlZCwgd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgc2l0ZS5zZXRQZW5kaW5nQ2hhbmdlcyh0cnVlKTtcblxuICAgICAgICAgICAgLy9ibG9jayBoYXMgY2hhbmdlZFxuICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSAnY2hhbmdlZCc7XG5cbiAgICAgICAgICAgIHB1Ymxpc2hlci5wdWJsaXNoKCdvbkJsb2NrQ2hhbmdlJywgdGhpcywgJ2NoYW5nZScpO1xuICAgICAgICAgICAgcHVibGlzaGVyLnB1Ymxpc2goJ29uQmxvY2tMb2FkZWQnLCB0aGlzKTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBjbGVhcnMgb3V0IHRoZSBlcnJvciBkcmF3ZXJcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbGVhckVycm9yRHJhd2VyID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHZhciBwcyA9IHRoaXMucGFyZW50TEkubmV4dFNpYmxpbmcucXVlcnlTZWxlY3RvckFsbCgncCcpO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHBzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHBzW2ldLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHRvZ2dsZXMgdGhlIHZpc2liaWxpdHkgb2YgdGhpcyBibG9jaydzIGZyYW1lQ292ZXJcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy50b2dnbGVDb3ZlciA9IGZ1bmN0aW9uKG9uT3JPZmYpIHtcblxuICAgICAgICAgICAgaWYoIG9uT3JPZmYgPT09ICdPbicgKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudExJLnF1ZXJ5U2VsZWN0b3IoJy5mcmFtZUNvdmVyJykuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiggb25Pck9mZiA9PT0gJ09mZicgKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudExJLnF1ZXJ5U2VsZWN0b3IoJy5mcmFtZUNvdmVyJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHJldHVybnMgdGhlIGZ1bGwgc291cmNlIGNvZGUgb2YgdGhlIGJsb2NrJ3MgZnJhbWVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5nZXRTb3VyY2UgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IFwiPGh0bWw+XCI7XG4gICAgICAgICAgICBzb3VyY2UgKz0gdGhpcy5mcmFtZURvY3VtZW50LmhlYWQub3V0ZXJIVE1MO1xuICAgICAgICAgICAgc291cmNlICs9IHRoaXMuZnJhbWVEb2N1bWVudC5ib2R5Lm91dGVySFRNTDtcblxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBwbGFjZXMgYSBkcmFnZ2VkL2Ryb3BwZWQgYmxvY2sgZnJvbSB0aGUgbGVmdCBzaWRlYmFyIG9udG8gdGhlIGNhbnZhc1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYWNlT25DYW52YXMgPSBmdW5jdGlvbih1aSkge1xuXG4gICAgICAgICAgICAvL2ZyYW1lIGRhdGEsIHdlJ2xsIG5lZWQgdGhpcyBiZWZvcmUgbWVzc2luZyB3aXRoIHRoZSBpdGVtJ3MgY29udGVudCBIVE1MXG4gICAgICAgICAgICB2YXIgZnJhbWVEYXRhID0ge30sIGF0dHI7XG5cbiAgICAgICAgICAgIGlmKCB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLnNpemUoKSA+IDAgKSB7Ly9pZnJhbWUgdGh1bWJuYWlsXG5cbiAgICAgICAgICAgICAgICBmcmFtZURhdGEuc3JjID0gdWkuaXRlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnKTtcbiAgICAgICAgICAgICAgICBmcmFtZURhdGEub3JpZ2luYWxfdXJsID0gdWkuaXRlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnKTtcbiAgICAgICAgICAgICAgICBmcmFtZURhdGEuZnJhbWVzX2hlaWdodCA9IHVpLml0ZW0uaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICAgICAvL3NhbmRib3hlZCBibG9jaz9cbiAgICAgICAgICAgICAgICBhdHRyID0gdWkuaXRlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzYW5kYm94Jyk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF0dHIgIT09IHR5cGVvZiB1bmRlZmluZWQgJiYgYXR0ciAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYW5kYm94ID0gc2l0ZUJ1aWxkZXJVdGlscy5nZXRSYW5kb21BcmJpdHJhcnkoMTAwMDAsIDEwMDAwMDAwMDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhbmRib3hfbG9hZGVyID0gdWkuaXRlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCdkYXRhLWxvYWRlcmZ1bmN0aW9uJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Ugey8vaW1hZ2UgdGh1bWJuYWlsXG5cbiAgICAgICAgICAgICAgICBmcmFtZURhdGEuc3JjID0gdWkuaXRlbS5maW5kKCdpbWcnKS5hdHRyKCdkYXRhLXNyY2MnKTtcbiAgICAgICAgICAgICAgICBmcmFtZURhdGEub3JpZ2luYWxfdXJsID0gdWkuaXRlbS5maW5kKCdpbWcnKS5hdHRyKCdkYXRhLXNyY2MnKTtcbiAgICAgICAgICAgICAgICBmcmFtZURhdGEuZnJhbWVzX2hlaWdodCA9IHVpLml0ZW0uZmluZCgnaW1nJykuYXR0cignZGF0YS1oZWlnaHQnKTtcblxuICAgICAgICAgICAgICAgIC8vc2FuZGJveGVkIGJsb2NrP1xuICAgICAgICAgICAgICAgIGF0dHIgPSB1aS5pdGVtLmZpbmQoJ2ltZycpLmF0dHIoJ2RhdGEtc2FuZGJveCcpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdHRyICE9PSB0eXBlb2YgdW5kZWZpbmVkICYmIGF0dHIgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2FuZGJveCA9IHNpdGVCdWlsZGVyVXRpbHMuZ2V0UmFuZG9tQXJiaXRyYXJ5KDEwMDAwLCAxMDAwMDAwMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYW5kYm94X2xvYWRlciA9IHVpLml0ZW0uZmluZCgnaW1nJykuYXR0cignZGF0YS1sb2FkZXJmdW5jdGlvbicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2NyZWF0ZSB0aGUgbmV3IGJsb2NrIG9iamVjdFxuICAgICAgICAgICAgdGhpcy5mcmFtZUlEID0gMDtcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkgPSB1aS5pdGVtLmdldCgwKTtcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9ICduZXcnO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVGcmFtZShmcmFtZURhdGEpO1xuICAgICAgICAgICAgdGhpcy5wYXJlbnRMSS5zdHlsZS5oZWlnaHQgPSB0aGlzLmZyYW1lSGVpZ2h0K1wicHhcIjtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlRnJhbWVDb3ZlcigpO1xuXG4gICAgICAgICAgICB0aGlzLmZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzKTtcblxuICAgICAgICAgICAgLy9pbnNlcnQgdGhlIGNyZWF0ZWQgaWZyYW1lXG4gICAgICAgICAgICB1aS5pdGVtLmFwcGVuZCgkKHRoaXMuZnJhbWUpKTtcblxuICAgICAgICAgICAgLy9hZGQgdGhlIGJsb2NrIHRvIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5ibG9ja3Muc3BsaWNlKHVpLml0ZW0uaW5kZXgoKSwgMCwgdGhpcyk7XG5cbiAgICAgICAgICAgIC8vY3VzdG9tIGV2ZW50XG4gICAgICAgICAgICB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLnRyaWdnZXIoJ2NhbnZhc3VwZGF0ZWQnKTtcblxuICAgICAgICAgICAgLy9kcm9wcGVkIGVsZW1lbnQsIHNvIHdlJ3ZlIGdvdCBwZW5kaW5nIGNoYW5nZXNcbiAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgaW5qZWN0cyBleHRlcm5hbCBKUyAoZGVmaW5lZCBpbiBjb25maWcuanMpIGludG8gdGhlIGJsb2NrXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubG9hZEphdmFzY3JpcHQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHZhciBpLFxuICAgICAgICAgICAgICAgIG9sZCxcbiAgICAgICAgICAgICAgICBuZXdTY3JpcHQ7XG5cbiAgICAgICAgICAgIC8vcmVtb3ZlIG9sZCBvbmVzXG4gICAgICAgICAgICBvbGQgPSB0aGlzLmZyYW1lRG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0LmJ1aWxkZXInKTtcblxuICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBvbGQubGVuZ3RoOyBpKysgKSBvbGRbaV0ucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIC8vaW5qZWN0XG4gICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IGJDb25maWcuZXh0ZXJuYWxKUy5sZW5ndGg7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIG5ld1NjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1NDUklQVCcpO1xuICAgICAgICAgICAgICAgIG5ld1NjcmlwdC5jbGFzc0xpc3QuYWRkKCdidWlsZGVyJyk7XG4gICAgICAgICAgICAgICAgbmV3U2NyaXB0LnNyYyA9IGJDb25maWcuZXh0ZXJuYWxKU1tpXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZnJhbWVEb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYXBwZW5kQ2hpbGQobmV3U2NyaXB0KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgQ2hlY2tzIGlmIHRoaXMgYmxvY2sgaGFzIGV4dGVybmFsIHN0eWxlc2hlZXRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oYXNFeHRlcm5hbENTUyA9IGZ1bmN0aW9uIChzcmMpIHtcblxuICAgICAgICAgICAgdmFyIGV4dGVybmFsQ3NzLFxuICAgICAgICAgICAgICAgIHg7XG5cbiAgICAgICAgICAgIGV4dGVybmFsQ3NzID0gdGhpcy5mcmFtZURvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpbmtbaHJlZio9XCInICsgc3JjICsgJ1wiXScpO1xuXG4gICAgICAgICAgICByZXR1cm4gZXh0ZXJuYWxDc3MubGVuZ3RoICE9PSAwO1xuXG4gICAgICAgIH07XG5cbiAgICB9XG5cbiAgICBCbG9jay5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsb2FkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRGcmFtZURvY3VtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWlnaHRBZGp1c3RtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkSmF2YXNjcmlwdCgpO1xuXG4gICAgICAgICAgICAgICAgJCh0aGlzLmZyYW1lQ292ZXIpLnJlbW92ZUNsYXNzKCdmcmVzaCcsIDUwMCk7XG5cbiAgICAgICAgICAgICAgICBwdWJsaXNoZXIucHVibGlzaCgnb25CbG9ja0xvYWRlZCcsIHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgYnVpbGRlclVJLmNhbnZhc0xvYWRpbmcoJ29mZicpO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgXCJjbGlja1wiOlxuXG4gICAgICAgICAgICAgICAgdmFyIHRoZUJsb2NrID0gdGhpcztcblxuICAgICAgICAgICAgICAgIC8vZmlndXJlIG91dCB3aGF0IHRvIGRvIG5leHRcblxuICAgICAgICAgICAgICAgIGlmKCBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkZWxldGVCbG9jaycpIHx8IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLmNsYXNzTGlzdC5jb250YWlucygnZGVsZXRlQmxvY2snKSApIHsvL2RlbGV0ZSB0aGlzIGJsb2NrXG5cbiAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxEZWxldGVCbG9jaykubW9kYWwoJ3Nob3cnKTtcblxuICAgICAgICAgICAgICAgICAgICAkKGJ1aWxkZXJVSS5tb2RhbERlbGV0ZUJsb2NrKS5vZmYoJ2NsaWNrJywgJyNkZWxldGVCbG9ja0NvbmZpcm0nKS5vbignY2xpY2snLCAnI2RlbGV0ZUJsb2NrQ29uZmlybScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVCbG9jay5kZWxldGUoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxEZWxldGVCbG9jaykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3Jlc2V0QmxvY2snKSB8fCBldmVudC50YXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ3Jlc2V0QmxvY2snKSApIHsvL3Jlc2V0IHRoZSBibG9ja1xuXG4gICAgICAgICAgICAgICAgICAgICQoYnVpbGRlclVJLm1vZGFsUmVzZXRCbG9jaykubW9kYWwoJ3Nob3cnKTtcblxuICAgICAgICAgICAgICAgICAgICAkKGJ1aWxkZXJVSS5tb2RhbFJlc2V0QmxvY2spLm9mZignY2xpY2snLCAnI3Jlc2V0QmxvY2tDb25maXJtJykub24oJ2NsaWNrJywgJyNyZXNldEJsb2NrQ29uZmlybScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVCbG9jay5yZXNldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxSZXNldEJsb2NrKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnaHRtbEJsb2NrJykgfHwgZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdodG1sQmxvY2snKSApIHsvL3NvdXJjZSBjb2RlIGVkaXRvclxuXG4gICAgICAgICAgICAgICAgICAgIHRoZUJsb2NrLnNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKCBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0Q2FuY2VsQnV0dG9uJykgfHwgZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0Q2FuY2VsQnV0dG9uJykgKSB7Ly9jYW5jZWwgc291cmNlIGNvZGUgZWRpdG9yXG5cbiAgICAgICAgICAgICAgICAgICAgdGhlQmxvY2suY2FuY2VsU291cmNlQmxvY2soKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZWRpdFNhdmVCdXR0b24nKSB8fCBldmVudC50YXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRTYXZlQnV0dG9uJykgKSB7Ly9zYXZlIHNvdXJjZSBjb2RlXG5cbiAgICAgICAgICAgICAgICAgICAgdGhlQmxvY2suc2F2ZVNvdXJjZUJsb2NrKCk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2J1dHRvbl9jbGVhckVycm9yRHJhd2VyJykgKSB7Ly9jbGVhciBlcnJvciBkcmF3ZXJcblxuICAgICAgICAgICAgICAgICAgICB0aGVCbG9jay5jbGVhckVycm9yRHJhd2VyKCk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8qXG4gICAgICAgIFNpdGUgb2JqZWN0IGxpdGVyYWxcbiAgICAqL1xuICAgIC8qanNoaW50IC1XMDAzICovXG4gICAgdmFyIHNpdGUgPSB7XG5cbiAgICAgICAgcGVuZGluZ0NoYW5nZXM6IGZhbHNlLCAgICAgIC8vcGVuZGluZyBjaGFuZ2VzIG9yIG5vP1xuICAgICAgICBwYWdlczoge30sICAgICAgICAgICAgICAgICAgLy9hcnJheSBjb250YWluaW5nIGFsbCBwYWdlcywgaW5jbHVkaW5nIHRoZSBjaGlsZCBmcmFtZXMsIGxvYWRlZCBmcm9tIHRoZSBzZXJ2ZXIgb24gcGFnZSBsb2FkXG4gICAgICAgIGlzX2FkbWluOiAwLCAgICAgICAgICAgICAgICAvLzAgZm9yIG5vbi1hZG1pbiwgMSBmb3IgYWRtaW5cbiAgICAgICAgZGF0YToge30sICAgICAgICAgICAgICAgICAgIC8vY29udGFpbmVyIGZvciBhamF4IGxvYWRlZCBzaXRlIGRhdGFcbiAgICAgICAgcGFnZXNUb0RlbGV0ZTogW10sICAgICAgICAgIC8vY29udGFpbnMgcGFnZXMgdG8gYmUgZGVsZXRlZFxuXG4gICAgICAgIHNpdGVQYWdlczogW10sICAgICAgICAgICAgICAvL3RoaXMgaXMgdGhlIG9ubHkgdmFyIGNvbnRhaW5pbmcgdGhlIHJlY2VudCBjYW52YXMgY29udGVudHNcblxuICAgICAgICBzaXRlUGFnZXNSZWFkeUZvclNlcnZlcjoge30sICAgICAvL2NvbnRhaW5zIHRoZSBzaXRlIGRhdGEgcmVhZHkgdG8gYmUgc2VudCB0byB0aGUgc2VydmVyXG5cbiAgICAgICAgYWN0aXZlUGFnZToge30sICAgICAgICAgICAgIC8vaG9sZHMgYSByZWZlcmVuY2UgdG8gdGhlIHBhZ2UgY3VycmVudGx5IG9wZW4gb24gdGhlIGNhbnZhc1xuXG4gICAgICAgIHBhZ2VUaXRsZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VUaXRsZScpLC8vaG9sZHMgdGhlIHBhZ2UgdGl0bGUgb2YgdGhlIGN1cnJlbnQgcGFnZSBvbiB0aGUgY2FudmFzXG5cbiAgICAgICAgZGl2Q2FudmFzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZUxpc3QnKSwvL0RJViBjb250YWluaW5nIGFsbCBwYWdlcyBvbiB0aGUgY2FudmFzXG5cbiAgICAgICAgcGFnZXNNZW51OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZXMnKSwgLy9VTCBjb250YWluaW5nIHRoZSBwYWdlcyBtZW51IGluIHRoZSBzaWRlYmFyXG5cbiAgICAgICAgYnV0dG9uTmV3UGFnZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZFBhZ2UnKSxcbiAgICAgICAgbGlOZXdQYWdlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3UGFnZUxJJyksXG5cbiAgICAgICAgaW5wdXRQYWdlU2V0dGluZ3NUaXRsZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VEYXRhX3RpdGxlJyksXG4gICAgICAgIGlucHV0UGFnZVNldHRpbmdzTWV0YURlc2NyaXB0aW9uOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZURhdGFfbWV0YURlc2NyaXB0aW9uJyksXG4gICAgICAgIGlucHV0UGFnZVNldHRpbmdzTWV0YUtleXdvcmRzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZURhdGFfbWV0YUtleXdvcmRzJyksXG4gICAgICAgIGlucHV0UGFnZVNldHRpbmdzSW5jbHVkZXM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlRGF0YV9oZWFkZXJJbmNsdWRlcycpLFxuICAgICAgICBpbnB1dFBhZ2VTZXR0aW5nc1BhZ2VDc3M6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlRGF0YV9oZWFkZXJDc3MnKSxcblxuICAgICAgICBidXR0b25TdWJtaXRQYWdlU2V0dGluZ3M6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlU2V0dGluZ3NTdWJtaXR0QnV0dG9uJyksXG5cbiAgICAgICAgbW9kYWxQYWdlU2V0dGluZ3M6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlU2V0dGluZ3NNb2RhbCcpLFxuXG4gICAgICAgIGJ1dHRvblNhdmU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzYXZlUGFnZScpLFxuXG4gICAgICAgIG1lc3NhZ2VTdGFydDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0JyksXG4gICAgICAgIGRpdkZyYW1lV3JhcHBlcjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZyYW1lV3JhcHBlcicpLFxuXG4gICAgICAgIHNrZWxldG9uOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2tlbGV0b24nKSxcblxuXHRcdGF1dG9TYXZlVGltZXI6IHt9LFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkLmdldEpTT04oYXBwVUkuc2l0ZVVybCtcInNpdGVEYXRhXCIsIGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgICAgICAgICAgaWYoIGRhdGEuc2l0ZSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICAgICAgICBzaXRlLmRhdGEgPSBkYXRhLnNpdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKCBkYXRhLnBhZ2VzICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpdGUucGFnZXMgPSBkYXRhLnBhZ2VzO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNpdGUuaXNfYWRtaW4gPSBkYXRhLmlzX2FkbWluO1xuXG5cdFx0XHRcdGlmKCAkKCcjcGFnZUxpc3QnKS5zaXplKCkgPiAwICkge1xuICAgICAgICAgICAgICAgIFx0YnVpbGRlclVJLnBvcHVsYXRlQ2FudmFzKCk7XG5cdFx0XHRcdH1cblxuICAgICAgICAgICAgICAgIGlmKCBkYXRhLnNpdGUudmlld21vZGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hlci5wdWJsaXNoKCdvblNldE1vZGUnLCBkYXRhLnNpdGUudmlld21vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vZmlyZSBjdXN0b20gZXZlbnRcbiAgICAgICAgICAgICAgICAkKCdib2R5JykudHJpZ2dlcignc2l0ZURhdGFMb2FkZWQnKTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQodGhpcy5idXR0b25OZXdQYWdlKS5vbignY2xpY2snLCBzaXRlLm5ld1BhZ2UpO1xuICAgICAgICAgICAgJCh0aGlzLm1vZGFsUGFnZVNldHRpbmdzKS5vbignc2hvdy5icy5tb2RhbCcsIHNpdGUubG9hZFBhZ2VTZXR0aW5ncyk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uU3VibWl0UGFnZVNldHRpbmdzKS5vbignY2xpY2snLCBzaXRlLnVwZGF0ZVBhZ2VTZXR0aW5ncyk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uU2F2ZSkub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtzaXRlLnNhdmUodHJ1ZSk7fSk7XG5cbiAgICAgICAgICAgIC8vYXV0byBzYXZlIHRpbWVcbiAgICAgICAgICAgIHRoaXMuYXV0b1NhdmVUaW1lciA9IHNldFRpbWVvdXQoc2l0ZS5hdXRvU2F2ZSwgYkNvbmZpZy5hdXRvU2F2ZVRpbWVvdXQpO1xuXG4gICAgICAgICAgICBwdWJsaXNoZXIuc3Vic2NyaWJlKCdvbkJsb2NrQ2hhbmdlJywgZnVuY3Rpb24gKGJsb2NrLCB0eXBlKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoIGJsb2NrLmdsb2JhbCApIHtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBzaXRlLnNpdGVQYWdlcy5sZW5ndGg7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHkgPSAwOyB5IDwgc2l0ZS5zaXRlUGFnZXNbaV0uYmxvY2tzLmxlbmd0aDsgeSArKyApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2l0ZS5zaXRlUGFnZXNbaV0uYmxvY2tzW3ldICE9PSBibG9jayAmJiBzaXRlLnNpdGVQYWdlc1tpXS5ibG9ja3NbeV0ub3JpZ2luYWxfdXJsID09PSBibG9jay5vcmlnaW5hbF91cmwgJiYgc2l0ZS5zaXRlUGFnZXNbaV0uYmxvY2tzW3ldLmdsb2JhbCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGUgPT09ICdjaGFuZ2UnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXRlLnNpdGVQYWdlc1tpXS5ibG9ja3NbeV0uZnJhbWVEb2N1bWVudC5ib2R5ID0gYmxvY2suZnJhbWVEb2N1bWVudC5ib2R5LmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaGVyLnB1Ymxpc2goJ29uQmxvY2tMb2FkZWQnLCBzaXRlLnNpdGVQYWdlc1tpXS5ibG9ja3NbeV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHR5cGUgPT09ICdyZWxvYWQnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXRlLnNpdGVQYWdlc1tpXS5ibG9ja3NbeV0ucmVzZXQoZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICBhdXRvU2F2ZTogZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgaWYoc2l0ZS5wZW5kaW5nQ2hhbmdlcykge1xuICAgICAgICAgICAgICAgIHNpdGUuc2F2ZShmYWxzZSk7XG4gICAgICAgICAgICB9XG5cblx0XHRcdHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuYXV0b1NhdmVUaW1lcik7XG4gICAgICAgICAgICB0aGlzLmF1dG9TYXZlVGltZXIgPSBzZXRUaW1lb3V0KHNpdGUuYXV0b1NhdmUsIGJDb25maWcuYXV0b1NhdmVUaW1lb3V0KTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIHNldFBlbmRpbmdDaGFuZ2VzOiBmdW5jdGlvbih2YWx1ZSkge1xuXG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdDaGFuZ2VzID0gdmFsdWU7XG5cbiAgICAgICAgICAgIGlmKCB2YWx1ZSA9PT0gdHJ1ZSApIHtcblxuXHRcdFx0XHQvL3Jlc2V0IHRpbWVyXG5cdFx0XHRcdHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuYXV0b1NhdmVUaW1lcik7XG4gICAgICAgICAgICBcdHRoaXMuYXV0b1NhdmVUaW1lciA9IHNldFRpbWVvdXQoc2l0ZS5hdXRvU2F2ZSwgYkNvbmZpZy5hdXRvU2F2ZVRpbWVvdXQpO1xuXG4gICAgICAgICAgICAgICAgJCgnI3NhdmVQYWdlIC5iTGFiZWwnKS50ZXh0KFwiU2F2ZSBub3cgKCEpXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYoIHNpdGUuYWN0aXZlUGFnZS5zdGF0dXMgIT09ICduZXcnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5zdGF0dXMgPSAnY2hhbmdlZCc7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAkKCcjc2F2ZVBhZ2UgLmJMYWJlbCcpLnRleHQoXCJOb3RoaW5nIHRvIHNhdmVcIik7XG5cbiAgICAgICAgICAgICAgICBzaXRlLnVwZGF0ZVBhZ2VTdGF0dXMoJycpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlOiBmdW5jdGlvbihzaG93Q29uZmlybU1vZGFsKSB7XG5cbiAgICAgICAgICAgIHB1Ymxpc2hlci5wdWJsaXNoKCdvbkJlZm9yZVNhdmUnKTtcblxuICAgICAgICAgICAgLy9maXJlIGN1c3RvbSBldmVudFxuICAgICAgICAgICAgJCgnYm9keScpLnRyaWdnZXIoJ2JlZm9yZVNhdmUnKTtcblxuICAgICAgICAgICAgLy9kaXNhYmxlIGJ1dHRvblxuICAgICAgICAgICAgJChcImEjc2F2ZVBhZ2VcIikuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cbiAgICAgICAgICAgIC8vcmVtb3ZlIG9sZCBhbGVydHNcbiAgICAgICAgICAgICQoJyNlcnJvck1vZGFsIC5tb2RhbC1ib2R5ID4gKiwgI3N1Y2Nlc3NNb2RhbCAubW9kYWwtYm9keSA+IConKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBzaXRlLnByZXBGb3JTYXZlKGZhbHNlKTtcblxuICAgICAgICAgICAgdmFyIHNlcnZlckRhdGEgPSB7fTtcbiAgICAgICAgICAgIHNlcnZlckRhdGEucGFnZXMgPSB0aGlzLnNpdGVQYWdlc1JlYWR5Rm9yU2VydmVyO1xuICAgICAgICAgICAgaWYoIHRoaXMucGFnZXNUb0RlbGV0ZS5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAgIHNlcnZlckRhdGEudG9EZWxldGUgPSB0aGlzLnBhZ2VzVG9EZWxldGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF0YSk7XG5cbiAgICAgICAgICAgIHNlcnZlckRhdGEuc2l0ZURhdGEgPSB0aGlzLmRhdGE7XG5cbiAgICAgICAgICAgIC8vc3RvcmUgY3VycmVudCByZXNwb25zaXZlIG1vZGUgYXMgd2VsbFxuICAgICAgICAgICAgc2VydmVyRGF0YS5zaXRlRGF0YS5yZXNwb25zaXZlTW9kZSA9IGJ1aWxkZXJVSS5jdXJyZW50UmVzcG9uc2l2ZU1vZGU7XG5cbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdXJsOiBhcHBVSS5zaXRlVXJsK1wic2l0ZS9zYXZlXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgICAgIGRhdGE6IHNlcnZlckRhdGEsXG4gICAgICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlcyl7XG5cbiAgICAgICAgICAgICAgICAvL2VuYWJsZSBidXR0b25cbiAgICAgICAgICAgICAgICAkKFwiYSNzYXZlUGFnZVwiKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblxuICAgICAgICAgICAgICAgIGlmKCByZXMucmVzcG9uc2VDb2RlID09PSAwICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCBzaG93Q29uZmlybU1vZGFsICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjZXJyb3JNb2RhbCAubW9kYWwtYm9keScpLmFwcGVuZCggJChyZXMucmVzcG9uc2VIVE1MKSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2Vycm9yTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggcmVzLnJlc3BvbnNlQ29kZSA9PT0gMSApIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiggc2hvd0NvbmZpcm1Nb2RhbCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3N1Y2Nlc3NNb2RhbCAubW9kYWwtYm9keScpLmFwcGVuZCggJChyZXMucmVzcG9uc2VIVE1MKSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3N1Y2Nlc3NNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgLy9ubyBtb3JlIHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKGZhbHNlKTtcblxuXG4gICAgICAgICAgICAgICAgICAgIC8vdXBkYXRlIHJldmlzaW9ucz9cbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keScpLnRyaWdnZXIoJ2NoYW5nZVBhZ2UnKTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHByZXBzIHRoZSBzaXRlIGRhdGEgYmVmb3JlIHNlbmRpbmcgaXQgdG8gdGhlIHNlcnZlclxuICAgICAgICAqL1xuICAgICAgICBwcmVwRm9yU2F2ZTogZnVuY3Rpb24odGVtcGxhdGUpIHtcblxuICAgICAgICAgICAgdGhpcy5zaXRlUGFnZXNSZWFkeUZvclNlcnZlciA9IHt9O1xuXG4gICAgICAgICAgICBpZiggdGVtcGxhdGUgKSB7Ly9zYXZpbmcgdGVtcGxhdGUsIG9ubHkgdGhlIGFjdGl2ZVBhZ2UgaXMgbmVlZGVkXG5cbiAgICAgICAgICAgICAgICB0aGlzLnNpdGVQYWdlc1JlYWR5Rm9yU2VydmVyW3RoaXMuYWN0aXZlUGFnZS5uYW1lXSA9IHRoaXMuYWN0aXZlUGFnZS5wcmVwRm9yU2F2ZSgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVQYWdlLmZ1bGxQYWdlKCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7Ly9yZWd1bGFyIHNhdmVcblxuICAgICAgICAgICAgICAgIC8vZmluZCB0aGUgcGFnZXMgd2hpY2ggbmVlZCB0byBiZSBzZW5kIHRvIHRoZSBzZXJ2ZXJcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMuc2l0ZVBhZ2VzLmxlbmd0aDsgaSsrICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLnNpdGVQYWdlc1tpXS5zdGF0dXMgIT09ICcnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpdGVQYWdlc1JlYWR5Rm9yU2VydmVyW3RoaXMuc2l0ZVBhZ2VzW2ldLm5hbWVdID0gdGhpcy5zaXRlUGFnZXNbaV0ucHJlcEZvclNhdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHNldHMgYSBwYWdlIGFzIHRoZSBhY3RpdmUgb25lXG4gICAgICAgICovXG4gICAgICAgIHNldEFjdGl2ZTogZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgICAgICAgICAvL3JlZmVyZW5jZSB0byB0aGUgYWN0aXZlIHBhZ2VcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlUGFnZSA9IHBhZ2U7XG5cbiAgICAgICAgICAgIC8vaGlkZSBvdGhlciBwYWdlc1xuICAgICAgICAgICAgZm9yKHZhciBpIGluIHRoaXMuc2l0ZVBhZ2VzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaXRlUGFnZXNbaV0ucGFyZW50VUwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9kaXNwbGF5IGFjdGl2ZSBvbmVcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlUGFnZS5wYXJlbnRVTC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGRlLWFjdGl2ZSBhbGwgcGFnZSBtZW51IGl0ZW1zXG4gICAgICAgICovXG4gICAgICAgIGRlQWN0aXZhdGVBbGw6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgcGFnZXMgPSB0aGlzLnBhZ2VzTWVudS5xdWVyeVNlbGVjdG9yQWxsKCdsaScpO1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHBhZ2VzW2ldLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgYWRkcyBhIG5ldyBwYWdlIHRvIHRoZSBzaXRlXG4gICAgICAgICovXG4gICAgICAgIG5ld1BhZ2U6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBzaXRlLmRlQWN0aXZhdGVBbGwoKTtcblxuICAgICAgICAgICAgLy9jcmVhdGUgdGhlIG5ldyBwYWdlIGluc3RhbmNlXG5cbiAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFtdO1xuICAgICAgICAgICAgdmFyIHRlbXAgPSB7XG4gICAgICAgICAgICAgICAgcGFnZXNfaWQ6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwYWdlRGF0YVswXSA9IHRlbXA7XG5cbiAgICAgICAgICAgIHZhciBuZXdQYWdlTmFtZSA9ICdwYWdlJysoc2l0ZS5zaXRlUGFnZXMubGVuZ3RoKzEpO1xuXG4gICAgICAgICAgICB2YXIgbmV3UGFnZSA9IG5ldyBQYWdlKG5ld1BhZ2VOYW1lLCBwYWdlRGF0YSwgc2l0ZS5zaXRlUGFnZXMubGVuZ3RoKzEpO1xuXG4gICAgICAgICAgICBuZXdQYWdlLnN0YXR1cyA9ICduZXcnO1xuXG4gICAgICAgICAgICBuZXdQYWdlLnNlbGVjdFBhZ2UoKTtcbiAgICAgICAgICAgIG5ld1BhZ2UuZWRpdFBhZ2VOYW1lKCk7XG5cbiAgICAgICAgICAgIG5ld1BhZ2UuaXNFbXB0eSgpO1xuXG4gICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgY2hlY2tzIGlmIHRoZSBuYW1lIG9mIGEgcGFnZSBpcyBhbGxvd2VkXG4gICAgICAgICovXG4gICAgICAgIGNoZWNrUGFnZU5hbWU6IGZ1bmN0aW9uKHBhZ2VOYW1lKSB7XG5cbiAgICAgICAgICAgIC8vbWFrZSBzdXJlIHRoZSBuYW1lIGlzIHVuaXF1ZVxuICAgICAgICAgICAgZm9yKCB2YXIgaSBpbiB0aGlzLnNpdGVQYWdlcyApIHtcblxuICAgICAgICAgICAgICAgIGlmKCB0aGlzLnNpdGVQYWdlc1tpXS5uYW1lID09PSBwYWdlTmFtZSAmJiB0aGlzLmFjdGl2ZVBhZ2UgIT09IHRoaXMuc2l0ZVBhZ2VzW2ldICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhZ2VOYW1lRXJyb3IgPSBcIlRoZSBwYWdlIG5hbWUgbXVzdCBiZSB1bmlxdWUuXCI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICByZW1vdmVzIHVuYWxsb3dlZCBjaGFyYWN0ZXJzIGZyb20gdGhlIHBhZ2UgbmFtZVxuICAgICAgICAqL1xuICAgICAgICBwcmVwUGFnZU5hbWU6IGZ1bmN0aW9uKHBhZ2VOYW1lKSB7XG5cbiAgICAgICAgICAgIHBhZ2VOYW1lID0gcGFnZU5hbWUucmVwbGFjZSgnICcsICcnKTtcbiAgICAgICAgICAgIHBhZ2VOYW1lID0gcGFnZU5hbWUucmVwbGFjZSgvWz8qIS58JiM7JCVAXCI8PigpKyxdL2csIFwiXCIpO1xuXG4gICAgICAgICAgICByZXR1cm4gcGFnZU5hbWU7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBzYXZlIHBhZ2Ugc2V0dGluZ3MgZm9yIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlUGFnZVNldHRpbmdzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy50aXRsZSA9IHNpdGUuaW5wdXRQYWdlU2V0dGluZ3NUaXRsZS52YWx1ZTtcbiAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5wYWdlU2V0dGluZ3MubWV0YV9kZXNjcmlwdGlvbiA9IHNpdGUuaW5wdXRQYWdlU2V0dGluZ3NNZXRhRGVzY3JpcHRpb24udmFsdWU7XG4gICAgICAgICAgICBzaXRlLmFjdGl2ZVBhZ2UucGFnZVNldHRpbmdzLm1ldGFfa2V5d29yZHMgPSBzaXRlLmlucHV0UGFnZVNldHRpbmdzTWV0YUtleXdvcmRzLnZhbHVlO1xuICAgICAgICAgICAgc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy5oZWFkZXJfaW5jbHVkZXMgPSBzaXRlLmlucHV0UGFnZVNldHRpbmdzSW5jbHVkZXMudmFsdWU7XG4gICAgICAgICAgICBzaXRlLmFjdGl2ZVBhZ2UucGFnZVNldHRpbmdzLnBhZ2VfY3NzID0gc2l0ZS5pbnB1dFBhZ2VTZXR0aW5nc1BhZ2VDc3MudmFsdWU7XG5cbiAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG5cbiAgICAgICAgICAgICQoc2l0ZS5tb2RhbFBhZ2VTZXR0aW5ncykubW9kYWwoJ2hpZGUnKTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHVwZGF0ZSBwYWdlIHN0YXR1c2VzXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZVBhZ2VTdGF0dXM6IGZ1bmN0aW9uKHN0YXR1cykge1xuXG4gICAgICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMuc2l0ZVBhZ2VzICkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2l0ZVBhZ2VzW2ldLnN0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIENoZWNrcyBhbGwgdGhlIGJsb2NrcyBpbiB0aGlzIHNpdGUgaGF2ZSBmaW5pc2hlZCBsb2FkaW5nXG4gICAgICAgICovXG4gICAgICAgIGxvYWRlZDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICB2YXIgaTtcblxuICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLnNpdGVQYWdlcy5sZW5ndGg7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIGlmICggIXRoaXMuc2l0ZVBhZ2VzW2ldLmxvYWRlZCgpICkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgTWFrZSBldmVyeSBibG9jayBoYXZlIGFuIG92ZXJsYXkgZHVyaW5nIGRyYWdnaW5nIHRvIHByZXZlbnQgbW91c2UgZXZlbnQgaXNzdWVzXG4gICAgICAgICovXG4gICAgICAgIG1vdmVNb2RlOiBmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5hY3RpdmVQYWdlLmJsb2Nrcy5sZW5ndGg7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIGlmICggdmFsdWUgPT09ICdvbicgKSB0aGlzLmFjdGl2ZVBhZ2UuYmxvY2tzW2ldLmZyYW1lQ292ZXIuY2xhc3NMaXN0LmFkZCgnbW92ZScpO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB2YWx1ZSA9PT0gJ29mZicgKSB0aGlzLmFjdGl2ZVBhZ2UuYmxvY2tzW2ldLmZyYW1lQ292ZXIuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZScpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIGJ1aWxkZXJVSS5pbml0KCk7IHNpdGUuaW5pdCgpO1xuXG5cbiAgICAvLyoqKiogRVhQT1JUU1xuICAgIG1vZHVsZS5leHBvcnRzLnNpdGUgPSBzaXRlO1xuICAgIG1vZHVsZS5leHBvcnRzLmJ1aWxkZXJVSSA9IGJ1aWxkZXJVSTtcblxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuICAgIG1vZHVsZS5leHBvcnRzLnBhZ2VDb250YWluZXIgPSBcIiNwYWdlXCI7XG5cbiAgICBtb2R1bGUuZXhwb3J0cy5ib2R5UGFkZGluZ0NsYXNzID0gXCJiUGFkZGluZ1wiO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMuZWRpdGFibGVJdGVtcyA9IHtcbiAgICAgICAgJ3NwYW4uZmEnOiBbJ2NvbG9yJywgJ2ZvbnQtc2l6ZSddLFxuICAgICAgICAnLmJnLmJnMSc6IFsnYmFja2dyb3VuZC1jb2xvciddLFxuICAgICAgICAnbmF2IGEnOiBbJ2NvbG9yJywgJ2ZvbnQtd2VpZ2h0JywgJ3RleHQtdHJhbnNmb3JtJ10sXG4gICAgICAgICdpbWcnOiBbJ2JvcmRlci10b3AtbGVmdC1yYWRpdXMnLCAnYm9yZGVyLXRvcC1yaWdodC1yYWRpdXMnLCAnYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1cycsICdib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1cycsICdib3JkZXItY29sb3InLCAnYm9yZGVyLXN0eWxlJywgJ2JvcmRlci13aWR0aCddLFxuICAgICAgICAnaHIuZGFzaGVkJzogWydib3JkZXItY29sb3InLCAnYm9yZGVyLXdpZHRoJ10sXG4gICAgICAgICcuZGl2aWRlciA+IHNwYW4nOiBbJ2NvbG9yJywgJ2ZvbnQtc2l6ZSddLFxuICAgICAgICAnaHIuc2hhZG93RG93bic6IFsnbWFyZ2luLXRvcCcsICdtYXJnaW4tYm90dG9tJ10sXG4gICAgICAgICcuZm9vdGVyIGEnOiBbJ2NvbG9yJ10sXG4gICAgICAgICcuc29jaWFsIGEnOiBbJ2NvbG9yJ10sXG4gICAgICAgICcuYmcuYmcxLCAuYmcuYmcyLCAuaGVhZGVyMTAsIC5oZWFkZXIxMSc6IFsnYmFja2dyb3VuZC1pbWFnZScsICdiYWNrZ3JvdW5kLWNvbG9yJ10sXG4gICAgICAgICcuZnJhbWVDb3Zlcic6IFtdLFxuICAgICAgICAnLmVkaXRDb250ZW50JzogWydjb250ZW50JywgJ2NvbG9yJywgJ2ZvbnQtc2l6ZScsICdiYWNrZ3JvdW5kLWNvbG9yJywgJ2ZvbnQtZmFtaWx5J10sXG4gICAgICAgICdhLmJ0biwgYnV0dG9uLmJ0bic6IFsnYm9yZGVyLXJhZGl1cycsICdmb250LXNpemUnLCAnYmFja2dyb3VuZC1jb2xvciddLFxuICAgICAgICAnI3ByaWNpbmdfdGFibGUyIC5wcmljaW5nMiAuYm90dG9tIGxpJzogWydjb250ZW50J11cbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMuZWRpdGFibGVJdGVtT3B0aW9ucyA9IHtcbiAgICAgICAgJ25hdiBhIDogZm9udC13ZWlnaHQnOiBbJzQwMCcsICc3MDAnXSxcbiAgICAgICAgJ2EuYnRuIDogYm9yZGVyLXJhZGl1cyc6IFsnMHB4JywgJzRweCcsICcxMHB4J10sXG4gICAgICAgICdpbWcgOiBib3JkZXItc3R5bGUnOiBbJ25vbmUnLCAnZG90dGVkJywgJ2Rhc2hlZCcsICdzb2xpZCddLFxuICAgICAgICAnaW1nIDogYm9yZGVyLXdpZHRoJzogWycxcHgnLCAnMnB4JywgJzNweCcsICc0cHgnXSxcbiAgICAgICAgJ2gxLCBoMiwgaDMsIGg0LCBoNSwgcCA6IGZvbnQtZmFtaWx5JzogWydkZWZhdWx0JywgJ0xhdG8nLCAnSGVsdmV0aWNhJywgJ0FyaWFsJywgJ1RpbWVzIE5ldyBSb21hbiddLFxuICAgICAgICAnaDIgOiBmb250LWZhbWlseSc6IFsnZGVmYXVsdCcsICdMYXRvJywgJ0hlbHZldGljYScsICdBcmlhbCcsICdUaW1lcyBOZXcgUm9tYW4nXSxcbiAgICAgICAgJ2gzIDogZm9udC1mYW1pbHknOiBbJ2RlZmF1bHQnLCAnTGF0bycsICdIZWx2ZXRpY2EnLCAnQXJpYWwnLCAnVGltZXMgTmV3IFJvbWFuJ10sXG4gICAgICAgICdwIDogZm9udC1mYW1pbHknOiBbJ2RlZmF1bHQnLCAnTGF0bycsICdIZWx2ZXRpY2EnLCAnQXJpYWwnLCAnVGltZXMgTmV3IFJvbWFuJ11cbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMucmVzcG9uc2l2ZU1vZGVzID0ge1xuICAgICAgICBkZXNrdG9wOiAnOTclJyxcbiAgICAgICAgbW9iaWxlOiAnNDgwcHgnLFxuICAgICAgICB0YWJsZXQ6ICcxMDI0cHgnXG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzLmVkaXRhYmxlQ29udGVudCA9IFsnLmVkaXRDb250ZW50JywgJy5uYXZiYXIgYScsICdidXR0b24nLCAnYS5idG4nLCAnLmZvb3RlciBhOm5vdCguZmEpJywgJy50YWJsZVdyYXBwZXInLCAnaDEnLCAnaDInXTtcblxuICAgIG1vZHVsZS5leHBvcnRzLmF1dG9TYXZlVGltZW91dCA9IDMwMDAwMDtcblxuICAgIG1vZHVsZS5leHBvcnRzLnNvdXJjZUNvZGVFZGl0U3ludGF4RGVsYXkgPSAxMDAwMDtcblxuICAgIG1vZHVsZS5leHBvcnRzLm1lZGl1bUNzc1VybHMgPSBbXG4gICAgICAgICcvL2Nkbi5qc2RlbGl2ci5uZXQvbWVkaXVtLWVkaXRvci9sYXRlc3QvY3NzL21lZGl1bS1lZGl0b3IubWluLmNzcycsXG4gICAgICAgICcvc3JjL2Nzcy9tZWRpdW0tYm9vdHN0cmFwLmNzcydcbiAgICBdO1xuICAgIG1vZHVsZS5leHBvcnRzLm1lZGl1bUJ1dHRvbnMgPSBbJ2JvbGQnLCAnaXRhbGljJywgJ3VuZGVybGluZScsICdhbmNob3InLCAnb3JkZXJlZGxpc3QnLCAndW5vcmRlcmVkbGlzdCcsICdoMScsICdoMicsICdoMycsICdoNCcsICdyZW1vdmVGb3JtYXQnXTtcblxuICAgIG1vZHVsZS5leHBvcnRzLmV4dGVybmFsSlMgPSBbXG4gICAgICAgICdzcmMvanMvYnVpbGRlcl9pbl9ibG9jay5qcydcbiAgICBdO1xuXG59KCkpOyIsIihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBiQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcuanMnKTtcblx0dmFyIHNpdGVCdWlsZGVyID0gcmVxdWlyZSgnLi9idWlsZGVyLmpzJyk7XG5cdHZhciBhcHBVSSA9IHJlcXVpcmUoJy4vdWkuanMnKS5hcHBVSTtcblxuXHR2YXIgcHVibGlzaCA9IHtcblxuICAgICAgICBidXR0b25QdWJsaXNoOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHVibGlzaFBhZ2UnKSxcbiAgICAgICAgYnV0dG9uU2F2ZVBlbmRpbmdCZWZvcmVQdWJsaXNoaW5nOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnV0dG9uU2F2ZVBlbmRpbmdCZWZvcmVQdWJsaXNoaW5nJyksXG4gICAgICAgIHB1Ymxpc2hNb2RhbDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3B1Ymxpc2hNb2RhbCcpLFxuICAgICAgICBidXR0b25QdWJsaXNoU3VibWl0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHVibGlzaFN1Ym1pdCcpLFxuICAgICAgICBwdWJsaXNoQWN0aXZlOiAwLFxuICAgICAgICB0aGVJdGVtOiB7fSxcbiAgICAgICAgbW9kYWxTaXRlU2V0dGluZ3M6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXRlU2V0dGluZ3MnKSxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJCh0aGlzLmJ1dHRvblB1Ymxpc2gpLm9uKCdjbGljaycsIHRoaXMubG9hZFB1Ymxpc2hNb2RhbCk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uU2F2ZVBlbmRpbmdCZWZvcmVQdWJsaXNoaW5nKS5vbignY2xpY2snLCB0aGlzLnNhdmVCZWZvcmVQdWJsaXNoaW5nKTtcbiAgICAgICAgICAgICQodGhpcy5wdWJsaXNoTW9kYWwpLm9uKCdjaGFuZ2UnLCAnaW5wdXRbdHlwZT1jaGVja2JveF0nLCB0aGlzLnB1Ymxpc2hDaGVja2JveEV2ZW50KTtcbiAgICAgICAgICAgICQodGhpcy5idXR0b25QdWJsaXNoU3VibWl0KS5vbignY2xpY2snLCB0aGlzLnB1Ymxpc2hTaXRlKTtcbiAgICAgICAgICAgICQodGhpcy5tb2RhbFNpdGVTZXR0aW5ncykub24oJ2NsaWNrJywgJyNzaXRlU2V0dGluZ3NCcm93c2VGVFBCdXR0b24sIC5saW5rJywgdGhpcy5icm93c2VGVFApO1xuICAgICAgICAgICAgJCh0aGlzLm1vZGFsU2l0ZVNldHRpbmdzKS5vbignY2xpY2snLCAnI2Z0cExpc3RJdGVtcyAuY2xvc2UnLCB0aGlzLmNsb3NlRnRwQnJvd3Nlcik7XG4gICAgICAgICAgICAkKHRoaXMubW9kYWxTaXRlU2V0dGluZ3MpLm9uKCdjbGljaycsICcjc2l0ZVNldHRpbmdzVGVzdEZUUCcsIHRoaXMudGVzdEZUUENvbm5lY3Rpb24pO1xuXG4gICAgICAgICAgICAvL3Nob3cgdGhlIHB1Ymxpc2ggYnV0dG9uXG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uUHVibGlzaCkuc2hvdygpO1xuXG4gICAgICAgICAgICAvL2xpc3RlbiB0byBzaXRlIHNldHRpbmdzIGxvYWQgZXZlbnRcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbignc2l0ZVNldHRpbmdzTG9hZCcsIHRoaXMuc2hvd1B1Ymxpc2hTZXR0aW5ncyk7XG5cbiAgICAgICAgICAgIC8vcHVibGlzaCBoYXNoP1xuICAgICAgICAgICAgaWYoIHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSBcIiNwdWJsaXNoXCIgKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzLmJ1dHRvblB1Ymxpc2gpLmNsaWNrKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGhlYWRlciB0b29sdGlwc1xuICAgICAgICAgICAgLy9pZiggdGhpcy5idXR0b25QdWJsaXNoLmhhc0F0dHJpYnV0ZSgnZGF0YS10b2dnbGUnKSAmJiB0aGlzLmJ1dHRvblB1Ymxpc2guZ2V0QXR0cmlidXRlKCdkYXRhLXRvZ2dsZScpID09ICd0b29sdGlwJyApIHtcbiAgICAgICAgICAgIC8vICAgJCh0aGlzLmJ1dHRvblB1Ymxpc2gpLnRvb2x0aXAoJ3Nob3cnKTtcbiAgICAgICAgICAgIC8vICAgc2V0VGltZW91dChmdW5jdGlvbigpeyQodGhpcy5idXR0b25QdWJsaXNoKS50b29sdGlwKCdoaWRlJyl9LCA1MDAwKTtcbiAgICAgICAgICAgIC8vfVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgbG9hZHMgdGhlIHB1Ymxpc2ggbW9kYWxcbiAgICAgICAgKi9cbiAgICAgICAgbG9hZFB1Ymxpc2hNb2RhbDogZnVuY3Rpb24oZSkge1xuXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGlmKCBwdWJsaXNoLnB1Ymxpc2hBY3RpdmUgPT09IDAgKSB7Ly9jaGVjayBpZiB3ZSdyZSBjdXJyZW50bHkgcHVibGlzaGluZyBhbnl0aGluZ1xuXG4gICAgICAgICAgICAgICAgLy9oaWRlIGFsZXJ0c1xuICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWwgLm1vZGFsLWFsZXJ0cyA+IConKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsIC5tb2RhbC1ib2R5ID4gLmFsZXJ0LXN1Y2Nlc3MnKS5oaWRlKCk7XG5cbiAgICAgICAgICAgICAgICAvL2hpZGUgbG9hZGVyc1xuICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWxfYXNzZXRzIC5wdWJsaXNoaW5nJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCcud29ya2luZycpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCcuZG9uZScpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vcmVtb3ZlIHB1Ymxpc2hlZCBjbGFzcyBmcm9tIGFzc2V0IGNoZWNrYm94ZXNcbiAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsX2Fzc2V0cyBpbnB1dCcpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygncHVibGlzaGVkJyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvL2RvIHdlIGhhdmUgcGVuZGluZyBjaGFuZ2VzP1xuICAgICAgICAgICAgICAgIGlmKCBzaXRlQnVpbGRlci5zaXRlLnBlbmRpbmdDaGFuZ2VzID09PSB0cnVlICkgey8vd2UndmUgZ290IGNoYW5nZXMsIHNhdmUgZmlyc3RcblxuICAgICAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsICNwdWJsaXNoUGVuZGluZ0NoYW5nZXNNZXNzYWdlJykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsIC5tb2RhbC1ib2R5LWNvbnRlbnQnKS5oaWRlKCk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Ugey8vYWxsIHNldCwgZ2V0IG9uIGl0IHdpdGggcHVibGlzaGluZ1xuXG4gICAgICAgICAgICAgICAgICAgIC8vZ2V0IHRoZSBjb3JyZWN0IHBhZ2VzIGluIHRoZSBQYWdlcyBzZWN0aW9uIG9mIHRoZSBwdWJsaXNoIG1vZGFsXG4gICAgICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWxfcGFnZXMgdGJvZHkgPiAqJykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnI3BhZ2VzIGxpOnZpc2libGUnKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGVQYWdlID0gJCh0aGlzKS5maW5kKCdhOmZpcnN0JykudGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZVJvdyA9ICQoJzx0cj48dGQgY2xhc3M9XCJ0ZXh0LWNlbnRlclwiIHN0eWxlPVwid2lkdGg6IDMwcHg7XCI+PGxhYmVsIGNsYXNzPVwiY2hlY2tib3ggbm8tbGFiZWxcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgdmFsdWU9XCInK3RoZVBhZ2UrJ1wiIGlkPVwiXCIgZGF0YS10eXBlPVwicGFnZVwiIG5hbWU9XCJwYWdlc1tdXCIgZGF0YS10b2dnbGU9XCJjaGVja2JveFwiPjwvbGFiZWw+PC90ZD48dGQ+Jyt0aGVQYWdlKyc8c3BhbiBjbGFzcz1cInB1Ymxpc2hpbmdcIj48c3BhbiBjbGFzcz1cIndvcmtpbmdcIj5QdWJsaXNoaW5nLi4uIDxpbWcgc3JjPVwiJythcHBVSS5iYXNlVXJsKydzcmMvaW1hZ2VzL3B1Ymxpc2hMb2FkZXIuZ2lmXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVwiZG9uZSB0ZXh0LXByaW1hcnlcIj5QdWJsaXNoZWQgJm5ic3A7PHNwYW4gY2xhc3M9XCJmdWktY2hlY2tcIj48L3NwYW4+PC9zcGFuPjwvc3Bhbj48L3RkPjwvdHI+Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hlY2tib3hpZnlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZVJvdy5maW5kKCdpbnB1dCcpLnJhZGlvY2hlY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZVJvdy5maW5kKCdpbnB1dCcpLm9uKCdjaGVjayB1bmNoZWNrIHRvZ2dsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jbG9zZXN0KCd0cicpWyQodGhpcykucHJvcCgnY2hlY2tlZCcpID8gJ2FkZENsYXNzJyA6ICdyZW1vdmVDbGFzcyddKCdzZWxlY3RlZC1yb3cnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsX3BhZ2VzIHRib2R5JykuYXBwZW5kKCB0aGVSb3cgKTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsICNwdWJsaXNoUGVuZGluZ0NoYW5nZXNNZXNzYWdlJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsIC5tb2RhbC1ib2R5LWNvbnRlbnQnKS5zaG93KCk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vZW5hYmxlL2Rpc2FibGUgcHVibGlzaCBidXR0b25cblxuICAgICAgICAgICAgdmFyIGFjdGl2YXRlQnV0dG9uID0gZmFsc2U7XG5cbiAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWwgaW5wdXRbdHlwZT1jaGVja2JveF0nKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5wcm9wKCdjaGVja2VkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2YXRlQnV0dG9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiggYWN0aXZhdGVCdXR0b24gKSB7XG4gICAgICAgICAgICAgICAgJCgnI3B1Ymxpc2hTdWJtaXQnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCgnI3B1Ymxpc2hTdWJtaXQnKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJCgnI3B1Ymxpc2hNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBzYXZlcyBwZW5kaW5nIGNoYW5nZXMgYmVmb3JlIHB1Ymxpc2hpbmdcbiAgICAgICAgKi9cbiAgICAgICAgc2F2ZUJlZm9yZVB1Ymxpc2hpbmc6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsICNwdWJsaXNoUGVuZGluZ0NoYW5nZXNNZXNzYWdlJykuaGlkZSgpO1xuICAgICAgICAgICAgJCgnI3B1Ymxpc2hNb2RhbCAubG9hZGVyJykuc2hvdygpO1xuICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcblxuICAgICAgICAgICAgc2l0ZUJ1aWxkZXIuc2l0ZS5wcmVwRm9yU2F2ZShmYWxzZSk7XG5cbiAgICAgICAgICAgIHZhciBzZXJ2ZXJEYXRhID0ge307XG4gICAgICAgICAgICBzZXJ2ZXJEYXRhLnBhZ2VzID0gc2l0ZUJ1aWxkZXIuc2l0ZS5zaXRlUGFnZXNSZWFkeUZvclNlcnZlcjtcbiAgICAgICAgICAgIGlmKCBzaXRlQnVpbGRlci5zaXRlLnBhZ2VzVG9EZWxldGUubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgICAgICBzZXJ2ZXJEYXRhLnRvRGVsZXRlID0gc2l0ZUJ1aWxkZXIuc2l0ZS5wYWdlc1RvRGVsZXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VydmVyRGF0YS5zaXRlRGF0YSA9IHNpdGVCdWlsZGVyLnNpdGUuZGF0YTtcblxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6IGFwcFVJLnNpdGVVcmwrXCJzaXRlL3NhdmUvMVwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgICAgICBkYXRhOiBzZXJ2ZXJEYXRhLFxuICAgICAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXMpe1xuXG4gICAgICAgICAgICAgICAgJCgnI3B1Ymxpc2hNb2RhbCAubG9hZGVyJykuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnI3B1Ymxpc2hNb2RhbCAubW9kYWwtYWxlcnRzJykuYXBwZW5kKCAkKHJlcy5yZXNwb25zZUhUTUwpICk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLWRlc3RydWN0IHN1Y2Nlc3MgbWVzc2FnZXNcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyQoJyNwdWJsaXNoTW9kYWwgLm1vZGFsLWFsZXJ0cyAuYWxlcnQtc3VjY2VzcycpLmZhZGVPdXQoNTAwLCBmdW5jdGlvbigpeyQodGhpcykucmVtb3ZlKCk7fSk7fSwgMjUwMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9lbmFibGUgYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWwgI3B1Ymxpc2hQZW5kaW5nQ2hhbmdlc01lc3NhZ2UgLmJ0bi5zYXZlJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmKCByZXMucmVzcG9uc2VDb2RlID09PSAxICkgey8vY2hhbmdlcyB3ZXJlIHNhdmVkIHdpdGhvdXQgaXNzdWVzXG5cbiAgICAgICAgICAgICAgICAgICAgLy9ubyBtb3JlIHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICBzaXRlQnVpbGRlci5zaXRlLnNldFBlbmRpbmdDaGFuZ2VzKGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2dldCB0aGUgY29ycmVjdCBwYWdlcyBpbiB0aGUgUGFnZXMgc2VjdGlvbiBvZiB0aGUgcHVibGlzaCBtb2RhbFxuICAgICAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsX3BhZ2VzIHRib2R5ID4gKicpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICQoJyNwYWdlcyBsaTp2aXNpYmxlJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhlUGFnZSA9ICQodGhpcykuZmluZCgnYTpmaXJzdCcpLnRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGVSb3cgPSAkKCc8dHI+PHRkIGNsYXNzPVwidGV4dC1jZW50ZXJcIiBzdHlsZT1cIndpZHRoOiAwcHg7XCI+PGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgdmFsdWU9XCInK3RoZVBhZ2UrJ1wiIGlkPVwiXCIgZGF0YS10eXBlPVwicGFnZVwiIG5hbWU9XCJwYWdlc1tdXCIgZGF0YS10b2dnbGU9XCJjaGVja2JveFwiPjwvbGFiZWw+PC90ZD48dGQ+Jyt0aGVQYWdlKyc8c3BhbiBjbGFzcz1cInB1Ymxpc2hpbmdcIj48c3BhbiBjbGFzcz1cIndvcmtpbmdcIj5QdWJsaXNoaW5nLi4uIDxpbWcgc3JjPVwiJythcHBVSS5iYXNlVXJsKydpbWFnZXMvcHVibGlzaExvYWRlci5naWZcIj48L3NwYW4+PHNwYW4gY2xhc3M9XCJkb25lIHRleHQtcHJpbWFyeVwiPlB1Ymxpc2hlZCAmbmJzcDs8c3BhbiBjbGFzcz1cImZ1aS1jaGVja1wiPjwvc3Bhbj48L3NwYW4+PC9zcGFuPjwvdGQ+PC90cj4nKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGVja2JveGlmeVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlUm93LmZpbmQoJ2lucHV0JykucmFkaW9jaGVjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhlUm93LmZpbmQoJ2lucHV0Jykub24oJ2NoZWNrIHVuY2hlY2sgdG9nZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNsb3Nlc3QoJ3RyJylbJCh0aGlzKS5wcm9wKCdjaGVja2VkJykgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oJ3NlbGVjdGVkLXJvdycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWxfcGFnZXMgdGJvZHknKS5hcHBlbmQoIHRoZVJvdyApO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vc2hvdyBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWwgLm1vZGFsLWJvZHktY29udGVudCcpLmZhZGVJbig1MDApO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBjaGVja2JveGVzIGluc2lkZSB0aGUgcHVibGlzaCBtb2RhbFxuICAgICAgICAqL1xuICAgICAgICBwdWJsaXNoQ2hlY2tib3hFdmVudDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHZhciBhY3RpdmF0ZUJ1dHRvbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsIGlucHV0W3R5cGU9Y2hlY2tib3hdJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgaWYoICQodGhpcykucHJvcCgnY2hlY2tlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICBhY3RpdmF0ZUJ1dHRvbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiggYWN0aXZhdGVCdXR0b24gKSB7XG5cbiAgICAgICAgICAgICAgICAkKCcjcHVibGlzaFN1Ym1pdCcpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgJCgnI3B1Ymxpc2hTdWJtaXQnKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgcHVibGlzaGVzIHRoZSBzZWxlY3RlZCBpdGVtc1xuICAgICAgICAqL1xuICAgICAgICBwdWJsaXNoU2l0ZTogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vdHJhY2sgdGhlIHB1Ymxpc2hpbmcgc3RhdGVcbiAgICAgICAgICAgIHB1Ymxpc2gucHVibGlzaEFjdGl2ZSA9IDE7XG5cbiAgICAgICAgICAgIC8vZGlzYWJsZSBidXR0b25cbiAgICAgICAgICAgICQoJyNwdWJsaXNoU3VibWl0LCAjcHVibGlzaENhbmNlbCcpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICAvL3JlbW92ZSBleGlzdGluZyBhbGVydHNcbiAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWwgLm1vZGFsLWFsZXJ0cyA+IConKS5yZW1vdmUoKTtcblxuICAgICAgICAgICAgLy9wcmVwYXJlIHN0dWZmXG4gICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsIGZvcm0gaW5wdXRbdHlwZT1cImhpZGRlblwiXS5wYWdlJykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIC8vbG9vcCB0aHJvdWdoIGFsbCBwYWdlc1xuICAgICAgICAgICAgJCgnI3BhZ2VMaXN0ID4gdWwnKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAvL2V4cG9ydCB0aGlzIHBhZ2U/XG4gICAgICAgICAgICAgICAgaWYoICQoJyNwdWJsaXNoTW9kYWwgI3B1Ymxpc2hNb2RhbF9wYWdlcyBpbnB1dDplcSgnKygkKHRoaXMpLmluZGV4KCkrMSkrJyknKS5wcm9wKCdjaGVja2VkJykgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9ncmFiIHRoZSBza2VsZXRvbiBtYXJrdXBcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0RvY01haW5QYXJlbnQgPSAkKCdpZnJhbWUjc2tlbGV0b24nKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vZW1wdHkgb3V0IHRoZSBza2VsZXRvblxuICAgICAgICAgICAgICAgICAgICBuZXdEb2NNYWluUGFyZW50LmZpbmQoJyonKS5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2xvb3AgdGhyb3VnaCBwYWdlIGlmcmFtZXMgYW5kIGdyYWIgdGhlIGJvZHkgc3R1ZmZcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCdpZnJhbWUnKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gJCh0aGlzKS5hdHRyKCdkYXRhLXNhbmRib3gnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZUNvbnRlbnRzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF0dHIgIT09IHR5cGVvZiB1bmRlZmluZWQgJiYgYXR0ciAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cyA9ICQoJyNzYW5kYm94ZXMgIycrYXR0cikuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlQ29udGVudHMgPSAkKHRoaXMpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZUNvbnRlbnRzLmZpbmQoJy5mcmFtZUNvdmVyJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9yZW1vdmUgaW5saW5lIHN0eWxpbmcgbGVmdG92ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IoIHZhciBrZXkgaW4gYkNvbmZpZy5lZGl0YWJsZUl0ZW1zICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlQ29udGVudHMuZmluZCgga2V5ICkuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQXR0cignZGF0YS1zZWxlY3RvcicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCAkKHRoaXMpLmF0dHIoJ3N0eWxlJykgPT09ICcnICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJDb25maWcuZWRpdGFibGVDb250ZW50Lmxlbmd0aDsgKytpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5lZGl0YWJsZUNvbnRlbnRbaV0gKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQXR0cignZGF0YS1zZWxlY3RvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b0FkZCA9IHRoZUNvbnRlbnRzLmh0bWwoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9ncmFiIHNjcmlwdHNcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjcmlwdHMgPSAkKHRoaXMpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICkuZmluZCgnc2NyaXB0Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBzY3JpcHRzLnNpemUoKSA+IDAgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhlSWZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJza2VsZXRvblwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdHMuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY3JpcHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoICQodGhpcykudGV4dCgpICE9PSAnJyApIHsvL3NjcmlwdCB0YWdzIHdpdGggY29udGVudFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHQgPSB0aGVJZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC5pbm5lckhUTUwgPSAkKHRoaXMpLnRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZUlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBiQ29uZmlnLnBhZ2VDb250YWluZXIuc3Vic3RyaW5nKDEpICkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoICQodGhpcykuYXR0cignc3JjJykgIT09IG51bGwgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdCA9IHRoZUlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0LnNyYyA9ICQodGhpcykuYXR0cignc3JjJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVJZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyLnN1YnN0cmluZygxKSApLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RvY01haW5QYXJlbnQuYXBwZW5kKCAkKHRvQWRkKSApO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdJbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgY2xhc3M9XCJwYWdlXCIgbmFtZT1cInhwYWdlc1snKyQoJyNwYWdlcyBsaTplcSgnKygkKHRoaXMpLmluZGV4KCkrMSkrJykgYTpmaXJzdCcpLnRleHQoKSsnXVwiIHZhbHVlPVwiXCI+Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnI3B1Ymxpc2hNb2RhbCBmb3JtJykucHJlcGVuZCggbmV3SW5wdXQgKTtcblxuICAgICAgICAgICAgICAgICAgICBuZXdJbnB1dC52YWwoIFwiPGh0bWw+XCIrJCgnaWZyYW1lI3NrZWxldG9uJykuY29udGVudHMoKS5maW5kKCdodG1sJykuaHRtbCgpK1wiPC9odG1sPlwiICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwdWJsaXNoLnB1Ymxpc2hBc3NldCgpO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgcHVibGlzaEFzc2V0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIHRvUHVibGlzaCA9ICQoJyNwdWJsaXNoTW9kYWxfYXNzZXRzIGlucHV0W3R5cGU9Y2hlY2tib3hdOmNoZWNrZWQ6bm90KC5wdWJsaXNoZWQsIC50b2dnbGVBbGwpLCAjcHVibGlzaE1vZGFsX3BhZ2VzIGlucHV0W3R5cGU9Y2hlY2tib3hdOmNoZWNrZWQ6bm90KC5wdWJsaXNoZWQsIC50b2dnbGVBbGwpJyk7XG5cbiAgICAgICAgICAgIGlmKCB0b1B1Ymxpc2guc2l6ZSgpID4gMCApIHtcblxuICAgICAgICAgICAgICAgIHB1Ymxpc2gudGhlSXRlbSA9IHRvUHVibGlzaC5maXJzdCgpO1xuXG4gICAgICAgICAgICAgICAgLy9kaXNwbGF5IHRoZSBhc3NldCBsb2FkZXJcbiAgICAgICAgICAgICAgICBwdWJsaXNoLnRoZUl0ZW0uY2xvc2VzdCgndGQnKS5uZXh0KCkuZmluZCgnLnB1Ymxpc2hpbmcnKS5mYWRlSW4oNTAwKTtcblxuICAgICAgICAgICAgICAgIHZhciB0aGVEYXRhO1xuXG4gICAgICAgICAgICAgICAgaWYoIHB1Ymxpc2gudGhlSXRlbS5hdHRyKCdkYXRhLXR5cGUnKSA9PT0gJ3BhZ2UnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoZURhdGEgPSB7c2l0ZV9pZDogJCgnZm9ybSNwdWJsaXNoRm9ybSBpbnB1dFtuYW1lPXNpdGVfaWRdJykudmFsKCksIGl0ZW06IHB1Ymxpc2gudGhlSXRlbS52YWwoKSwgcGFnZUNvbnRlbnQ6ICQoJ2Zvcm0jcHVibGlzaEZvcm0gaW5wdXRbbmFtZT1cInhwYWdlc1snK3B1Ymxpc2gudGhlSXRlbS52YWwoKSsnXVwiXScpLnZhbCgpfTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggcHVibGlzaC50aGVJdGVtLmF0dHIoJ2RhdGEtdHlwZScpID09PSAnYXNzZXQnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoZURhdGEgPSB7c2l0ZV9pZDogJCgnZm9ybSNwdWJsaXNoRm9ybSBpbnB1dFtuYW1lPXNpdGVfaWRdJykudmFsKCksIGl0ZW06IHB1Ymxpc2gudGhlSXRlbS52YWwoKX07XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICQoJ2Zvcm0jcHVibGlzaEZvcm0nKS5hdHRyKCdhY3Rpb24nKStcIi9cIitwdWJsaXNoLnRoZUl0ZW0uYXR0cignZGF0YS10eXBlJyksXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwb3N0JyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICAgICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmV0KXtcblxuICAgICAgICAgICAgICAgICAgICBpZiggcmV0LnJlc3BvbnNlQ29kZSA9PT0gMCApIHsvL2ZhdGFsIGVycm9yLCBwdWJsaXNoaW5nIHdpbGwgc3RvcFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2hpZGUgaW5kaWNhdG9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaC50aGVJdGVtLmNsb3Nlc3QoJ3RkJykubmV4dCgpLmZpbmQoJy53b3JraW5nJykuaGlkZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2VuYWJsZSBidXR0b25zXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjcHVibGlzaFN1Ym1pdCwgI3B1Ymxpc2hDYW5jZWwnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoTW9kYWwgLm1vZGFsLWFsZXJ0cycpLmFwcGVuZCggJChyZXQucmVzcG9uc2VIVE1MKSApO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggcmV0LnJlc3BvbnNlQ29kZSA9PT0gMSApIHsvL25vIGlzc3Vlc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3Nob3cgZG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaC50aGVJdGVtLmNsb3Nlc3QoJ3RkJykubmV4dCgpLmZpbmQoJy53b3JraW5nJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaC50aGVJdGVtLmNsb3Nlc3QoJ3RkJykubmV4dCgpLmZpbmQoJy5kb25lJykuZmFkZUluKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoLnRoZUl0ZW0uYWRkQ2xhc3MoJ3B1Ymxpc2hlZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoLnB1Ymxpc2hBc3NldCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy9wdWJsaXNoaW5nIGlzIGRvbmVcbiAgICAgICAgICAgICAgICBwdWJsaXNoLnB1Ymxpc2hBY3RpdmUgPSAwO1xuXG4gICAgICAgICAgICAgICAgLy9lbmFibGUgYnV0dG9uc1xuICAgICAgICAgICAgICAgICQoJyNwdWJsaXNoU3VibWl0LCAjcHVibGlzaENhbmNlbCcpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICAgICAgLy9zaG93IG1lc3NhZ2VcbiAgICAgICAgICAgICAgICAkKCcjcHVibGlzaE1vZGFsIC5tb2RhbC1ib2R5ID4gLmFsZXJ0LXN1Y2Nlc3MnKS5mYWRlSW4oNTAwLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7JCgnI3B1Ymxpc2hNb2RhbCAubW9kYWwtYm9keSA+IC5hbGVydC1zdWNjZXNzJykuZmFkZU91dCg1MDApO30sIDI1MDApO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuICAgICAgICBzaG93UHVibGlzaFNldHRpbmdzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJCgnI3NpdGVTZXR0aW5nc1B1Ymxpc2hpbmcnKS5zaG93KCk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgYnJvd3NlIHRoZSBGVFAgY29ubmVjdGlvblxuICAgICAgICAqL1xuICAgICAgICBicm93c2VGVFA6IGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgXHRcdC8vZ290IGFsbCB3ZSBuZWVkP1xuXG4gICAgXHRcdGlmKCAkKCcjc2l0ZVNldHRpbmdzX2Z0cFNlcnZlcicpLnZhbCgpID09PSAnJyB8fCAkKCcjc2l0ZVNldHRpbmdzX2Z0cFVzZXInKS52YWwoKSA9PT0gJycgfHwgJCgnI3NpdGVTZXR0aW5nc19mdHBQYXNzd29yZCcpLnZhbCgpID09PSAnJyApIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnUGxlYXNlIG1ha2Ugc3VyZSBhbGwgRlRQIGNvbm5lY3Rpb24gZGV0YWlscyBhcmUgcHJlc2VudCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9jaGVjayBpZiB0aGlzIGlzIGEgZGVlcGVyIGxldmVsIGxpbmtcbiAgICBcdFx0aWYoICQodGhpcykuaGFzQ2xhc3MoJ2xpbmsnKSApIHtcblxuICAgIFx0XHRcdGlmKCAkKHRoaXMpLmhhc0NsYXNzKCdiYWNrJykgKSB7XG5cbiAgICBcdFx0XHRcdCQoJyNzaXRlU2V0dGluZ3NfZnRwUGF0aCcpLnZhbCggJCh0aGlzKS5hdHRyKCdocmVmJykgKTtcblxuICAgIFx0XHRcdH0gZWxzZSB7XG5cbiAgICBcdFx0XHRcdC8vaWYgc28sIHdlJ2xsIGNoYW5nZSB0aGUgcGF0aCBiZWZvcmUgY29ubmVjdGluZ1xuXG4gICAgXHRcdFx0XHRpZiggJCgnI3NpdGVTZXR0aW5nc19mdHBQYXRoJykudmFsKCkuc3Vic3RyKCAkKCcjc2l0ZVNldHRpbmdzX2Z0cFBhdGgnKS52YWwubGVuZ3RoIC0gMSApID09PSAnLycgKSB7Ly9wcmVwZW5kIFwiL1wiXG5cbiAgICBcdFx0XHRcdFx0JCgnI3NpdGVTZXR0aW5nc19mdHBQYXRoJykudmFsKCAkKCcjc2l0ZVNldHRpbmdzX2Z0cFBhdGgnKS52YWwoKSskKHRoaXMpLmF0dHIoJ2hyZWYnKSApO1xuXG4gICAgXHRcdFx0XHR9IGVsc2Uge1xuXG4gICAgXHRcdFx0XHRcdCQoJyNzaXRlU2V0dGluZ3NfZnRwUGF0aCcpLnZhbCggJCgnI3NpdGVTZXR0aW5nc19mdHBQYXRoJykudmFsKCkrXCIvXCIrJCh0aGlzKS5hdHRyKCdocmVmJykgKTtcblxuICAgIFx0XHRcdFx0fVxuXG4gICAgXHRcdFx0fVxuXG5cbiAgICBcdFx0fVxuXG4gICAgXHRcdC8vZGVzdHJveSBhbGwgYWxlcnRzXG5cbiAgICBcdFx0JCgnI2Z0cEFsZXJ0cyAuYWxlcnQnKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcbiAgICBcdFx0XHQkKHRoaXMpLnJlbW92ZSgpO1xuICAgIFx0XHR9KTtcblxuICAgIFx0XHQvL2Rpc2FibGUgYnV0dG9uXG4gICAgXHRcdCQodGhpcykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cbiAgICBcdFx0Ly9yZW1vdmUgZXhpc3RpbmcgbGlua3NcbiAgICBcdFx0JCgnI2Z0cExpc3RJdGVtcyA+IConKS5yZW1vdmUoKTtcblxuICAgIFx0XHQvL3Nob3cgZnRwIHNlY3Rpb25cbiAgICBcdFx0JCgnI2Z0cEJyb3dzZSAubG9hZGVyRnRwJykuc2hvdygpO1xuICAgIFx0XHQkKCcjZnRwQnJvd3NlJykuc2xpZGVEb3duKDUwMCk7XG5cbiAgICBcdFx0dmFyIHRoZUJ1dHRvbiA9ICQodGhpcyk7XG5cbiAgICBcdFx0JC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6IGFwcFVJLnNpdGVVcmwrXCJzaXRlL2Nvbm5lY3RcIixcbiAgICBcdFx0XHR0eXBlOiAncG9zdCcsXG4gICAgXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcbiAgICBcdFx0XHRkYXRhOiAkKCdmb3JtI3NpdGVTZXR0aW5nc0Zvcm0nKS5zZXJpYWxpemVBcnJheSgpXG4gICAgXHRcdH0pLmRvbmUoZnVuY3Rpb24ocmV0KXtcblxuICAgIFx0XHRcdC8vZW5hYmxlIGJ1dHRvblxuICAgIFx0XHRcdHRoZUJ1dHRvbi5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblxuICAgIFx0XHRcdC8vaGlkZSBsb2FkaW5nXG4gICAgXHRcdFx0JCgnI2Z0cEJyb3dzZSAubG9hZGVyRnRwJykuaGlkZSgpO1xuXG4gICAgXHRcdFx0aWYoIHJldC5yZXNwb25zZUNvZGUgPT09IDAgKSB7Ly9lcnJvclxuICAgIFx0XHRcdFx0JCgnI2Z0cEFsZXJ0cycpLmFwcGVuZCggJChyZXQucmVzcG9uc2VIVE1MKSApO1xuICAgIFx0XHRcdH0gZWxzZSBpZiggcmV0LnJlc3BvbnNlQ29kZSA9PT0gMSApIHsvL2FsbCBnb29kXG4gICAgXHRcdFx0XHQkKCcjZnRwTGlzdEl0ZW1zJykuYXBwZW5kKCAkKHJldC5yZXNwb25zZUhUTUwpICk7XG4gICAgXHRcdFx0fVxuXG4gICAgXHRcdH0pO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgaGlkZXMvY2xvc2VzIHRoZSBGVFAgYnJvd3NlclxuICAgICAgICAqL1xuICAgICAgICBjbG9zZUZ0cEJyb3dzZXI6IGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIFx0XHQkKHRoaXMpLmNsb3Nlc3QoJyNmdHBCcm93c2UnKS5zbGlkZVVwKDUwMCk7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgICAvKlxuICAgICAgICAgICAgdGVzdHMgdGhlIEZUUCBjb25uZWN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGRldGFpbHNcbiAgICAgICAgKi9cbiAgICAgICAgdGVzdEZUUENvbm5lY3Rpb246IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAvL2dvdCBhbGwgd2UgbmVlZD9cbiAgICBcdFx0aWYoICQoJyNzaXRlU2V0dGluZ3NfZnRwU2VydmVyJykudmFsKCkgPT09ICcnIHx8ICQoJyNzaXRlU2V0dGluZ3NfZnRwVXNlcicpLnZhbCgpID09PSAnJyB8fCAkKCcjc2l0ZVNldHRpbmdzX2Z0cFBhc3N3b3JkJykudmFsKCkgPT09ICcnICkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdQbGVhc2UgbWFrZSBzdXJlIGFsbCBGVFAgY29ubmVjdGlvbiBkZXRhaWxzIGFyZSBwcmVzZW50Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgXHRcdC8vZGVzdHJveSBhbGwgYWxlcnRzXG4gICAgICAgICAgICAkKCcjZnRwVGVzdEFsZXJ0cyAuYWxlcnQnKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICBcdFx0Ly9kaXNhYmxlIGJ1dHRvblxuICAgIFx0XHQkKHRoaXMpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgXHRcdC8vc2hvdyBsb2FkaW5nIGluZGljYXRvclxuICAgIFx0XHQkKHRoaXMpLm5leHQoKS5mYWRlSW4oNTAwKTtcblxuICAgICAgICAgICAgdmFyIHRoZUJ1dHRvbiA9ICQodGhpcyk7XG5cbiAgICBcdFx0JC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6IGFwcFVJLnNpdGVVcmwrXCJzaXRlL2Z0cHRlc3RcIixcbiAgICBcdFx0XHR0eXBlOiAncG9zdCcsXG4gICAgXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcbiAgICBcdFx0XHRkYXRhOiAkKCdmb3JtI3NpdGVTZXR0aW5nc0Zvcm0nKS5zZXJpYWxpemVBcnJheSgpXG4gICAgXHRcdH0pLmRvbmUoZnVuY3Rpb24ocmV0KXtcblxuICAgIFx0XHRcdC8vZW5hYmxlIGJ1dHRvblxuICAgIFx0XHRcdHRoZUJ1dHRvbi5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICB0aGVCdXR0b24ubmV4dCgpLmZhZGVPdXQoNTAwKTtcblxuICAgIFx0XHRcdGlmKCByZXQucmVzcG9uc2VDb2RlID09PSAwICkgey8vZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgJCgnI2Z0cFRlc3RBbGVydHMnKS5hcHBlbmQoICQocmV0LnJlc3BvbnNlSFRNTCkgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIHJldC5yZXNwb25zZUNvZGUgPT09IDEgKSB7Ly9hbGwgZ29vZFxuICAgICAgICAgICAgICAgICAgICAkKCcjZnRwVGVzdEFsZXJ0cycpLmFwcGVuZCggJChyZXQucmVzcG9uc2VIVE1MKSApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgIFx0XHR9KTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgcHVibGlzaC5pbml0KCk7XG5cbn0oKSk7IiwiKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIGFwcFVJID0gcmVxdWlyZSgnLi91aS5qcycpLmFwcFVJO1xuXG5cdHZhciBzaXRlcyA9IHtcblxuICAgICAgICB3cmFwcGVyU2l0ZXM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXRlcycpLFxuICAgICAgICBzZWxlY3RVc2VyOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXNlckRyb3BEb3duJyksXG4gICAgICAgIHNlbGVjdFNvcnQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzb3J0RHJvcERvd24nKSxcbiAgICAgICAgYnV0dG9uRGVsZXRlU2l0ZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbGV0ZVNpdGVCdXR0b24nKSxcblx0XHRidXR0b25zRGVsZXRlU2l0ZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmRlbGV0ZVNpdGVCdXR0b24nKSxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdGhpcy5jcmVhdGVUaHVtYm5haWxzKCk7XG5cbiAgICAgICAgICAgICQodGhpcy5zZWxlY3RVc2VyKS5vbignY2hhbmdlJywgdGhpcy5maWx0ZXJVc2VyKTtcbiAgICAgICAgICAgICQodGhpcy5zZWxlY3RTb3J0KS5vbignY2hhbmdlJywgdGhpcy5jaGFuZ2VTb3J0aW5nKTtcbiAgICAgICAgICAgICQodGhpcy5idXR0b25zRGVsZXRlU2l0ZSkub24oJ2NsaWNrJywgdGhpcy5kZWxldGVTaXRlKTtcblx0XHRcdCQodGhpcy5idXR0b25EZWxldGVTaXRlKS5vbignY2xpY2snLCB0aGlzLmRlbGV0ZVNpdGUpO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgYXBwbGllcyB6b29tZXIgdG8gY3JlYXRlIHRoZSBpZnJhbWUgdGh1Ym1uYWlsc1xuICAgICAgICAqL1xuICAgICAgICBjcmVhdGVUaHVtYm5haWxzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJCh0aGlzLndyYXBwZXJTaXRlcykuZmluZCgnaWZyYW1lJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgdmFyIHRoZUhlaWdodCA9ICQodGhpcykuYXR0cignZGF0YS1oZWlnaHQnKSowLjI1O1xuXG4gICAgICAgICAgICAgICAgJCh0aGlzKS56b29tZXIoe1xuICAgICAgICAgICAgICAgICAgICB6b29tOiAwLjI1LFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoZUhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICQodGhpcykucGFyZW50KCkud2lkdGgoKSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZVVSTDogYXBwVUkuc2l0ZVVybCtcInNpdGUvXCIrJCh0aGlzKS5hdHRyKCdkYXRhLXNpdGVpZCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNsb3Nlc3QoJy5zaXRlJykuZmluZCgnLnpvb21lci1jb3ZlciA+IGEnKS5hdHRyKCd0YXJnZXQnLCAnJyk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgZmlsdGVycyB0aGUgc2l0ZSBsaXN0IGJ5IHNlbGVjdGVkIHVzZXJcbiAgICAgICAgKi9cbiAgICAgICAgZmlsdGVyVXNlcjogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlmKCAkKHRoaXMpLnZhbCgpID09PSAnQWxsJyB8fCAkKHRoaXMpLnZhbCgpID09PSAnJyApIHtcbiAgICAgICAgICAgICAgICAkKCcjc2l0ZXMgLnNpdGUnKS5oaWRlKCkuZmFkZUluKDUwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoJyNzaXRlcyAuc2l0ZScpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAkKCcjc2l0ZXMnKS5maW5kKCdbZGF0YS1uYW1lPVwiJyskKHRoaXMpLnZhbCgpKydcIl0nKS5mYWRlSW4oNTAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGNobmFnZXMgdGhlIHNvcnRpbmcgb24gdGhlIHNpdGUgbGlzdFxuICAgICAgICAqL1xuICAgICAgICBjaGFuZ2VTb3J0aW5nOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIHNpdGVzO1xuXG4gICAgICAgICAgICBpZiggJCh0aGlzKS52YWwoKSA9PT0gJ05vT2ZQYWdlcycgKSB7XG5cblx0XHRcdFx0c2l0ZXMgPSAkKCcjc2l0ZXMgLnNpdGUnKTtcblxuXHRcdFx0XHRzaXRlcy5zb3J0KCBmdW5jdGlvbihhLGIpe1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBhbiA9IGEuZ2V0QXR0cmlidXRlKCdkYXRhLXBhZ2VzJyk7XG5cdFx0XHRcdFx0dmFyIGJuID0gYi5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGFnZXMnKTtcblxuXHRcdFx0XHRcdGlmKGFuID4gYm4pIHtcblx0XHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKGFuIDwgYm4pIHtcblx0XHRcdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gMDtcblxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0c2l0ZXMuZGV0YWNoKCkuYXBwZW5kVG8oICQoJyNzaXRlcycpICk7XG5cblx0XHRcdH0gZWxzZSBpZiggJCh0aGlzKS52YWwoKSA9PT0gJ0NyZWF0aW9uRGF0ZScgKSB7XG5cblx0XHRcdFx0c2l0ZXMgPSAkKCcjc2l0ZXMgLnNpdGUnKTtcblxuXHRcdFx0XHRzaXRlcy5zb3J0KCBmdW5jdGlvbihhLGIpe1xuXG5cdFx0XHRcdFx0dmFyIGFuID0gYS5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3JlYXRlZCcpLnJlcGxhY2UoXCItXCIsIFwiXCIpO1xuXHRcdFx0XHRcdHZhciBibiA9IGIuZ2V0QXR0cmlidXRlKCdkYXRhLWNyZWF0ZWQnKS5yZXBsYWNlKFwiLVwiLCBcIlwiKTtcblxuXHRcdFx0XHRcdGlmKGFuID4gYm4pIHtcblx0XHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKGFuIDwgYm4pIHtcblx0XHRcdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gMDtcblxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0c2l0ZXMuZGV0YWNoKCkuYXBwZW5kVG8oICQoJyNzaXRlcycpICk7XG5cblx0XHRcdH0gZWxzZSBpZiggJCh0aGlzKS52YWwoKSA9PT0gJ0xhc3RVcGRhdGUnICkge1xuXG5cdFx0XHRcdHNpdGVzID0gJCgnI3NpdGVzIC5zaXRlJyk7XG5cblx0XHRcdFx0c2l0ZXMuc29ydCggZnVuY3Rpb24oYSxiKXtcblxuXHRcdFx0XHRcdHZhciBhbiA9IGEuZ2V0QXR0cmlidXRlKCdkYXRhLXVwZGF0ZScpLnJlcGxhY2UoXCItXCIsIFwiXCIpO1xuXHRcdFx0XHRcdHZhciBibiA9IGIuZ2V0QXR0cmlidXRlKCdkYXRhLXVwZGF0ZScpLnJlcGxhY2UoXCItXCIsIFwiXCIpO1xuXG5cdFx0XHRcdFx0aWYoYW4gPiBibikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoYW4gPCBibikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gMDtcblxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0c2l0ZXMuZGV0YWNoKCkuYXBwZW5kVG8oICQoJyNzaXRlcycpICk7XG5cblx0XHRcdH1cblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGRlbGV0ZXMgYSBzaXRlXG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZVNpdGU6IGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICAkKCcjZGVsZXRlU2l0ZU1vZGFsIC5tb2RhbC1jb250ZW50IHAnKS5zaG93KCk7XG5cbiAgICAgICAgICAgIC8vcmVtb3ZlIG9sZCBhbGVydHNcbiAgICAgICAgICAgICQoJyNkZWxldGVTaXRlTW9kYWwgLm1vZGFsLWFsZXJ0cyA+IConKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICQoJyNkZWxldGVTaXRlTW9kYWwgLmxvYWRlcicpLmhpZGUoKTtcblxuICAgICAgICAgICAgdmFyIHRvRGVsID0gJCh0aGlzKS5jbG9zZXN0KCcuc2l0ZScpO1xuICAgICAgICAgICAgdmFyIGRlbEJ1dHRvbiA9ICQodGhpcyk7XG5cbiAgICAgICAgICAgICQoJyNkZWxldGVTaXRlTW9kYWwgYnV0dG9uI2RlbGV0ZVNpdGVCdXR0b24nKS5zaG93KCk7XG4gICAgICAgICAgICAkKCcjZGVsZXRlU2l0ZU1vZGFsJykubW9kYWwoJ3Nob3cnKTtcblxuICAgICAgICAgICAgJCgnI2RlbGV0ZVNpdGVNb2RhbCBidXR0b24jZGVsZXRlU2l0ZUJ1dHRvbicpLnVuYmluZCgnY2xpY2snKS5jbGljayhmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcjZGVsZXRlU2l0ZU1vZGFsIC5sb2FkZXInKS5mYWRlSW4oNTAwKTtcblxuICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgIHVybDogYXBwVUkuc2l0ZVVybCtcInNpdGUvdHJhc2gvXCIrZGVsQnV0dG9uLmF0dHIoJ2RhdGEtc2l0ZWlkJyksXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgICAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXQpe1xuXG4gICAgICAgICAgICAgICAgICAgICQoJyNkZWxldGVTaXRlTW9kYWwgLmxvYWRlcicpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnI2RlbGV0ZVNpdGVNb2RhbCBidXR0b24jZGVsZXRlU2l0ZUJ1dHRvbicpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCByZXQucmVzcG9uc2VDb2RlID09PSAwICkgey8vZXJyb3JcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2RlbGV0ZVNpdGVNb2RhbCAubW9kYWwtY29udGVudCBwJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2RlbGV0ZVNpdGVNb2RhbCAubW9kYWwtYWxlcnRzJykuYXBwZW5kKCAkKHJldC5yZXNwb25zZUhUTUwpICk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCByZXQucmVzcG9uc2VDb2RlID09PSAxICkgey8vYWxsIGdvb2RcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2RlbGV0ZVNpdGVNb2RhbCAubW9kYWwtY29udGVudCBwJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2RlbGV0ZVNpdGVNb2RhbCAubW9kYWwtYWxlcnRzJykuYXBwZW5kKCAkKHJldC5yZXNwb25zZUhUTUwpICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjZGVsZXRlU2l0ZU1vZGFsIGJ1dHRvbiNkZWxldGVTaXRlQnV0dG9uJykuaGlkZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0b0RlbC5mYWRlT3V0KDgwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIHNpdGVzLmluaXQoKTtcblxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgYXBwVUkgPSByZXF1aXJlKCcuL3VpLmpzJykuYXBwVUk7XG5cblx0dmFyIHNpdGVTZXR0aW5ncyA9IHtcblxuICAgICAgICAvL2J1dHRvblNpdGVTZXR0aW5nczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpdGVTZXR0aW5nc0J1dHRvbicpLFxuXHRcdGJ1dHRvblNpdGVTZXR0aW5nczI6ICQoJy5zaXRlU2V0dGluZ3NNb2RhbEJ1dHRvbicpLFxuICAgICAgICBidXR0b25TYXZlU2l0ZVNldHRpbmdzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2F2ZVNpdGVTZXR0aW5nc0J1dHRvbicpLFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAvLyQodGhpcy5idXR0b25TaXRlU2V0dGluZ3MpLm9uKCdjbGljaycsIHRoaXMuc2l0ZVNldHRpbmdzTW9kYWwpO1xuXHRcdFx0dGhpcy5idXR0b25TaXRlU2V0dGluZ3MyLm9uKCdjbGljaycsIHRoaXMuc2l0ZVNldHRpbmdzTW9kYWwpO1xuICAgICAgICAgICAgJCh0aGlzLmJ1dHRvblNhdmVTaXRlU2V0dGluZ3MpLm9uKCdjbGljaycsIHRoaXMuc2F2ZVNpdGVTZXR0aW5ncyk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvKlxuICAgICAgICAgICAgbG9hZHMgdGhlIHNpdGUgc2V0dGluZ3MgZGF0YVxuICAgICAgICAqL1xuICAgICAgICBzaXRlU2V0dGluZ3NNb2RhbDogZnVuY3Rpb24oZSkge1xuXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBcdFx0JCgnI3NpdGVTZXR0aW5ncycpLm1vZGFsKCdzaG93Jyk7XG5cbiAgICBcdFx0Ly9kZXN0cm95IGFsbCBhbGVydHNcbiAgICBcdFx0JCgnI3NpdGVTZXR0aW5ncyAuYWxlcnQnKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcblxuICAgIFx0XHRcdCQodGhpcykucmVtb3ZlKCk7XG5cbiAgICBcdFx0fSk7XG5cbiAgICBcdFx0Ly9zZXQgdGhlIHNpdGVJRFxuICAgIFx0XHQkKCdpbnB1dCNzaXRlSUQnKS52YWwoICQodGhpcykuYXR0cignZGF0YS1zaXRlaWQnKSApO1xuXG4gICAgXHRcdC8vZGVzdHJveSBjdXJyZW50IGZvcm1zXG4gICAgXHRcdCQoJyNzaXRlU2V0dGluZ3MgLm1vZGFsLWJvZHktY29udGVudCA+IConKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgXHRcdFx0JCh0aGlzKS5yZW1vdmUoKTtcbiAgICBcdFx0fSk7XG5cbiAgICAgICAgICAgIC8vc2hvdyBsb2FkZXIsIGhpZGUgcmVzdFxuICAgIFx0XHQkKCcjc2l0ZVNldHRpbmdzV3JhcHBlciAubG9hZGVyJykuc2hvdygpO1xuICAgIFx0XHQkKCcjc2l0ZVNldHRpbmdzV3JhcHBlciA+ICo6bm90KC5sb2FkZXIpJykuaGlkZSgpO1xuXG4gICAgXHRcdC8vbG9hZCBzaXRlIGRhdGEgdXNpbmcgYWpheFxuICAgIFx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogYXBwVUkuc2l0ZVVybCtcInNpdGVBamF4L1wiKyQodGhpcykuYXR0cignZGF0YS1zaXRlaWQnKSxcbiAgICBcdFx0XHR0eXBlOiAnZ2V0JyxcbiAgICBcdFx0XHRkYXRhVHlwZTogJ2pzb24nXG4gICAgXHRcdH0pLmRvbmUoZnVuY3Rpb24ocmV0KXtcblxuICAgIFx0XHRcdGlmKCByZXQucmVzcG9uc2VDb2RlID09PSAwICkgey8vZXJyb3JcblxuICAgIFx0XHRcdFx0Ly9oaWRlIGxvYWRlciwgc2hvdyBlcnJvciBtZXNzYWdlXG4gICAgXHRcdFx0XHQkKCcjc2l0ZVNldHRpbmdzIC5sb2FkZXInKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcblxuICAgIFx0XHRcdFx0XHQkKCcjc2l0ZVNldHRpbmdzIC5tb2RhbC1hbGVydHMnKS5hcHBlbmQoICQocmV0LnJlc3BvbnNlSFRNTCkgKTtcblxuICAgIFx0XHRcdFx0fSk7XG5cbiAgICBcdFx0XHRcdC8vZGlzYWJsZSBzdWJtaXQgYnV0dG9uXG4gICAgXHRcdFx0XHQkKCcjc2F2ZVNpdGVTZXR0aW5nc0J1dHRvbicpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXG5cbiAgICBcdFx0XHR9IGVsc2UgaWYoIHJldC5yZXNwb25zZUNvZGUgPT09IDEgKSB7Ly9hbGwgd2VsbCA6KVxuXG4gICAgXHRcdFx0XHQvL2hpZGUgbG9hZGVyLCBzaG93IGRhdGFcblxuICAgIFx0XHRcdFx0JCgnI3NpdGVTZXR0aW5ncyAubG9hZGVyJykuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG5cbiAgICBcdFx0XHRcdFx0JCgnI3NpdGVTZXR0aW5ncyAubW9kYWwtYm9keS1jb250ZW50JykuYXBwZW5kKCAkKHJldC5yZXNwb25zZUhUTUwpICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICQoJ2JvZHknKS50cmlnZ2VyKCdzaXRlU2V0dGluZ3NMb2FkJyk7XG5cbiAgICBcdFx0XHRcdH0pO1xuXG4gICAgXHRcdFx0XHQvL2VuYWJsZSBzdWJtaXQgYnV0dG9uXG4gICAgXHRcdFx0XHQkKCcjc2F2ZVNpdGVTZXR0aW5nc0J1dHRvbicpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgXHRcdFx0fVxuXG4gICAgXHRcdH0pO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgc2F2ZXMgdGhlIHNpdGUgc2V0dGluZ3NcbiAgICAgICAgKi9cbiAgICAgICAgc2F2ZVNpdGVTZXR0aW5nczogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vZGVzdHJveSBhbGwgYWxlcnRzXG4gICAgXHRcdCQoJyNzaXRlU2V0dGluZ3MgLmFsZXJ0JykuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG5cbiAgICBcdFx0XHQkKHRoaXMpLnJlbW92ZSgpO1xuXG4gICAgXHRcdH0pO1xuXG4gICAgXHRcdC8vZGlzYWJsZSBidXR0b25cbiAgICBcdFx0JCgnI3NhdmVTaXRlU2V0dGluZ3NCdXR0b24nKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcblxuICAgIFx0XHQvL2hpZGUgZm9ybSBkYXRhXG4gICAgXHRcdCQoJyNzaXRlU2V0dGluZ3MgLm1vZGFsLWJvZHktY29udGVudCA+IConKS5oaWRlKCk7XG5cbiAgICBcdFx0Ly9zaG93IGxvYWRlclxuICAgIFx0XHQkKCcjc2l0ZVNldHRpbmdzIC5sb2FkZXInKS5zaG93KCk7XG5cbiAgICBcdFx0JC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6IGFwcFVJLnNpdGVVcmwrXCJzaXRlQWpheFVwZGF0ZVwiLFxuICAgIFx0XHRcdHR5cGU6ICdwb3N0JyxcbiAgICBcdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuICAgIFx0XHRcdGRhdGE6ICQoJ2Zvcm0jc2l0ZVNldHRpbmdzRm9ybScpLnNlcmlhbGl6ZUFycmF5KClcbiAgICBcdFx0fSkuZG9uZShmdW5jdGlvbihyZXQpe1xuXG4gICAgXHRcdFx0aWYoIHJldC5yZXNwb25zZUNvZGUgPT09IDAgKSB7Ly9lcnJvclxuXG4gICAgXHRcdFx0XHQkKCcjc2l0ZVNldHRpbmdzIC5sb2FkZXInKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcblxuICAgIFx0XHRcdFx0XHQkKCcjc2l0ZVNldHRpbmdzIC5tb2RhbC1hbGVydHMnKS5hcHBlbmQoIHJldC5yZXNwb25zZUhUTUwgKTtcblxuICAgIFx0XHRcdFx0XHQvL3Nob3cgZm9ybSBkYXRhXG4gICAgXHRcdFx0XHRcdCQoJyNzaXRlU2V0dGluZ3MgLm1vZGFsLWJvZHktY29udGVudCA+IConKS5zaG93KCk7XG5cbiAgICBcdFx0XHRcdFx0Ly9lbmFibGUgYnV0dG9uXG4gICAgXHRcdFx0XHRcdCQoJyNzYXZlU2l0ZVNldHRpbmdzQnV0dG9uJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cbiAgICBcdFx0XHRcdH0pO1xuXG5cbiAgICBcdFx0XHR9IGVsc2UgaWYoIHJldC5yZXNwb25zZUNvZGUgPT09IDEgKSB7Ly9hbGwgaXMgd2VsbFxuXG4gICAgXHRcdFx0XHQkKCcjc2l0ZVNldHRpbmdzIC5sb2FkZXInKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcblxuXG4gICAgXHRcdFx0XHRcdC8vdXBkYXRlIHNpdGUgbmFtZSBpbiB0b3AgbWVudVxuICAgIFx0XHRcdFx0XHQkKCcjc2l0ZVRpdGxlJykudGV4dCggcmV0LnNpdGVOYW1lICk7XG5cbiAgICBcdFx0XHRcdFx0JCgnI3NpdGVTZXR0aW5ncyAubW9kYWwtYWxlcnRzJykuYXBwZW5kKCByZXQucmVzcG9uc2VIVE1MICk7XG5cbiAgICBcdFx0XHRcdFx0Ly9oaWRlIGZvcm0gZGF0YVxuICAgIFx0XHRcdFx0XHQkKCcjc2l0ZVNldHRpbmdzIC5tb2RhbC1ib2R5LWNvbnRlbnQgPiAqJykucmVtb3ZlKCk7XG4gICAgXHRcdFx0XHRcdCQoJyNzaXRlU2V0dGluZ3MgLm1vZGFsLWJvZHktY29udGVudCcpLmFwcGVuZCggcmV0LnJlc3BvbnNlSFRNTDIgKTtcblxuICAgIFx0XHRcdFx0XHQvL2VuYWJsZSBidXR0b25cbiAgICBcdFx0XHRcdFx0JCgnI3NhdmVTaXRlU2V0dGluZ3NCdXR0b24nKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblxuICAgIFx0XHRcdFx0XHQvL2lzIHRoZSBGVFAgc3R1ZmYgYWxsIGdvb2Q/XG5cbiAgICBcdFx0XHRcdFx0aWYoIHJldC5mdHBPayA9PT0gMSApIHsvL3llcywgYWxsIGdvb2RcblxuICAgIFx0XHRcdFx0XHRcdCQoJyNwdWJsaXNoUGFnZScpLnJlbW92ZUF0dHIoJ2RhdGEtdG9nZ2xlJyk7XG4gICAgXHRcdFx0XHRcdFx0JCgnI3B1Ymxpc2hQYWdlIHNwYW4udGV4dC1kYW5nZXInKS5oaWRlKCk7XG5cbiAgICBcdFx0XHRcdFx0XHQkKCcjcHVibGlzaFBhZ2UnKS50b29sdGlwKCdkZXN0cm95Jyk7XG5cbiAgICBcdFx0XHRcdFx0fSBlbHNlIHsvL25vcGUsIGNhbid0IHVzZSBGVFBcblxuICAgIFx0XHRcdFx0XHRcdCQoJyNwdWJsaXNoUGFnZScpLmF0dHIoJ2RhdGEtdG9nZ2xlJywgJ3Rvb2x0aXAnKTtcbiAgICBcdFx0XHRcdFx0XHQkKCcjcHVibGlzaFBhZ2Ugc3Bhbi50ZXh0LWRhbmdlcicpLnNob3coKTtcblxuICAgIFx0XHRcdFx0XHRcdCQoJyNwdWJsaXNoUGFnZScpLnRvb2x0aXAoJ3Nob3cnKTtcblxuICAgIFx0XHRcdFx0XHR9XG5cblxuICAgIFx0XHRcdFx0XHQvL3VwZGF0ZSB0aGUgc2l0ZSBuYW1lIGluIHRoZSBzbWFsbCB3aW5kb3dcbiAgICBcdFx0XHRcdFx0JCgnI3NpdGVfJytyZXQuc2l0ZUlEKycgLndpbmRvdyAudG9wIGInKS50ZXh0KCByZXQuc2l0ZU5hbWUgKTtcblxuICAgIFx0XHRcdFx0fSk7XG5cblxuICAgIFx0XHRcdH1cblxuICAgIFx0XHR9KTtcblxuICAgICAgICB9LFxuXG5cbiAgICB9O1xuXG4gICAgc2l0ZVNldHRpbmdzLmluaXQoKTtcblxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXG4vKiBnbG9iYWxzIHNpdGVVcmw6ZmFsc2UsIGJhc2VVcmw6ZmFsc2UgKi9cbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgXG4gICAgdmFyIGFwcFVJID0ge1xuICAgICAgICBcbiAgICAgICAgZmlyc3RNZW51V2lkdGg6IDE5MCxcbiAgICAgICAgc2Vjb25kTWVudVdpZHRoOiAzMDAsXG4gICAgICAgIGxvYWRlckFuaW1hdGlvbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRlcicpLFxuICAgICAgICBzZWNvbmRNZW51VHJpZ2dlckNvbnRhaW5lcnM6ICQoJyNtZW51ICNtYWluICNlbGVtZW50Q2F0cywgI21lbnUgI21haW4gI3RlbXBsYXRlc1VsJyksXG4gICAgICAgIHNpdGVVcmw6IHNpdGVVcmwsXG4gICAgICAgIGJhc2VVcmw6IGJhc2VVcmwsXG4gICAgICAgIFxuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRmFkZSB0aGUgbG9hZGVyIGFuaW1hdGlvblxuICAgICAgICAgICAgJChhcHBVSS5sb2FkZXJBbmltYXRpb24pLmZhZGVPdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkKCcjbWVudScpLmFuaW1hdGUoeydsZWZ0JzogLWFwcFVJLmZpcnN0TWVudVdpZHRofSwgMTAwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVGFic1xuICAgICAgICAgICAgJChcIi5uYXYtdGFicyBhXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICQodGhpcykudGFiKFwic2hvd1wiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKFwic2VsZWN0LnNlbGVjdFwiKS5zZWxlY3QyKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQoJzpyYWRpbywgOmNoZWNrYm94JykucmFkaW9jaGVjaygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUb29sdGlwc1xuICAgICAgICAgICAgJChcIltkYXRhLXRvZ2dsZT10b29sdGlwXVwiKS50b29sdGlwKFwiaGlkZVwiKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVGFibGU6IFRvZ2dsZSBhbGwgY2hlY2tib3hlc1xuICAgICAgICAgICAgJCgnLnRhYmxlIC50b2dnbGUtYWxsIDpjaGVja2JveCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgIHZhciBjaCA9ICR0aGlzLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAkdGhpcy5jbG9zZXN0KCcudGFibGUnKS5maW5kKCd0Ym9keSA6Y2hlY2tib3gnKS5yYWRpb2NoZWNrKCFjaCA/ICd1bmNoZWNrJyA6ICdjaGVjaycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFkZCBzdHlsZSBjbGFzcyBuYW1lIHRvIGEgdG9vbHRpcHNcbiAgICAgICAgICAgICQoXCIudG9vbHRpcFwiKS5hZGRDbGFzcyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5wcmV2KCkuYXR0cihcImRhdGEtdG9vbHRpcC1zdHlsZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0b29sdGlwLVwiICsgJCh0aGlzKS5wcmV2KCkuYXR0cihcImRhdGEtdG9vbHRpcC1zdHlsZVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJChcIi5idG4tZ3JvdXBcIikub24oJ2NsaWNrJywgXCJhXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQodGhpcykuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKS5lbmQoKS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBGb2N1cyBzdGF0ZSBmb3IgYXBwZW5kL3ByZXBlbmQgaW5wdXRzXG4gICAgICAgICAgICAkKCcuaW5wdXQtZ3JvdXAnKS5vbignZm9jdXMnLCAnLmZvcm0tY29udHJvbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNsb3Nlc3QoJy5pbnB1dC1ncm91cCwgLmZvcm0tZ3JvdXAnKS5hZGRDbGFzcygnZm9jdXMnKTtcbiAgICAgICAgICAgIH0pLm9uKCdibHVyJywgJy5mb3JtLWNvbnRyb2wnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jbG9zZXN0KCcuaW5wdXQtZ3JvdXAsIC5mb3JtLWdyb3VwJykucmVtb3ZlQ2xhc3MoJ2ZvY3VzJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVGFibGU6IFRvZ2dsZSBhbGwgY2hlY2tib3hlc1xuICAgICAgICAgICAgJCgnLnRhYmxlIC50b2dnbGUtYWxsJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoID0gJCh0aGlzKS5maW5kKCc6Y2hlY2tib3gnKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jbG9zZXN0KCcudGFibGUnKS5maW5kKCd0Ym9keSA6Y2hlY2tib3gnKS5jaGVja2JveCghY2ggPyAnY2hlY2snIDogJ3VuY2hlY2snKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUYWJsZTogQWRkIGNsYXNzIHJvdyBzZWxlY3RlZFxuICAgICAgICAgICAgJCgnLnRhYmxlIHRib2R5IDpjaGVja2JveCcpLm9uKCdjaGVjayB1bmNoZWNrIHRvZ2dsZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgICAgICAgICAgICAgICwgY2hlY2sgPSAkdGhpcy5wcm9wKCdjaGVja2VkJylcbiAgICAgICAgICAgICAgICAsIHRvZ2dsZSA9IGUudHlwZSA9PT0gJ3RvZ2dsZSdcbiAgICAgICAgICAgICAgICAsIGNoZWNrYm94ZXMgPSAkKCcudGFibGUgdGJvZHkgOmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAsIGNoZWNrQWxsID0gY2hlY2tib3hlcy5sZW5ndGggPT09IGNoZWNrYm94ZXMuZmlsdGVyKCc6Y2hlY2tlZCcpLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgICR0aGlzLmNsb3Nlc3QoJ3RyJylbY2hlY2sgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oJ3NlbGVjdGVkLXJvdycpO1xuICAgICAgICAgICAgICAgIGlmICh0b2dnbGUpICR0aGlzLmNsb3Nlc3QoJy50YWJsZScpLmZpbmQoJy50b2dnbGUtYWxsIDpjaGVja2JveCcpLmNoZWNrYm94KGNoZWNrQWxsID8gJ2NoZWNrJyA6ICd1bmNoZWNrJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gU3dpdGNoXG4gICAgICAgICAgICAkKFwiW2RhdGEtdG9nZ2xlPSdzd2l0Y2gnXVwiKS53cmFwKCc8ZGl2IGNsYXNzPVwic3dpdGNoXCIgLz4nKS5wYXJlbnQoKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgYXBwVUkuc2Vjb25kTWVudVRyaWdnZXJDb250YWluZXJzLm9uKCdjbGljaycsICdhOm5vdCguYnRuKScsIGFwcFVJLnNlY29uZE1lbnVBbmltYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBzZWNvbmRNZW51QW5pbWF0aW9uOiBmdW5jdGlvbigpe1xuICAgICAgICBcbiAgICAgICAgICAgICQoJyNtZW51ICNtYWluIGEnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdhY3RpdmUnKTtcblx0XG4gICAgICAgICAgICAvL3Nob3cgb25seSB0aGUgcmlnaHQgZWxlbWVudHNcbiAgICAgICAgICAgICQoJyNtZW51ICNzZWNvbmQgdWwgbGknKS5oaWRlKCk7XG4gICAgICAgICAgICAkKCcjbWVudSAjc2Vjb25kIHVsIGxpLicrJCh0aGlzKS5hdHRyKCdpZCcpKS5zaG93KCk7XG5cbiAgICAgICAgICAgIGlmKCAkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdhbGwnICkge1xuICAgICAgICAgICAgICAgICQoJyNtZW51ICNzZWNvbmQgdWwjZWxlbWVudHMgbGknKS5zaG93KCk7XHRcdFxuICAgICAgICAgICAgfVxuXHRcbiAgICAgICAgICAgICQoJy5tZW51IC5zZWNvbmQnKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKS5zdG9wKCkuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgd2lkdGg6IGFwcFVJLnNlY29uZE1lbnVXaWR0aFxuICAgICAgICAgICAgfSwgNTAwKTtcdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH07XG4gICAgXG4gICAgLy9pbml0aWF0ZSB0aGUgVUlcbiAgICBhcHBVSS5zZXR1cCgpO1xuXG5cbiAgICAvLyoqKiogRVhQT1JUU1xuICAgIG1vZHVsZS5leHBvcnRzLmFwcFVJID0gYXBwVUk7XG4gICAgXG59KCkpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgXG4gICAgZXhwb3J0cy5nZXRSYW5kb21BcmJpdHJhcnkgPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW4pO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdldFBhcmFtZXRlckJ5TmFtZSA9IGZ1bmN0aW9uIChuYW1lLCB1cmwpIHtcblxuICAgICAgICBpZiAoIXVybCkgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csIFwiXFxcXCQmXCIpO1xuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiWz8mXVwiICsgbmFtZSArIFwiKD0oW14mI10qKXwmfCN8JClcIiksXG4gICAgICAgICAgICByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICAgICAgICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xuICAgICAgICBpZiAoIXJlc3VsdHNbMl0pIHJldHVybiAnJztcbiAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xuICAgICAgICBcbiAgICB9O1xuICAgIFxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXF1aXJlKCcuL21vZHVsZXMvdWkuanMnKTtcblx0cmVxdWlyZSgnLi9tb2R1bGVzL2FjY291bnQuanMnKTtcblx0cmVxdWlyZSgnLi9tb2R1bGVzL3NpdGVzLmpzJyk7XG5cdHJlcXVpcmUoJy4vbW9kdWxlcy9zaXRlc2V0dGluZ3MuanMnKTtcblx0cmVxdWlyZSgnLi9tb2R1bGVzL3B1Ymxpc2hpbmcuanMnKTtcblxufSgpKTsiLCIvKiFcbiAqIHB1Ymxpc2hlci5qcyAtIChjKSBSeWFuIEZsb3JlbmNlIDIwMTFcbiAqIGdpdGh1Yi5jb20vcnBmbG9yZW5jZS9wdWJsaXNoZXIuanNcbiAqIE1JVCBMaWNlbnNlXG4qL1xuXG4vLyBVTUQgQm9pbGVycGxhdGUgXFxvLyAmJiBEOlxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTsgLy8gbm9kZVxuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTsgLy8gYW1kXG4gIH0gZWxzZSB7XG4gICAgLy8gd2luZG93IHdpdGggbm9Db25mbGljdFxuICAgIHZhciBfcHVibGlzaGVyID0gcm9vdC5wdWJsaXNoZXI7XG4gICAgdmFyIHB1Ymxpc2hlciA9IHJvb3QucHVibGlzaGVyID0gZmFjdG9yeSgpO1xuICAgIHJvb3QucHVibGlzaGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByb290LnB1Ymxpc2hlciA9IF9wdWJsaXNoZXI7XG4gICAgICByZXR1cm4gcHVibGlzaGVyO1xuICAgIH1cbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIHB1Ymxpc2hlciA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgdG9waWNzID0ge307XG4gICAgb2JqID0gb2JqIHx8IHt9O1xuXG4gICAgb2JqLnB1Ymxpc2ggPSBmdW5jdGlvbiAodG9waWMvKiwgbWVzc2FnZXMuLi4qLykge1xuICAgICAgaWYgKCF0b3BpY3NbdG9waWNdKSByZXR1cm4gb2JqO1xuICAgICAgdmFyIG1lc3NhZ2VzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0b3BpY3NbdG9waWNdLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0b3BpY3NbdG9waWNdW2ldLmhhbmRsZXIuYXBwbHkodG9waWNzW3RvcGljXVtpXS5jb250ZXh0LCBtZXNzYWdlcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH07XG5cbiAgICBvYmouc3Vic2NyaWJlID0gZnVuY3Rpb24gKHRvcGljT3JTdWJzY3JpYmVyLCBoYW5kbGVyT3JUb3BpY3MpIHtcbiAgICAgIHZhciBmaXJzdFR5cGUgPSB0eXBlb2YgdG9waWNPclN1YnNjcmliZXI7XG5cbiAgICAgIGlmIChmaXJzdFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBzdWJzY3JpYmUuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpcnN0VHlwZSA9PT0gJ29iamVjdCcgJiYgIWhhbmRsZXJPclRvcGljcykge1xuICAgICAgICByZXR1cm4gc3Vic2NyaWJlTXVsdGlwbGUuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyT3JUb3BpY3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBoaXRjaC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaGl0Y2hNdWx0aXBsZS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzdWJzY3JpYmUgKHRvcGljLCBoYW5kbGVyLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVmZXJlbmNlID0geyBoYW5kbGVyOiBoYW5kbGVyLCBjb250ZXh0OiBjb250ZXh0IHx8IG9iaiB9O1xuICAgICAgdG9waWMgPSB0b3BpY3NbdG9waWNdIHx8ICh0b3BpY3NbdG9waWNdID0gW10pO1xuICAgICAgdG9waWMucHVzaChyZWZlcmVuY2UpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXR0YWNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdG9waWMucHVzaChyZWZlcmVuY2UpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBkZXRhY2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBlcmFzZSh0b3BpYywgcmVmZXJlbmNlKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlTXVsdGlwbGUgKHBhaXJzKSB7XG4gICAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHt9O1xuICAgICAgZm9yICh2YXIgdG9waWMgaW4gcGFpcnMpIHtcbiAgICAgICAgaWYgKCFwYWlycy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIGNvbnRpbnVlO1xuICAgICAgICBzdWJzY3JpcHRpb25zW3RvcGljXSA9IHN1YnNjcmliZSh0b3BpYywgcGFpcnNbdG9waWNdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdWJzY3JpcHRpb25zO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoaXRjaCAoc3Vic2NyaWJlciwgdG9waWMpIHtcbiAgICAgIHJldHVybiBzdWJzY3JpYmUodG9waWMsIHN1YnNjcmliZXJbdG9waWNdLCBzdWJzY3JpYmVyKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaGl0Y2hNdWx0aXBsZSAoc3Vic2NyaWJlciwgdG9waWNzKSB7XG4gICAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0b3BpY3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaCggaGl0Y2goc3Vic2NyaWJlciwgdG9waWNzW2ldKSApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbnM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGVyYXNlIChhcnIsIHZpY3RpbSkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcnIubGVuZ3RoOyBpIDwgbDsgaSsrKXtcbiAgICAgICAgaWYgKGFycltpXSA9PT0gdmljdGltKSBhcnIuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gcHVibGlzaGVyIGlzIGEgcHVibGlzaGVyLCBzbyBtZXRhIC4uLlxuICByZXR1cm4gcHVibGlzaGVyKHB1Ymxpc2hlcik7XG59KSk7XG4iXX0=
