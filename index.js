var methodNames = require('./methods');

function createCpsFunction(model, method) {
    return function() {
        var newArgs = Array.prototype.slice.call(arguments),
            callback = newArgs.pop();
        model[method].apply(model, newArgs).complete(callback);
    };
}

function addCps(model, cpsProperty) {

    Object.defineProperty(model, cpsProperty, {
        get: function() {
            if (!this.__cpsGet) {
                var _model = this;
                this.__cpsGet = {};

                methodNames.class.forEach(function(method) {
                    _model.__cpsGet[method] = createCpsFunction(_model, method);
                });
            }
            return this.__cpsGet;
        }
    });

    Object.defineProperty(model.DAO.prototype, cpsProperty, {
        get: function() {
            if (!this.__cpsGet) {
                var _model = this;
                this.__cpsGet = {};

                methodNames.instance.forEach(function(method) {
                    _model.__cpsGet[method] = createCpsFunction(_model, method);
                });
            }
            return this.__cpsGet;
        }
    });
}

module.exports = function(models, cpsProperty) {
    cpsProperty = cpsProperty || 'cps';
    models = models.DAO ? [models] : models;

    if (typeof models !== 'object' || !Object.keys(models).length) {
        throw new Error('Not a sequelize model');
    }

    for (var key in models) {
        if (!models[key].DAO) {
            throw new Error('Not a sequelize model');
        }
        addCps(models[key], cpsProperty);
    }
};