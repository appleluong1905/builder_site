(function () {
	"use strict";

	var canvasElement = require('./canvasElement.js').Element;
    var publisher = require('../vendor/publisher');
	var bConfig = require('./config');
	var siteBuilder = require('./builder.js');
    var MediumEditor = require('medium-editor');

	var contenteditor = {
        
        buttonUpdateContent: document.getElementById('updateContentInFrameSubmit'),
        activeElement: {},
        allContentItemsOnCanvas: [],
        modalEditContent: document.getElementById('editContentModal'),
        mediumEditors: [],
    
        init: function() {

            publisher.subscribe('onBlockLoaded', function (block) {
                contenteditor.injectMediumCSS(block);
            });

            publisher.subscribe('onBeforeSave', function () {
                contenteditor.destroyAllEditors();
            });

            publisher.subscribe('onBeforePreview', function () {
                contenteditor.destroyAllEditors();
            });

            publisher.subscribe('onBeforeClone', function () {
                contenteditor.destroyAllEditors();
            });

            publisher.subscribe('onBeforeDelete', function () {
                contenteditor.destroyAllEditors();
            });

            publisher.subscribe('onClickContent', function (el) {
                contenteditor.contentClick(el);
            });
			
			//listen for the beforeSave event, removes outlines before saving
            $('body').on('beforeSave', function () {
				
				if( Object.keys( contenteditor.activeElement ).length > 0 ) {
                	contenteditor.activeElement.removeOutline();
            	}
				
			});
                        
        },
        
        
        /*
            Opens up the content editor
        */
        contentClick: function(el) {
                        
            //if we have an active element, make it unactive
            if( Object.keys(this.activeElement).length !== 0) {
                this.activeElement.activate();
            }

            //destroy all first
            //contenteditor.destroyAllEditors();
            
            //set the active element
            var activeElement = new canvasElement(el);
            activeElement.setParentBlock();
            contenteditor.activeElement = activeElement;
                        
            //unbind hover and click events and make this item active
            contenteditor.activeElement.setOpen();

            if( !el.hasAttribute('medium-editor-index') ) {

                var theWindow = el.ownerDocument.defaultView;
                var theDoc = el.ownerDocument;

                var editor = new MediumEditor(el, {
                    ownerDocument: theDoc,
                    contentWindow: theWindow,
                    buttonLabels: 'fontawesome',
                    toolbar: {
                        buttons: bConfig.mediumButtons
                    }

                });

                var $this = this;

                editor.subscribe('blur', function (data, editable) {

                    if( Object.keys($this.activeElement).length !== 0) {
                        $this.activeElement.activate();
                    }

                    //height adjustment on the containing block
                    $this.activeElement.parentBlock.heightAdjustment();

                    contenteditor.destroyAllEditors();

                });

                editor.subscribe('editableInput', function () {
                    siteBuilder.site.setPendingChanges(true);
                    publisher.publish('onBlockChange', contenteditor.activeElement.parentBlock, 'change');
                });

                editor.selectElement(el.firstChild);

                contenteditor.mediumEditors.push(editor);

            }
            
        },


        /*
            Destroys all active Medium editor
        */
        destroyAllEditors: function () {

            for( var x = 0; x < contenteditor.mediumEditors.length; x++ ) {
                contenteditor.mediumEditors[x].destroy();
                contenteditor.mediumEditors.splice(x, 1);
            }

        },


        /*
            injects the Medium Editor styling into the iframe's head
        */
        injectMediumCSS: function (block) {

            for( var x = 0; x < bConfig.mediumCssUrls.length; x++ ) {

                if ( block.hasExternalCSS(bConfig.mediumCssUrls[x]) ) continue;

                var cssLink = document.createElement('LINK');
                cssLink.setAttribute('rel', 'stylesheet');
                cssLink.setAttribute('href', bConfig.mediumCssUrls[x]);
                cssLink.setAttribute('type', 'text/css');
                cssLink.setAttribute('media', 'screen');
                cssLink.setAttribute('charset', 'utf-8');
                cssLink.setAttribute('id', 'mediumCss' + x);

                block.frameDocument.head.appendChild(cssLink);

            }

        }
        
    };
    
    contenteditor.init();

}());