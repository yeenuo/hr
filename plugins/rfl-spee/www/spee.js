//------------------------------------------------------------------------------
// object that we're exporting
//------------------------------------------------------------------------------

// "com.test.plugin.PluginTest"指定的是此插件的ID
cordova.define("com.renxd.plugin.Spee", function (require, exports, module) {

    var exec = require('cordova/exec');

    function speeRfl() {
    }

    speeRfl.prototype = {

        test1: function (params, successCallback, errorCallback) {
            // 第三个参数是插件的名称，必须与config.xml文件中的feature.name保持一致
            exec(successCallback, errorCallback, "Spee", "doRecord", [params]);
        },
        test2: function (params, successCallback, errorCallback) {
            exec(successCallback, errorCallback, "Spee", "doPlay", [params]);
        }
    }

    module.exports = new speeRfl();
})