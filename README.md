This repository contains code and tests corresponding to our blog post about [Testing AngularJS in a RequireJS environment][blog]. For completeness the full post is included below.

---

Previously [I wrote about our RequireJS and AngularJS environment][prev]. There I promised to describe our test setup for unit testing using Karma and Jasmine.

Our setup for testing has gone through multiple iterations, just like our application setup, but this post documents an [example project][repo] which follows our current state.

Before I dive into the details of the setup, I want to touch on a few important points about unit testing, since that is the kind of testing described in this post. A unit test is a self contained test of a single unit. In most cases a unit can be a function or a class. In AngularJS units would be directives, filters, controllers, and services.

The purpose of the unit test is to help document and enforce the behavior and output of the unit given specific input. This serves both as a design aid, by helping you think in more self-contained building blocks, and as a help catching regressions as new features are added. A good unit test will give you piece of mind as you refactor or add to a component, since you have certainty that the output is unchanged for the expected input. This helps minimize the risk of existing functionality breaking.

[[MORE]]

One very important aspect of our setup is that each of our RequireJS modules defines one AngularJS component, and that component is defined using the fully qualified array syntax.

```
define(function () {

    return ['Dependency1', 'Dependency2', ... , function (Dependency1, Dependency2, ...) {
        ...
    }];
});
```

Because we return arrays from our RequireJS modules, we cannot simply run/instantiate our AngularJS components, but rely heavily on the `$injector` service from ngMock as shown below. Personally, I feel this is a wise choice, since the `$injector` is how components are created when the AngularJS application is run.

Our test setup is based around Karma and run with Grunt, and we have two configurations: a development configuration for use during development, and a CI configuration for running on our CI service. Like all Karma tests, it starts with the configuration.

## Karma Configuration

Before diving into the configuration, it is worth just describing the layout of our app.

- `app`
   - `external`
   - `javascripts`
   - `stylesheets`
   - `templates`
- `Gruntfile.js`
- `test`
    - `mock`
    - `spec`
        - `test.config.js`
        - and folders corresponding to structure in `/app/javascripts`

The `javascripts` folder under `/app` contains the JavaScript files that make up the application. In our real app we have subfolders for components that correspond to different functionality, e.g. `javascripts/user` for user related services, controllers, and so on. For the example setup I have removed this additional layer for the sake of simplicity. The `stylesheets` and `templates` should be self-explanatory, and the `external` folder contains local copies of any external JavaScript libraries we depend on. Understanding this folder structure makes the `grunt-karma` plugin configuration easier to understand. The configuration below is almost exactly what our real configuration is, which shows how close the example project is in structure to our real app.

First we set the base path to the root of the repo, and include the Jasmine and RequireJS frameworks.

    karma: {
      options: {
        basePath: '',
        frameworks: ['jasmine', 'requirejs'],

Then we include all the files we need. This means all the JavaScript files, the spec files, any external libraries, the mocks, and all our templates. We set them to not be included by default, since we are going to be using RequireJS to include the files as needed. We also exclude the `*.main.js` files for each of the apps since we are not running the apps.

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
          'app/javascripts/**/*main.js'
        ],

Finally we setup the pre-processor for the templates that are used for some of our directives. This setup means that a template `$PROJECT_ROOT/app/templates/example.html` becomes available as an AngularJS module with the name `/assets/templates/example.html`.

        preprocessors: {
          'app/templates/**/*.html': ['ng-html2js']
        },

         ngHtml2JsPreprocessor: {
          stripPrefix: 'app',
          prependPrefix: '/assets'
        }
       },

After setting the options for the global karma setup, we configure the CI and development configurations.

The CI (or _dist_) configuration uses PhantomJS for headless testing. It runs once (single run), and outputs the coverage data from the coverage reporter as well as the JUnit XML which is used to published the test results on our CI server.

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

The development configuration has auto watch set, so we can just have it running in the background while making changes, and is set to use Chrome.

      },
      dev: {
        autoWatch: true,
        browsers: ['Chrome']
      }
    },


Now that we have configured our test it makes sense to look at the `test.config.js` file which configures RequireJS and starts the test.

    var tests = Object.keys(window.__karma__.files).filter(function (file) {
        return (/Spec\.js$/).test(file);
    });

    requirejs.config({
        paths: {
            // External libraries
            'angular': '/base/app/external/angular/1.2.3/angular',
            // ...
            'angular-ui.utils': '/base/app/external/angular-ui-utils/0.0.4/angular-ui-utils',
            'angularMocks': '/base/app/external/angular/1.2.3/angular-mocks',

            'templates': '../templates'
        },

        baseUrl: '/base/app/javascripts',

        shim: {
            'angular': {'exports': 'angular'},
            // ...
            'angular-ui.utils': {deps: ['angular']},
            'angularMocks': {deps: ['angular'], 'exports': 'angular.mock'},

            // Each template to be included in tests should be included below.
            ‘templates/status-chart.html': {deps: ['angular']}
        },

        // Ask Require.js to load these files (all our tests).
        deps: tests,

        // Set test to start run once Require.js is done.
        callback: window.__karma__.start
    });

The configuration looks very similar to the global config from the [previous post][prev], but there is one thing that is very important. Each template that is used by the directives that are tested, should be defined in the `shim` part of the config. Since they are not RequireJS modules the dependency on AngularJS has to be explicitly injected.

From the configuration we can create a test which pulls in the component under test, as well as any other dependencies.

For the actual tests there are four types we are interested in: directives, filters, controllers, and services (which includes factories and providers).

## Directives

To allow writing this fictional test we imagine a status chart directive which takes an object and for each property in the object it creates a span element with a status attribute containing the property key, and the content of the span is set to the value of the property. This directive could allow usage like this.

    <div rad-status-chart="{a: 1, b: 2, ...}”></div>

Which would expand to

    <div rad-status-chart="{a: 1, b: 2, ...}">
        <span class=“status-a">1</span>
        <span class=“status-b">2</span>
    </div>

To write the test for the directive, we start by adding the RequireJS module definition, including the dependencies of the component.

    define([
        'angular',
        'angularMocks',
        'status-chart.directive',

        'templates/status-chart.html'
    ], function (angular, mocks, statusChartDirective) {

It is worth digressing a bit to dwell on the template inclusion. We use the `ng-html2js` pre-processor to create AngularJS modules for our templates. Because these modules are not RequireJS formatted we set them up as shims in `test.config.js`. One thing that the pre-processor does is create JavaScript files for each template, and we can include these as RequireJS dependencies because of our configuration. In our fictional example here the `ng-html2js` pre-processor creates a temporary file `status-chart.directive.html.js` while it is running the test. This file can be included, and the inclusion adds a module with the path to the template as the name of the module.

In your `describe` block we declare any spies for any dependencies for the directive we are going to mock.

    var formatClassFilter = jasmine.createSpy('formatClass');

Then setup the AngularJS ngMock injector to initialize any dependencies. In this case let us imagine that the status chart directive depends on a `formatInput` filter

```
beforeEach(function () {
    mocks.module('/assets/templates/status-chart.html');
    mocks.module(function ($compileProvider, $filterProvider) {
        $compileProvider.directive('radStatusChart', statusChartDirective);
        $filterProvider.register('formatInput', function () {
            return formatInputFilter;
        });
    });
});
```

Then you start adding tests for each functionality of your directive. Compile the element, and run the `$digest` to evaluate any expressions in the resulting DOM object.

```
it('should create the internal elements', mocks.inject(function ($compile, $rootScope) {
    var indices = ['a', 'b', 'c', 'd'];
    var status = {
        a: 105,
        b: 430,
        c: 105,
        d: 70
    };
    var total = 105 + 430 + 105 + 70;
    var formattedClasses = {
        a: 'status-a',
        b: 'status-b',
        c: 'status-c',
        d: 'status-d'
    };

    formatInputFilter.andCallFake(function (input) { return formattedClasses[input]; });

    // Compile element and run $digest.
    $rootScope.status = status;
    var element = $compile('<div rad-status-chart="status"></div>')($rootScope);
    $rootScope.$digest();
```

The resulting element can be inspected to verify the test worked.

```
    var spanChildren = element.find('span');
    expect(spanChildren.length).toBe(4);

    // Check each child (e.g. height and texts).
    angular.forEach(spanChildren, function (value, index) {
        var key = indices[index];
        var node = angular.element(value);
        expect(node.text()).toBe(status[key].toString());
        expect(node.attr('class')).toContain(formattedClasses[key]);
    });
}));
```

It is possible check on `node.hasClass(formattedClasses[key])`, but it will not provide much value in case of failure, but write “expected false to be truthy” or similar. The format we chose will actually output some useful names in case of failure. Also, for some reason I found that `hasClass` returned false when a node had multiple classes.

Usually it makes sense to start testing the expected use cases. This ensures that roughly 80% of user needs are covered. Then you can start looking at the edge cases. These are the things that sometimes are forgotten in development because "no one runs into them". Cases where input is malformed or unexpected, where execution happens in the wrong order, etc. For the directive in this section, edge cases might be providing an empty object or `undefined` as the input, and similar.

For components that change at certain points, testing on either sides of (and if possible, at) those points makes a lot of sense.

## Filters

For continuing our tests, we can imagine the `formatInput` filter from before. The test for filters is essential, but very simple.

```
define([
    'angular',
    'angularMocks',
    'format-input.filter'
], function (angular, mocks, formatInputFilter) {
    'use strict';

    describe('formatNumber', function () {

        beforeEach(mocks.module(function ($filterProvider) {
            $filterProvider.register('formatInput', formatInputFilter);
        }));
```

Again, we input AngularJS and the AngularJS mocks module. We use `mocks.module` to inject the `$filterProvider` which allows registering a filter for the tests, and register our filter as `formatInput`. We could also have created an AngularJS module and used the `.filter(...)` syntax like we used the `.directive(...) syntax above`. Either way should work equally well.

Then we can start adding tests.

```
it('should format a string into "span-<string>"', mocks.inject(function ($filter) {
    expect($filter('formatInput')('a')).toEqual('span-a');
}));

```

Just like directives you should take care to exercise the parts of the code that are important to you. Usually this is the parts that are hard to understand, or would break other components if they behave differently from the initial implementation.

## Controllers

Controllers often do setup when instantiated. For this testing it makes sense to have a function to create the controller, which can be invoked from the tests themselves.

```
beforeEach(mocks.inject(function ($injector) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    var $controller = $injector.get('$controller');
    createSampleController = function () {
        return $controller(sampleController, {'$scope': $rootScope, 'Sample': SampleSpy});
    };
}));
```

Since the sample controller uses the sample service, we use `$q` to provide promise functionality. This also means we need the `$rootScope` to ensure that any promises we do use are resolved.

Since the sample controller start by invoking the `getSamples` method on the sample service, our first test sets up the spy object for the service to return a list of "samples". After running the `$digest` we can check that the samples were delivered onto the scope.

```
it('should load samples on creation', function () {
    SampleSpy.getSamples.andReturn($q.when(samples));
    var controller = createSampleController();
    $rootScope.$digest();
    expect($rootScope.samples).toEqual(samples);
});
```

## Services (etc...)

For services it usually makes sense to test the methods they provide. Many services rely on the `$http` service, and [the `$httpBackend` service from ngMock][httpBackend] is very useful to ensure the code gets exercised.

The service under test can be instantiated using the `$injector` service from the ngMock module. Services should be instantiated with `$injector.instantiate` while factories should be invoked using `$injector.invoke` to run the factory function. In both cases spy objects can be set as locals for the dependencies.

The specific testing of the Sample service created for this post is included in the repository, and can be studied if necessary.

I hope this introduction provided some value and help other people who integrate AngularJS and RequireJS, and who care about software quality and peace of mind.

[blog]: http://engineering.radius.com/post/77677879234/testing-angularjs-in-a-requirejs-environment
[repo]: https://github.com/RadiusIntelligence/require-and-angular-test
[prev]: http://engineering.radius.com/post/71425827156/requirejs-with-angularjs-an-example
[httpBackend]: http://docs.angularjs.org/api/ngMock/service/$httpBackend
