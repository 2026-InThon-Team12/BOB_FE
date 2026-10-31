import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppState, BackHandler } from 'react-native';
import { apkActions as actions, apkRepository, useApkState } from '@/data';
import { apkBackPage, object, seoulDate, str, type Json } from '@/lib/apkDomain';
import { pickImage, prepareCartImage, type PickedImage } from '@/lib/image';
import { apkTabs, apkTitles } from '@/constants/apkCopy';

export function useApk() {
  const params = useLocalSearchParams<{ page: string }>();
  const page = params.page in apkTitles ? params.page : 'home';
  const state = useApkState();
  const [pendingPhoto, setPendingPhoto] = useState<PickedImage | null>(null);
  const go = (next: string) => router.replace({ pathname: '/apk/[page]', params: { page: next } });
  useEffect(() => {
    let active = true;
    void (async () => {
      if ((await actions.init()) && active) await actions.refresh(page);
    })();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void actions.refresh(page);
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [page]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.busy) return true;
      if (page in apkTabs) return false;
      router.replace({
        pathname: '/apk/[page]',
        params: { page: apkBackPage[page] ?? 'home' },
      });
      return true;
    });
    return () => sub.remove();
  }, [page, state.busy]);
  const finish = async (action: Promise<boolean>, next: string) => {
    if (await action) go(next);
  };
  const analyze = async (photo: PickedImage, replace: boolean) => {
    setPendingPhoto(null);
    await finish(
      actions.run(async () => {
        await apkRepository.extract(await prepareCartImage(photo), replace);
      }),
      'drafts',
    );
  };
  return {
    ...state,
    actions,
    page,
    go,
    finish,
    pendingPhoto,
    back: () => {
      if (!state.busy) go(apkBackPage[page] ?? 'home');
    },
    pickPhoto: async () => {
      let picked: PickedImage | null = null;
      if (
        !(await actions.run(async () => {
          picked = await pickImage();
        })) ||
        !picked
      )
        return;
      if (state.drafts.some((d) => d.source === 'SCREENSHOT')) setPendingPhoto(picked);
      else await analyze(picked, false);
    },
    usePhoto: (replace: boolean) => pendingPhoto && analyze(pendingPhoto, replace),
    cancelPhoto: () => setPendingPhoto(null),
    openItem: (id: string) => finish(actions.openItem(id), 'result'),
    openReview: (review: Json) => {
      if (review.question_mode === 'LOCAL') {
        return finish(actions.openQuestion({
          kind: 'purchases', subjectId: str(review.id), name: str(review.item_name), date: seoulDate(),
        }), 'question');
      }
      actions.openReview(review);
      go('review');
    },
    itemRecords: Object.values(state.records).filter(
      (q) => q.local_kind === 'simulations' && q.local_subject === object(state.selected.simulation).id,
    ),
  };
}
