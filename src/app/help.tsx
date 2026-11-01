import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, PanResponder, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';

import { Button, Row, Text } from '@/components/ui';
import { helpCanvas, helpCopy, helpSteps } from '@/constants/help';
import { helpStepIndices } from '@/config/helpFlow';
import { makeStyles, useTheme } from '@/theme';

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  picture: { overflow: 'hidden', backgroundColor: t.color.bg.canvas },
  absolute: { position: 'absolute', top: 0, left: 0 },
  bubble: { position: 'absolute', backgroundColor: t.color.bg.surface, borderRadius: t.radius.lg, ...t.elevation.raised },
  bubbleClip: { overflow: 'hidden', borderRadius: t.radius.lg },
  bubbleContent: { padding: t.space[4], gap: t.space[2] },
  controls: { paddingHorizontal: t.space[4], paddingBottom: t.space[3], paddingTop: t.space[2] },
  arrow: { position: 'absolute', width: t.space[4], height: t.space[4], backgroundColor: t.color.bg.surface, transform: [{ rotate: '45deg' }] },
}));

export default function HelpScreen() {
  const { intro, scope } = useLocalSearchParams<{ intro?: string; scope?: string }>();
  const steps = helpStepIndices(intro === '1', scope).map(i => helpSteps[i]);
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const [controlsHeight, setControlsHeight] = useState(0);
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

  // Fill the available screen; image and spotlight use the same cover transform.
  const scale = Math.max(size.width / helpCanvas.width, size.height / helpCanvas.height);
  const { width, height } = size;
  const imageWidth = helpCanvas.width * scale;
  const imageHeight = helpCanvas.height * scale;
  const offsetX = (width - imageWidth) / 2;
  const offsetY = (height - imageHeight) / 2;
  const inset = theme.space[3];
  const gap = theme.space[4];
  const sx = Math.max(inset, offsetX + (step.x - theme.space[1]) * scale);
  const sy = Math.max(inset, offsetY + (step.y - theme.space[1]) * scale);
  const sw = Math.max(0, Math.min(width - inset, offsetX + (step.x + step.width + theme.space[1]) * scale) - sx);
  const sh = Math.max(0, Math.min(height - inset, offsetY + (step.y + step.height + theme.space[1]) * scale) - sy);
  const belowSpace = Math.max(0, height - sy - sh - gap - inset);
  const aboveSpace = Math.max(0, sy - gap - inset);
  const above = bubbleHeight + controlsHeight > belowSpace && aboveSpace > belowSpace;
  const maxBubbleHeight = above ? aboveSpace : belowSpace;
  const shownHeight = Math.min(bubbleHeight + controlsHeight, maxBubbleHeight);
  const top = above ? sy - gap - shownHeight : sy + sh + gap;
  const arrowLeft = Math.max(inset, Math.min(width - inset * 3 - theme.space[4], sx + sw / 2 - inset - theme.space[2]));

  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <View style={styles.stage} {...gesture.panHandlers} onLayout={(e) => setSize(e.nativeEvent.layout)}>
      {scale > 0 && <View style={[styles.picture, { width, height }]}>
        <Image key={index} source={step.image} accessibilityElementsHidden importantForAccessibility="no" style={[styles.absolute, { width: imageWidth, height: imageHeight, left: offsetX, top: offsetY }]} resizeMode="contain" fadeDuration={0} />
        <Svg pointerEvents="none" style={styles.absolute} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs><Mask id="helpSpot" x="0" y="0" width={width} height={height} maskUnits="userSpaceOnUse">
            <Rect width={width} height={height} fill="white" />
            <Rect x={sx} y={sy} width={sw} height={sh} rx={theme.radius.md} fill="black" />
          </Mask></Defs>
          <Rect width={width} height={height} fill={theme.color.overlay} mask="url(#helpSpot)" />
          <Rect x={sx} y={sy} width={sw} height={sh} rx={theme.radius.md} fill="none" stroke={theme.color.brand.solid} strokeWidth={2} />
        </Svg>
        <View style={[styles.bubble, { left: inset, right: inset, top }]}>
          <View pointerEvents="none" style={[styles.arrow, { left: arrowLeft, ...(above ? { bottom: -theme.space[2] } : { top: -theme.space[2] }) }]} />
          <View style={styles.bubbleClip}>
            <ScrollView key={index} style={{ maxHeight: Math.max(0, maxBubbleHeight - controlsHeight) }} bounces={false}>
              <View style={styles.bubbleContent} onLayout={(e) => setBubbleHeight(e.nativeEvent.layout.height)}>
                <Text variant="caption" tone="brand">{step.topic}</Text>
                <Text variant="heading">{step.title}</Text>
                <Text variant="label">{step.body}</Text>
              </View>
            </ScrollView>
            <Row justify="space-between" style={styles.controls} onLayout={(e) => setControlsHeight(e.nativeEvent.layout.height)}>
              <Button label={helpCopy.previous} disabled={index === 0} variant="ghost" onPress={() => setIndex(index - 1)} />
              <Text variant="caption" tone="brand">{index + 1} / {steps.length}</Text>
              <Button label={index === steps.length - 1 ? intro === '1' ? helpCopy.start : helpCopy.done : helpCopy.next} onPress={next} />
            </Row>
          </View>
        </View>
      </View>}
    </View>
  </SafeAreaView>;
}
