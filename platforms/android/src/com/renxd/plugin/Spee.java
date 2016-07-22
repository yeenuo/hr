package com.renxd.plugin;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.Date;
import java.io.File;
import java.text.SimpleDateFormat;

import android.os.Environment;
import android.widget.Toast;

import com.renxd.recorder.*;

public class Spee extends CordovaPlugin {
	public static final int STOPPED = 0;
	public static final int RECORDING = 1;
	public static final int PLAYING = 2;
	//private SpeechSynthesizer speechSynthesizer;
	
	SpeexRecorder recorderInstance = null;
	int status = STOPPED;

	String fileName = null;
	SpeexPlayer splayer = null;

	/**
	 * 必须重写execute方法
	 */
	@Override
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		if ("doRecord".equals(action)) {
			this.doRecord(args, callbackContext);
		} else if ("doPlay".equals(action)) {
			// this.fileName = args.getString(0);
			this.doPlay(args, callbackContext);
		} else if ("doRead".equals(action)) {
			// this.fileName = args.getString(0);
			this.doRead(args, callbackContext);
		} else {
			return false;
		}
		return true;
	}

	private void doRecord(JSONArray args, final CallbackContext callbackContext)
			throws JSONException {
		if (status != PLAYING) {
			// 开启worker线程
			cordova.getThreadPool().execute(new Runnable() {
				@Override
				public void run() {
					System.out.println("Execute doRecord method");
					if (status == STOPPED) {
						fileName = "/mnt/sdcard/gauss.spx";
						// fileName = "/mnt/sdcard/1324966898504.spx";
						SimpleDateFormat df = new SimpleDateFormat(
								"yyyyMMddHHmmss");// 设置日期格式
						String dateStr = df.format(new Date());// new
						// Date()为获取当前系统时间
						// fileName=cordova.getActivity().getExternalFilesDir("myfolder")
						// + File.separator+dateStr+".spx";//File;
						System.out.println(fileName);// new Date()为获取当前系统时间
						recorderInstance = new SpeexRecorder(fileName);
						Thread th = new Thread(recorderInstance);
						th.start();
						recorderInstance.setRecording(true);
						status = RECORDING;
						callbackContext.success("{success:true,info:'Start Record'}");
					} else {
						recorderInstance.setRecording(false);
						status = STOPPED;
						callbackContext.success("{success:true,name:'"+fileName+"'}");
					}	
				}
			});
		}
	}

	private void doPlay(JSONArray args, final CallbackContext callbackContext)
			throws JSONException {

		if (status != RECORDING) {// 非录音中
			// 在UI线程上执行
			cordova.getActivity().runOnUiThread(new Runnable() {
				@Override
				public void run() {
					if (status == STOPPED) {
						fileName = "/mnt/sdcard/gauss.spx";
						System.out.println("filename====" + fileName);
						splayer = new SpeexPlayer(fileName);
						splayer.startPlay();
						if (recorderInstance != null) {
							recorderInstance.setRecording(false);
						}
						callbackContext.success("{success:true,name:'"+fileName+"'}");
					} else {
						recorderInstance.setRecording(false);
						status = STOPPED;
					}

				}
			});
		}
	}

		private void doRead(JSONArray args, final CallbackContext callbackContext)
			throws JSONException {
			
			
			}
}