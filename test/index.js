var test = require('grape'),
    propertyName = 'fakeProp',
    runTests = require('./runTests');

function successTest(t, model, method) {
    model[propertyName][method](null, true).complete(function(error, result) {
        t.equal(result, true, method + ' success ok');
    });
}

function errorTest(t, model, method) {
    model[propertyName][method]('bad').complete(function(error) {
        t.equal(error, 'bad', method + ' error ok');
    });
}

function createTestFunction(model, method) {
    return function() {
        return model[method].apply(model, arguments);
    };
}

runTests(test, propertyName, createTestFunction, successTest, errorTest);