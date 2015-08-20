var pathToObjectUnderTest = '../index',
    methodNames = require('../methods'),
    SequelizeEventEmitter = require('./sequelizeEventEmitter'),
    SequelizePromise = require('./sequelizePromise');

function getCleanTestObject(){
    delete require.cache[require.resolve(pathToObjectUnderTest)];
    var objectUnderTest = require(pathToObjectUnderTest);
    return objectUnderTest;
}

function emitterCreate() {
    return function() {
        var newArgs = Array.prototype.slice.call(arguments);
        return new SequelizeEventEmitter(function(emitter) {
            return emitter.emit('complete', newArgs);
        });
    };
}

function promiseCreate() {
    return function() {
        var newArgs = Array.prototype.slice.call(arguments);
        return new SequelizePromise(function(promise) {
            return promise.done.apply(promise, newArgs);
        });
    };
}

function runTests(test, propertyName, testFunction, successTest, errorTest, entityCreate, instanceProperty){
    function SequelizeModel() {
        var model = this;
        this[instanceProperty] = function(){};

        methodNames.instance.forEach(function(method) {
            model[instanceProperty].prototype[method] = entityCreate();
        });

        this.DAOInstance = new this[instanceProperty]();
    }
    methodNames.class.forEach(function(method) {
        SequelizeModel.prototype[method] = entityCreate();
    });

    function createModels(names) {
        var models = {};
        for (var key in names) {
            models[names[key]] = new SequelizeModel();
        }
        return models;
    }

    function classMethodTester(t, model) {
        t.plan(methodNames.class.length * 2);

        methodNames.class.forEach(function(method) {
            successTest(t, model, method);
            errorTest(t, model, method);
        });
    }

    function instanceMethodTester(t, model) {
        t.plan(methodNames.instance.length * 2);

        methodNames.instance.forEach(function(method) {
            successTest(t, model, method);
            errorTest(t, model, method);
        });
    }

    test('sequelize-fake Exists', function (t) {
        t.plan(2);
        var customulize = getCleanTestObject();
        t.ok(customulize, 'Exists');
        t.equal(typeof customulize, 'function',  'customulize is a function');
    });

    test('multi model', function () {
        var customulize = getCleanTestObject(),
            modelNames = ['Account', 'User'],
            models = createModels(modelNames);

        customulize(propertyName, testFunction)(models);

        modelNames.forEach(function(modelName) {
            test('testing classMethod success/error for model ' + modelName, function(t) {
                classMethodTester(t, models[modelName]);
            });

            test('testing instanceMethod success/error for model ' + modelName, function(t) {
                instanceMethodTester(t, models[modelName].DAOInstance);
            });
        });

    });

    test('single model', function () {
        var customulize = getCleanTestObject(),
            model = new SequelizeModel();

        customulize(propertyName, testFunction)(model);

        test('testing classMethod success/error for single model ', function(t) {
            classMethodTester(t, model);
        });

        test('testing instanceMethod success/error for single model ', function(t) {
            instanceMethodTester(t, model.DAOInstance);
        });
    });

    test('errors with a invalid model', function (t) {
        t.plan(2);

        var customulize = getCleanTestObject()(propertyName, testFunction);

        t.throws(function() {
            customulize({});
        }, 'got an exception on empty object');

        t.throws(function() {
            customulize({ my: 'property'});
        }, 'got an exception on non empty object');
    });
}

function runTestsSequelizeV1(test, propertyName, testFunction, successTest, errorTest){
    runTests(test, propertyName, testFunction, successTest, errorTest, emitterCreate, 'DAO');
}

function runTestsSequelizeV2(test, propertyName, testFunction, successTest, errorTest){
    runTests(test, propertyName, testFunction, successTest, errorTest, promiseCreate, 'DAO');
}

function runTestsSequelizeV3(test, propertyName, testFunction, successTest, errorTest){
    runTests(test, propertyName, testFunction, successTest, errorTest, promiseCreate, 'Instance');
}

module.exports = {
    sequelizeV1: runTestsSequelizeV1,
    sequelizeV2: runTestsSequelizeV2,
    sequelizeV3: runTestsSequelizeV3
};
