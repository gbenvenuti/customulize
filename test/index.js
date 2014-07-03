var test = require('grape'),
    pathToObjectUnderTest = './sequelazy',
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

        model.lazy[method](null, true)(function(error, result) {
            t.equal(result, true, method + ' success ok');
        });

        model.lazy[method]('bad')(function(error) {
            t.equal(error, 'bad', method + ' error ok');
        });

    });
}

function instanceMethodTester(t, model) {
    t.plan(methodNames.instance.length * 2);

    methodNames.instance.forEach(function(method) {
        model.lazy[method](null, true)(function(error, result) {
            t.equal(result, true, method + ' success ok');
        });

        model.lazy[method]('bad')(function(error) {
            t.equal(error, 'bad', method + ' error ok');
        });
    });
}

test('sequelize-lazy Exists', function (t) {
    t.plan(2);
    var sequelizeLazy = getCleanTestObject();
    t.ok(sequelizeLazy, 'Exists');
    t.equal(typeof sequelizeLazy, 'function',  'sequelizeLazy is a function');
});

test('multi model', function (t) {
    var sequelizeLazy = getCleanTestObject(),
        modelNames = ['Account', 'User', 'Site', 'Page'],
        models = createModels(modelNames);

    sequelizeLazy(models);

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
    var sequelizeLazy = getCleanTestObject(),
        model = new SequelizeModel();

    sequelizeLazy(model);

    test('testing classMethod success/error for single model ', function(t) {
        classMethodTester(t, model);
    });

    test('testing instanceMethod success/error for single model ', function(t) {
        instanceMethodTester(t, model.DAOInstance);
    });
});

test('errors with a invalid model', function (t) {
    t.plan(2);
    var sequelizeLazy = getCleanTestObject();

    t.throws(function() {
        sequelizeLazy({});
    }, 'got an exception on empty object');

    t.throws(function() {
        sequelizeLazy({ my: 'property'});
    }, 'got an exception on non empty object');
});
