import { Plus } from 'lucide-react';
import { Accordion } from '../src/components/Accordion';
import { AlertMessage } from '../src/components/AlertMessage';
import { AvailabilityPills } from '../src/components/AvailabilityPills';
import { Button } from '../src/components/Button';
import { ContactOpponentButton } from '../src/components/ContactOpponentButton';
import { EntityCard } from '../src/components/EntityCard';
import { Fab } from '../src/components/Fab';
import { Input } from '../src/components/Input';
import { PersonChip } from '../src/components/PersonChip';
import { PersonInline } from '../src/components/PersonInline';
import { ListGroup } from '../src/components/ListGroup';
import { ListRow } from '../src/components/ListRow';
import { LoadingBar } from '../src/components/LoadingBar';
import { NearbyPill } from '../src/components/NearbyPill';
import { PlayerCard, RankMove, SourceLetter } from '../src/components/PlayerCard';
import { RacquetIcon } from '../src/components/RacquetIcon';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { Sheet } from '../src/components/Sheet';
import { Skeleton } from '../src/components/Skeleton';
import { ReviewPanel } from '../src/components/ReviewPanel';
import { ProfileCard } from '../src/components/ProfileCard';
import { DrawerLayout } from '../src/components/DrawerLayout';
import { StatGrid } from '../src/components/StatGrid';
import { StatTile } from '../src/components/StatTile';
import { Popover, PopoverRow } from '../src/components/Popover';
import { SelectSheet } from '../src/components/SelectSheet';
import { Spinner } from '../src/components/Spinner';
import { Toast } from '../src/components/Toast';
import { Tree, TreeGroup, TreeRow } from '../src/components/Tree';

/**
 * D1 design-sync closeout (TASK-650 / BLG0041).
 * Live primitives from DC-16 / DC-18 / DC-19 are registered here.
 * Superseded: Stepper (deleted D2 R-5); DC-19 pendingGrade cache (never committed);
 * `.design-sync/previews/*.tsx` Variants/Sizes/States files (this harness is the source).
 */
export const componentSrcMap = {
  Button: '../src/components/Button.tsx',
  Input: '../src/components/Input.tsx',
  PlayerCard: '../src/components/PlayerCard.tsx',
  Accordion: '../src/components/Accordion.tsx',
  AlertMessage: '../src/components/AlertMessage.tsx',
  AvailabilityPills: '../src/components/AvailabilityPills.tsx',
  ContactOpponentButton: '../src/components/ContactOpponentButton.tsx',
  Fab: '../src/components/Fab.tsx',
  LoadingBar: '../src/components/LoadingBar.tsx',
  NearbyPill: '../src/components/NearbyPill.tsx',
  RacquetIcon: '../src/components/RacquetIcon.tsx',
  SegmentedControl: '../src/components/SegmentedControl.tsx',
  Sheet: '../src/components/Sheet.tsx',
  Toast: '../src/components/Toast.tsx',
  Tree: '../src/components/Tree.tsx',
  EntityCard: '../src/components/EntityCard.tsx',
  PersonChip: '../src/components/PersonChip.tsx',
  PersonInline: '../src/components/PersonInline.tsx',
  ListGroup: '../src/components/ListGroup.tsx',
  ListRow: '../src/components/ListRow.tsx',
  Skeleton: '../src/components/Skeleton.tsx',
  ReviewPanel: '../src/components/ReviewPanel.tsx',
  ProfileCard: '../src/components/ProfileCard.tsx',
  DrawerLayout: '../src/components/DrawerLayout.tsx',
  StatGrid: '../src/components/StatGrid.tsx',
  Popover: '../src/components/Popover.tsx',
  SelectSheet: '../src/components/SelectSheet.tsx',
  Spinner: '../src/components/Spinner.tsx',
} as const;

/** 44px paint-height guide (DC-18). */
function Target44() {
  return <div data-guide="Target44" className="h-11 border border-badge-loss" aria-hidden />;
}

export const previews = {
  Button: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-4 bg-tennis-surface p-4 text-fg">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="clay">Clay</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="white">White</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button isLoading>Saving</Button>
        <Button disabled>Disabled</Button>
        <Target44 />
      </div>
    </div>
  ),
  Input: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-4 bg-tennis-surface p-4" style={{ width: 360 }}>
      <Input label="Display name" placeholder="Blake Bell" />
      <Input label="Email" required hint="We'll never share this." />
      <Input label="Score" error="Enter a number" />
      <Target44 />
    </div>
  ),
  PlayerCard: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-2 bg-tennis-surface p-4" style={{ width: 360 }}>
      <PlayerCard
        id="blake"
        name="blake bell"
        subtitle="Skill 3.5"
        rank={1}
        primary={12}
        trailing={<RankMove t="up" move={2} />}
        nameBadge={<SourceLetter source="tournament" />}
        pills={<NearbyPill show />}
        stats={[{ label: 'Wins', value: '8' }]}
        open={false}
        onToggle={() => {}}
      />
      <PlayerCard
        id="you"
        name="Annas Tariq"
        isYou
        subtitle="Skill 4.0"
        open
        onToggle={() => {}}
        stats={[
          { label: 'Wins', value: '4' },
          { label: 'Losses', value: '2' },
        ]}
      />
    </div>
  ),
  Accordion: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-3 bg-tennis-surface p-4" style={{ width: 360 }}>
      <Accordion
        id="open"
        title="Open section"
        open
        onToggle={() => {}}
        right={<span className="text-xs text-fg/70">2</span>}
      >
        <p className="text-sm text-fg">Body</p>
      </Accordion>
      <Accordion id="closed" title="Closed section" open={false} onToggle={() => {}}>
        <p className="text-sm text-fg">Hidden</p>
      </Accordion>
      <Accordion id="locked" title="Locked" open={false} onToggle={() => {}} locked>
        <p className="text-sm text-fg">Locked</p>
      </Accordion>
    </div>
  ),
  AlertMessage: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-3 bg-tennis-surface p-4" style={{ width: 360 }}>
      <AlertMessage tone="success">Result recorded.</AlertMessage>
      <AlertMessage tone="warning">Result disputed — organizer reviewing.</AlertMessage>
      <AlertMessage tone="error">Could not save.</AlertMessage>
    </div>
  ),
  AvailabilityPills: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4" style={{ width: 360 }}>
      <AvailabilityPills tags={['weekday_evenings', 'weekend_mornings']} />
    </div>
  ),
  ContactOpponentButton: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="flex items-center gap-2 bg-tennis-surface p-4">
      <ContactOpponentButton name="Blake Bell" email="blake@example.com" phone="4165550123" />
      <Target44 />
    </div>
  ),
  Fab: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="relative bg-tennis-surface p-4" style={{ width: 360, height: 180 }}>
      <Fab ariaLabel="Add an event" onClick={() => {}}>
        <Plus className="w-6 h-6" />
      </Fab>
    </div>
  ),
  LoadingBar: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="relative bg-tennis-surface" style={{ width: 360, height: 160 }}>
      <LoadingBar label="Loading locations…" />
    </div>
  ),
  NearbyPill: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="flex items-center gap-2 bg-tennis-surface p-4">
      <NearbyPill show />
    </div>
  ),
  RacquetIcon: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="flex items-center gap-4 bg-tennis-surface p-4 text-fg">
      <RacquetIcon className="h-6 w-6" />
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-clay text-white">
        <RacquetIcon className="h-6 w-6" />
      </span>
    </div>
  ),
  SegmentedControl: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-3 bg-tennis-surface p-4" style={{ width: 360 }}>
      <SegmentedControl
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'completed', label: 'Completed' },
        ]}
        value="upcoming"
        onChange={() => {}}
      />
      <Target44 />
    </div>
  ),
  Sheet: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="relative bg-tennis-surface p-4" style={{ width: 360, height: 240 }}>
      <Sheet title="Enter score" onClose={() => {}}>
        <p className="text-sm text-fg">Pick the winner and enter the games.</p>
      </Sheet>
    </div>
  ),
  Toast: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="relative bg-tennis-surface p-4" style={{ width: 360, height: 120 }}>
      <Toast message="Win recorded — 6-4 v. Blake Bell" onDismiss={() => {}} />
    </div>
  ),
  Tree: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4" style={{ width: 360 }}>
      <Tree title="Divisions" footnote="Dot marks your group">
        <TreeGroup id="mens" label="Men's 3.5" right="8" open onToggle={() => {}}>
          <TreeRow label="Saturday draw" fill={{ count: 8, size: 16 }} />
          <TreeRow label="Sunday draw" right="4/16" dot />
        </TreeGroup>
        <TreeGroup id="womens" label="Women's 3.5" right="3" open={false} onToggle={() => {}}>
          <TreeRow label="Hidden" />
        </TreeGroup>
      </Tree>
    </div>
  ),
  EntityCard: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4">
      <EntityCard
        title={<h3 className="text-sm font-bold text-fg">Saturday social</h3>}
        badges={<span className="text-xs font-bold text-clay-fg">Event</span>}
        body={<p className="text-xs text-fg/70">A friendly evening on court.</p>}
        pills={<span className="rounded-full bg-fg/5 px-2 py-1 text-xs text-fg/70">Toronto</span>}
        footerMeta={<span className="text-xs text-fg/70">June 15 · 6:00 PM</span>}
        footerAction={
          <button type="button" className="text-xs font-bold text-clay-fg">
            Join
          </button>
        }
      />
    </div>
  ),
  PersonChip: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4">
      <PersonChip name="Blake Bell" onRemove={() => {}} />
    </div>
  ),
  PersonInline: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4 text-fg">
      <p>
        Defeated <PersonInline name="Blake Bell" /> in the quarterfinal.
      </p>
    </div>
  ),
  ListGroup: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4">
      <ListGroup title="Recent matches" count={2}>
        <ListRow title="Blake Bell" description="Completed today" trailing="6–4" />
        <ListRow title="Annas Tariq" description="Pending" trailing="—" />
      </ListGroup>
    </div>
  ),
  ListRow: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4">
      <ListRow title="Blake Bell" description="Completed today" meta="W" trailing="6–4" />
    </div>
  ),
  Skeleton: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-4 bg-tennis-surface p-4">
      <ListGroup title="List rows">
        <Skeleton as="ListRow" />
        <ListRow title="Blake Bell" description="Completed today" trailing="6–4" />
      </ListGroup>
      <Skeleton as="PersonRow" />
      <Skeleton as="EntityCard" />
      <Skeleton as="block" />
      <Skeleton as="row" radius="rounded-2xl" />
    </div>
  ),
  ReviewPanel: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4">
      <ReviewPanel title="Task approvals" count={2} defaultOpen>
        <p className="text-sm text-fg">Blake Bell — Volunteered</p>
      </ReviewPanel>
    </div>
  ),
  ProfileCard: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-4 bg-tennis-dark p-4" style={{ width: 360 }}>
      <ProfileCard
        mode="own"
        name="blake bell"
        bio="Evenings on clay."
        skillLevel={3.5}
        league="Men's"
        courts={['Stanley Park']}
        zone="Downtown - Midtown"
        favourites={['Roger Federer']}
        phone="(416)-555-0123"
        matches={[{ won: true }, { won: true }]}
        payments={[{ type: 'donation', state: 'succeeded' }]}
        pgWonPct="48%"
        availableToPlay
        availabilityTags={['weekday_evenings', 'weekend_mornings']}
      />
      <ProfileCard
        mode="public"
        name="blake bell"
        bio="Evenings on clay."
        skillLevel={3.5}
        league="Men's"
        courts={['Stanley Park']}
        favourites={['Roger Federer']}
        matches={[{ won: true }, { won: true }]}
        payments={[{ type: 'donation', state: 'succeeded' }]}
        pgWonPct="48%"
      />
    </div>
  ),
  DrawerLayout: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4" style={{ width: 360 }}>
      <DrawerLayout
        open
        stats={[
          { label: 'P/G Won %', value: '48%' },
          { label: 'Wins', value: '12' },
          { label: 'Matches', value: '20' },
          { label: 'Contact', value: '—' },
        ]}
      />
    </div>
  ),
  StatGrid: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4" style={{ width: 360 }}>
      <StatGrid>
        <StatTile label="RS Points" value={12} />
        <StatTile label="League Points" value={8} />
        <StatTile label="Rewards" value={1} />
      </StatGrid>
    </div>
  ),
  Popover: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="relative bg-tennis-surface p-4" style={{ width: 360, minHeight: 180 }}>
      <Popover open onClose={() => {}} aria-label="Court choices">
        <PopoverRow>Stanley Park</PopoverRow>
        <PopoverRow>High Park</PopoverRow>
      </Popover>
    </div>
  ),
  SelectSheet: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="bg-tennis-surface p-4" style={{ width: 360 }}>
      <SelectSheet
        label="Condition"
        value="Like new"
        options={[
          { value: 'New', label: 'New' },
          { value: 'Like new', label: 'Like new' },
          { value: 'Good', label: 'Good' },
        ]}
        onChange={() => {}}
      />
    </div>
  ),
  Spinner: ({ theme }: { theme: 'light' | 'dark' }) => (
    <div data-theme={theme} className="space-y-4 bg-tennis-surface p-4 text-fg">
      <div className="flex items-center gap-4">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>
      <button type="button" className="inline-flex h-11 items-center rounded-2xl bg-clay px-6 font-semibold text-white">
        <Spinner size="sm" tone="current" className="mr-2" aria-hidden />
        Saving
      </button>
    </div>
  ),
} as const;
