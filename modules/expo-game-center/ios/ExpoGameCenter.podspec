Pod::Spec.new do |s|
  s.name           = 'ExpoGameCenter'
  s.version        = '1.0.0'
  s.summary        = 'Apple Game Center leaderboards for Ascend'
  s.description    = 'Local Expo module wrapping GameKit for authentication and leaderboards.'
  s.author         = ''
  s.homepage       = 'https://github.com/ascend/ascend'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'GameKit', 'UIKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
