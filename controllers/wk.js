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

    else if (option == "o")//上传文件
    {
        if (req.files && req.files.spx != 'undifined') {
            var temp_path = req.files.spx.path;
            if (temp_path) {
                var newPath = "./www/uploadFiles/rnf.spx";
                if (req.body.fileName) {
                    newPath = './www/uploadFiles/' + req.body.fileName + ".spx";
                }

                fs.rename(temp_path, newPath, function (err) {
                    if (err) {
                        throw err;
                    }
                    res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
                    res.write("{success:true,name:\"" + temp_path + "\"}");
                    res.end();
                });


            }
        }
    }

    else if (option == "rv")//评价
    {
        var data = req.body;
        var id = data.id;
        var value = data.value;
        var err = function (res) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write("{success:false}");
            res.end();
        };
        var suc = function (res) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write("{success:true}");
            res.end();
        };
        var nodata = function (res) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write("{success:true,data:0}");
            res.end();
        };
        db.c("update REN.H_HR set Point = Point + (?) where id = ?", [value, id], function (datas) {
            if (datas.affectedRows == 1) {
                db.c("update REN.T_USER set point = point + (?) where id = (select user from REN.H_HR where id = ?)", [value, id], function (rtn) {

                    if (rtn.affectedRows == 1) {
                        suc(res);
                    }
                    else {
                        nodata(res);
                    }
                });
            }
            else {
                nodata(res);
            }
        });


//            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
        //  res.write(JSON.stringify(datas));
        //  res.end();


    }
    else {
        var kind = req.body.kind;//0:寻求帮助 1:有用信息
        var point = req.body.point;
        db.q("SELECT ID as id,Title as title,Lat as lat,Lng as lng,Info as info,Point as point,Voice as voice,Status as status,Type as type,USER as user,KIND as kind FROM REN.H_" + req.body.model.toUpperCase() + " WHERE KIND = ? and Point > ?", [kind, point], function (datas) {
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
function rtnHtml(res, info) {
    info = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/></head><body>' + info + '</body></html>';
    rtnInfo(res, info);
}

exports.pwd = function (req, res, next) {
    var me = this;

    var data = req.body;


    if (typeof (data.option) == "undefined")//get
    {
        data = req.query;
    }
    var option = data.option;
    console.log(data);


    if (option == "c")//修改密码
    {
        var sql = "SELECT ID,EMAIL email FROM REN.T_USER WHERE ID =? and PASSWORD = ?"
        var pwd = crypt(data.password);
        var newPwd = crypt(data.newpassword);
        var id = req.session.user;
        console.log(sql);
        console.log(pwd);//原有密码
        console.log(newPwd);//原有密码
        var params = [id, pwd];
        db.q(sql, params, function (rows) {
            var rtn = "{success:false}"
            if (rows.length > 0)//有数据
            {
                var email = rows[0].email;
                var data = {};
                data.table = "`REN`.`T_USER`";
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
                        obj.from = "好人网";
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
    else if (option == "r")//重置密码
    {

        var sql = "SELECT u.ID id,email,no FROM REN.T_USER u  WHERE `NO` = ? and EMAIL = ?"

        var params = [data.name, data.email];
        db.q(sql, params, function (rows) {
            if (rows.length > 0) {
                //重置密码
                var qdata = JSON.parse(JSON.stringify(rows))[0];
                var pwd = qdata.no + "123";//重置密码
                var id = qdata.id;//UserId
                var data = {};
                data.table = "`REN`.`T_USER`";
                data.id = qdata.id;
                data.password = crypt(pwd);
                //console.log(data.password)
                db.u(data, function (rtndata) {
                    if (rtndata.affectedRows == 1)//更新成功
                    {
                        var obj = {};
                        obj.subject = "重置密码";
                        obj.html = "密码已重置为" + pwd + "";
                        obj.from = "好人网";
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

    } else if (option == "g")//进行注册
    {

        var sql = "SELECT u.ID id,email,no FROM REN.T_USER u  WHERE `NO` = ? or EMAIL = ?"

        var params = [data.name, data.email];
        db.q(sql, params, function (rows) {
            if (rows.length == 0) {
                //重置密码

                console.log(data);
                var iData = {};
                iData.table = "`REN`.`T_USER`";
                iData.no = data.name;
                iData.name = data.name;
                iData.email = data.email;
                iData.password = crypt(data.password);
                console.log(iData.no + iData.email);
                var key = crypt(iData.no + iData.email);
                db.i(iData, function (rtndata) {
                    if (rtndata.affectedRows == 1)//插入成功
                    {
                        console.log(rtndata);
                        var obj = {};
                        obj.subject = "注册用户";
                        obj.html = "恭喜您注册用户成功,欢迎加入好人网。";
                        obj.html += "<br>登录ID:" + iData.no;
                        var url = "http://" + config.host + ":" + config.port + "/pwd?option=v&key=" + key + "&c=" + rtndata.insertId;
                        obj.html += "<br><a href='" + url + "'>请点击链接进行注册</a>";//rtn.insertId
                        obj.from = "好人网";
                        obj.to = iData.email;
                        obj.func = rtnInfo(res, "{success:true}");
                        //http://153.122.98.240:8379/pwd?option=v&key=08d385f2af39d24789914d49e0dedfc7bc6a119e
                        exports.mail(obj);
                    }
                });
            }
            else {
                rtnInfo(res, "{success:false,info:'no'}");//已存在
            }
        });

    } else if (option == "v")//进行验证
    {

        var sql = "SELECT email,no FROM REN.T_USER u  WHERE `id` = ? "

        var params = [data.c];
        db.q(sql, params, function (rows) {
                if (rows.length > 0) {
                    var key = crypt(rows[0].no + rows[0].email);
                    if (key == data.key) {


                        var updateD = {
                            "table": "`REN`.`T_USER`",
                            "verified": 1,
                            "id": data.c
                        };

                        db.u(updateD, function (rtndata) {
                            if (rtndata.affectedRows == 1)//更新成功
                            {
                                rtnHtml(res, '验证成功，请登录后使用。');//已存在
                            }
                        });


                    }
                }
                else {
                    rtnHtml(res, "验证失败");//已存在
                }
            }
        );
    }
}

exports.login = function (req, res, next) {
    var me = this;
    var data = req.body;
    var name = data.name;
    var pwd = crypt(data.password);
    var sql = "SELECT u.ID,ROLE,email,u.name,u.point,u.no FROM REN.T_USER u  WHERE NO =? and PASSWORD = ? and failedcount < ? and verified = 1"

    var params = [name, pwd, 10];
    db.q(sql, params, function (rows) {
        var rtn = "{success:false}"
        if (rows.length > 0) {
            // RowDataPacket { ID: 2, ROLE: null }
            console.log(rows);
            var data = JSON.parse(JSON.stringify(rows));
            rtn = "{success:true,user:" + data[0].ID + ",point:'" + data[0].point + "',no:'" + data[0].no + "',role:" + data[0].ROLE + "}"
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