var methodNames = require('./methods');

function addCustomMethods(model, propertyName, createCustomFunction) {
    var privateGetKey = '__' + propertyName;

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
    } else if (model.Instance) {
        Object.defineProperty(model.Instance.prototype, propertyName, {
            get: function() {
                return getter.call(this, methodNames.instance);
            }
        });
    } else {
        Object.defineProperty(model.prototype, propertyName, {
            get: function() {
                return getter.call(this, methodNames.instance);
            }
        });
    }
}

module.exports = function(propertyName, createCustomFunction) {
    return function(models) {
        if (!~['object', 'function'].indexOf(typeof models)) {
            throw new Error('Not a sequelize model');
        }

        if (typeof models === 'object') {
            models = models.DAO || models.Instance ? [models] : models;
        } else {
            models = typeof models === 'function' ? [models] : models;
        }

        if ((typeof models === 'object' && !Object.keys(models).length) && typeof models !== 'function') {
            throw new Error('Not a sequelize model');
        }

        for (var key in models) {
            if (!models[key].DAO && !models[key].Instance && typeof models[key] !== 'function') {
                throw new Error('Not a sequelize model');
            }
            addCustomMethods(models[key], propertyName, createCustomFunction);
        }
    };
};
