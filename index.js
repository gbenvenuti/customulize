var methodNames = require('./methods');

function addCustomMethods(model, lazyProperty, createCustomFunction) {

    var privateGetKey = '__' + lazyProperty;

    Object.defineProperty(model, lazyProperty, {
        get: function() {
            var modelInstance = this;
            if (!this[privateGetKey]) {
                this[privateGetKey] = {};

                methodNames.class.forEach(function(method) {
                    modelInstance[privateGetKey][method] = createCustomFunction(modelInstance, method);
                });
            }
            return this[privateGetKey];
        }
    });

    Object.defineProperty(model.DAO.prototype, lazyProperty, {
        get: function() {
            var modelInstance = this;
            if (!this[privateGetKey]) {
                this[privateGetKey] = {};

                methodNames.instance.forEach(function(method) {
                    modelInstance[privateGetKey][method] = createCustomFunction(modelInstance, method);
                });
            }
            return this[privateGetKey];
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
            addCustomMethods(models[key], propertyName, createCustomFunction);
        }
    };
}