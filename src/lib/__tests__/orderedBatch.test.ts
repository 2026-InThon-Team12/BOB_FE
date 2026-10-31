import { orderedBatch } from '../orderedBatch';
it('bounds concurrent requests, preserves source indices and retains partial success',async()=>{
  let active=0,max=0;const results: PromiseSettledResult<number>[]=[];
  await orderedBatch([1,2,3,4],async value=>{
    active++;max=Math.max(max,active);await Promise.resolve();active--;
    if(value===2)throw new Error('unreadable');return value*10;
  },(i,result)=>{results[i]=result;});
  expect(max).toBe(2);expect(results).toEqual([{status:'fulfilled',value:10},{status:'rejected',reason:expect.any(Error)},{status:'fulfilled',value:30},{status:'fulfilled',value:40}]);
});
