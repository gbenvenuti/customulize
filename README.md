#customulize

Add arbitrary custom functions to sequelize models

##Installation

    npm install customulize

##usage

    var customulize = require('customulize');

    var sequelizeCps = customulize('cps', function(model, method) {
        return function() {
            var newArgs = Array.prototype.slice.call(arguments),
                callback = newArgs.pop();
            model[method].apply(model, newArgs).complete(callback);
        };
    });

    // define your sequelize models
    var models = {
        Account: require('./account')
    };

    // call function over them
    sequelizeCps(models);

    // now you can call methods via cps
    models.Account.cps.find({ where: { id: 1} }, function(error, account) {
        if (error) {
            // error logic
        }
        account.name = 'John';
        account.cps.save(function(error, account) {

        });
    });

##kgo

customulize allows you to create a lazy calling pattern, eg:

    var sequelazy = customulize('lazy', function(model, method) {
        return function() {
            var query = model[method].apply(model, arguments);
            return query.complete.bind(query);
        };
    });

When using [kgo](https://www.npmjs.org/package/kgo) this is especially convenient:

    kgo
    ('account', Account.lazy.find({where: {id: 1}}))
    ('update', ['account'], function(account, done) {
        account.name = 'John';
        account.cps.save(done);
    })
    // etc, etc, etc

Pull requests welcome with passing tests.
