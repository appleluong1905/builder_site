(function () {
    "use strict";

    var siteBuilder = require('./builder.js');

    /*
        constructor function for Element
    */
    module.exports.Element = function (el) {

        this.element = el;
        this.sandbox = false;
        this.parentFrame = {};
        this.parentBlock = {};//reference to the parent block element
        this.editableAttributes = [];

        //make current element active/open (being worked on)
        this.setOpen = function() {

            $(this.element).off('mouseenter mouseleave click');

            $(this.element).css({'outline': '2px solid rgba(233,94,94,0.5)', 'outline-offset':'-2px', 'cursor': 'pointer'});

        };

        //sets up hover and click events, making the element active on the canvas
        this.activate = function() {

            var element = this;

            //data attributes for color
            if ( this.element.tagName === 'A' ) $(this.element).data('color', getComputedStyle(this.element).color);

            $(this.element).css({'outline': 'none', 'cursor': ''});

            $(this.element).on('mouseenter', function(e) {

                e.stopPropagation();

                $(this).css({'outline': '2px solid rgba(233,94,94,0.5)', 'outline-offset': '-2px', 'cursor': 'pointer'});

            }).on('mouseleave', function() {

                $(this).css({'outline': '', 'cursor': '', 'outline-offset': ''});

            }).on('click', function(e) {

                e.preventDefault();
                e.stopPropagation();

                element.clickHandler(this);

            });

        };

        this.deactivate = function() {

            $(this.element).off('mouseenter mouseleave click');
            $(this.element).css({'outline': 'none', 'cursor': 'inherit'});

        };

        //removes the elements outline
        this.removeOutline = function() {

            $(this.element).css({'outline': 'none', 'cursor': 'inherit'});

        };

        //sets the parent iframe
        this.setParentFrame = function() {

            var doc = this.element.ownerDocument;
            var w = doc.defaultView || doc.parentWindow;
            var frames = w.parent.document.getElementsByTagName('iframe');

            for (var i= frames.length; i-->0;) {

                var frame= frames[i];

                try {
                    var d= frame.contentDocument || frame.contentWindow.document;
                    if (d===doc)
                        this.parentFrame = frame;
                } catch(e) {}
            }

        };

        //sets this element's parent block reference
        this.setParentBlock = function() {

            //loop through all the blocks on the canvas
            for( var i = 0; i < siteBuilder.site.sitePages.length; i++ ) {

                for( var x = 0; x < siteBuilder.site.sitePages[i].blocks.length; x++ ) {

                    //if the block's frame matches this element's parent frame
                    if( siteBuilder.site.sitePages[i].blocks[x].frame === this.parentFrame ) {
                        //create a reference to that block and store it in this.parentBlock
                        this.parentBlock = siteBuilder.site.sitePages[i].blocks[x];
                    }

                }

            }

        };


        this.setParentFrame();

        /*
            is this block sandboxed?
        */

        if( this.parentFrame.getAttribute('data-sandbox') ) {
            this.sandbox = this.parentFrame.getAttribute('data-sandbox');
        }

    };

}());