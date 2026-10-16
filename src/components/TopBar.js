import { View } from 'react-native';

import { space } from '../lib/theme';
import HelpButton from './HelpButton';
import { Title } from './ui';

export default function TopBar({ title, left }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: space(3),
        paddingBottom: space(4),
        gap: 12,
      }}
    >
      {left || <Title style={{ flexShrink: 1 }}>{title}</Title>}
      <HelpButton />
    </View>
  );
}
