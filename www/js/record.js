var Record = new Function();
Record.prototype = {
	version : "1.0",
	fileName : "",
	status : 0,
	app : null,
	isNew : false,
	record : function(str) {
		var me = this;
		this.status = 1;//record
		cordova.exec(function(value) {
			if (value) {
				var obj = eval("(" + value + ")");
				if (obj.success) {
					if (obj.name) {
						me.endRecord(obj.name);
						console.log("record:" + obj.name);
					} else {
						console.log("record");
					}
				}
			}
		}, function() {
		}, "Spee", "doRecord", []);
	},
	play : function(str) {
		var file = str || this.fileName;
		this.status = 2;//play
		var me = this;
		console.log("play:" + file);
		cordova.exec(function(value) {
			var obj = eval("(" + value + ")");
			if (obj.success) {
				me.endPlay(obj.name);
			}

		}, function() {
		}, "Spee", "doPlay", [ file ]);
	},
	read : function(str) {
		this.status = 3;
		var me = this;
		console.log("read:" + str);
		cordova.exec(function(value) {
			var obj = eval("(" + value + ")");
			if (obj.success) {
				me.endRead(obj.name);
			}
		}, function() {
		}, "Spee", "doRead", [ str ]);
	},
	endRecord : function(fileName) {
		this.status = 0;
		this.fileName = fileName;
		this.isNew = true;
		console.log(fileName);
		this.app.endRecord();
	},
	endPlay : function(fileName) {
		this.status = 0;
		console.log(fileName);
		this.app.endPlay();
	},
	endRead : function() {
		this.status = 0;
		this.app.endRead();
	}
};
