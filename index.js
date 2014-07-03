var methodNames = require('./methods');

function addCustomMethods(model, propertyName, createCustomFunction) {

    function getter(methodNames) {
        var modelInstance = this;
        if (!this[privateGetKey]) {
            this[privateGetKey] = {};

            methodNames.forEach(function(method) {
                modelInstance[privateGetKey][method] = createCustomFunction(modelInstance, method);
            });
        }
        return this[privateGetKey];
    }

    var privateGetKey = '__' + propertyName;

    Object.defineProperty(model, propertyName, {
        get: function() {
            return getter.call(this, methodNames.class);
        }
    });

    Object.defineProperty(model.DAO.prototype, propertyName, {
        get: function() {
            return getter.call(this, methodNames.instance);
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
};