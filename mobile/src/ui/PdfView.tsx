// PDF из «Моих документов»: на iPhone — прямо в приложении, на Android — во встроенном просмотрщике телефона.
import { Paths } from 'expo-file-system';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { shareUri } from './files';
import { Button, Card, T } from './kit';

export function PdfView({ uri, title }: { uri: string; title: string }) {
  if (Platform.OS === 'ios') {
    return <WebView source={{ uri }} originWhitelist={['*']} allowingReadAccessToURL={Paths.document.uri} style={{ flex: 1, backgroundColor: '#fff' }} />;
  }
  return (
    <View style={{ flex: 1, padding: 14, justifyContent: 'center' }}>
      <Card>
        <T>Android открывает PDF в своём просмотрщике — файл хранится в приложении и доступен без интернета.</T>
        <Button title="Открыть PDF" icon="doc" onPress={() => shareUri(uri, 'pdf', title)} />
      </Card>
    </View>
  );
}
