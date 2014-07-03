var test = require('grape'),
    pathToObjectUnderTest = '../index',
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

        model.cps[method](null, true, function(error, result) {
            t.equal(result, true, method + ' success ok');
        });

        model.cps[method]('bad', function(error) {
            t.equal(error, 'bad', method + ' error ok');
        });

    });
}

function instanceMethodTester(t, model) {
    t.plan(methodNames.instance.length * 2);

    methodNames.instance.forEach(function(method) {
        model.cps[method](null, true, function(error, result) {
            t.equal(result, true, method + ' success ok');
        });

        model.cps[method]('bad', function(error) {
            t.equal(error, 'bad', method + ' error ok');
        });
    });
}

test('sequelize-cps Exists', function (t) {
    t.plan(2);
    var sequelizeCps = getCleanTestObject();
    t.ok(sequelizeCps, 'Exists');
    t.equal(typeof sequelizeCps, 'function',  'sequelizeCps is a function');
});

test('multi model', function (t) {
    var sequelizeCps = getCleanTestObject(),
        modelNames = ['Account', 'User', 'Site', 'Page'],
        models = createModels(modelNames);

    sequelizeCps(models);

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
    var sequelizeCps = getCleanTestObject(),
        model = new SequelizeModel();

    sequelizeCps(model);

    test('testing classMethod success/error for single model ', function(t) {
        classMethodTester(t, model);
    });

    test('testing instanceMethod success/error for single model ', function(t) {
        instanceMethodTester(t, model.DAOInstance);
    });
});

test('works with a custom property name', function (t) {
    t.plan(4);
    var sequelizeCps = getCleanTestObject(),
        property = 'myProperty',
        model = new SequelizeModel();

    sequelizeCps(model, property);

    model[property].find(null, true, function(error, result) {
        t.equal(result, true, 'class success ok');
    });
    model[property].find('bad', function(error) {
        t.equal(error, 'bad', 'class error ok');
    });

    model.DAOInstance[property].save(null, true, function(error, result) {
        t.equal(result, true, 'instance success ok');
    });
    model.DAOInstance[property].save('bad', function(error) {
        t.equal(error, 'bad', 'instance error ok');
    });
});

test('errors with a invalid model', function (t) {
    t.plan(2);
    var sequelizeCps = getCleanTestObject();

    t.throws(function() {
        sequelizeCps({});
    }, 'got an exception on empty object');

    t.throws(function() {
        sequelizeCps({ my: 'property'});
    }, 'got an exception on non empty object');
});
