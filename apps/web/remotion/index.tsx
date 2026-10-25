import { Composition, registerRoot } from "remotion";
import { TransferComposition } from "../src/components/motion/transfer-composition";
import { LaunchComposition } from "../src/components/motion/launch-composition";
import { NativeSetup } from './native-setup';
const Root = () => <>
  {(['install', 'update', 'uninstall'] as const).map(mode => <Composition key={mode} id={`Native-${mode}`} component={NativeSetup} width={600} height={300} fps={20} durationInFrames={120} defaultProps={{ mode }} />)}
  <Composition id="EnturmaDownload" component={TransferComposition} width={600} height={300} fps={30} durationInFrames={180} defaultProps={{mode:"download" as const}} />
  <Composition id="EnturmaUpdate" component={TransferComposition} width={600} height={300} fps={30} durationInFrames={180} defaultProps={{mode:"update" as const,progress:48}} />
  <Composition id="EnturmaLaunch" component={LaunchComposition} width={560} height={400} fps={24} durationInFrames={144} />
</>;
registerRoot(Root);
