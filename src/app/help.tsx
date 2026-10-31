import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, PanResponder, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';

import { Button, Row, Text, TextLink } from '@/components/ui';
import { helpCanvas, helpCopy, helpSteps } from '@/constants/help';
import { helpStepIndices } from '@/config/helpFlow';
import { makeStyles, useTheme } from '@/theme';

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  content: { flex: 1, padding: t.space[3], gap: t.space[2] },
  top: { minHeight: t.space[8], justifyContent: 'center' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  picture: { overflow: 'hidden', borderRadius: t.radius.lg, backgroundColor: t.color.bg.canvas },
  absolute: { position: 'absolute', top: 0, left: 0 },
  bubble: { position: 'absolute', backgroundColor: t.color.bg.surface, borderRadius: t.radius.lg, ...t.elevation.raised },
  bubbleClip: { overflow: 'hidden', borderRadius: t.radius.lg },
  bubbleContent: { padding: t.space[4], gap: t.space[2] },
  arrow: { position: 'absolute', width: t.space[4], height: t.space[4], backgroundColor: t.color.bg.surface, transform: [{ rotate: '45deg' }] },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: t.space[1], minHeight: t.space[4] },
  dot: { width: t.space[1], height: t.space[1], borderRadius: t.radius.pill, backgroundColor: t.color.border.default },
  activeDot: { width: t.space[3], backgroundColor: t.color.text.brand },
  menu: { gap: t.space[2], paddingBottom: t.space[3] },
}));

export default function HelpScreen() {
  const { intro, scope } = useLocalSearchParams<{ intro?: string; scope?: string }>();
  const steps = helpStepIndices(intro === '1', scope).map(i => helpSteps[i]);
  const [index, setIndex] = useState(0);
  const [menu, setMenu] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const theme = useTheme();
  const styles = useStyles();
  const step = steps[index];
  const close = () => {
    if (intro === '1') router.replace('/onboarding/budget');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const next = () => index === steps.length - 1 ? close() : setIndex(index + 1);
  const gesture = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 25 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50) setIndex(Math.min(steps.length - 1, index + 1));
      else if (g.dx > 50) setIndex(Math.max(0, index - 1));
    },
  }), [index, steps.length]);

  // Image and rounded mask share a contain transform: no stretching or cropping.
  const scale = Math.max(0, Math.min(size.width / helpCanvas.width, size.height / helpCanvas.height));
  const width = helpCanvas.width * scale;
  const height = helpCanvas.height * scale;
  const inset = theme.space[3];
  const gap = theme.space[4];
  const sx = Math.max(4, step.x - 4);
  const sy = Math.max(4, step.y - 4);
  const sw = Math.min(helpCanvas.width - sx - 4, step.width + 8);
  const sh = Math.min(helpCanvas.height - sy - 4, step.height + 8);
  const belowSpace = Math.max(0, height - (sy + sh) * scale - gap - inset);
  const aboveSpace = Math.max(0, sy * scale - gap - inset);
  const above = bubbleHeight > belowSpace && aboveSpace > belowSpace;
  const maxBubbleHeight = above ? aboveSpace : belowSpace;
  const shownHeight = Math.min(bubbleHeight, maxBubbleHeight);
  const top = above ? sy * scale - gap - shownHeight : (sy + sh) * scale + gap;
  const arrowLeft = Math.max(inset, Math.min(width - inset * 3 - theme.space[4], (sx + sw / 2) * scale - inset - theme.space[2]));

  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <View style={styles.content}>
      <View style={styles.top}><Row justify="space-between">
        <TextLink label={helpCopy.contents} onPress={() => setMenu(!menu)} />
        <Text variant="caption">{helpCopy.example}</Text>
        <TextLink label={helpCopy.close} onPress={close} />
      </Row></View>
      {menu ? <ScrollView contentContainerStyle={styles.menu}>
        {steps.map((s, i) => <Button key={s.topic} variant="secondary" label={`${i + 1}. ${s.topic}`} onPress={() => { setIndex(i); setMenu(false); }} />)}
      </ScrollView> : <>
        <View style={styles.stage} {...gesture.panHandlers} onLayout={(e) => setSize(e.nativeEvent.layout)}>
          {scale > 0 && <View style={[styles.picture, { width, height }]}>
            <Image key={index} source={step.image} accessibilityElementsHidden importantForAccessibility="no" style={[styles.absolute, { width, height }]} resizeMode="contain" fadeDuration={0} />
            <Svg pointerEvents="none" style={styles.absolute} width={width} height={height} viewBox={`0 0 ${helpCanvas.width} ${helpCanvas.height}`}>
              <Defs><Mask id="helpSpot" x="0" y="0" width={helpCanvas.width} height={helpCanvas.height} maskUnits="userSpaceOnUse">
                <Rect width={helpCanvas.width} height={helpCanvas.height} fill="white" />
                <Rect x={sx} y={sy} width={sw} height={sh} rx={theme.radius.md} fill="black" />
              </Mask></Defs>
              <Rect width={helpCanvas.width} height={helpCanvas.height} fill={theme.color.overlay} mask="url(#helpSpot)" />
              <Rect x={sx} y={sy} width={sw} height={sh} rx={theme.radius.md} fill="none" stroke={theme.color.brand.solid} strokeWidth={2} />
            </Svg>
            <View style={[styles.bubble, { left: inset, right: inset, top }]}>
              <View pointerEvents="none" style={[styles.arrow, { left: arrowLeft, ...(above ? { bottom: -theme.space[2] } : { top: -theme.space[2] }) }]} />
              <View style={styles.bubbleClip}>
                <ScrollView key={index} style={{ maxHeight: maxBubbleHeight }} bounces={false}>
                  <View style={styles.bubbleContent} onLayout={(e) => setBubbleHeight(e.nativeEvent.layout.height)}>
                    <Text variant="caption" tone="brand">{step.topic}</Text>
                    <Text variant="heading">{step.title}</Text>
                    <Text variant="label">{step.body}</Text>
                    <Row justify="space-between">
                      <Button label={helpCopy.previous} disabled={index === 0} variant="ghost" onPress={() => setIndex(index - 1)} />
                      <Text variant="caption" tone="brand">{index + 1} / {steps.length}</Text>
                      <Button label={index === steps.length - 1 ? intro === '1' ? helpCopy.start : helpCopy.done : helpCopy.next} onPress={next} />
                    </Row>
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>}
        </View>
        <View style={styles.dots} accessible accessibilityLabel={`${index + 1} / ${steps.length}`}>
          {steps.map((s, i) => <View key={s.topic} style={[styles.dot, i === index && styles.activeDot]} />)}
        </View>
      </>}
    </View>
  </SafeAreaView>;
}
