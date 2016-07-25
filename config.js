/*!
 * todo - config.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

exports.debug = true;
exports.port = 8379;
exports.site_name = '好人网';
exports.site_desc = '人人为我，我为人人';
exports.session_secret = 'todo session secret';
exports.host = '153.122.98.240';
exports.db ={
    host: exports.host ,
    user: 'ren',
    password: 'ren456$%^',
    database:'REN',
    port: 3306
};


exports.dbm ={
    host: exports.host ,
    user: 'ren',
    password: 'ren123',
    database:'ren',
    port: 3005
};

exports.status ={
	f:'yellow',//future未来
    d:'green',//done 已完成
	u:'red',//undo 未做
	n:'gray'//NoNeed 不需要
};


exports.localdb ={
    host: '127.0.0.1',
    user: 'root',
    password: 'tenji123!@#',
    port: 3306
};

exports.mail ={
    host: 'smtp.gmail.com',
	port: 465,
    user: 'tenji0608@gmail.com',
    pass: 'test0608'
};