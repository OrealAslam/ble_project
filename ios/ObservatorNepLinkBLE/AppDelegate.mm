#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import "RNSplashScreen.h"
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"ObservatorNepLinkBLE";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

//  [RNSplashScreen show];
//  return [super application:application didFinishLaunchingWithOptions:launchOptions];

  [GMSServices provideAPIKey:@"AIzaSyDzdYiK4ZG-RVA8-z2U4AzwXU0V9a6QLTM"];

  BOOL ret = [super application:application didFinishLaunchingWithOptions:launchOptions]; if (ret == YES) { [RNSplashScreen show];  } return ret;

}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
