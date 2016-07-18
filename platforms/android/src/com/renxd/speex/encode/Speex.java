
package com.renxd.speex.encode;

//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;

class Speex  {

	/* quality
	 * 1 : 4kbps (very noticeable artifacts, usually intelligible)
	 * 2 : 6kbps (very noticeable artifacts, good intelligibility)
	 * 4 : 8kbps (noticeable artifacts sometimes)
	 * 6 : 11kpbs (artifacts usually only noticeable with headphones)
	 * 8 : 15kbps (artifacts not usually noticeable)
	 */
	private static final int DEFAULT_COMPRESSION = 4;
	//private Logger log = LoggerFactory.getLogger(Speex.class);

	Speex() {
		this.open(DEFAULT_COMPRESSION);
	}
	 static {
		 try {
				System.loadLibrary("speex");
			
			} catch (Throwable e) {
				e.printStackTrace();
			}
     }

 
	
	static void load() {
		try {
			System.loadLibrary("speex");
		} catch (Throwable e) {
			e.printStackTrace();
		}

	}

	public native  int open(int compression);
	public native int getFrameSize();
	public native int decode(byte encoded[], short lin[], int size);
	public native int encode(short lin[], int offset, byte encoded[], int size);
	public native void close();
	
}
