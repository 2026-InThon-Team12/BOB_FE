import { Animated, PanResponder, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import { createSwipeController } from '../SwipeCard';

jest.mock('@/components/ui', () => ({}));
jest.mock('@/theme', () => ({makeStyles: () => () => ({}), useTheme: () => ({})}));

afterEach(() => jest.restoreAllMocks());
it('owns touches from card contact and commits an upward swipe only on release', () => {
  const create = jest.spyOn(PanResponder, 'create');
  jest.spyOn(Animated, 'timing').mockImplementation(() => ({start: cb => cb?.({finished:true}),stop:jest.fn(),reset:jest.fn()}));
  const controller = createSwipeController(new Animated.ValueXY());
  const active = jest.fn(), answer = jest.fn();
  controller.setOnGestureActiveChange(active);
  controller.setOnSwipe(answer);
  const handlers = create.mock.calls[0][0];
  const event = {} as GestureResponderEvent;
  const movement = {dx:5,dy:-120} as PanResponderGestureState;
  expect(handlers.onStartShouldSetPanResponderCapture?.(event,movement)).toBe(true);
  handlers.onPanResponderGrant?.(event,movement);
  expect(active).toHaveBeenLastCalledWith(true);
  expect(handlers.onPanResponderTerminationRequest?.(event,movement)).toBe(false);
  handlers.onPanResponderMove?.(event,movement);
  expect(answer).not.toHaveBeenCalled();
  handlers.onPanResponderRelease?.(event,movement);
  expect(answer).toHaveBeenCalledWith('up');
  expect(active.mock.calls).toEqual([[true],[false]]);
});

it.each(['short drag','cancel','unmount'])('restores outside scrolling without answering on %s', reason => {
  jest.spyOn(Animated, 'timing').mockImplementation(() => ({start: cb => cb?.({finished:true}),stop:jest.fn(),reset:jest.fn()}));
  const controller = createSwipeController(new Animated.ValueXY());
  const active = jest.fn(), answer = jest.fn();
  controller.setOnGestureActiveChange(active);
  controller.setOnSwipe(answer);
  controller.grab();
  if(reason==='short drag') controller.release(0,-30);
  else if(reason==='cancel') controller.reset();
  else controller.endInteraction();
  expect(active.mock.calls).toEqual([[true],[false]]);
  expect(answer).not.toHaveBeenCalled();
});
