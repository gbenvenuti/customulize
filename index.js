var methodNames = require('./methods');

function addLazyCps(model, lazyProperty, createCustomFunction) {

    Object.defineProperty(model, lazyProperty, {
        get: function() {
            var instance = this;
            if (!this.__cpsGet) {
                var _model = this;
                this.__cpsGet = {};

                methodNames.class.forEach(function(method) {
                    _model.__cpsGet[method] = createCustomFunction(_model, method);
                });
            }
            return this.__cpsGet;
        }
    });

    Object.defineProperty(model.DAO.prototype, lazyProperty, {
        get: function() {
            var instance = this;
            if (!this.__cpsGet) {
                var _model = this;
                this.__cpsGet = {};

                methodNames.instance.forEach(function(method) {
                    _model.__cpsGet[method] = createCustomFunction(_model, method);
                });
            }
            return this.__cpsGet;
        }
    });
}

module.exports = function(propertyName, createCustomFunction){
    return function(models) {
        models = models.DAO ? [models] : models;

        if (typeof models !== 'object' || !Object.keys(models).length) {
            throw new Error('Not a sequelize model');
        }

        for (var key in models) {
            if (!models[key].DAO) {
                throw new Error('Not a sequelize model');
            }
            addLazyCps(models[key], propertyName, createCustomFunction);
        }
    };
}