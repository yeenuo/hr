//
//  NSData+Speex.h
//  OggSpeex
//
//  Created by REN FENGLEI on 16/7/11.
//  Copyright © 2016年 Sense Force. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <Cordova/CDVPlugin.h>
@interface Spee : CDVPlugin


// methods
- (void) doRecord:(CDVInvokedUrlCommand*)command;


// methods
- (void) doPlay:(CDVInvokedUrlCommand*)command;



@end
