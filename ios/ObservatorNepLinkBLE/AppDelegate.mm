#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import "RNBootSplash.h"
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

// - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
// {
//   self.moduleName = @"ObservatorNepLinkBLE";
//   // You can add your custom initial props in the dictionary below.
//   // They will be passed down to the ViewController used by React Native.
//   self.initialProps = @{};
// //  return [super application:application didFinishLaunchingWithOptions:launchOptions];

//   [GMSServices provideAPIKey:@"AIzaSyDzdYiK4ZG-RVA8-z2U4AzwXU0V9a6QLTM"];

//   // BOOL ret = [super application:application didFinishLaunchingWithOptions:launchOptions]; if (ret == YES) { [RNSplashScreen show];  } return ret;
//   BOOL ret = [super application:application didFinishLaunchingWithOptions:launchOptions];
//   return ret;

//}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"ObservatorNepLinkBLE";
  self.initialProps = @{};

  [GMSServices provideAPIKey:@"AIzaSyDzdYiK4ZG-RVA8-z2U4AzwXU0V9a6QLTM"];

  BOOL ret = [super application:application didFinishLaunchingWithOptions:launchOptions];

  // Add this line to initialize BootSplash
  [RNBootSplash initWithStoryboard:@"LaunchScreen" rootView:(RCTRootView *)self.window.rootViewController.view];

  return ret;
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
