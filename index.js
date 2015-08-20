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


    if(model.DAO) {
        Object.defineProperty(model.DAO.prototype, propertyName, {
            get: function() {
                return getter.call(this, methodNames.instance);
            }
        });
    } else {
        Object.defineProperty(model.Instance.prototype, propertyName, {
            get: function() {
                return getter.call(this, methodNames.instance);
            }
        });
    }
}

module.exports = function(propertyName, createCustomFunction){
    return function(models) {
        models = models.DAO || models.Instance ? [models] : models;

        if (typeof models !== 'object' || !Object.keys(models).length) {
            throw new Error('Not a sequelize model');
        }

        for (var key in models) {
            if (!models[key].DAO && !models[key].Instance) {
                throw new Error('Not a sequelize model');
            }
            addCustomMethods(models[key], propertyName, createCustomFunction);
        }
    };
};