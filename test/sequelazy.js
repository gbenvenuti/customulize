var customulize = require('../');

function createLazyFunction(model, method) {
    return function() {
        var query = model[method].apply(model, arguments);
        return query.complete.bind(query);
    };
}
module.exports = customulize('lazy', createLazyFunction);