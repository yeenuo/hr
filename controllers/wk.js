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

var JPush = require("../lib/JPush/JPush.js")
var client = JPush.buildClient('cc88762a409b84bfdc957f80', '379645d6a232ffc2f4c9b5d1')

exports.app = function (req, res, next) {
    // console.log("app");
    res.redirect('/www/index.html');
};

exports.data = function (req, res, next) {

    var data = req.body;

    if (typeof (data.option) == "undefined")//get
    {
        data = req.query;
    }
    var option = data.option;
    console.log(data);

    if (option == "s")//保存数据
    {
        var data = req.body;
        data.table = "H_" + data.table;
        if (data.model) {
            data.table = "T_" + data.model;
            data.model = null;
            delete data.model;
        }
        var func = function (rtn) {

            if (rtn.affectedRows == 1) {
                res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
                if (parseInt(rtn.insertId) > 0) {
                    if (data.table == "H_REPLY")//回复
                    {

                        pushReply(data.hr, data.info, req.session.user);
                    }
                    else if (data.table == "H_HR") {//新建
                        pushHR(data);
                    }
                    res.write("{success:true,id:" + rtn.insertId + ",option:'a'}");
                }
                else {
                    res.write("{success:true,option:'u'}");
                }
                res.end();
            }
        };
        if (data.id) {//添加
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
    else if (option == "ma")//界面选择数据
    {
        var sql = "";
        db.q("SELECT  TYPE as type,value as value,text as text  FROM REN.H_MASTER order by type,value ", [], function (datas) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write(JSON.stringify(datas));
            res.end();
        });
    }
    else if (option == "rp")//reply查询
    {
        var hr = req.body.hr;
        var sql = "";
        db.q("SELECT r.ID as id,HR as hr,Info as info,Date as date,Voice as voice ,u.no as user,u.id as userId   FROM REN.H_REPLY r left join T_USER u on r.user = u.id   WHERE HR = ? ", [hr], function (datas) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write(JSON.stringify(datas));
            res.end();
        });
    }
    else if (option == "score")//评价
    {   var data = req.body;
        var id = data.id;
        var value = data.point;
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
        db.c("update REN.T_USER set point = GREATEST( point + (?),0) where id = ?", [value, id], function (rtn) {

            if (rtn.affectedRows == 1) {
                if(value >0)
                {
                    var users = [id];
                    push(users,"谢谢您的帮助，您将获得"+value+"积分。");
                }
                suc(res);
            }
            else {
                err(res);
            }
        });

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
                //更新值
                db.c("update REN.T_USER set point = GREATEST( point + (?),0) where id = (select user from REN.H_HR where id = ?)", [value, id], function (rtn) {

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

    }
    else if (option == "push") {
        //easy push

        /*        client.push().setPlatform(JPush.ALL)
         .setAudience(JPush.ALL)
         .setNotification('Hi, JPush', JPush.ios('ios alert', 'happy', 5))
         .send(function(err, res) {
         if (err) {
         console.log(err.message)
         } else {
         console.log('Sendno: ' + res.sendno)
         console.log('Msg_id: ' + res.msg_id)
         }
         });*/
    }
    else if (option == "master") {
        db.q("select id as id,text as text,type as type,value as value from REN.H_MASTER order by type,value", [], function (datas) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write(JSON.stringify(datas));
            res.end();
        });
    }
    else {
        var kind = req.body.kind;//0:寻求帮助 1:有用信息
        var point = req.body.point;
        db.q("SELECT ID as id,Title as title,Lat as lat,Lng as lng,Info as info,Point as point,Voice as voice,Date as date,Status as status,Type as type,USER as user,Helper as helper, KIND as kind,Occ as occ FROM REN.H_" + req.body.model.toUpperCase() + " WHERE KIND = ? and Point > ? and (STATUS = 0 OR (STATUS = 1 AND USER = ? OR HELPER = ?))", [kind, point,req.session.user,req.session.user], function (datas) {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write(JSON.stringify(datas));
            res.end();
        });
    }

};

function pushHR(data) {
    //SELECT user.id FROM REN.T_USER user where (ABS((lat +  lng) - ?) <0.01) and (occ = 0 or occ = ?)


    var sql = "SELECT user.id user FROM REN.T_USER user where (ABS((lat +  lng) - ?) <0.01)";

    var params = [(parseFloat(data.lat) + parseFloat(data.lng)).toFixed(6)];
    if (data.occ != 0)//特定推送种类
    {
        sql = sql + " and (occ = 0 or occ = ?)";
        params.push(data.occ);
    }


    db.q(sql, params, function (datas) {
        var users = [];
        if (datas.length > 0) {
            for (var i = 0; i < datas.length; i++) {
                users.push(datas[i].user);
                //console.log("add datas[i].user");
            }

            if (users.length > 0) {
                // console.log("push reply");
                push(users, "新信息:(" + data.info + ")。");
            }
        }

    });

}
function push(users, msg, title) {
    var str_users = users.join();

    console.log(str_users);
    client.push().setPlatform('ios', 'android')
        .setAudience(JPush.alias(str_users))
        .setNotification(title || msg, JPush.ios(title || msg), JPush.android(title || msg, null, 1))
        .setMessage(msg)
        .setOptions(null, 60)
        .send(function (err, res) {
            if (err) {
                console.log(err.message)
            } else {
                console.log('Sendno: ' + res.sendno)
                console.log('Msg_id: ' + res.msg_id)
            }
        });
}
function pushReply(hr, info, user) {
    var users = [];
    // var sql = " SELECT Distinct User+'' user FROM REN.H_REPLY where HR = ? "
    //sql = sql + "  union select user  from REN.H_HR where id = ?  "
    //sql = sql + "  union select info user  from REN.H_HR where id = ?  "//?

    var sql = " select user from( ";
    sql = sql + "     SELECT Distinct User  user FROM REN.H_REPLY where HR = ? ";
    sql = sql + "  union select user ";
    sql = sql + "  from REN.H_HR where id = ?  ) a ";
    sql = sql + "  inner join  REN.T_USER user on user.id = a.user ";
    sql = sql + "  where user.ispush = 1 and user.islogin = 1 and user.id <> ?";

    db.q(sql, [hr, hr, user], function (datas) {

        //datas
        if (datas.length > 0) {
            for (var i = 0; i < datas.length; i++) {
                users.push(datas[i].user);
                //console.log("add datas[i].user");
            }

            if (users.length > 0) {
                // console.log("push reply");
                push(users, "新回复:(" + info + ")。");
            }
        }

    });


}

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
    var sql = "SELECT u.ID,ROLE,email,u.name,u.point,u.no,ISPUSH as ispush,OCC as occ,AREA as area,POS as pos FROM REN.T_USER u  WHERE NO =? and PASSWORD = ? and failedcount < ? and verified = 1"

    var params = [name, pwd, 10];
    db.q(sql, params, function (rows) {
        var rtn = "{success:false}"
        if (rows.length > 0) {
            // RowDataPacket { ID: 2, ROLE: null }
            console.log(rows);
            var data = JSON.parse(JSON.stringify(rows));
            db.u({id: data[0].ID, islogin: 1, table: "T_USER"}, function () {
                rtn = "{success:true,user:" + data[0].ID + ",point:'" + data[0].point + "',no:'" + data[0].no + "',area:'" + data[0].area + "',occ:'" + data[0].occ + "',ispush:'" + data[0].ispush + "',pos:'" + data[0].pos + "',role:" + data[0].ROLE + "}"
                req.session.user = data[0].ID;
                req.session.role = data[0].ROLE;
                res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
                res.write(rtn);
                res.end();
            });

        }
        else {
            res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
            res.write(rtn);
            res.end();
        }

    });
};
exports.logout = function (req, res, next) {
    var rtn = "{success:false}"
    db.u({id: req.session.user, islogin: 0, table: "T_USER"}, function () {
        if (rows.length > 0) {
            rtn = "{success:true}"
            req.session.user = data[0].ID;
            req.session.role = data[0].ROLE;
        }

    });

    res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
    res.write(rtn);
    res.end();
};

function crypt(info) {
    var content = info;
    var shasum = crypto.createHash('sha1');
    shasum.update(content);
    return shasum.digest('hex');
}