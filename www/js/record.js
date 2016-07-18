var Record = new Function();
Record.prototype = {
    version : "1.0",
    fileName:"",
    record : function(str) {
        console.log("record");
        alert(str);
	  cordova.exec(function(){}, function(){}, "Spee", "doRecord", []);
    },
    play : function(str) {
        var file = str||this.fileName;
        console.log(file);
         cordova.exec(function(){}, function(){}, "Spee", "doPlay", [file]);
    },
    endRecord : function(fileName) {
        this.fileName = fileName;
        console.log(fileName);
    }
    
};
