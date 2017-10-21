var test = require('tape'),
    propertyName = 'fakeProp',
    runTests = require('./runTests');

function successTestV1(t, model, method) {
    model[propertyName][method](null, true).complete(function(error, result) {
        t.equal(result, true, method + ' success ok');
    });
}

function errorTestV1(t, model, method) {
    model[propertyName][method]('bad').complete(function(error) {
        t.equal(error, 'bad', method + ' error ok');
    });
}

function successTestV2(t, model, method) {
    model[propertyName][method](null, true).then(
        function(result) {
            t.equal(result, true, method + ' success ok');
        },
        function() {
            t.fail(method + ' errored instead of succeeding');
        }
    );
}

function errorTestV2(t, model, method) {
    model[propertyName][method]('bad').then(
        function() {
            t.fail(method + ' succeeded instead of failing');
        },
        function(error) {
            t.equal(error, 'bad', method + ' error ok');
        }
    );
}

function createTestFunction(model, method) {
    return function() {
        return model[method].apply(model, arguments);
    };
}

runTests.sequelizeV1(test, propertyName, createTestFunction, successTestV1, errorTestV1);
runTests.sequelizeV2(test, propertyName, createTestFunction, successTestV2, errorTestV2);
runTests.sequelizeV3(test, propertyName, createTestFunction, successTestV2, errorTestV2);
runTests.sequelizeV4(test, propertyName, createTestFunction, successTestV2, errorTestV2);
