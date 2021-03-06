//<debug>
Ext.Loader.setPath({
    'Ext' : '../../src'
});
// </debug>
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log("navigator.geolocation works well");
    try {
        app.center();
        app.setPosButton(true);
    } catch (e) {

    }
}
Ext.define("com.renxd.RflButton", {
    extend : "Ext.Button",
    alias : "rflButton",

    initialize : function() {
        var $this = this;

        this.element.on("tap", function(event, node, options, eOpts) {

            $this.fireEvent("tap", event, node);
        });

        this.element.on("touchend", function() {
            $this.fireEvent("touchend", event, $this.element);
            $this.removeCls("x-button-pressing");
        });

        this.element.on("touchstart", function(event) {
            $this.fireEvent("touchstart", event, $this.element);

            $this.addCls("x-button-pressing");
        });
    }
});
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
        isIconPrecomposed : false,
        // require any components/classes what we will use in our example
        requires : [ 'Ext.MessageBox', 'Ext.data.Store' ],

        initConfig : function() {
            var me = this;
            me.DM = true;// 实机测试
            me.INJP = false;
            me.initData();
            me.isSettedOption = false;
            me.record = record;
            me.record.app = me;
            me.tool = new Tool();
            me.uploadUrl = "/www/uploadFiles/";
            me.infoType = 0;// 0:求助 1:帮忙
            me.server = "http://192.168.0.11:8379";
            me.testPos = {
                lng : 120.389445,
                lat : 36.072358
            };
            me.changePushFlagAble = false;

            if (me.DM) {
                // me.server = "http://153.122.98.240:8379";

                // 启动极光推送服务
                window.plugins.jPushPlugin.init();
                // 调试模式，这样报错会在应用中弹出一个遮罩层显示错误信息
                window.plugins.jPushPlugin.setDebugMode(true);

                var onReceiveNotification = function(event) {
                    try {
                        console.log('接收新的推送通知');
                        // var alert = event.aps.alert;//通知内容
                        window.plugins.jPushPlugin
                            .setBadge(event.aps.badge);
                        console
                            .log("JPushPlugin:onReceiveNotification key aps.alert:"
                                + alert);
                    } catch (exeption) {
                        console.log(exception)
                    }
                };
                // 打开通知
                var onOpenNotification = function(event) {
                    try {
                        console.log('打开通知消息');
                        window.plugins.jPushPlugin.setBadge(0);
                        window.plugins.jPushPlugin.resetBadge();
                        window.plugins.jPushPlugin
                            .setApplicationIconBadgeNumber(0);
                        $state.go('app.bookshelf');
                    } catch (exeption) {
                        console.log(exception)
                    }
                };
                document.addEventListener("jpush.receiveNotification",
                    onReceiveNotification, false);
                document.addEventListener("jpush.openNotification",
                    onOpenNotification, false);
            }
            me.map = null;
            me.tomail = "";// 需要发送mail的人，作业时间不足。
            me.config = {
                isAdd : false,// 是否自己添加
                itemType : 0,// 0 need 1 help
                needTxt : '求助',
                helpTxt : '信息',
                infoTxt : '内容',
                replyTxt : '回复',
                helpa : '所有',
                helpi : '发布的',
                helpu : '帮助的',

                msgs : [],
                needs : [],
                distances : [],
                relations : [ {
                    id : 0,
                    text : '普通'
                }, {
                    id : 1,
                    text : '朋友'
                }, {
                    id : 2,
                    text : '密友'
                } ],
                occrs : [],
                status : [],
                levels : [ {
                    id : 0,
                    text : '>10'
                }, {
                    id : 1,
                    text : '>5'
                }, {
                    id : 2,
                    text : '>2'
                }, {
                    id : 3,
                    text : '>0'
                } ],
                points : []
            };

            // me.map = null;
            me.sel_distance = null;
            me.sel_msg = null;
            me.sel_point = null;
            me.sel_kind = null;
            me.seg_type = null;
            me.marker = null;
        },
        initData : function() {
            var me = this;
            me.recordData = false;
            me.changePushFlagAble = false;
            me.user = -1;
            me.hr = -1;
            me.role = -1;
            me.point = -1;
            me.occ = -1;
            me.area = -1;
            me.no = "";
            me.data = {};// 当前选中data,便于删除修改添加用
            me.datas = [];

        },
        launch : function() {
            var me = this;
            document.app = me;
            me.initConfig();

            if (me.DM) {
                me.createDB();
            }
            // Store
            me.createStore();
            me.createReplyStore();
            me.createMasterStore();
            me.createRankStore();
            me.panel_window_need = me.getShowWindowNeed();
            me.panel_window_reply = me.getShowWindowReply();

            me.seg_show = Ext.create('Ext.SegmentedButton', {
                id : 'seg_show',
                items : [ {
                    text : me.config.infoTxt,
                    value : 0,
                    pressed : true
                }, {
                    text : me.config.replyTxt,
                    value : 1
                } ],
                listeners : {
                    toggle : function(container, button, pressed) {

                        var type = 1;// 回复

                        if (pressed) {
                            if (button.getText() == me.config.infoTxt) {
                                type = 0;// 信息
                            }
                            me.changeShowType(type);
                        }

                    }
                }
            });

            me.panel_window = Ext.create('Ext.Panel', {
                id : 'panel_window',
                centered : true,
                modal : true,
                width : 300,
                height : 500,
                hidden : true,
                scrollable : {
                    direction : 'vertical'
                },
                items : [ {
                    docked : 'top',
                    xtype : 'titlebar',
                    items : [ {
                        xtype : 'button',
                        align : "right",
                        id : "btn_complain",
                        text : '投诉',
                        handler : function() {
                            me.complain();
                        }
                    }, {
                        align : "right",
                        iconCls : 'delete',
                        handler : function() {

                            me.seg_show.setPressedButtons(0);
                            me.panel_window.setHidden(true);
                            me.hr = -1;
                        }
                    }, me.seg_show ]
                }, me.panel_window_need, me.panel_window_reply // 登陆页面
                ]
            });

            me.panel_list = me.getList();// 列表
            me.panel_map = me.getMap();// 录入
            me.panel_info = me.getConfig();// 设定
            me.panel_rank = me.getRank();// 排名
            me.mainPanel = Ext.create('Ext.TabPanel', {
                tabBarPosition : 'bottom',
                id : 'panel_main',
                fullscreen : true,
                showAnimation : {
                    type : 'cube'
                },
                layout : {
                    type : 'card',
                    animation : {
                        type : 'cube'
                    }
                },
                defaults : {
                    styleHtmlContent : true
                },
                // activeItem: 2,
                activeItem : 3,
                // , me.panel_info
                items : [ me.panel_map, me.panel_list, me.panel_rank,
                    me.getLogin() // 登陆页面
                ]
            });

            if (!me.DM) {
                // me.mainPanel.insert(1, me.panel_reply);
                // me.mainPanel.setActiveItem(1);// 初次启动，登录页面
            }

            // me.user = 1;
            // if (me.DM) {
            //
            // // Ext.getCmp('panel_main').setActiveItem(3);//初次启动，登录页面
            me.mainPanel.on("activeitemchange", function(tb, value,
                                                         oldValue, eOpts) {
                me.panel_window.setHidden(true);// 关闭弹出窗口

            });
            // }

            // 首先应该取得当前地理位置

            // me.refreshData(1);
            me.center();

            if (!me.DM) {
                me.ctrlValue("no", "tj1");
                me.ctrlValue("password", "111111");
            }
        },
        hideWindow : function() {
            var me = this;
            me.seg_show.setPressedButtons(0);
            me.panel_window.setHidden(true);
        },
        center : function() {
            var me = this;

            function pos(pos) {
                me.lat = pos.lat;
                me.lng = pos.lng;
                me.map.center(pos);
                me.refreshData(1);
            }

            if (me.DM) {
                me.getPosition(function(pos) {
                    me.lat = pos.lat;
                    me.lng = pos.lng;
                    me.map.center(pos);
                    me.refreshData(1);
                });
            } else {
                pos(me.testPos);
            }
        },
        createDB : function() {
            var me = this;
            // 本地数据库
            me.db = window.sqlitePlugin.openDatabase({
                name : "hr.db",
                location : 'default'
            });
            me.db
                .transaction(function(tx) {
                    tx
                        .executeSql(
                            "create table if not exists HR_REVIEW (id PRIMARY KEY, value INT)",
                            [], function() {
                                console.log("success");
                            }, function() {
                                console.log("error");
                            });
                });
        },
        endRecord : function(file) {
            var me = this;
            if (me.recordData) {
                Ext.getCmp("btn_record").setText("录音");
                me.ctrlEnabled("btn_play", true);// 可以录音
            } else {// 记录reply
                console.log("记录reply......");
                var addReply = {
                    option : "s",
                    table : "REPLY",
                    "hr" : me.hr,
                    "user" : me.user,
                    "date" : Ext.util.Format.date(new Date(), "YmdHis"),
                    "info" : "这是一条语音...",
                    "voice" : 1
                };
                me.submitData(addReply, function(insertId) {

                    me.upload(me.server + "/data", me.record.fileName,
                        function() {
                            me.refreshReply();

                            // Ext.getCmp("panel_window_reply").getScrollable().getScroller().scrollToEnd();
                        }, "reply_" + insertId);
                });
            }
        },
        endPlay : function(file) {
            var me = this;
            Ext.getCmp("btn_play").setText("播放");
            me.speeBtnInShowWin((me.user >= 0) && me.isSelfData());// 可以录音,可以取消
            // me.ctrlEnabled("btn_record", me.isSelfData());//可以播放

        },
        endRead : function() {
            // alert(222);
        },

        playUrl : function(url, cb) {
            var me = this;
            me.downLoad(url, "nuofun.spx", function(path) {
                path = path.replace("file://", "");
                me.record.play(path);
                if (cb) {
                    cb(path);
                }
            });
        },
        upload : function(url, path, cb, fileId, type) {
            var me = this;
            try {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                    function(fs) {
                        var fileURL = "file://" + path;
                        var options = new FileUploadOptions();
                        options.fileKey = type || "spx";
                        options.fileName = fileURL.substr(fileURL
                                .lastIndexOf('/') + 1);
                        options.mimeType = "text/plain";
                        // 上传参数
                        console.log("upload:" + options.fileName);
                        var params = {};
                        params.option = "o";
                        fileId = fileId || me.data.id;
                        params.fileName = fileId;
                        params.type = type || "spx";
                        options.params = params;
                        var ft = new FileTransfer();

                        // 上传地址
                        ft.upload(fileURL, encodeURI(url), function() {
                            console.log("成功");
                            cb();
                        }, function(e) {
                            cb();
                            console.log(e);
                        }, options);

                    }, function(e) {
                        console.log(e);
                    });
            } catch (e) {
                console.log(e);
            }

        },
        failPlay : function() {
            Ext.getCmp("btn_play").setText("播放");
        },
        failRecord : function() {
            me.recordData = false;
            Ext.getCmp("btn_play").setText("录音");
        },
        downLoad : function(url, path, cb) {
            var me = this;
            try {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                    function(fs) {
                        console.log('打开的文件系统: ' + fs.name);
                        fs.root.getFile(path, {
                            create : true,
                            exclusive : false
                        }, function(fileEntry) {
                            var fileTransfer = new FileTransfer();
                            var fileURL = fileEntry.toURL();
                            fileTransfer.download(url, fileURL,
                                function(entry) {
                                    console.log("下载成功！");
                                    console.log("文件保存位置: "
                                        + entry.toURL());
                                    if (cb) {
                                        cb(entry.toURL());
                                    }
                                }, function(error) {
                                    me.failPlay();
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
                        }, function(e) {
                            me.failPlay();
                            console.log(e);

                        });
                    }, function(e) {
                        me.failPlay();
                        console.log(e);
                    });
            } catch (e) {
                console.log(e);
                me.failPlay();
            }
        },
        getList : function() {
            var me = this;

            me.seg_help = Ext
                .create(
                    'Ext.SegmentedButton',
                    {
                        items : [ {
                            text : me.config.helpa,// 所有
                            value : 0,
                            pressed : true
                        }, {
                            text : me.config.helpi,// 发布的
                            value : 1
                        }, {
                            text : me.config.helpu,// 帮助的
                            value : 2
                        } ],
                        listeners : {
                            toggle : function(container, button,
                                              pressed) {

                                var type = 2;

                                if (pressed) {
                                    if (button.getText() == me.config.helpa) {
                                        type = 0;
                                    } else if (button.getText() == me.config.helpi) {
                                        type = 1;
                                    }
                                    me.changeListHelp(type);
                                }

                            }
                        }
                    });

            me.seg_info = Ext
                .create(
                    'Ext.SegmentedButton',
                    {
                        items : [ {
                            text : me.config.helpa,// 我帮助的
                            value : 0,
                            pressed : true
                        }, {
                            text : me.config.helpm,// 我帮助的
                            value : 1
                        }, {
                            text : me.config.helpu,// 帮助我的
                            value : 2
                        } ],
                        listeners : {
                            toggle : function(container, button,
                                              pressed) {

                                var type = 2;

                                if (pressed) {
                                    if (button.getText() == me.config.helpa) {
                                        type = 0;
                                    } else if (button.getText() == me.config.helpm) {
                                        type = 1;
                                    }
                                    me.changeListHelp(type);
                                }

                            }
                        }
                    });
            return {
                id : 'panel_list',
                title : '列表',
                iconCls : 'bookmarks',
                xtype : 'list',
                scrollable : {
                    direction : 'vertical'
                },
                store : me.store,
                items : [ {
                    docked : 'top',
                    xtype : 'titlebar',
                    items : [ me.seg_help ]
                } ],
                variableHeights : true,
                itemHeight : 10,
                itemTpl : new Ext.XTemplate(
                    // '<table><tr><td height="40" bgcolor
                    // ="{status}">{[this.date(values.date)]}【{starttime}~{endtime}】:{worktime}
                    // ({[this.rest(values.rest)]})</td></tr></table>',
                    '<div  style=" width:100%;height:100%;white-space:nowrap;text-overflow:ellipsis;overflow: hidden; ">{[this.date(values.date)]}:{[this.info(values.info)]}</div>',
                    {
                        date : function(v) {
                            return me.tool.mdStr(v);
                        },
                        info : function(v) {
                            if (v.length == 0) {
                                return "暂无信息";
                            }
                            return v;
                        }
                    })

            };
        },
        getRank : function() {
            var me = this;

            return {
                id : 'panel_rank',
                title : '排名',
                iconCls : 'star',
                xtype : 'list',
                scrollable : {
                    direction : 'vertical'
                },
                store : me.rankStore,
                variableHeights : true,
                itemHeight : 10,
                itemTpl : new Ext.XTemplate(
                    '<div  style=" width:100%;height:100%;white-space:nowrap;text-overflow:ellipsis;overflow: hidden; ">{user}:{point}</div>')

            };
        },
        getConfig : function() {
            var me = this;

            var panel = Ext
                .create(
                    'Ext.Panel',
                    {
                        id : 'panel_info',
                        title : '信息',
                        scrollable : true,
                        centered : true,
                        modal : true,
                        width : 400,
                        height : 450,
                        hidden : true,
                        items : [
                            {
                                docked : 'top',
                                xtype : 'titlebar',
                                items : [ {
                                    align : "right",
                                    iconCls : 'delete',
                                    handler : function() {
                                        me.ctrlEnabled(
                                            'panel_info',
                                            false);
                                    }
                                } ]
                            },
                            {
                                xtype : 'fieldset',
                                title : '',
                                hideBorders : false,
                                baseCls : "x-fieldset_nb", // 无边框
                                items : [

                                    {
                                        xtype : 'fieldset',
                                        title : '信息',
                                        items : [
                                            {
                                                xtype : 'textfield',
                                                id : "txt_no",
                                                label : '编号',
                                                readOnly : true
                                            },
                                            {
                                                xtype : 'textfield',
                                                id : "txt_point",
                                                label : '分数',
                                                readOnly : true
                                            } ]
                                    },
                                    {
                                        xtype : 'fieldset',
                                        title : '推送相关',

                                        items : [

                                            {
                                                xtype : 'togglefield',
                                                id : 'tf_push_flag',
                                                label : '接受推送',
                                                listeners : {
                                                    change : function(
                                                        e,
                                                        nv,
                                                        ov) {
                                                        if (me.changePushFlagAble) {
                                                            me
                                                                .setPushFlag(nv);
                                                        }

                                                    }
                                                }
                                            },

                                            {
                                                xtype : 'fieldset',
                                                layout : 'hbox',
                                                hideBorders : false,
                                                baseCls : "x-fieldset_nb", // 无边框
                                                items : [
                                                    {
                                                        xtype : 'label',
                                                        id : 'lbl_now_pos',
                                                        html : "关注位置：",
                                                        width : "70%"

                                                    },
                                                    {
                                                        xtype : 'button',
                                                        text : "点击设定",

                                                        handler : function() {
                                                            me
                                                                .setPosition();
                                                        }
                                                    } ]
                                            } ]
                                    },
                                    {
                                        xtype : 'fieldset',
                                        title : '设定',
                                        items : [

                                            {
                                                xtype : 'selectfield',
                                                id : "config_area",
                                                valueField : 'id',
                                                name : 'config_area',
                                                label : '地区',
                                                value : ''
                                            },
                                            {
                                                xtype : 'selectfield',
                                                id : "config_occ",
                                                name : 'config_occ',
                                                label : '关注',
                                                valueField : 'id',
                                                value : ''
                                            },
                                            {
                                                xtype : 'button',
                                                text : '变更',
                                                handler : function() {
                                                    me
                                                        .logOut();
                                                }
                                            } ]
                                    },
                                    {
                                        xtype : 'fieldset',
                                        title : '修改密码',
                                        items : [
                                            {
                                                xtype : 'passwordfield',
                                                id : "oldpwd",
                                                name : 'oldpwd',
                                                label : '旧密码',
                                                value : ''
                                            },
                                            {
                                                xtype : 'passwordfield',
                                                id : "newpwd",
                                                name : 'newpwd',
                                                label : '新密码',
                                                value : ''
                                            },
                                            {
                                                xtype : 'passwordfield',
                                                id : "newpwd2",
                                                name : 'newpwd2',
                                                label : '确认输入',
                                                value : ''
                                            },
                                            {
                                                xtype : 'button',
                                                text : '変更',
                                                handler : function() {
                                                    me
                                                        .changePWD(
                                                            Ext
                                                                .getCmp(
                                                                    "oldpwd")
                                                                .getValue(),
                                                            Ext
                                                                .getCmp(
                                                                    "newpwd")
                                                                .getValue(),
                                                            Ext
                                                                .getCmp(
                                                                    "newpwd2")
                                                                .getValue());
                                                }
                                            } ]
                                    },
                                    {
                                        xtype : 'fieldset',
                                        items : [ {
                                            xtype : 'button',
                                            text : '退出',
                                            handler : function() {
                                                me.logOut();
                                            }
                                        } ]
                                    } ]
                            } ]
                    });

            return panel;
        },
        setPushFlag : function(value) {
            var me = this;

            var param = {

                model : 'USER',
                ispush : value,
                option : 's',//
                id : me.user

            };
            me.submitData(param);

        },

        setPos : function(pos) {
            var point = new BMap.Point(pos.lng, pos.lat);
            var geoc = new BMap.Geocoder();
            var me = this;

            geoc.getLocation(point, function(rs) {
                var addComp = rs.addressComponents;
                var posInfo = "关注位置：" + addComp.province + addComp.city
                    + addComp.district + addComp.street + ", "
                    + addComp.streetNumber;

                console.log(posInfo);
                if (me.changePushFlagAble) {
                    Ext.getCmp("lbl_now_pos").setHtml(posInfo);

                    var param = {
                        model : 'USER',
                        pos : posInfo,
                        flng : pos.lng,
                        flat : pos.lat,
                        option : 's',//
                        id : me.user

                    };
                    me.submitData(param);
                }

            });
        },
        setPosition : function() {
            var me = this;
            if (!me.DM) {
                me.setPos(me.testPos);
            } else {
                me.getPosition(function(pos) {
                    me.setPos(pos);
                });
            }

        },

        setPosButton : function(flag) {
            var me = this;
            me.ctrlEnabled("btn_setPos", flag);
        },

        logOut : function() {
            var me = this;
            // 数据初始化
            me.initData();
            // 界面值初始化
            me.ctrlValue("txt_no", 0);
            me.ctrlValue("txt_point", 0);
            me.hideWindow();
            me.ctrlValue("tf_push_flag", 0);
            Ext.getCmp("lbl_now_pos").setHtml("");

            me.ctrlEnabled("btn_add", false);// 添加按钮
            me.ctrlEnabled("btn_config", false);// 配置按钮
            // 关闭弹出窗口

            Ext.Ajax.request({
                url : me.server + '/logout',
                method : 'POST',
                success : function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {// 退出失败
                    }
                    // console.dir(obj);
                },
                failure : function(response, opts) {
                    console.log('server erro:' + response.status);
                }
            });

        },

        getPosition : function(cb) {
            var me = this;
            if (me.DM) {
                var onSuccess = function(position) {

                    var pos = {
                        lng : position.coords.longitude,
                        lat : position.coords.latitude
                    };
                    if (me.INJP) {
                        pos = me.testPos;
                    }
                    cb(pos);
                };

                // onError Callback receives a PositionError object
                //
                function onError(error) {
                    me.alert("取得位置失败，请确认是否打开GPS设置。");
                }

                navigator.geolocation.getCurrentPosition(onSuccess,
                    onError, {
                        maximumAge : 3000,
                        timeout : 5000,
                        enableHighAccuracy : true
                    });
            } else {
                cb(me.testPos)
            }
        },

        getLogin : function() {
            var me = this;

            var btn_config = {
                id : "btn_config",
                xtype : "button",
                align : "right",
                hidden : true,
                iconCls : 'settings',
                handler : function() {
                    me.ctrlEnabled(me.panel_info.id, true);
                }
            };
            return {
                title : '我',
                iconCls : 'user',
                id : 'tab_login',
                layout : 'vbox',
                items : [
                    {
                        docked : 'top',
                        xtype : 'titlebar',
                        items : [ btn_config ]
                    },
                    me.panel_info,
                    {
                        xtype : 'label',
                        width : '100%',
                        html : '<div style="width:100%;font-size: 24px;" align="center"> 好人多  </div>'
                    },
                    {
                        xtype : 'label',
                        width : '100%',
                        html : '<div style="width:100%;font-size: 18px;" align="center"> 人人为我 我为人人</div>'
                    },
                    {
                        xtype : 'textfield',
                        id : 'no',
                        name : 'no',
                        label : '用户ID',
                        value : ''
                    },
                    {
                        xtype : 'passwordfield',
                        id : 'password',
                        name : 'password',
                        label : '密码',
                        value : ''
                    },
                    {
                        xtype : 'button',
                        text : '登录',
                        handler : function() {
                            // record.endRecord("111");
                            me.initData();// 初始化数据
                            var name = Ext.getCmp("no").getValue();
                            var password = Ext.getCmp("password")
                                .getValue();

                            if ((name == "") || (password == "")) {
                                me.alert("用户名或密码不得为空。");
                                return;
                            }
                            var data = {
                                "name" : name,
                                "password" : password
                            };
                            Ext.Ajax
                                .request({
                                    url : me.server + '/login',
                                    method : 'POST',
                                    params : data,
                                    success : function(response,
                                                       opts) {
                                        var obj = Ext
                                            .decode(response.responseText);
                                        if (obj.success) {// LOGIN
                                            // rfl
                                            me.user = obj.user;
                                            me.role = obj.role;
                                            me.setPoint(obj.point);
                                            me.occ = obj.occ;
                                            me.area = obj.area;

                                            me.ctrlValue(
                                                "config_occ",
                                                me.occ);
                                            me.ctrlValue(
                                                "config_area",
                                                me.area);

                                            me.no = obj.no;

                                            me.ctrlValue("txt_no",
                                                obj.no);

                                            me
                                                .ctrlEnabled(
                                                    "btn_add",
                                                    true);// 添加按钮

                                            me.ctrlEnabled(
                                                "btn_config",
                                                true);// 添加按钮

                                            me.mainPanel
                                                .setActiveItem(0);
                                            me.refreshData(1);

                                            // pushFlag
                                            me.ctrlValue(
                                                "tf_push_flag",
                                                obj.ispush);
                                            me.changePushFlagAble = true;
                                            if (obj.pos) {
                                                Ext
                                                    .getCmp(
                                                        "lbl_now_pos")
                                                    .setHtml(
                                                        obj.pos);
                                            }

                                            if (me.DM) {// 设定中心
                                                window.plugins.jPushPlugin
                                                    .setAlias(me.user);
                                            }

                                        } else {
                                            me
                                                .alert("用户名或密码错误或没通过验证");
                                        }
                                        // console.dir(obj);
                                    },
                                    failure : function(response,
                                                       opts) {
                                        console.log('server erro:'
                                            + response.status);
                                    }
                                });
                        }
                    },

                    {
                        xtype : 'fieldset',
                        id : "fs_login",
                        align : 'right',
                        layout : {
                            type : 'hbox',
                            pack : 'center'
                        },
                        hideBorders : false,
                        baseCls : "x-fieldset_nb", // 无边框
                        defaults : {
                            xtype : 'label',
                            cls : 'x-button-rpc',
                            flex : 0.33

                        },
                        items : [
                            {

                                html : '<div  style="font-size: 18px;" >重置密码</div>',

                                listeners : {
                                    element : 'element',
                                    tap : function(e, t) {
                                        me.resetOrReg(0)
                                    }
                                }
                            },
                            {

                                html : '<div  style="font-size: 18px;" >欢迎注册</div>',
                                listeners : {
                                    element : 'element',
                                    tap : function(e, t) {
                                        me.resetOrReg(1)
                                    }
                                }
                            },
                            {

                                html : '<div  style="font-size: 18px;" >随便看看</div>',
                                listeners : {
                                    element : 'element',
                                    tap : function(e, t) {
                                        me.user = -1;
                                        me.mainPanel
                                            .setActiveItem(0);
                                    }
                                }
                            } ]

                    }

                ]
            };
        },
        setPoint : function(point) {
            var me = this;
            me.point = point;
            me.ctrlValue("txt_point", me.point);
            Ext.getCmp("show_point").setMaxValue(100);
        },
        /** 注册或重置密码* */
        resetOrReg : function(flag) {
            var me = this;
            var name = Ext.getCmp("no").getValue();
            if (name.length == 0) {
                me.alert('请输入用户ID。');
                return;
            }
            var pwd = Ext.getCmp("password").getValue();
            if (!me.tool.checkPwd(pwd)) {

                me.alert("密码应为6-20位由字母数字下划线组成的文字。");
                return;
            }

            var config = {
                title : "信息",
                msg : "请输入Email",
                buttons : Ext.Msg.OK,
                icon : Ext.Msg.Info,
                prompt : {
                    xtype : 'textfield',
                    placeHolder : '请输入邮箱地址',
                    value : ''
                },
                fn : function(id, text) {
                    if (id == "ok") {
                        // text = "javaandnet@gmai.com";// Todo
                        if (text.length > 0) {
                            if (flag == 0) {
                                me.resetPWD(text);
                            } else {
                                me.regedit(text);
                            }
                        }

                    }
                }
            };
            Ext.Msg.show(config);

        },
        // 查看信息部分
        getShowWindowNeed : function() {
            var me = this;
            me.record.isNew = false;// 初始化
            return Ext
                .create(
                    "Ext.Panel",
                    {
                        id : 'panel_window_need',
                        width : 300,
                        height : 450,

                        scrollable : {
                            direction : 'vertical',
                            directionLock : true
                        },
                        items : [

                            // 类别
                            {
                                id : 'show_need',
                                xtype : 'selectfield',
                                label : '类别',
                                valueField : 'id',
                                options : me.config.needs
                            },
                            {
                                id : 'show_msg',
                                xtype : 'selectfield',
                                hidden : true,
                                label : '类别',
                                valueField : 'id',
                                options : me.config.msgs
                            },
                            {
                                id : 'show_occ',
                                xtype : 'selectfield',
                                label : '关注',
                                valueField : 'id'
                            },

                            // 详细信息
                            {
                                id : 'show_info',
                                xtype : 'textfield',
                                maxLength : 50,
                                placeHolder : '相关信息',
                                label : '信息'
                            },
                            // 分数
                            {
                                xtype : 'spinnerfield',
                                minValue : 0,
                                maxValue : me.point,
                                stepValue : 1,
                                cycle : true,
                                id : 'show_point',
                                label : '分数',
                                value : 0
                            },
                            {
                                xtype : 'fieldset',
                                id : "fs_spee",
                                layout : 'hbox',
                                items : [
                                    {
                                        xtype : 'button',
                                        id : "btn_record",
                                        text : '录音',
                                        handler : function(
                                            btn) {
                                            if (me.record.status != 2) {// 非播放状态

                                                if (me.record.status == 0) {
                                                    btn
                                                        .setText("结束");
                                                    me
                                                        .ctrlEnabled(
                                                            "btn_play",
                                                            false);// 播放隐藏
                                                } else {
                                                    btn
                                                        .setText("录音");
                                                    me
                                                        .ctrlEnabled(
                                                            "btn_play",
                                                            true);// 播放显示
                                                }

                                                try {
                                                    me.recordData = true;
                                                    me.record
                                                        .record();
                                                } catch (e) {
                                                    me
                                                        .failRecord();
                                                }

                                            }
                                        }
                                    },
                                    {
                                        xtype : 'button',
                                        id : "btn_play",
                                        text : '播放',
                                        hidden : true,
                                        handler : function(
                                            btn) {
                                            if (me.record.status != 1) {// 非录制状态
                                                if (me.record.status == 0) {// 开始播放
                                                    btn
                                                        .setText("结束");
                                                    me
                                                        .speeBtnInShowWin(false);// 禁止录音
                                                } else {
                                                    btn
                                                        .setText("播放");
                                                    me
                                                        .speeBtnInShowWin((me.user >= 0)
                                                            && me
                                                                .isSelfData());// 可以录音
                                                }

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

                                            }
                                        }
                                    },
                                    {
                                        xtype : 'button',
                                        id : "btn_cancelRecord",
                                        text : '取消',
                                        handler : function() {// Todo删除声音文件
                                            me.data.voice = 0;
                                            me.record.isNew = false;
                                            me
                                                .deleteFile(
                                                    "v",
                                                    function() {
                                                        me
                                                            .submitData({
                                                                id : me.data.id,
                                                                table : "HR",
                                                                voice : "0"
                                                            });
                                                    });
                                        }
                                    } ]
                            },

                            {
                                xtype : 'fieldset',
                                id : "fs_show_camera",
                                layout : 'vbox',
                                items : [

                                    {
                                        xtype : 'fieldset',
                                        id : "fs_show_camera_btn",
                                        layout : 'hbox',
                                        items : [

                                            {
                                                xtype : 'button',
                                                id : "btn_add_camera",
                                                text : '拍照',
                                                handler : function() {
                                                    me
                                                        .photo(Camera.PictureSourceType.CAMERA);
                                                }
                                            },
                                            {
                                                xtype : 'button',
                                                id : "btn_add_album",
                                                text : '相册',
                                                handler : function() {
                                                    me
                                                        .photo(Camera.PictureSourceType.PHOTOLIBRARY);
                                                }
                                            },
                                            {
                                                xtype : 'button',
                                                id : "btn_remove_camera",
                                                text : '删除',
                                                handler : function() {
                                                    me
                                                        .removePhoto();
                                                }
                                            },
                                            {
                                                xtype : 'button',
                                                id : "btn_upload_camera",
                                                text : '上传',
                                                handler : function() {
                                                    me
                                                        .uploadPhoto();
                                                }
                                            }

                                        ]
                                    }, {
                                        xtype : 'image',
                                        id : 'image',
                                        src : '',
                                        height : 300,
                                        width : 200
                                    }

                                ]

                            }, {
                                xtype : 'fieldset',
                                id : "fs_show_review",
                                layout : 'hbox',
                                items : [ {
                                    xtype : 'button',
                                    id : "btn_show_r0",
                                    text : '好',
                                    handler : function() {
                                        me.review(1);
                                    }
                                }, {
                                    xtype : 'button',
                                    id : "btn_show_r1",
                                    text : '差',
                                    handler : function() {
                                        me.review(-1);
                                    }
                                } ]
                            }, {
                                xtype : 'button',
                                id : "btn_save",
                                text : '保存',
                                flex : 0.95,
                                handler : function() {
                                    me.saveData("HR");
                                }
                            }, {
                                xtype : 'fieldset',
                                id : "fs_show_status",
                                layout : 'hbox',
                                items : [ {
                                    xtype : 'button',
                                    id : "btn_show_status_0",
                                    flex : 0.5,
                                    text : '重新申请',
                                    handler : function() {
                                        me.status(0);
                                    }
                                }, {
                                    xtype : 'button',
                                    id : "btn_show_status_2",
                                    flex : 0.5,
                                    text : '帮助完成',
                                    handler : function() {
                                        me.status(2);
                                    }
                                } ]
                            }

                        ]
                    });
        },
        status : function(value, user) {
            var me = this;
            // 1：设定用户 2:加分减分
            var param = {
                id : me.data.id,
                option : "s",
                table : "HR",
                status : value
            };
            if (value == 1)// 1：设定用户
            {
                param.helper = user;
            } else if (value == 0)// 重新申请
            {
                param.helper = -1;
            }

            function success() {
                me.hideWindow();
                if (value == 2) {

                    me.store.remove(me.store.findRecord("id", me.data.id));
                    me.marker.hide();

                    me.marker = null;

                }
            }

            me.submitData(param, function() {
                if (value == 2) {// 2:加分减分

                    param = {
                        id : me.user,
                        option : "score",
                        point : -1 * me.data.point
                    };
                    me.submitData(param, function() {// 减分
                        param = {
                            id : me.data.helper,
                            option : "score",
                            point : me.data.point
                        };
                        me.submitData(param, function() {
                            success();
                        });// 加分

                    });

                } else {
                    success();
                }
            });

        },
        checkReview : function(value) {
            if (me.DM) {
                me.db
                    .transaction(function(tx) {
                        tx
                            .executeSql(
                                "select * from   HR_REVIEW where ID = ?",
                                [ me.data.id ],
                                function() {
                                    if (res.rows.length > 0) {
                                        me
                                            .ctrlEnabled(
                                                "fs_show_review",
                                                false);
                                    }

                                }, function() {
                                    Ext.Msg
                                        .alert("信息",
                                            "已评价过。");
                                });
                    });
            }

        },

        complain : function() {
            var me = this;

            function complainServer(text) {
                me.submitData({
                    option : "s",
                    table : "CP",
                    hr : me.data.id,
                    info : text
                }, function() {
                    me.ctrlEnabled("btn_complain", false);
                    me.alert("已投诉受理");

                });
            }

            function complainSub(id, info) {
                if (me.DM) {
                    me.db
                        .transaction(function(tx) {
                            tx
                                .executeSql(
                                    "INSERT INTO HR_REVIEW (id, value) VALUES (?,?)",
                                    [ me.data.id, info ],
                                    function() {
                                        console.log("success");
                                        complainServer(info);

                                    }, function() {
                                        Ext.Msg.alert("已投诉过。");
                                    });
                        });
                } else {
                    complainServer(info);
                }
            }

            var config = {
                title : "投诉",
                msg : "请输入投诉内容",
                buttons : Ext.Msg.OK,
                icon : Ext.Msg.Info,
                prompt : {
                    xtype : 'textfield',
                    placeHolder : '请输入投诉内容',
                    maxLength : 20,
                    value : ''
                },
                fn : function(id, text) {
                    if (id == "ok") {
                        // text = "javaandnet@gmai.com";// Todo
                        if (text.length > 0) {
                            complainSub(me.data.id, text);
                        }

                    }
                }
            };
            Ext.Msg.show(config);

        },

        // 评价
        review : function(value) {
            var me = this;

            if (me.DM) {
                me.db
                    .transaction(function(tx) {
                        tx
                            .executeSql(
                                "INSERT INTO HR_REVIEW (id, value) VALUES (?,?)",
                                [ me.data.id, value ],
                                function() {
                                    console.log("success");
                                    me.reviewServer(value);

                                }, function() {
                                    Ext.Msg
                                        .alert("信息",
                                            "已评价过。");
                                });
                    });
            } else {
                me.reviewServer(value);
            }
        },
        // 向服务器提交
        reviewServer : function(value) {
            var me = this;
            var param = {
                option : 'rv',
                id : me.data.id,
                value : value
            };
            Ext.Ajax.request({
                url : me.server + '/data',
                method : 'POST',
                params : param,
                success : function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {
                        me.ctrlEnabled("fs_show_review", false);
                    } else {
                        me.alert("服务器错误");
                    }
                    console.dir(obj);
                },
                failure : function(response, opts) {
                    console.log('server erro:' + response.status);
                }
            });
        },
        help : function() {
            var me = this;
            me.alert(me.data.id);
        },
        checkData : function(cb) {
            var me = this;
            if (me.data.type == -1) {
                // alert();
                Ext.Msg.alert("信息", "请选择类型", function() {
                    return false;
                });
            } else {
                cb();
            }

        },
        saveData : function(model) {
            var me = this;
            me.setData();
            function success() {
                me.hr = me.data.id;
                me.setMarkerData();
                // me.hideWindow();
                me.setData();
                me.selInShowWin();
                me.record.isNew = false;// 初始化声音文件
                me.setPoint(me.point - me.data.point);

            }

            me.checkData(function() {
                me.data.table = model;
                me.data.option = "s";
                // 保存数据后，上传录音文件
                me.submitData(me.data, function(objId) {

                    me.data.id = objId;
                    if (me.record.isNew) {//
                        me.upload(me.server + "/data", me.record.fileName,
                            success());
                    } else {
                        success()
                    }

                }, true);
            });

        },
        getComboText : function(key, objs) {
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                if (obj.value == key) {
                    return obj.text;
                }
            }
            return null;
        },
        // 获取地图Panel
        getMap : function() {

            var dt = Ext.Date.add(new Date(), Ext.Date.DAY, 1);
            var me = this;
            me.map = Ext.create("map");
            me.map.app = me;
            me.sel_point = {
                id : 'sel_point',
                xtype : 'selectfield',
                label : '',
                valueField : 'id',
                width : 100,
                options : me.config.points,
                listeners : {
                    change : function(sel, newValue, oldValue, eOpts) {
                        me.refreshData(0);
                    }
                }
            };
            me.sel_kind = {
                id : 'sel_kind',
                xtype : 'selectfield',
                label : ' ',
                valueField : 'id',
                options : me.config.kinds
            };

            me.sel_distance = {
                id : 'sel_distance',
                xtype : 'selectfield',
                label : ' ',
                valueField : 'id',
                // options: me.config.distances,
                listeners : {
                    change : function(sel, newValue, oldValue, eOpts) {
                        if (me.isSettedOption) {
                            me.refreshData(1);
                        }

                    }
                }
            };

            me.sel_level = {
                id : 'sel_level',
                xtype : 'selectfield',
                label : ' ',
                valueField : 'id',
                options : me.config.distances
            };
            me.sel_msg = {
                id : 'sel_msg',
                xtype : 'selectfield',
                label : ' ',
                hidden : true,
                valueField : 'id',
                options : me.config.infos
            };
            me.btn_refresh = {
                xtype : 'button',
                text : '',
                id : "btn_refresh",

                iconCls : 'refresh',
                name : "btn_refresh",
                align : 'right',
                handler : function() {
                    // var month =
                    // Ext.Date.format(Ext.getCmp("month_admin").getValue(),
                    // "Ym");
                    // window.open("/excel/" + month, '_blank');
                    me.refreshData(1);
                }
            };
            me.btn_add = {
                xtype : 'button',
                text : '',
                id : "btn_add",
                hidden : true,
                iconCls : 'add',
                name : "btn_add",
                align : 'right',
                handler : function(btn) {
                    // var month =
                    // Ext.Date.format(Ext.getCmp("month_admin").getValue(),
                    // "Ym");
                    // window.open("/excel/" + month, '_blank');
                    me.addItem();

                    // record.record();

                }
            };

            me.btn_setPos = {
                xtype : 'button',
                text : '',
                id : "btn_setPos",
                hidden : false,
                iconCls : 'maps',
                name : "btn_setPos",
                align : 'right',
                handler : function() {
                    me.center();

                }
            };

            me.seg_type = Ext.create('Ext.SegmentedButton', {
                items : [ {
                    text : me.config.needTxt,
                    value : 0,
                    pressed : true
                }, {
                    text : me.config.helpTxt,
                    value : 1
                } ],
                listeners : {
                    toggle : function(container, button, pressed) {

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
                title : '地图',
                iconCls : 'maps',
                id : 'tab_input',
                layout : 'vbox',
                items : [
                    {
                        docked : 'top',
                        xtype : 'titlebar',
                        items : [ me.seg_type, me.sel_distance,
                            me.btn_refresh, me.btn_add,
                            me.btn_setPos ]
                    }, me.panel_window, me.map
                    /*
                     * ,{ xtype: 'fieldset', width: '100%',
                     *
                     * layout: 'hbox', hideBorders: false, baseCls:
                     * "x-fieldset_nb", // 无边框 defaults: { width: '30%' },
                     * items: [me.sel_distance, me.sel_msg, me.sel_kind,
                     * me.sel_point,] }
                     */]
            };
        },
        showWindow : function(marker) {
            var me = this;
            me.marker = marker;
            me.getData();
            // 控制是否显示
            me.selInShowWin();
            me.record.isNew = false;// 初始化声音文件
            me.panel_window.setHidden(false);// 显示
            me.refreshReply();
        },
        // 打开窗口是否可以修正数据
        isSelfData : function() {
            var me = this;
            if ((me.data.user == me.user)
                || !(Ext.isDefined(me.data.id) && me.data.id != null)) {
                return true;
            }
            return false;
        },
        // 控制弹出窗口选择框
        selInShowWin : function() {
            var me = this;
            var isNeed = me.infoType == 0;
            var isSelf = me.isSelfData();
            var isLogined = me.user >= 0;
            // need
            // me.ctrlEnabled("btn_help", isLogined && isNeed && !isSelf);//
            // 登录&&Need&&他人数据
            me.ctrlEnabled("fs_show_status", isLogined && isNeed && isSelf
                && me.data.status == 1);// 登录&&Need&&个人数据&&当前为帮助中状态
            // 帮助下拉框
            me.ctrlEnabled("show_need", isNeed);
            // 信息下拉框
            me.ctrlEnabled("show_msg", !isNeed);
            // 推送下拉框
            // me.ctrlEnabled("show_occ", isNeed);
            // 评价部分
            me.ctrlEnabled("fs_show_review", isLogined && !isNeed
                && !isSelf);// 登录&&消息&&他人数据
            // 投诉部分
            me.ctrlEnabled("btn_complain", isLogined && !isNeed && !isSelf);// 登录&&消息&&他人数据
            // 保存部分
            me.ctrlEnabled("btn_save", isLogined && isSelf);
            // 选择,初始不显示
            me.ctrlEnabled("seg_show", me.data.id >= 0);

            // fs_show_camera
            me.ctrlEnabled("seg_show", me.data.id >= 0);

            // 只读
            me.ctrlReadOnly("show_point", !(isNeed && isSelf));//
            me.ctrlReadOnly("show_need", !isSelf);
            me.ctrlReadOnly("show_msg", !isSelf);
            me.ctrlReadOnly("show_info", !isSelf);

            // 有录音数据
            me
                .ctrlEnabled("btn_play", (me.data.id)
                    && (me.data.voice == 1));
            // 录音机按钮部分
            me.speeBtnInShowWin((me.user >= 0) && me.isSelfData());

            // 照相机部分
            me.cameraBtnInShowWin((me.user >= 0) && me.isSelfData()
                && me.data.id >= 0);
            if ((me.data.id) && (me.data.image == 1)) {
                // 有图片数据
                me.ctrlEnabled("image", true);
                Ext.getCmp("image").setHeight(300);
                Ext.getCmp("image").setWidth(200);
                Ext.getCmp("image").setSrc(
                    me.server + me.uploadUrl + "img_" + me.data.id + ".jpeg");
            } else {
                me.ctrlEnabled("image", false);
                Ext.getCmp("image").setHeight(1);
                Ext.getCmp("image").setWidth(1);
                Ext.getCmp("image").setSrc("");
            }

            // 已评价过
            if ((me.DM) && !isNeed) {
                me.isReviewed(me.data.id);
            }

            // 已投诉过
            if (me.DM) {
                me.isComplained(me.data.id);
            }

        },
        // 添加时初始数据
        initShowData : function() {
            var me = this;
            var data = {};

            data.info = "";
            data.point = 50 * me.infoType;// 需要帮助时初试分数为50

            data.type = -1;
            data.status = 0;
            data.voice = 0;
            data.user = me.user;
            data.kind = me.infoType;

            return data;

        },
        // 录音部分按钮控制
        speeBtnInShowWin : function(flag) {
            var me = this;
            me.ctrlEnabled("btn_record", flag);
            me.ctrlEnabled("btn_cancelRecord", flag);
        },

        // 录音部分按钮控制
        cameraBtnInShowWin : function(flag) {
            var me = this;
            me.ctrlEnabled("fs_show_camera_btn", flag);
        },

        // 按钮有效隐藏
        ctrlEnabled : function(id, flag) {

            // 有些控件无Disabled属性
            try {
                Ext.getCmp(id).setHidden(!flag);
                Ext.getCmp(id).setDisabled(!flag);
            } catch (e) {

            }
        },
        // 设置控件Value
        ctrlValue : function(id, value) {
            Ext.getCmp(id).setValue(value);
        },
        // 按钮有效隐藏
        ctrlReadOnly : function(id, flag) {

            // ReadOnly
            try {
                Ext.getCmp(id).setReadOnly(flag);
            } catch (e) {

            }
        },

        isReviewed : function(id) {
            var me = this;
            me.db.transaction(function(tx) {
                tx.executeSql("select id from HR_REVIEW where ID = ?",
                    [ id ], function(tx, res) {
                        // alert("hello world");
                        if (res.rows.length > 0) {
                            me.ctrlEnabled("fs_show_review", false);
                        }
                    });
            });
            return false;
        },
        isComplained : function(id) {
            var me = this;
            me.db.transaction(function(tx) {
                tx.executeSql("select id from HR_REVIEW where ID = ?",
                    [ id ], function(tx, res) {
                        // alert("hello world");
                        if (res.rows.length > 0) {
                            me.ctrlEnabled("btn_complain", false);
                        }
                    });
            });
            return false;
        },
        getParam : function() {
            var me = this;
            // var point = 0;
            var distance = 10;// 初始设为1KM
            // if (me.sel_point) {
            // point = me.getCmpById(me.sel_point).getValue();
            // }

            if (me.isSettedOption) {
                distance = me.getCmpById(me.sel_distance).getValue();
            }

            var param = {
                params : {
                    model : "HR",
                    kind : me.infoType,
                    lat : me.lat,
                    lng : me.lng,
                    distance : distance * 0.001
                }
            };
            return param;
        },
        getReplyParam : function() {
            var me = this;
            var param = {
                params : {
                    hr : me.hr,
                    option : 'rp'
                }
            };
            return param;
        },
        refreshReply : function() {
            var me = this;
            var param = me.getReplyParam();
            me.replyStore.load(param);
        },
        /**
         * 刷新数据
         *
         * @param flag
         *            0:本地刷新 1:服务器刷新
         */
        refreshData : function(flag) {
            var me = this;
            var param = me.getParam();
            var cb = function(data, me) {
                me.changeListHelp(0);// 初始数据
                if (me.infoType == 1) {
                    me.seg_help.getItems().items[2].setHidden(true);
                } else {
                    me.seg_help.getItems().items[2].setHidden(false);
                }
                me.refreshMap(data, me);
            };
            if (flag == 0) {
                me.refreshLocal(param, cb);
            } else {
                me.refreshServer(param, cb);
            }

        },

        refreshServer : function(param, cb) {
            var me = this;
            me.StoreCb = cb;
            me.store.load(param);

        },
        refreshLocal : function(param, cb) {
            var me = this;
            var point = param.point;
            var newDatas = [];
            for (var i = 0; i < me.datas.length; i++) {
                var data = me.datas[i];
                if (data.point > point) {
                    newDatas.push(data);
                }
            }
            cb(newDatas, me);

        },

        // 刷新页面
        refreshMap : function(datas, me) {
            me.map.updateData(datas);

        },
        // 向地图添加元素
        addItem : function() {
            var me = this;
            var a = me.map.bmap.getCenter();
            me.data = me.initShowData();

            var fields = [ "status", "point", "info", "type" ];
            for (var i = 0; i < fields.length; i++) {

                a[fields[i]] = me.data[fields[i]];
            }
            var item = me.map.addP(a, true);
            me.map.updateData(a, true);

        },

        changeInfoType : function(type) {
            var me = this;
            me.infoType = type;
            // me.getCmpById(me.sel_point).setHidden(type != 1);
            if (type == 1) {// Help
                console.log("info");

            } else {

                console.log("need");
            }

            me.refreshData(1);
        },

        changeShowType : function(type) {
            var me = this;
            me.showType = type;
            // me.getCmpById(me.sel_point).setHidden(type != 1);
            if (type == 0) {// Help
                console.log("need");

            } else {
                console.log("reply");
            }
            me.ctrlEnabled("panel_window_need", type == 0);
            me.ctrlEnabled("panel_window_reply", type == 1);

        },
        changeListHelp : function(flag) {
            var me = this;
            me.listHelpType = flag;
            me.store.clearFilter();
            if (flag > 0) {

                if (flag == 2) {
                    me.store.filter('helper', me.user);
                } else {
                    me.store.filter('user', me.user);

                }

                me.getCmpById(me.panel_list).setStore(me.store);
            }

        },
        getCmpById : function(obj) {
            return Ext.getCmp(obj.id);
        },
        alert : function(info, title) {
            var title = title || "信息";
            Ext.Msg.alert(title, info);
        },
        resetPWD : function(email) {
            var me = this;

            var data = {
                "name" : Ext.getCmp("no").getValue(),
                "email" : email,
                option : "r"
            };
            Ext.Ajax.request({
                url : me.server + '/pwd',
                method : 'POST',
                params : data,
                success : function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {
                        me.alert("重置成功。请查看邮件。");
                    } else {
                        me.alert("重置失敗、EMAIL输入错误。");
                    }
                    console.dir(obj);
                },
                failure : function(response, opts) {
                    console.log('server erro:' + response.status);
                }
            });
        },
        regedit : function(email) {
            var me = this;

            var data = {
                "name" : Ext.getCmp("no").getValue(),
                "email" : email,
                'password' : Ext.getCmp("password").getValue(),
                option : "g"
            };
            Ext.Ajax.request({
                url : me.server + '/pwd',
                method : 'POST',
                params : data,
                success : function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {
                        me.alert("注册成功，请查看邮件进行验证。");
                    } else {
                        me.alert("注册失败,EMAIL或用户名已被注册。");
                    }
                    console.dir(obj);
                },
                failure : function(response, opts) {
                    console.log('server erro:' + response.status);
                }
            });
        },
        changePWD : function(pwd, newpwd, newpwd2) {
            if (newpwd != newpwd2) {
                me.alert("两次密码输入不一致。");
                return;
            }
            var me = this;
            var data = {
                user : me.user,
                "password" : pwd,
                "newpassword" : newpwd,
                option : "c"
            };
            Ext.Ajax.request({
                url : '../../pwd',
                method : 'POST',
                params : data,
                success : function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {
                        me.alert("更改成功");
                    } else {
                        me.alert("旧密码输入错误");
                    }
                    console.dir(obj);
                },
                failure : function(response, opts) {
                    console.log('server erro:' + response.status);
                }
            });
        },

        setMarkerData : function() {
            var me = this;
            var obj = me.marker.options;
            obj.lat = me.data.lat;
            obj.lng = me.data.lng;
            obj.voice = me.data.voice;
            obj.user = me.data.user;
            obj.type = me.data.type;
            obj.kind = me.data.kind;
            obj.info = me.data.info;
            obj.status = me.data.status;
            obj.point = me.data.point;
            obj.image = me.data.image;
            obj.occ = me.data.occ;
            obj.helper = me.data.helper;
            obj.id = me.data.id;
        },
        getData : function() {
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
            me.data.occ = obj.occ;
            me.data.image = obj.image;
            me.data.helper = obj.helper;

            if (obj.id) {
                me.data.id = obj.id;
                me.hr = obj.id;
            }

            var fields = [ "point", "info", "occ" ];
            for (var i = 0; i < fields.length; i++) {
                Ext.getCmp("show_" + fields[i]).setValue(obj[fields[i]]);
            }

            if (me.infoType == 0) {// need
                Ext.getCmp("show_need").setValue(me.data["type"]);
            } else {
                Ext.getCmp("show_msg").setValue(me.data["type"]);
            }
        },
        setData : function() {
            var me = this;

            me.data.user = me.user;

            me.data.kind = me.infoType;

            me.data.date = Ext.util.Format.date(new Date(), "YmdHis");

            var fields = [ "point", "info", "occ" ];

            for (var i = 0; i < fields.length; i++) {
                me.data[fields[i]] = Ext.getCmp("show_" + fields[i])
                    .getValue();
            }
            if (me.infoType == 0) {// need
                me.data["type"] = Ext.getCmp("show_need").getValue();
            } else {
                me.data["type"] = Ext.getCmp("show_msg").getValue();
            }
            if (me.data.voice == 0) {
                if (me.record.isNew) {
                    me.data["voice"] = 1;
                } else {
                    me.data["voice"] = 0;
                }
            }
        },
        // 提交数据
        submitData : function(data, callback, flag) {
            var me = this;
            Ext.Ajax.request({
                url : me.server + '/data',
                method : 'POST',
                params : data,
                success : function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {

                        if (obj.id) {
                            data.id = obj.id;
                            if (flag === true) {
                                me.alert("追加成功");
                            }
                        } else {
                            if (flag === true) {
                                me.alert("更新成功");
                            }
                        }
                        if (callback) {

                            callback(obj.id);
                        }
                    }
                    console.dir(obj);
                },
                failure : function(response, opts) {
                    console.log('server erro:' + response.status);
                }
            });
        },

        createStore : function() {
            var me = this;
            me.store = Ext
                .create(
                    'Ext.data.Store',
                    {
                        // give the store some fields
                        fields : [ 'id', 'title', 'lat', 'lng',
                            'date', 'info', 'point', 'voice',
                            'status', 'type', 'user', 'helper',
                            'kind', 'occ', 'image' ],
                        // filter the data using the firstName field
                        sorters : 'id',
                        // autoload the data from the server
                        autoLoad : false,
                        listeners : {
                            load : function(st, records) {
                                me.datas = [];
                                if (records.length > 0) {
                                    me
                                        .ctrlEnabled(
                                            "fs_show_review",
                                            false);
                                }
                                for (var i = 0; i < records.length; i++) {
                                    me.datas.push(records[i].data);
                                }
                                if (me.StoreCb) {
                                    me.StoreCb(me.datas, me);
                                }

                            },
                            refresh : function(st, datas) {
                                if (me.mainPanel.getActiveItem() == 3) {
                                    me.getCmpById(me.panel_list)
                                        .refresh();
                                }
                            },
                            removerecords : function(store,
                                                     records, indices, eOpts) {
                                var newArray = [];
                                me.getCmpById(me.panel_list)
                                    .refresh();
                                for (var i = 0; i < me.datas.length; i++) {
                                    if (me.datas[i].id != records[0].data.id) {
                                        newArray.push(me.datas[i]);
                                    }
                                }
                                me.datas = newArray;
                                // me.refreshMap(me.datas, me);
                            }
                        },
                        proxy : {
                            type : 'ajax',
                            url : me.server + '/data',
                            reader : {
                                type : 'json',
                                root : 'data'
                            },
                            actionMethods : {
                                create : 'POST',
                                read : 'POST', // by default GET
                                update : 'POST',
                                destroy : 'POST'
                            },
                            extraParams : {}
                        }
                    });
        },
        createRankStore : function() {
            var me = this;
            me.rankStore = Ext.create('Ext.data.Store', {
                // give the store some fields
                fields : [ 'id', 'user', 'point' ],
                // filter the data using the firstName field
                // autoload the data from the server
                autoLoad : true,

                proxy : {
                    type : 'ajax',
                    url : me.server + '/data',
                    reader : {
                        type : 'json',
                        root : 'data'
                    },
                    actionMethods : {
                        create : 'POST',
                        read : 'POST', // by default GET
                        update : 'POST',
                        destroy : 'POST'
                    },
                    extraParams : {
                        option : "rank"
                    }
                }
            });
        },

        createMasterStore : function() {
            var me = this;
            me.masterStore = Ext.create('Ext.data.Store', {
                // give the store some fields
                fields : [ 'type', 'value', 'text' ],
                // filter the data using the firstName field
                sorters : 'type',
                // autoload the data from the server
                autoLoad : false,
                listeners : {
                    load : function(st, records) {
                        me.datas = [];
                        me.config.occrs = [];
                        me.config.points = [];
                        me.config.status = [];
                        me.config.needs = [];
                        me.config.msgs = [];
                        me.config.areas = [];
                        var m_k = {
                            1 : "occrs",
                            2 : "points",
                            3 : "status",
                            4 : "needs",
                            5 : "msgs",
                            6 : "areas",
                            7 : "distances"
                        };
                        for (var i = 0; i < records.length; i++) {
                            var type = records[i].data.type;
                            me.config[m_k[type]].push({
                                id : records[i].data.value,
                                text : records[i].data.text
                            });
                        }

                        // 界面显示用
                        // Ext.getCmp("sel_point").setOptions(me.config[m_k[2]]);
                        Ext.getCmp("sel_distance").setOptions(
                            me.config[m_k[7]]);
                        Ext.getCmp("sel_distance").setValue(10);// 初始设为1KM
                        // 填写信息用
                        // Ext.getCmp("show_status").setOptions(me.config[m_k[3]]);
                        Ext.getCmp("show_need").setOptions(
                            me.config[m_k[4]]);
                        Ext.getCmp("show_msg")
                            .setOptions(me.config[m_k[5]]);
                        // 个人信息用

                        Ext.getCmp("show_occ")
                            .setOptions(me.config[m_k[1]]);

                        Ext.getCmp("config_area").setOptions(
                            me.config[m_k[6]]);
                        Ext.getCmp("config_area").setValue(me.area);

                        Ext.getCmp("config_occ").setOptions(
                            me.config[m_k[1]]);
                        Ext.getCmp("config_occ").setValue(me.occ);

                        me.isSettedOption = true;

                    },
                },
                proxy : {
                    type : 'ajax',
                    url : me.server + '/data',
                    reader : {
                        type : 'json',
                        root : 'data'
                    },
                    actionMethods : {
                        create : 'POST',
                        read : 'POST', // by default GET
                        update : 'POST',
                        destroy : 'POST'
                    },
                    extraParams : {
                        params : {
                            option : "master"
                        }
                    }
                }
            });

            me.masterStore.load({
                params : {
                    option : "master"
                }
            });

        },

        createReplyStore : function() {
            var me = this;
            me.replyStore = Ext.create('Ext.data.Store', {
                // give the store some fields
                fields : [ 'id', 'info', 'voice', 'hr', 'date', 'user',
                    'userId' ],
                // filter the data using the firstName field
                sorters : 'id',
                // autoload the data from the server
                autoLoad : false,
                listeners : {
                    load : function(st, records) {
                        me.replyDatas = [];
                        for (var i = 0; i < records.length; i++) {
                            me.replyDatas.push(records[i].data);
                        }

                        Ext.getCmp("panel_window_reply").getScrollable()
                            .getScroller().scrollToEnd();
                        // me.StoreCb(me.datas, me);
                    },

                    addrecords : function(store, records, eOpts) {
                        var scroller = Ext.getCmp("panel_window_reply")
                            .getScrollable().getScroller();
                        scroller.scrollTo(0, scroller.getSize().y
                            - scroller.getContainerSize().y + 20);

                    }

                },
                proxy : {
                    type : 'ajax',
                    url : me.server + '/data',
                    reader : {
                        type : 'json',
                        root : 'data'
                    },
                    actionMethods : {
                        create : 'POST',
                        read : 'POST', // by default GET
                        update : 'POST',
                        destroy : 'POST'
                    },
                    extraParams : {}
                }
            });
        },
        playReply : function(id) {
            var me = this;

            me.playUrl(me.server + me.uploadUrl + "reply_" + id + ".spx");

        },
        removePhoto : function() {
            Ext.getCmp("image").setSrc("");
            me.ctrlEnabled("image", false);
            me.data.image = 0;
            me.deleteFile("i", function() {
                me.submitData({
                    id : me.data.id,
                    table : "HR",
                    image : "0",
                    option : "s"
                });
            });
        },
        uploadPhoto : function() {
            var me = this;
            me.upload(me.server + "/data", me.imageUrl, function() {

                me.submitData({
                    id : me.data.id,
                    table : "HR",
                    image : "1",
                    option : "s"
                }, function() {
                    me.alert("图片上传成功。");
                });
            }, "img_" + me.data.id, "jpeg");
        },
        deleteFile : function(type, cb) {
            var me = this;
            Ext.Ajax.request({
                url : me.server + '/data',
                method : 'POST',
                extraParams : {
                    option : "ro",
                    id : me.data.id,
                    type : type
                },
                success : function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    if (obj.success) {
                        cb();

                    }
                },
                failure : function(response, opts) {
                    console.log('server erro:' + response.status);
                }
            });
        },
        photo : function(srcType) {
            var me = this;
            var quality = 50;
            var dataUrl = Camera.DestinationType.FILE_URI;
            if (srcType == Camera.PictureSourceType.CAMERA) {
                quality = 40;
            }

            navigator.camera.getPicture(onSuccess, onFail, {
                quality : quality,
                sourceType : srcType,
                destinationType : dataUrl,
                EncodingType : 1
            });

            function onSuccess(imageURI) {

                me.ctrlEnabled("image", true);
                me.data.image = 1;
                Ext.getCmp("image").setSrc(imageURI);
                me.imageUrl = imageURI;
            }

            function onFail(message) {
                if (message.indexOf("cancel") < 0)// 取消以外
                {
                    me.alert('拍摄失败，请检查照相机设置');
                }

            }
        },

        // 回复
        getShowWindowReply : function() {
            var me = this;

            var reply_send_refresh = {
                xtype : 'button',
                // align: 'left',
                id : "reply_send_refresh",
                iconCls : "refresh",
                flex : 0.1,

                handler : function() {
                    // Ext.getCmp("panel_window_reply").refresh();
                    me.refreshReply();
                }
            };
            var reply_send_voice =

                Ext.create('com.renxd.RflButton', {

                    // align: 'left',
                    id : "reply_send_voice",
                    iconCls : "add",
                    flex : 0.1,
                    listeners : {

                        touchstart : function(event) {
                            console.log("touchstart");
                            me.recordData = false;
                            me.record.record();
                        },
                        touchend : function(event) {
                            console.log("touchend");
                            me.recordData = false;
                            me.record.record();
                        }
                    }
                });

            var reply_txt_msg = {
                xtype : 'textfield',
                // align: 'left',
                id : "reply_txt_msg",
                flex : 0.6,
                width : '80%',
                maxLength : 50,
                text : ''
            };
            var reply_btn_msg = {
                xtype : 'button',
                // align: 'left',
                id : "reply_btn_msg",

                text : '发送',
                handler : function() {
                    var info = Ext.util.Format.trim(Ext.getCmp(
                        "reply_txt_msg").getValue());
                    if (info == "") {
                        return;
                    }
                    var addReply = {
                        option : "s",
                        table : "REPLY",
                        "hr" : me.hr,
                        "user" : me.user,
                        "date" : Ext.util.Format.date(new Date(), "YmdHis"),
                        "info" : Ext.getCmp("reply_txt_msg").getValue(),
                        "voice" : 0
                    };
                    me.submitData(addReply, function(insertId) {
                        me.refreshReply();
                        // me.replyStore.add({
                        // "id": insertId,
                        // "hr": me.hr,
                        // "user": me.no,
                        // "voice": 0,
                        // "date": Ext.util.Format.date(new Date(),
                        // "YmdHis"),
                        // "info": Ext.getCmp("reply_txt_msg").getValue()
                        // });
                        me.ctrlValue("reply_txt_msg", "");
                    });
                }
            };
            return {
                id : 'panel_window_reply',
                width : 300,
                height : 400,
                items : [ {
                    docked : 'bottom',
                    xtype : 'titlebar',
                    layout : 'hbox',
                    items : [ reply_send_refresh, reply_send_voice,
                        reply_txt_msg, reply_btn_msg ]
                } ],
                store : me.replyStore,
                xtype : 'list',
                scrollable : {
                    direction : 'vertical'
                },
                variableHeights : true,
                itemHeight : 30,
                itemTpl : new Ext.XTemplate(
                    '<div  style="width:100%;height:100%;overflow: hidden; "> ({[this.date(values.date)]}) {user}:{info}  {[this.btn(values)]}</div>',
                    {
                        date : function(v) {
                            return me.tool.mdStr(v);
                        },
                        btn : function(v) {
                            var rtn = "";
                            if (v.voice == 1) {
                                rtn = rtn
                                    + "<a href='#' onclick='document.app.playReply("
                                    + v.id + ")'>播放</a>";
                            }

                            // 登录用户为数据用户&&回复用户不等于本数据用户&&目前为寻求帮助
                            if ((me.user == me.data.user)
                                && (v.userId != me.data.user)
                                && (me.data.status == 0)) {
                                rtn = rtn
                                    + "&nbsp;&nbsp;<a href='#' onclick='document.app.status(1,"
                                    + v.userId + ")'>设为帮助</a>";
                            }

                            return rtn;
                        }
                    })
            };
        }
    });
var record = new Record();