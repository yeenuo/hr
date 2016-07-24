//<debug>
Ext.Loader.setPath({
    'Ext': '../../src'
});
// </debug>

/**
 * This simple example shows the ability of the Ext.List component.
 *
 * In this example, it uses a grouped store to show group headers in the list.
 * It also includes an indicator so you can quickly swipe through each of the
 * groups. On top of that it has a disclosure button so you can disclose more
 * information for a list item.
 */

// define the application
var app = Ext
        .application({
            isIconPrecomposed: false,
            // require any components/classes what we will use in our example
            requires: ['Ext.MessageBox', 'OpenCharts.OpenCharts',
                'Ext.data.Store'],

            /**
             * The launch method is called when the browser is ready, and the
             * application can launch.
             *
             * Inside our launch method we create the list and show in in the
             * viewport. We get the lists configuration using the
             * getListConfiguration method which we defined below.
             *
             * If the user is not on a phone, we wrap the list inside a panel
             * which is centered on the page.
             */

            initConfig: function () {
                var me = this;
                me.DM = false;
                me.initData();
                me.record = record;
                me.record.app = me;
                me.tool = new Tool();
                me.uploadUrl = "/www/uploadFiles/";
                // me.server = "http://localhost:8379";
                me.server = "http://192.168.0.11:8379";
                //me.server = "http://153.122.98.240:8379";
                me.infoType = 0;// 0:求助 1:帮忙
                me.map = null;
                me.tomail = "";// 需要发送mail的人，作业时间不足。
                me.config = {
                    isAdd: false,// 是否自己添加
                    itemType: 0,// 0 need 1 help
                    needTxt: '求助',
                    helpTxt: '信息',
                    msgs: [{
                        id: -1,
                        text: '--类别--'
                    }, {
                        id: 0,
                        text: '便民活动'
                    }, {
                        id: 1,
                        text: '商家打折'
                    }, {
                        id: 2,
                        text: '拾取归还'
                    }, {
                        id: 3,
                        text: '二手物品'
                    }, {
                        id: 3,
                        text: '免费体检'
                    }],
                    needs: [{
                        id: -1,
                        text: '--类别--'
                    }, {
                        id: 0,
                        text: '寻物'
                    }, {
                        id: 1,
                        text: '寻人'
                    }, {
                        id: 2,
                        text: '问答'
                    }, {
                        id: 3,
                        text: '求购'
                    }, {
                        id: 4,
                        text: '其他'
                    }],
                    distances: [{
                        id: -1,
                        text: '--距离--'
                    }, {
                        id: 0,
                        text: '200M'
                    }, {
                        id: 1,
                        text: '500M'
                    }, {
                        id: 2,
                        text: '1KM'
                    }, {
                        id: 3,
                        text: '3KM'
                    }, {
                        id: 4,
                        text: '10KM'
                    }, {
                        id: 3,
                        text: '3KM'
                    }, {
                        id: 4,
                        text: '以上'
                    }],
                    relations: [{
                        id: 0,
                        text: '普通'
                    }, {
                        id: 1,
                        text: '朋友'
                    }, {
                        id: 2,
                        text: '密友'
                    }],
                    status: [{
                        id: 0,
                        text: '确认中'
                    }, {
                        id: 1,
                        text: '帮助中'
                    }, {
                        id: 2,
                        text: '已完成'
                    }],
                    levels: [{
                        id: 0,
                        text: '>10'
                    }, {
                        id: 1,
                        text: '>5'
                    }, {
                        id: 2,
                        text: '>2'
                    }, {
                        id: 3,
                        text: '>0'
                    }],
                    points: [{
                        id: -1,
                        text: '分数'
                    }, {
                        id: 0,
                        text: '0'
                    }, {
                        id: 1,
                        text: '<10'
                    }, {
                        id: 2,
                        text: '<20'
                    }, {
                        id: 3,
                        text: '<50'
                    }, {
                        id: 4,
                        text: '<100'
                    }, {
                        id: 5,
                        text: '100以上'
                    }]
                };

                // me.map = null;
                me.sel_distance = null;
                me.sel_msg = null;
                me.sel_kind = null;
                me.sel_point = null;
                me.seg_type = null;
                me.marker = null;
            },
            initData: function () {
                var me = this;
                me.user = -1;
                me.data = {};// 当前选中data,便于删除修改添加用
                me.datas = {
                    "need": [],
                    "help": []
                };

            },
            launch: function () {
                var me = this;

                me.initConfig();

                if (me.DM) {
                    me.createDB();
                }

                me.panel_window_need = me.getInfo();
                //me.panel_window_need = me.getInfo();

                me.panel_list = me.getList();// 列表
                me.panel_map = me.getMap();// 录入
                me.panel_config = me.getConfig();// 设定
                me.mainPanel = Ext.create('Ext.TabPanel', {
                    tabBarPosition: 'bottom',
                    id: 'panel_main',
                    fullscreen: true,
                    showAnimation: {
                        type: 'cube'
                    },
                    layout: {
                        type: 'card',
                        animation: {
                            type: 'cube'
                        }
                    },
                    defaults: {
                        styleHtmlContent: true
                    },
                    //activeItem: 2,
                    activeItem: 0,
                    // , me.panel_config
                    items: [me.panel_map, me.panel_list, me.getLogin() // 登陆页面
                    ]
                });

                //me.user = 1;
                if (me.DM) {

                    Ext.getCmp('panel_main').setActiveItem(3);//初次启动，登录页面
                    me.mainPanel.on("activeitemchange", function (tb, value,
                                                                  oldValue, eOpts) {
                        if (me.user == -1) {
                            me.mainPanel.setActiveItem(2);// 初次启动，登录页面
                        }
                    });
                }
                else {
                    me.user = 1;
                }
                me.refreshData(1);
            },
            createDB: function () {
                var me = this;
                //本地数据库
                me.db = window.sqlitePlugin.openDatabase({name: "hr.db", location: 'default'});
                me.db.transaction(function (tx) {
                    tx.executeSql("create table if not exists HR_REVIEW (id PRIMARY KEY, value INT)", [], function () {
                        console.log("success");
                    }, function () {
                        console.log("error");
                    });
                });
            },
            endRecord: function (file) {
                var me = this;
                Ext.getCmp("btn_record").setText("录音");
                me.ctrlEnabled("btn_play", true);//可以录音

            },
            endPlay: function (file) {
                var me = this;
                Ext.getCmp("btn_play").setText("播放");
                me.ctrlEnabled("btn_record", true);//可以播放

            },
            endRead: function () {
                // alert(222);
            },

            playUrl: function (url) {
                var me = this;
                me.downLoad(url, "nuofun.spx", function (path) {
                    path = path.replace("file://", "");
                    me.record.play(path);
                });
            },
            upload: function (url, path, cb) {
                var me = this;
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                    function (fs) {
                        var fileURL = "file://" + path;
                        var options = new FileUploadOptions();
                        options.fileKey = "spx";
                        options.fileName = fileURL.substr(fileURL
                                .lastIndexOf('/') + 1);
                        options.mimeType = "text/plain";
                        // 上传参数
                        var params = {};
                        params.option = "o";
                        params.fileName = me.data.id;
                        options.params = params;
                        var ft = new FileTransfer();

                        // 上传地址
                        ft.upload(fileURL, encodeURI(url), function () {
                            console.log("成功");
                        }, function (e) {
                            console.log(e);
                        }, options);

                    }, function (e) {
                        console.log(e);
                    });

            },

            downLoad: function (url, path, cb) {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                    function (fs) {
                        console.log('打开的文件系统: ' + fs.name);
                        fs.root.getFile(path, {
                            create: true,
                            exclusive: false
                        }, function (fileEntry) {
                            var fileTransfer = new FileTransfer();
                            var fileURL = fileEntry.toURL();
                            fileTransfer.download(url, fileURL, function (entry) {
                                    console.log("下载成功！");
                                    console.log("文件保存位置: " + entry.toURL());
                                    if (cb) {
                                        cb(entry.toURL());
                                    }
                                },
                                function (error) {
                                    console.log("下载失败！");
                                    console.log("error source "
                                        + error.source);
                                    console.log("error target "
                                        + error.target);
                                    console.log("error code"
                                        + error.code);
                                }, null, // or, pass false
                                {
                                    // headers: {
                                    // "Authorization": "Basic
                                    // dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                                    // }
                                });
                        }, function (e) {
                            console.log(e);
                        });
                    }, function (e) {
                        console.log(e);
                    });
            },
            getLogin: function () {
                var me = this;
                return {
                    title: '登录',
                    iconCls: 'user',
                    id: 'tab_login',
                    layout: 'vbox',
                    items: [
                        {
                            xtype: 'textfield',
                            id: 'name',
                            name: 'name',
                            label: 'ユーザ',
                            value: 'tj1'
                        },
                        {
                            xtype: 'passwordfield',
                            id: 'password',
                            name: 'password',
                            label: '密码',
                            value: '111111'
                        },
                        {
                            xtype: 'button',
                            text: '登录',
                            handler: function () {
                                // record.endRecord("111");
                                me.initData();// 初始化数据
                                var name = Ext.getCmp("name").getValue();
                                var password = Ext.getCmp("password")
                                    .getValue();

                                if ((name == "") || (password == "")) {
                                    me.alert("用户名或密码不得为空。");
                                    return;
                                }
                                var data = {
                                    "name": name,
                                    "password": password
                                };
                                Ext.Ajax
                                    .request({
                                        url: me.server + '/login',
                                        method: 'POST',
                                        params: data,
                                        success: function (response,
                                                           opts) {
                                            var obj = Ext
                                                .decode(response.responseText);
                                            if (obj.success) {// 登陆成功
                                                me.user = obj.user;
                                                me.role = obj.role;
                                                Ext
                                                    .getCmp(
                                                        "lbl_user_name")
                                                    .setHtml(
                                                        data.name);
                                                me.mainPanel
                                                    .setActiveItem(0);

                                            } else {
                                                me.alert("用户名或密码错误。");
                                            }
                                            // console.dir(obj);
                                        },
                                        failure: function (response,
                                                           opts) {
                                            console.log('server erro:'
                                                + response.status);
                                        }
                                    });
                            }
                        },
                        {
                            xtype: 'button',
                            text: '重置密码',
                            handler: function () {

                                // me.record.read("12345, asdad");
                                return;

                                var name = Ext.getCmp("name").getValue();
                                if (name.length == 0) {
                                    me.alert('请输入姓名。');
                                    return;
                                }
                                Ext.Msg.prompt('EMAIL', '请输入Email',
                                    function (id, text) {
                                        text = "javaandnet@gmail.com";// Todo
                                        if (text.length > 0) {
                                            me.resetPWD(text);
                                        }

                                    });
                            }
                        }]
                };
            },

            getInfo: function () {
                var me = this;
                me.record.isNew = false;// 初始化
                // me.record.fileName = "";

                return Ext
                    .create(
                        "Ext.Panel",
                        {
                            centered: true,
                            modal: true,
                            width: 300,
                            height: 400,
                            hidden: true,
                            scrollable: {
                                direction: 'vertical',
                                directionLock: true
                            },
                            items: [
                                {
                                    docked: 'top',
                                    xtype: 'titlebar',
                                    items: [{
                                        text: '关闭',
                                        handler: function () {
                                            me.panel_window_need
                                                .setHidden(true);
                                        }
                                    }]
                                },

                                // 类别
                                {
                                    id: 'show_need',
                                    xtype: 'selectfield',
                                    label: '类别',
                                    valueField: 'id',
                                    options: me.config.needs
                                },
                                {
                                    id: 'show_msg',
                                    xtype: 'selectfield',
                                    hidden: true,
                                    label: '类别',
                                    valueField: 'id',
                                    options: me.config.msgs
                                },

                                // 详细信息
                                {
                                    id: 'show_info',
                                    xtype: 'textareafield',
                                    placeHolder: '相关信息',
                                    label: '信息'
                                },
                                // 分数
                                {
                                    xtype: 'sliderfield',
                                    id: 'show_point',
                                    label: 'P(0)',
                                    value: 0,
                                    minValue: 0,
                                    maxValue: 100,
                                    listeners: {
                                        change: function (me, sl,
                                                          thumb, value,
                                                          pressed) {
                                            me.setLabel("P("
                                                + value + ")");

                                        }
                                    }
                                },
                                {
                                    xtype: 'fieldset',
                                    id: "fs_spee",
                                    layout: 'hbox',
                                    items: [
                                        {
                                            xtype: 'button',
                                            id: "btn_record",
                                            text: '录音',
                                            handler: function (btn) {
                                                if (me.record.status != 2) {// 非播放状态
                                                    me.record
                                                        .record();
                                                    me.ctrlEnabled("btn_play", true);
                                                    if (record.status == 0) {
                                                        this
                                                            .setText("录音");
                                                        Ext
                                                            .getCmp(
                                                                'btn_play')
                                                            .setDisabled(
                                                                false);
                                                    } else {
                                                        this
                                                            .setText("结束");
                                                        me.ctrlEnabled("btn_play", false);
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            xtype: 'button',
                                            id: "btn_play",
                                            text: '播放',
                                            hidden: true,
                                            handler: function (btn) {
                                                if (me.record.status != 1) {// 非录制状态
                                                    if (me.record.isNew) {// 新增才读取本地
                                                        me.record
                                                            .play();
                                                    } else {
                                                        if (me.data.id) {// 读取服务器
                                                            me
                                                                .playUrl(me.server
                                                                    + me.uploadUrl
                                                                    + me.data.id
                                                                    + ".spx");
                                                        }
                                                    }

                                                    if (record.status == 0) {
                                                        this
                                                            .setText("播放");
                                                        me.ctrlEnabled("btn_record", true);
                                                        Ext
                                                            .getCmp(
                                                                'btn_record')
                                                            .setDisabled(
                                                                true);
                                                    } else {
                                                        this
                                                            .setText("结束");
                                                        me.ctrlEnabled("btn_record", false);
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            xtype: 'button',
                                            id: "btn_cancelRecord",
                                            text: '取消',
                                            handler: function () {// Todo删除声音文件
                                                me
                                                    .upload(
                                                        me.server
                                                        + "/data",
                                                        me.record.fileName,
                                                        function () {
                                                        });
                                            }
                                        }]
                                },

                                // 状态
                                {
                                    xtype: 'selectfield',
                                    id: 'show_status',
                                    label: '状态',
                                    valueField: 'id',
                                    options: me.config.status
                                },

                                {
                                    xtype: 'fieldset',
                                    id: "fs_show_review",
                                    layout: 'hbox',
                                    items: [
                                        {
                                            xtype: 'button',
                                            id: "btn_show_r0",
                                            text: '好',
                                            handler: function () {
                                                me.review(1);
                                            }
                                        }, {
                                            xtype: 'button',
                                            id: "btn_show_r1",
                                            text: '差',
                                            handler: function () {
                                                me.review(-1);
                                            }
                                        }
                                    ]
                                },
                                {
                                    xtype: 'button',
                                    id: "btn_save",
                                    text: '保存',
                                    handler: function () {
                                        me.saveData("HR");
                                    }
                                },
                                {
                                    xtype: 'button',
                                    id: "btn_help",
                                    text: '帮助',
                                    handler: function () {
                                        me.help();
                                    }
                                }

                            ]
                        });
            },
            review: function (value) {
                var me = this;
                if (me.DM) {
                    me.db.transaction(function (tx) {
                        tx.executeSql("INSERT INTO HR_REVIEW (id, value) VALUES (?,?)", [me.data.id, value], function () {
                            console.log("success");
                            me.reviewServer(value);

                        }, function () {
                            Ext.Msg.alert("信息", "已评价过。");
                        });
                    });
                } else {
                    me.reviewServer(value);
                }
            },
            reviewServer: function (value) {
                var me = this;
                var param = {
                    option: 'rv',
                    id: me.data.id,
                    value: value
                };
                Ext.Ajax.request({
                    url: me.server + '/data',
                    method: 'POST',
                    params: param,
                    success: function (response, opts) {
                        var obj = Ext.decode(response.responseText);
                        if (obj.success) {
                            me.ctrlEnabled("fs_show_review", false);
                        } else {
                            me.alert("服务器错误");
                        }
                        console.dir(obj);
                    },
                    failure: function (response, opts) {
                        console.log('server erro:' + response.status);
                    }
                });
            },
            help: function () {
                me.alert(me.data.id);
            },
            checkData: function (cb) {
                var me = this;
                if (me.data.type == -1) {
                    //alert();
                    Ext.Msg.alert("信息", "请选择类型", function () {
                        return false;
                    });
                } else {
                    cb();
                }

            },
            saveData: function (model) {
                var me = this;
                me.setData();

                me.checkData(function () {
                    me.data.table = model;
                    me.data.option = "s";
                    //保存数据后，上传录音文件
                    me.submitData(me.data, function () {
                        me.panel_window_need.setHidden(true);
                    });
                });

            },
            getList: function () {
                var me = this;
                return {
                    title: '一览',
                    iconCls: 'calendar',
                    id: 'tab_list',
                    layout: 'card',
                    items: [me.getListConfiguration()]
                };
            },
            getComboText: function (key, objs) {
                for (var i = 0; i < objs.length; i++) {
                    var obj = objs[i];
                    if (obj.value == key) {
                        return obj.text;
                    }
                }
                return null;
            },
            getConfig: function () {
                var me = this;
                return {
                    title: '设定',
                    iconCls: 'settings',
                    scrollable: true,
                    items: [{
                        xtype: 'fieldset',
                        title: '修改密码',
                        items: [

                            {
                                xtype: 'button',
                                text: '変更',
                                handler: function () {
                                    me.changePWD(Ext.getCmp("oldpwd").getValue(),
                                        Ext.getCmp("newpwd").getValue(), Ext
                                            .getCmp("newpwd2").getValue());
                                }
                            }]
                    }]
                };
            },
            getMap: function () {

                var dt = Ext.Date.add(new Date(), Ext.Date.DAY, 1);
                var me = this;
                me.map = Ext.create("map");
                me.map.app = me;
                me.sel_point = {
                    id: 'sel_point',
                    xtype: 'selectfield',
                    label: '',
                    valueField: 'id',
                    width:100,
                    options: me.config.points
                };
                me.sel_kind = {
                    id: 'sel_kind',
                    xtype: 'selectfield',
                    label: ' ',
                    valueField: 'id',
                    options: me.config.kinds
                };

                me.sel_distance = {
                    id: 'sel_distance',
                    xtype: 'selectfield',
                    label: ' ',
                    valueField: 'id',
                    options: me.config.distances
                };

                me.sel_level = {
                    id: 'sel_level',
                    xtype: 'selectfield',
                    label: ' ',
                    valueField: 'id',
                    options: me.config.distances
                };
                me.sel_msg = {
                    id: 'sel_msg',
                    xtype: 'selectfield',
                    label: ' ',
                    hidden: true,
                    valueField: 'id',
                    options: me.config.infos
                };
                me.btn_refresh = {
                    xtype: 'button',
                    text: '',
                    id: "btn_refresh",
                    iconCls: 'refresh',
                    name: "btn_refresh",
                    align: 'right',
                    handler: function () {
                        // var month =
                        // Ext.Date.format(Ext.getCmp("month_admin").getValue(),
                        // "Ym");
                        // window.open("/excel/" + month, '_blank');
                        me.refreshData(1);
                    }
                };
                me.btn_add = {
                    xtype: 'button',
                    text: '',
                    id: "btn_add",
                    iconCls: 'add',
                    name: "btn_add",
                    align: 'right',
                    handler: function (btn) {
                        // var month =
                        // Ext.Date.format(Ext.getCmp("month_admin").getValue(),
                        // "Ym");
                        // window.open("/excel/" + month, '_blank');
                        me.addItem();

                        // record.record();

                    }
                };

                me.seg_type = Ext.create('Ext.SegmentedButton', {
                    items: [{
                        text: me.config.needTxt,
                        value: 0,
                        pressed: true
                    }, {
                        text: me.config.helpTxt,
                        value: 1
                    }],
                    listeners: {
                        toggle: function (container, button, pressed) {

                            var type = 1;

                            if (pressed) {
                                if (button.getText() == me.config.needTxt) {
                                    type = 0;
                                }
                                me.changeInfoType(type);
                            }

                        }
                    }
                });

                return {
                    title: '地图',
                    iconCls: 'compose',
                    id: 'tab_input',
                    layout: 'vbox',
                    items: [
                        {
                            docked: 'top',
                            xtype: 'titlebar',
                            items: [me.seg_type, me.sel_point,me.btn_refresh,
                                me.btn_add]
                        },
                        me.panel_window_need,
                        me.map
                        /*,{
                            xtype: 'fieldset',
                            width: '100%',
                            hideBorders: false,
                            layout: 'hbox',
                            baseCls: "x-fieldset_nb", // 无边框
                            defaults: {
                                width: '30%'

                            },
                            items: [me.sel_distance, me.sel_msg,
                                me.sel_kind, me.sel_point,]
                        }*/]
                };
            },
            showWindow: function (marker) {
                var me = this;
                me.marker = marker;
                me.getData();

                //有录音数据
                me.ctrlEnabled("btn_play", (me.data.id) && (me.data.voice == 1));
                //录音机按钮部分
                me.speeBtnInShowWin(me.isSelfData());
                me.selInShowWin();


                me.record.isNew = false;// 初始化声音文件
                me.panel_window_need.setHidden(false);// 显示
            },
            //打开窗口是否可以修正数据
            isSelfData: function () {
                var me = this;
                if ((me.data.user == me.user)
                    || !(Ext.isDefined(me.data.id) && me.data.id != null)) {
                    return true;
                }
                return false;
            },
            //控制弹出窗口选择框
            selInShowWin: function () {
                var me = this;
                var isNeed = me.infoType == 0;
                var isSelf = me.isSelfData();
                //need
                me.ctrlEnabled("btn_help", isNeed && !isSelf);//Need&&他人数据
                me.ctrlEnabled("show_status", isNeed && isSelf);//Need&&个人数据
                me.ctrlEnabled("show_need", isNeed);

                //msg
                me.ctrlEnabled("show_msg", !isNeed);
                me.ctrlEnabled("fs_show_review", !isNeed && !isSelf);//消息&&他人数据

                me.ctrlEnabled("btn_save", isSelf);


                //只读
                me.ctrlReadOnly("show_point", !(isNeed&&isSelf));//
                me.ctrlReadOnly("show_need", !isSelf);
                me.ctrlReadOnly("show_msg", !isSelf);
                me.ctrlReadOnly("show_info", !isSelf);


                //已评价过
                if (me.DM) {
                    if (me.isReviewed(me.data.id)) {
                        me.ctrlEnabled("fs_show_review", false);
                    }
                }

            },

            //添加时初始数据
            initShowData: function () {
                var me = this;
                var data = {};

                data.info = "";
                data.point = 50 * me.infoType;//需要帮助时初试分数为50


                data.type = -1;
                data.status = 0;
                data.voice = 0;
                data.user = me.user;
                data.kind = me.infoType;

                return data;

            },
            //录音部分按钮控制
            speeBtnInShowWin: function (flag) {
                var me = this;
                me.ctrlEnabled("btn_record", flag);
                me.ctrlEnabled("btn_cancelRecord", flag);
            },
            //按钮有效隐藏
            ctrlEnabled: function (id, flag) {

                //有些控件无Disabled属性
                try {
                    Ext.getCmp(id).setHidden(!flag);
                    Ext.getCmp(id).setDisabled(!flag);
                }
                catch (e) {

                }
            },
            ctrlValue: function (id, value) {
                Ext.getCmp(id).setValue(value);
            },
            //按钮有效隐藏
            ctrlReadOnly: function (id, flag) {

                //ReadOnly
                try {
                    Ext.getCmp(id).setReadOnly(flag);
                }
                catch (e) {

                }
            },
            showNeed: function () {

            },

            showInfo: function () {

            },
            isReviewed: function (id) {
                var me = this;
                me.db.transaction(function (tx) {
                    tx.executeSql("select id from HR_REVIEW where ID = ?", [id], function (tx, res) {
                        //alert("hello world");
                        if (res.rows.length > 0) {
                            return true;
                        }
                    });
                });
                return false;
            },
            getParam: function () {
                var me = this;
                var param = {
                    model: "HR",
                    kind: me.infoType
                };
                return param;
            },
            /**
             * 刷新数据
             *
             * @param flag
             *            0:本地刷新 1:服务器刷新
             */
            refreshData: function (flag) {
                var me = this;
                var param = me.getParam();

                if (flag == 0) {
                    me.refreshLocal(param, me.refreshMap);
                } else {
                    me.refreshServer(param, me.refreshMap);
                }

            },

            refreshServer: function (param, cb) {
                var me = this;
                Ext.Ajax.request({
                    url: me.server + '/data',
                    method: 'POST',
                    params: param,
                    success: function (response, opts) {
                        var obj = Ext.decode(response.responseText);

                        cb(obj, me);
                        console.dir(obj);
                    },
                    failure: function (response, opts) {
                        console.log('server erro:' + response.status);
                    }
                });
            },

            refreshLocal: function (param) {

            },

            // 刷新页面
            refreshMap: function (datas, me) {
                me.map.updateData(datas);

            },

            addItem: function () {
                var me = this;
                var a = me.map.bmap.getCenter();
                me.data = me.initShowData();


                var fields = ["status", "point", "info", "type"];
                for (var i = 0; i < fields.length; i++) {

                    a[fields[i]] = me.data[fields[i]];
                }
                var item = me.map.addP(a, true);
                me.map.updateData(a, true);

            },

            changeInfoType: function (type) {
                var me = this;
                me.infoType = type;
                //me.getCmpById(me.sel_point).setHidden(type != 1);
                if (type == 1) {// Help
                    console.log("info");

                } else {
                    console.log("need");
                }
                me.refreshData(1);
            }
            ,
            getCmpById: function (obj) {
                return Ext.getCmp(obj.id);
            }
            ,
            alert:function(info,title)
            {
                var title = title||"信息";
                Ext.Msg.alert(title,info);
            },
            resetPWD: function (email) {
                var me = this;

                var data = {
                    "name": Ext.getCmp("name").getValue(),
                    "email": email,
                    option: "r"
                };
                Ext.Ajax.request({
                    url: '../../rspwd',
                    method: 'POST',
                    params: data,
                    success: function (response, opts) {
                        var obj = Ext.decode(response.responseText);
                        if (obj.success) {
                            me.alert("重置成功。请查看邮件。");
                        } else {
                            me.alert("重置失敗、EMAIL入力错误。");
                        }
                        console.dir(obj);
                    },
                    failure: function (response, opts) {
                        console.log('server erro:' + response.status);
                    }
                });
            }
            ,
            changePWD: function (pwd, newpwd, newpwd2) {
                if (newpwd != newpwd2) {
                    me.alert("两次密码输入不一致。");
                    return;
                }
                var me = this;
                var data = {
                    user: me.user,
                    "password": pwd,
                    "newpassword": newpwd,
                    option: "c"
                };
                Ext.Ajax.request({
                    url: '../../pwd',
                    method: 'POST',
                    params: data,
                    success: function (response, opts) {
                        var obj = Ext.decode(response.responseText);
                        if (obj.success) {
                            me.alert("更改成功");
                        } else {
                            me.alert("旧密码输入错误");
                        }
                        console.dir(obj);
                    },
                    failure: function (response, opts) {
                        console.log('server erro:' + response.status);
                    }
                });
            }
            ,
            getData: function () {
                var me = this;
                var obj = me.marker.options;
                me.data = {};
                me.data.lat = obj.lat;
                me.data.lng = obj.lng;
                me.data.voice = obj.voice;
                me.data.user = obj.user;
                me.data.type = obj.type;
                me.data.kind = obj.kind;

                me.data.info = obj.info;
                me.data.status = obj.status;
                me.data.point = obj.point;

                if (obj.id) {
                    me.data.id = obj.id;
                }
                var fields = ["status", "point", "info"];
                for (var i = 0; i < fields.length; i++) {
                    Ext.getCmp("show_" + fields[i]).setValue(obj[fields[i]]);
                }

                if (me.infoType == 0) {// need
                    Ext.getCmp("show_need").setValue(me.data["type"]);
                } else {
                    Ext.getCmp("show_msg").setValue(me.data["type"]);
                }
            }
            ,
            setData: function () {
                var me = this;

                me.data.user = me.user;
                
                me.data.kind = me.infoType;

                me.data.date = Ext.util.Format.date(new Date(), "YmdHis")
                
                var fields = ["status", "point", "info"];

                for (var i = 0; i < fields.length; i++) {
                    me.data[fields[i]] = Ext.getCmp("show_" + fields[i])
                        .getValue();
                }
                if (me.infoType == 0) {// need
                    me.data["type"] = Ext.getCmp("show_need").getValue();
                } else {
                    me.data["type"] = Ext.getCmp("show_msg").getValue();
                }
                if (me.record.isNew) {
                    me.data["voice"] = 1;
                } else {
                    me.data["voice"] = 0;
                }
            }
            ,
// 提交数据
            submitData: function (data, callback) {
                var me = this;
                Ext.Ajax.request({
                    url: me.server + '/data',
                    method: 'POST',
                    params: data,
                    success: function (response, opts) {
                        var obj = Ext.decode(response.responseText);
                        if (obj.success) {
                            if (obj.id) {
                                data.id = obj.id;
                                me.alert("追加成功");
                            } else {
                                me.alert("更新成功");
                            }
                            //
                            me.data.id = data.id;
                            if (me.record.isNew) {//
                                me.upload(me.server + "/data",
                                    me.record.fileName, function () {
                                        if (callback) {
                                            callback();
                                        }

                                    });
                            } else {
                                if (callback) {
                                    callback();
                                }
                            }

                        }
                        console.dir(obj);
                    },
                    failure: function (response, opts) {
                        console.log('server erro:' + response.status);
                    }
                });
            }
            ,


// 列表
            getListConfiguration: function () {
                var me = this;
                var lbl_user_name = {
                    xtype: 'label',
                    id: "lbl_user_name",
                    name: "lbl_user_name",
                    align: 'right',
                    html: ""
                };
                me.datas = [];
                me.store = Ext.create('Ext.data.Store', {
                    // give the store some fields
                    fields: ['id', 'date', 'starttime', 'endtime',
                        'worktime', 'rest', 'reason', 'status', 'memo',
                        'confim'],
                    // filter the data using the firstName field
                    sorters: 'date',
                    // autoload the data from the server
                    // autoLoad: true,
                    listeners: {
                        load: function (st, records) {

                            me.changeDatas(st);// 更换数据,重新计算时间等多种变量
                            Ext.getCmp('list_list').setStore(null);
                            Ext.getCmp('list_list').setStore(me.store);// 此处刷新数据后，重新绑定

                            me.datas = [];
                            for (var i = 0; i < records.length; i++) {
                                me.datas.push(records[i].data);
                            }
                            if (me.config.mintime) {
                                me.calAllTime();// 计算总计时间
                                me.setAllTime();// 设置合计时间
                                me.saveAllTime();
                            }
                        }
                    },
                    proxy: {
                        type: 'ajax',
                        url: '../../wk/list',
                        reader: {
                            type: 'json',
                            root: 'data'
                        },
                        actionMethods: {
                            create: 'POST',
                            read: 'POST', // by default GET
                            update: 'POST',
                            destroy: 'POST'
                        },
                        extraParams: {
                            'user': me.user,
                            'month': me.month
                        }
                    }
                });
                return {
                    items: [{
                        docked: 'top',
                        xtype: 'titlebar',
                        items: [

                            lbl_user_name]
                    }],
                    id: 'list_list',
                    xtype: 'list',
                    scrollable: {
                        direction: 'vertical'
                    },
                    variableHeights: true,
                    itemHeight: 10,
                    itemTpl: new Ext.XTemplate(
                        // '<table><tr><td height="40" bgcolor
                        // ="{status}">{[this.date(values.date)]}【{starttime}~{endtime}】:{worktime}
                        // ({[this.rest(values.rest)]})</td></tr></table>',
                        '<div  style="background-color:{status};width:100%;height:100%">{[this.date(values.date)]}【{[this.time(values.starttime)]}~{[this.time(values.endtime)]}】:{worktime} ({[this.rest(values.rest)]})</div>',
                        {
                            rest: function (v) {
                                return me.tool.getListText(v, me.rest_data);
                            },
                            date: function (v) {
                                return me.tool.day(v) + "("
                                    + me.tool.jweek(v) + ")";
                            },
                            time: function (v) {
                                return me.tool.timeStr(v);
                            }
                        }),
                    listeners: {
                        selectionchange: function (view, records) {
                            var data = records[0].data;
                            me.index = parseInt(data.date.substring(6, 8)) - 1// 日期设为Index
                            me.data = me.datas[me.index];
                            Ext.getCmp('panel_main').setActiveItem(1);
                            me.getData();
                        }
                    }
                };
            }
        })
    ;
var record = new Record();