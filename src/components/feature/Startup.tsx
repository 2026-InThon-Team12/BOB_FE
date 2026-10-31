import { Image, View } from 'react-native';
import { Text, Stack } from '@/components/ui';
import { copy, updateCopy } from '@/constants/copy';
import { makeStyles } from '@/theme';
const useStyles = makeStyles(t => ({
  root: {position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:100,backgroundColor:t.color.brand.solid,alignItems:'center',justifyContent:'center',padding:t.space[6]},
  mascot:{width:160,height:140}, wordmark:{width:130,height:60,tintColor:t.color.text.onBrand},
}));
export function Startup() {
  const styles=useStyles();
  return <View style={styles.root} accessibilityLabel={copy.appName}><Stack align="center" gap={4}>
    <Image source={require('../../../assets/brand/mascot.png')} style={styles.mascot} resizeMode="contain"/>
    <Image source={require('../../../assets/brand/wordmark.png')} style={styles.wordmark} resizeMode="contain"/>
    <Text variant="heading" align="center" tone="onBrand">{copy.appName}</Text>
    <Text variant="label" align="center" tone="onBrand">{updateCopy.startupTagline}</Text>
  </Stack></View>;
}
