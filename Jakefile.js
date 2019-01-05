/**
 * Created by mattijsnaus on 1/27/16.
 */
/* globals desc:false, task:true, fail:false, complete:false, jake:false, directory:false */
(function () {
    "use strict";

    var packageJson = require('./package.json');
    var semver = require('semver');
    var minifier = require('minifier');
    var concat = require('concat');
    var jshint = require('simplebuild-jshint');
    var shell = require('shelljs');

    var JSBUILD_DIR = 'public/src/js/build/';

    var lintFiles = [
        "Jakefile.js",
        "public/src/js/modules/*.js"
    ];

    var lintOptions = {
        bitwise: true,
        eqeqeq: true,
        forin: true,
        freeze: true,
        futurehostile: true,
        newcap: true,
        latedef: 'nofunc',
        noarg: true,
        nocomma: true,
        nonbsp: true,
        nonew: true,
        strict: true,
        undef: true,
        node: true,
        browser: true,
        loopfunc: true,
        laxcomma: true,
        '-W089': false,
        '-W055': false,
        '-W069': false
    };

    var lintGlobals = {
        define: false,
        alert: false,
        confirm: false,
        ace: false,
        $: false,
        jQuery: false
    };

    var requiredJS = [
        {
            files: ['public/src/js/vendor/jquery.min.js', 'public/src/js/vendor/jquery-ui.min.js', 'public/src/js/vendor/flat-ui-pro.min.js', 'public/src/js/vendor/chosen.min.js', 'public/src/js/vendor/jquery.zoomer.js', 'public/src/js/vendor/spectrum.js', 'public/src/js/vendor/summernote.min.js', 'public/src/js/vendor/ace/ace.js', 'public/src/js/build/builder.js'],
            output: "public/src/js/build/builder.min.js"
        },
        {
            files: ['public/src/js/vendor/jquery.min.js', 'public/src/js/vendor/jquery-ui.min.js', 'public/src/js/vendor/flat-ui-pro.min.js', 'public/src/js/vendor/jquery.zoomer.js', 'public/src/js/build/sites.js'],
            output: "public/src/js/build/sites.min.js"
        },
        {
            files: ['public/src/js/vendor/jquery.min.js', 'public/src/js/vendor/flat-ui-pro.min.js', 'public/src/js/vendor/chosen.min.js', 'public/src/js/vendor/jquery.zoomer.js', 'public/src/js/build/images.js'],
            output: "public/src/js/build/images.min.js"
        },
        {
            files: ['public/src/js/vendor/jquery.min.js', 'public/src/js/vendor/flat-ui-pro.min.js'],
            output: "public/src/js/build/login.min.js"
        },
        {
            files: ['public/src/js/vendor/jquery.min.js', 'public/src/js/vendor/flat-ui-pro.min.js', 'public/src/js/build/settings.js'],
            output: "public/src/js/build/settings.min.js"
        },
        {
            files: ['public/src/js/vendor/jquery.min.js', 'public/src/js/vendor/jquery.zoomer.js', 'public/src/js/vendor/flat-ui-pro.min.js', 'public/src/js/build/users.js'],
            output: "public/src/js/build/users.min.js"
        }
    ];


    //**** Main Jake tasks

    desc("The default build task");
    task("default", [ "nodeversion", "build" ], function () {

        console.log('Build OK');

    });

    desc("The actual build task");
    task("build", [ "linting", "minifyElementJS", "minifyElementCSS", "minifyMainCSS", "minifySkeletonCSS", "minifyBuilderCSS", "browserify" ], function () {

        console.log("Building SiteBuilder Lite");

    });


    //**** Supporting Jake tasks

    desc("Check Nodejs version");
    task("nodeversion", function () {

        console.log("Checking Nodejs version: .");

        var requiredVersion = packageJson.engines.node;
        var actualVersion = process.version;

        if( semver.neq(requiredVersion, actualVersion) ) {
            fail("Incorrect Node version; expected " + requiredVersion + " but found " + actualVersion);
        }

    });

    desc("Linting of JS files");
    task("linting", function () {

        process.stdout.write("Linting JS code: ");
        
        jshint.checkFiles({
            files: lintFiles,
            options: lintOptions,
            globals: lintGlobals
        }, complete, fail);

    }, { async: true });

    desc("Compile front-end modules");
    task("browserify", [ JSBUILD_DIR ], function () {

        console.log("Building Javascript code: .");

        shell.rm('-rf', JSBUILD_DIR + "*");

        var cmds = [
            "node node_modules/browserify/bin/cmd.js public/src/js/builder.js --debug -o " + JSBUILD_DIR + "builder.js",
            "node node_modules/browserify/bin/cmd.js public/src/js/sites.js --debug -o " + JSBUILD_DIR + "sites.js",
            "node node_modules/browserify/bin/cmd.js public/src/js/images.js --debug -o " + JSBUILD_DIR + "images.js",
            "node node_modules/browserify/bin/cmd.js public/src/js/settings.js --debug -o " + JSBUILD_DIR + "settings.js",
            "node node_modules/browserify/bin/cmd.js public/src/js/users.js --debug -o " + JSBUILD_DIR + "users.js",
        ];

        //sites.js
        jake.exec(
            cmds, 
            { interactive: true }, 
            function () {
                jake.Task['minifyMainJS'].invoke();
                complete();
            }
        );        

    }, { async: true });


    desc("Minify elements JS");
    task("minifyElementJS", function () {

        console.log("Minifying elements JS: .");

        minifier.minify(
            ['public/elements/js/vendor/jquery.min.js', 'public/elements/js/flat-ui-pro.min.js', 'public/elements/js/custom.js'],
            {output: 'public/elements/js/build/build.min.js'}
        );

    });

    desc("Concatenate and minify element CSS");
    task("minifyElementCSS", function () {

        console.log("Concatenating element CSS: .");

        concat([
                'public/elements/css/vendor/bootstrap.min.css',
                'public/elements/css/flat-ui-pro.min.css',
                'public/elements/css/style.css',
                'public/elements/css/font-awesome.css'
            ],
            'public/elements/css/build.css',
            function (error) {

                if( error ) {
                    console.log(error);
                } else {
                    console.log("Minifying element CSS: .");
                    minifier.minify('public/elements/css/build.css', { output: 'public/elements/css/build.css' });
                }

                complete();

            }
        );

    }, { async: true });

    desc("Concatenate and minify main css");
    task("minifyMainCSS", function () {

        console.log("Concatenate main CSS: .");

        concat([
                'public/src/css/vendor/bootstrap.min.css',
                'public/src/css/flat-ui-pro.css',
                'public/src/css/style.css',
                'public/src/css/login.css',
                'public/src/css/font-awesome.css'
            ],
            'public/src/css/build-main.css',
            function (error) {

                if( error ) {
                    console.log(error);
                } else {
                    console.log("Minifying main CSS: .");
                    minifier.minify('public/src/css/build-main.css', { output: 'public/src/css/build-main.min.css' });
                }

                complete();

            }
        );

    }, { async: true });

    desc("Concatenate and minify skeleton CSS");
    task("minifySkeletonCSS", function () {

        console.log("Concatenate skeleton CSS: .");

        concat([
                'public/elements/css/build.css',
                'public/elements/css/style-contact.css',
                'public/elements/css/style-content.css',
                'public/elements/css/style-dividers.css',
                'public/elements/css/style-footers.css',
                'public/elements/css/style-headers.css',
                'public/elements/css/style-portfolios.css',
                'public/elements/css/style-pricing.css',
                'public/elements/css/style-team.css',
                'public/elements/css/nivo-slider.css'
            ],
            'public/elements/css/skeleton.css',
            function (error) {
                
                if( error ) {
                    console.log(error);
                } else {
                    console.log("Minifying skeleton CSS: .");
                    minifier.minify('public/elements/css/skeleton.css', { output: 'public/elements/css/skeleton.css' });
                }

                complete();

            }
        );

    }, { async: true });

    desc("Concatenate and minify builder CSS");
    task("minifyBuilderCSS", function () {

        console.log("Concatenate builder CSS: .");

        concat([
                'public/src/css/builder.css',
                'public/src/css/spectrum.css',
                'public/src/css/chosen.css',
                'public/src/css/summernote.css'
            ],
            'public/src/css/build-builder.css',
            function (error) {
                
                if( error ) {
                    console.log(error);
                } else {
                    console.log("Minifying builder CSS: .");
                    minifier.minify('public/src/css/build-builder.css', { output: 'public/src/css/build-builder.min.css' });
                }

                complete();

            }
        );

    }, { async: true });

    desc("Concatenate and minify builder JS");
    task("minifyMainJS", function (page) {

        console.log("Minifying builder JS: .");

        for( var x = 0; x < requiredJS.length; x++ ) {
            minifier.minify(requiredJS[x].files, {output: requiredJS[x].output});
        }

    });

    desc("Runs a local http server");
    task("serve", function () {

        console.log("Serve block locally:");

        jake.exec("node_modules/.bin/http-server elements", { interactive: true }, complete);

    }, { async: true });

    directory(JSBUILD_DIR);

}());