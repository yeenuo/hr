/**
 * 
 */
package com.renxd.recorder;

import java.io.File;

import org.apache.cordova.CallbackContext;

import com.renxd.plugin.Spee;
import com.renxd.speex.encode.SpeexDecoder;

/**
 * @author Gauss
 * 
 */
public class SpeexPlayer {
	private String fileName = null;
	private SpeexDecoder speexdec = null;
	private Spee spee = null;

	public SpeexPlayer(String fileName, Spee spee) {

		this.fileName = fileName;
		this.spee = spee;
		try {
			speexdec = new SpeexDecoder(new File(this.fileName), this);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void endPlay() {
		this.spee.endPlay();
	}

	public void stopPlay() {
		this.speexdec.setPaused(true);
	}

	public void startPlay() {
		RecordPlayThread rpt = new RecordPlayThread();

		Thread th = new Thread(rpt);
		th.start();
	}

	boolean isPlay = true;

	class RecordPlayThread extends Thread {

		public void run() {
			try {
				if (speexdec != null)
					speexdec.setPaused(false);
				speexdec.decode();

			} catch (Exception t) {
				t.printStackTrace();
			}
		}
	};
}
