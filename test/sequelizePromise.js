module.exports = function (callback) {
    this.callbacks = {};
    callback(this);
    return this;
};

module.exports.prototype.then = function(successCallback, errorCallback) {
    this.callbacks.success = successCallback;
    this.callbacks.error = errorCallback;
    return this;
};

module.exports.prototype.done = function(error, result) {
    var promise = this;

    process.nextTick(function() {
        if(error){
            promise.callbacks.error(error);
        } else {
            promise.callbacks.success(result);
        }
    });
};