import { registerRootComponent } from 'expo';
import App from './src/App';

// Ascend — entry point. registerRootComponent wires App as the native root
// and sets up the environment for both Expo Go / dev-client and standalone builds.
registerRootComponent(App);
