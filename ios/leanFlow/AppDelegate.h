#import <React/RCTBridgeDelegate.h>
#import <Expo/Expo.h>
#import <UIKit/UIKit.h>
#import <RCTJPushModule.h>
#ifdef NSFoundationVersionNumber_iOS_9_x_Max
#import <UserNotifications/UserNotifications.h>
#endif

@interface AppDelegate : EXAppDelegateWrapper <UIApplicationDelegate, RCTBridgeDelegate, JPUSHRegisterDelegate>

@property (nonatomic, strong) UIWindow *window;

@end
