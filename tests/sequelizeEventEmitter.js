module.exports = function (callback) {
    this.callbacks = {};
    callback(this);
    return this;
};

module.exports.prototype.success = function(callback) {
    this.callbacks.success = callback;
    return this;
};

module.exports.prototype.error = function(callback) {
    this.callbacks.error = callback;
    return this;
};

module.exports.prototype.complete = function(callback) {
    this.callbacks.complete = callback;
    return this;
};

module.exports.prototype.emit = function(type, data) {
    var emitter = this;

    process.nextTick(function() {
        if (emitter.callbacks[type]) {
            if (!Array.isArray(data)) {
                data = [data];
            }
            emitter.callbacks[type].apply(null, data);
        }
    });
};