//
//  NSData+Speex.m
//  OggSpeex
//
//  Created by REN FENGLEI on 16/7/11.
//  Copyright © 2016年 Sense Force. All rights reserved.
//

#import "Spee.h"
#import <Cordova/CDV.h>
#import "RecorderManager.h"
#import "PlayerManager.h"



@interface Spee () <RecordingDelegate, PlayingDelegate>
@property (nonatomic, assign) BOOL isRecording;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, copy) NSString *filename;
@end
@implementation Spee
-(void) doRecord:(CDVInvokedUrlCommand*)command;
{
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self Record];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

-(void) Record;
{
    
    if (self.isPlaying) {
        return;
    }
    if ( ! self.isRecording) {
        self.isRecording = YES;
        //self.consoleLabel.text = @"正在录音";
        [RecorderManager sharedManager].delegate = self;
        [[RecorderManager sharedManager] startRecording];
    }
    else {
        self.isRecording = NO;
        [[RecorderManager sharedManager] stopRecording];
    }
    
}
-(void) Play:(NSString*) fileName;
{
    if (self.isRecording) {
        return;
    }
    if ( ! self.isPlaying) {
        [PlayerManager sharedManager].delegate = nil;
        
        self.isPlaying = YES;
        
        [[PlayerManager sharedManager] playAudioWithFileName:fileName delegate:self];
    }
    else {
        self.isPlaying = NO;
        [[PlayerManager sharedManager] stopPlaying];
    }
    
}
-(void) doPlay:(CDVInvokedUrlCommand*)command;
{
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        NSString* file = [command.arguments objectAtIndex:0];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self Play:file];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}






#pragma mark - Recording & Playing Delegate

- (void)recordingFinishedWithFileName:(NSString *)filePath time:(NSTimeInterval)interval {
    self.isRecording = NO;
    self.filename = filePath;
    // NSMutableString strForResult = [NSMutableString stringWithFormat:@"%@;%@",strForResult, str];
    //[NSMutableString stringWithFormat:@"%@;%@",strForResult, str]
    //[NSString stringWithFormat:@"app.setRecordFilePath('%s');", filePath]
    NSMutableString * strForResult=[[NSMutableString alloc]init];
    strForResult=[NSMutableString stringWithFormat:@"record.endRecord('%@');",filePath];
    [self.commandDelegate evalJs:strForResult];
    
    
}

- (void)recordingTimeout {
    self.isRecording = NO;
    // self.consoleLabel.text = @"录音超时";
}

- (void)recordingStopped {
    self.isRecording = NO;
}

- (void)recordingFailed:(NSString *)failureInfoString {
    self.isRecording = NO;
    // self.consoleLabel.text = @"录音失败";
}

- (void)levelMeterChanged:(float)levelMeter {
    //self.levelMeter.progress = levelMeter;
}

- (void)playingStoped {
    self.isPlaying = NO;
}

@end
