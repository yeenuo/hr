/*!
 * wk - controllers/wk.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */
var excel = require("../lib/excel.js");
var nodemailer = require("nodemailer");
var config = require('../config');
var db = require('../db');
var dbm = require('../dbm');
var crypto = require('crypto');
var url = require('url');
var fs = require('fs');
exports.app = function (req, res, next) {
   // console.log("app");
    res.redirect('/www/index.html');
};

exports.data = function (req, res, next) {
    console.log(req.files);  
    var option = req.body.option;
    if (option == "s")//添加
    {
        var data = req.body;
        data.table = "H_" + data.table;
        var func = function (rtn) {
            console.log(rtn);
            if (rtn.affectedRows == 1) {
                res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
                if (parseInt(rtn.insertId) > 0) {
                    res.write("{success:true,id:" + rtn.insertId + ",option:'a'}");
                }
                else {
                    res.write("{success:true,option:'u'}");
                }
                res.end();
            }
        };
        if (data.id) {
            db.u(req.body, func);
        }
        else {
            db.i(req.body, func);
        }

    } 
	
	else  if (option == "o")//上传文件
	{
		if (req.files && req.files.spx != 'undifined') {  
        var temp_path = req.files.spx.path;  
        if (temp_path) {
				var newPath =  "./www/uploadFiles/rnf.spx";
			  if(req.body.fileName)
			{
			     newPath =  './www/uploadFiles/'+req.body.fileName+".spx";
			}
		
				fs.rename(temp_path,newPath, function(err){
						 if(err){
						  throw err;
						 }
						    res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
                res.write("{success:true,name:\""+ temp_path+ "\"}");
				res.end();
					});

		
        }  
    }  
	}
	
	else {
		 var user = req.body.user;
        db.q("SELECT ID as id,Title as title,Lat as lat,Lng as lng,Info as info,Point as point,Voice as voice,Status as status,Type as type,USER as user FROM REN.H_" + req.body.model.toUpperCase() , [], function (datas) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write(JSON.stringify(datas));
            res.end();
        });
    }

};

exports.list = function (req, res, next) {

    var sql = "select * from REN." + req.body.model.toUpperCase();

    db.q(sql, [], function (datas) {
        console.log(datas);
        res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
        res.write(JSON.stringify(datas));
        res.end();
    });
};

exports.mail = function (obj) {
    var transport = nodemailer.createTransport('smtps://' + config.mail.user + ':' + config.mail.pass + '@' + config.mail.host);
    transport.sendMail({
            from: obj.from,
            to: obj.to,
            subject: obj.subject,
            generateTextFromHTML: true,
            html: obj.html
        },
        function (error, response) {
            if (error) {
                console.log(error);
            } else {//发送成功
                //console.log("Message sent: " + response.message);
                if (obj.func) {
                    obj.func();
                }
            }
            transport.close();
        });
};


exports.view = function (req, res, next) {
    res.redirect('/');
};

function rtnInfo(res, info) {
    res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
    res.write(info);
    res.end();
}




exports.pwd = function (req, res, next) {
    var me = this;
    var data = req.body;
    var option = data.option;
    if (option == "c")//修改密码
    {
        var sql = "SELECT ID,EMAIL email FROM REN.T_USER WHERE ID =? and PASSWORD = ?"
        var pwd = crypt(data.password);
        var newPwd = crypt(data.newpassword);
        var id = req.session.user;
        console.log(sql);
        console.log(id);
        console.log(pwd);//原有密码
        console.log(newPwd);//原有密码
        var params = [id, pwd];
        db.q(sql, params, function (rows) {
            var rtn = "{success:false}"
            if (rows.length > 0)//有数据
            {
                var email = rows[0].email;
                var data = {};
                data.table = "`WK`.`T_USER`";
                data.id = id;
                data.password = newPwd;
                console.log(data.password)
                db.u(data, function (rtndata) {
                    if (rtndata.affectedRows == 1) {
                        console.log("success")
                        rtn = "{success:true}"
                        console.log(rtn)
                        var obj = {};
                        obj.subject = "修改密码";
                        obj.html = "密码已修改";
                        obj.from = "天時勤務";
                        obj.to = email;
                        exports.mail(obj);

                        res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
                        res.write(rtn);
                        res.end();
                    }
                });
            }
            else {
                rtn = "{success:false,info:'pwd'}"
                console.log(rtn)
                res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
                res.write(rtn);
                res.end();
            }
        });
    }
    else//重置密码
    {

        var sql = "SELECT u.ID id,email,no FROM REN.T_USER u inner join REN.T_EMPLOYEE e on u.employee = e.id WHERE e.NO =? and EMAIL = ?"
        console.log(sql)
        console.log(data.name)
        console.log(data.email)
        var params = [data.name, data.email];
        db.q(sql, params, function (rows) {
            if (rows.length > 0) {
                //重置密码
                var qdata = JSON.parse(JSON.stringify(rows))[0];
                var pwd = qdata.no + "123";//重置密码
                var id = qdata.id;//UserId
                var data = {};
                data.table = "`WK`.`T_USER`";
                data.id = qdata.id;
                data.password = crypt(pwd);
                console.log(data.password)
                db.u(data, function (rtndata) {
                    if (rtndata.affectedRows == 1)//更新成功
                    {
                        var obj = {};
                        obj.subject = "重置密码";
                        obj.html = "密码已重置为" + pwd + "";
                        obj.from = "天時勤務";
                        obj.to = qdata.email;
                        obj.func = rtnInfo(res, "{success:true}");
                        exports.mail(obj);
                    }
                });
            }
            else {
                rtnInfo(res, "{success:false,info:'no'}");//不存在
            }
        });

    }
}

exports.login = function (req, res, next) {
    var me = this;
    var data = req.body;
    var name = data.name;
    var pwd = crypt(data.password);
    var sql = "SELECT u.ID,ROLE,email,e.name FROM REN.T_USER u inner join REN.T_EMPLOYEE e on u.employee = e.id WHERE e.NO =? and PASSWORD = ? and failedcount < ?"
    console.log(sql);
    console.log(name);
    console.log(pwd);
    var params = [name, pwd, 10];
    db.q(sql, params, function (rows) {
        var rtn = "{success:false}"
        if (rows.length > 0) {
            // RowDataPacket { ID: 2, ROLE: null }
            console.log(rows);
            var data = JSON.parse(JSON.stringify(rows));
            rtn = "{success:true,user:" + data[0].ID + ",role:" + data[0].ROLE + "}"
            req.session.user = data[0].ID;
            req.session.role = data[0].ROLE;
        }
        res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
        res.write(rtn);
        res.end();
    });
};


function crypt(info) {
    var content = info;
    var shasum = crypto.createHash('sha1');
    shasum.update(content);
    return shasum.digest('hex');
}