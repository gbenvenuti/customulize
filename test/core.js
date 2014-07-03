var pathToObjectUnderTest = '../index',
    methodNames = require('../methods'),
    SequelizeEventEmitter = require('./sequelizeEventEmitter');

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

function runTests(test, propertyName, testFunction, successTest, errorTest){

    function SequelizeModel() {
        var model = this;
        this.DAO = function(){};

        methodNames.instance.forEach(function(method) {
            model.DAO.prototype[method] = emitterCreate();
        });

        this.DAOInstance = new this.DAO();
    }
    methodNames.class.forEach(function(method) {
        SequelizeModel.prototype[method] = emitterCreate();
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

    test('multi model', function (t) {
        var customulize = getCleanTestObject(),
            modelNames = ['Account', 'User', 'Site', 'Page'],
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

    test('single model', function (t) {
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
            sequelizeFake({});
        }, 'got an exception on empty object');

        t.throws(function() {
            sequelizeFake({ my: 'property'});
        }, 'got an exception on non empty object');
    });
}

module.exports = runTests;
