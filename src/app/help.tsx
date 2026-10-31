import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, PanResponder, ScrollView, View } from 'react-native';
import { Button, Card, Row, Screen, Stack, Text, TextLink } from '@/components/ui';
import { helpCopy, helpSteps } from '@/constants/help';
import { makeStyles } from '@/theme';
const useStyles=makeStyles(t=>({
  stage:{flex:1,minHeight:t.space[12]*4,overflow:'hidden',borderRadius:t.radius.lg,backgroundColor:t.color.bg.canvas},
  absolute:{position:'absolute'}, shade:{position:'absolute',backgroundColor:t.color.overlay},
  spot:{position:'absolute',borderColor:t.color.brand.solid,borderWidth:2,borderRadius:t.radius.md},
  content:{paddingBottom:t.space[2]},
}));
export default function HelpScreen(){
 const {intro}=useLocalSearchParams<{intro?:string}>();
 const [index,setIndex]=useState(0),[menu,setMenu]=useState(false);
 const [size,setSize]=useState({width:0,height:0});
 const styles=useStyles(), step=helpSteps[index];
 const close=()=>{if(intro==='1')router.replace('/onboarding/goal');else if(router.canGoBack())router.back();else router.replace('/');};
 const next=()=>{if(index===helpSteps.length-1)close();else setIndex(index+1);};
 const gesture=useMemo(()=>PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>25&&Math.abs(g.dx)>Math.abs(g.dy)*1.5,onPanResponderRelease:(_,g)=>{if(g.dx < -50){if(index<helpSteps.length-1)setIndex(index+1);}else if(g.dx>50)setIndex(Math.max(0,index-1));}}),[index]);
 const scale=size.width/390;
 const spotHeight=Math.min(step.height*scale+12,Math.max(0,size.height-16));
 const offset=Math.max(0,Math.min(650*scale-size.height,step.y*scale-(size.height-spotHeight)/2));
 const y=Math.max(4,Math.min(size.height-spotHeight-4,step.y*scale-offset-6));
 const x=Math.max(4,step.x*scale-6),w=Math.min(size.width-x-4,step.width*scale+12);
 const topics=helpSteps.filter(s=>s.si===0);
 return <Screen scroll={false} edges={['top','bottom']}>
  <Row justify="space-between"><TextLink label={helpCopy.contents} onPress={()=>setMenu(!menu)}/><Text variant="caption">{helpCopy.example}</Text><TextLink label={helpCopy.close} onPress={close}/></Row>
  {menu ? <ScrollView contentContainerStyle={styles.content}>{topics.map(s=><Button key={s.ti} variant="secondary" label={`${s.ti+1}. ${s.topic}`} onPress={()=>{setIndex(helpSteps.indexOf(s));setMenu(false);}}/>)}</ScrollView> : <>
  <View style={styles.stage} {...gesture.panHandlers} onLayout={e=>setSize({width:e.nativeEvent.layout.width,height:e.nativeEvent.layout.height})}>
    <Image source={step.image} accessibilityElementsHidden importantForAccessibility="no" style={[styles.absolute,{width:size.width,height:650*scale,top:-offset}]} resizeMode="stretch"/>
    <View pointerEvents="none" style={[styles.shade,{top:0,left:0,right:0,height:y}]}/>
    <View pointerEvents="none" style={[styles.shade,{top:y+spotHeight,left:0,right:0,bottom:0}]}/>
    <View pointerEvents="none" style={[styles.shade,{top:y,left:0,width:x,height:spotHeight}]}/>
    <View pointerEvents="none" style={[styles.shade,{top:y,left:x+w,right:0,height:spotHeight}]}/>
    <View pointerEvents="none" style={[styles.spot,{top:y,left:x,width:w,height:spotHeight}]}/>
  </View>
  <Card><Stack gap={2}>
    <Text variant="caption" tone="brand">{step.ti+1}. {step.topic} · {index+1}/{helpSteps.length}</Text>
    <Text variant="heading">{step.title}</Text>
    <Text variant="label">{step.body}</Text>
    <Row justify="space-between"><Button label={helpCopy.previous} disabled={index===0} variant="ghost" onPress={()=>setIndex(index-1)}/><Button label={index===helpSteps.length-1 ? intro==='1' ? helpCopy.start : helpCopy.done : helpCopy.next} onPress={next}/></Row>
  </Stack></Card></>}
 </Screen>;
}
