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
    function SequelizeModel(modelName) {
        var model = this;
        var __modelName = modelName;
        this[instanceProperty] = function(){};

        methodNames.instance.forEach(function(method) {
            model[instanceProperty].prototype[method] = entityCreate();
        });

        this.DAOInstance = new this[instanceProperty]();
    }
    methodNames.class.forEach(function(method) {
        SequelizeModel.prototype[method] = entityCreate();
    });

    function define(modelName) {
        if (instanceProperty) {
            return new SequelizeModel(modelName);
        } else {
            function SequelizeModelV4() {
                var model = this;
                this.__modelName = modelName;
            }

            methodNames.instance.forEach((method) => {
                SequelizeModelV4.prototype[method] = entityCreate();
            });
            methodNames.class.forEach((method) => {
                SequelizeModelV4[method] = entityCreate();
            });

            return SequelizeModelV4;
        }
    }

    function createModels(names) {
        var models = {};
        for (var key in names) {
            models[names[key]] = define(key);
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

    function instanceMethodTester(t, instance) {
        t.plan(methodNames.instance.length * 2);

        methodNames.instance.forEach(function(method) {
            successTest(t, instance, method);
            errorTest(t, instance, method);
        });
    }

    test('sequelize-fake Exists', function (t) {
        t.plan(2);
        var customulize = getCleanTestObject();
        t.ok(customulize, 'Exists');
        t.equal(typeof customulize, 'function',  'customulize is a function');
    });

    test('multi model', function (t) {
        t.end();
        var customulize = getCleanTestObject(),
            modelNames = ['Account', 'User'],
            models = createModels(modelNames);

        customulize(propertyName, testFunction)(models);

        modelNames.forEach(function(modelName) {
            test('testing classMethod success/error for model ' + modelName, function(t) {
                classMethodTester(t, models[modelName]);
            });

            test('testing instanceMethod success/error for model ' + modelName, function(t) {
                if (instanceProperty) {
                    instanceMethodTester(t, models[modelName].DAOInstance);
                } else {
                    instanceMethodTester(t, new models[modelName]());
                }
            });
        });

    });

    test('single model', function (t) {
        t.end();
        var customulize = getCleanTestObject(),
            model = define('singleModel');

        customulize(propertyName, testFunction)(model);

        test('testing classMethod success/error for single model ', function(t) {
            classMethodTester(t, model);
        });

        test('testing instanceMethod success/error for single model ', function(t) {
            if (instanceProperty) {
                instanceMethodTester(t, model.DAOInstance);
            } else {
                instanceMethodTester(t, new model());
            }
        });
    });

    test('errors with a invalid model', function (t) {
        t.plan(3);

        var customulize = getCleanTestObject()(propertyName, testFunction);

        t.throws(function() {
            customulize({});
        }, 'got an exception on empty object');

        t.throws(function() {
            customulize({ my: 'property'});
        }, 'got an exception on non empty object');

        t.throws(function() {
            customulize(1);
        }, 'got an exception on non-object');
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

function runTestsSequelizeV4(test, propertyName, testFunction, successTest, errorTest){
    runTests(test, propertyName, testFunction, successTest, errorTest, promiseCreate);
}

module.exports = {
    sequelizeV1: runTestsSequelizeV1,
    sequelizeV2: runTestsSequelizeV2,
    sequelizeV3: runTestsSequelizeV3,
    sequelizeV4: runTestsSequelizeV4,
};
