import { policy } from '@/config/policy';
import { categoryReviewUsage } from '@/lib/calc/tendency';
import type { Item } from '@/types';

const item: Item = {
  id:'reviewed',name:'쿠션',price:19870,category:'beauty',reasons:['need'],source:'manual',status:'bought',
  createdAt:'2026-10-01T00:00:00+09:00',simulation:{startAt:'2026-10-02T00:00:00+09:00',durationDays:3},
  purchase:{boughtAt:'2026-10-05T00:00:00+09:00'},review:{usageBucket:'DAYS_4_7',usedDays:5.5,at:'2026-10-19T00:00:00+09:00'},
};
const report = (items: Item[]) => categoryReviewUsage({items,questions:[],answers:[],policy});
it('includes the selected usage range without inventing a forecast from swipe answers',()=>{
  expect(report([item])[0]).toMatchObject({samples:1,actualDays:5.5,minDays:4,maxDays:7,predictedDays:null,ratio:null});
  expect(report([{...item,review:undefined}])).toEqual([]);
});
it('compares only matching samples and retains all actual records in mixed categories',()=>{
  const predicted: Item = {...item,id:'predicted',summary:{text:'예측',method:'TEMPLATE',fingerprint:'x',coverage:1,eligible:true,reason:null,expectedDays:15}};
  expect(report([predicted])[0]).toMatchObject({predictedDays:7,actualDays:5.5});
  expect(report([predicted,item])[0]).toMatchObject({samples:2,predictedDays:null,actualDays:11,minDays:8,maxDays:14,ratio:null});
});
it('keeps historical bucket ranges unchanged',()=>{
  expect(report([{...item,review:{usageBucket:'sometimes',usedDays:2.5,at:item.review!.at}}])[0]).toMatchObject({minDays:1,maxDays:4,actualDays:2.5});
});
