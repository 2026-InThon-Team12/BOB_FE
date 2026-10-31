import { useApk } from '@/features/apklike/useApk';
import { HtmlScreen, ItemList, Action } from '../html/shared';
import { apkCopy as c } from '@/constants/apkCopy';
import { Text } from '@/components/ui';
import * as Observation from '../html/observation';
import { Discount } from '../html/discount';
import * as Pages from '../html/pages';
import * as Dashboard from '../html/dashboard';
import * as Registration from '../html/registration';

export default function ApkScreen() {
  const vm = useApk();
  if (!vm.ready)
    return (
      <HtmlScreen vm={vm}>
        <Text>{c.loading}</Text>
      </HtmlScreen>
    );
  const pages = {
    home: Dashboard.Home,
    add: Registration.Add,
    drafts: Registration.Drafts,
    reasons: Registration.Drafts,
    registrationPreview: Registration.Drafts,
    discount: Discount,
    today: Pages.Today,
    question: Observation.Question,
    result: Observation.Result,
    review: Observation.Review,
    goal: Dashboard.Goal,
    goalSetup: Pages.GoalSetup,
    shelf: Dashboard.Shelf,
    impulse: Dashboard.Impulse,
    wallet: Pages.Wallet,
    report: Dashboard.Report,
    settings: Pages.Settings,
  };
  const Page = pages[vm.page as keyof typeof pages];
  if (Page) return <Page key={vm.page} vm={vm} />;
  return (
    <HtmlScreen vm={vm} title={c.history}>
      <ItemList vm={vm} items={vm.history} />
      {!vm.history.length && <Text>{c.empty}</Text>}
      {vm.historyMore && <Action vm={vm} label={c.more} run={vm.actions.moreHistory} />}
    </HtmlScreen>
  );
}
