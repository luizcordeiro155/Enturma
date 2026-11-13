import { describe, expect, it } from 'vitest';
import { navigateStory, resolveStoryGesture } from './social-story-controls';
const groups = [{authorId:'a',items:[{id:'a1'},{id:'a2'}]},{authorId:'b',items:[{id:'b1'}]}];
describe('Story controls', () => {
  it('uses taps for previous/next and does not turn a hold into a tap', () => {
    expect(resolveStoryGesture({dx:1,dy:1,ms:90,x:100,width:390})).toBe('previous');
    expect(resolveStoryGesture({dx:0,dy:0,ms:90,x:118,width:390})).toBe('next');
    expect(resolveStoryGesture({dx:0,dy:0,ms:500,x:200,width:390})).toBeNull();
  });
  it('dismisses downward and changes author horizontally, preserving OS edge gestures', () => {
    expect(resolveStoryGesture({dx:5,dy:120,ms:300,x:200,width:390})).toBe('close');
    expect(resolveStoryGesture({dx:-90,dy:8,ms:300,x:220,width:390})).toBe('next-author');
    expect(resolveStoryGesture({dx:90,dy:8,ms:300,x:100,width:390})).toBe('previous-author');
    expect(resolveStoryGesture({dx:90,dy:8,ms:300,x:12,width:390})).toBeNull();
    expect(resolveStoryGesture({dx:100,dy:100,ms:300,x:220,width:390})).toBeNull();
  });
  it('moves across author boundaries and safely handles the first and last stories', () => {
    expect(navigateStory(groups,'a1','next')).toBe('a2');
    expect(navigateStory(groups,'a2','next')).toBe('b1');
    expect(navigateStory(groups,'b1','previous')).toBe('a2');
    expect(navigateStory(groups,'a1','previous')).toBe('a1');
    expect(navigateStory(groups,'b1','next')).toBeNull();
    expect(navigateStory(groups,'a1','next-author')).toBe('b1');
    expect(navigateStory(groups,'b1','previous-author')).toBe('a1');
    expect(navigateStory([],'missing','next')).toBeNull();
  });
});
