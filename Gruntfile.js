module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        karma: {
            options: {
                basePath: '',
                frameworks: ['jasmine', 'requirejs'],

                files: [
                    {
                        pattern: 'app/javascripts/**/*.js',
                        included: false
                    }, {
                        pattern: 'test/spec/**/*Spec.js',
                        included: false
                    }, {
                        pattern: 'app/external/**/*.js',
                        included: false
                    }, {
                        pattern: 'test/**/*-mock.js',
                        included: false
                    }, {
                        pattern: 'app/templates/**/*.html',
                        included: false
                    },

                    'test/spec/test.config.js'
                ],

                exclude: [
                    'app/javascripts/**/*.main.js'
                ],

                preprocessors: {
                    'app/templates/**/*.html': ['ng-html2js']
                },

                ngHtml2JsPreprocessor: {
                    stripPrefix: 'app',
                    prependPrefix: '/assets'
                }
            },
            dist: {
                singleRun: true,
                browsers: ['PhantomJS'],

                preprocessors: {
                    'app/javascripts/**/*.js': ['coverage']
                },

                reporters: ['dots', 'junit', 'coverage'],

                coverageReporter: {
                    type : 'cobertura',
                    dir: 'log/coverage/'
                },

                junitReporter: {
                    outputFile: 'log/test-results.xml'
                }
            },
            dev: {
                autoWatch: true,
                browsers: ['Chrome']
            }
        }
    });

    grunt.registerTask('default', ['karma:dev']);
};
