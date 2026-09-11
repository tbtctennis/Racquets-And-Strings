import { EntityCard } from '../src/components/EntityCard';
import { PersonChip } from '../src/components/PersonChip';
import { PersonInline } from '../src/components/PersonInline';
import { ListGroup } from '../src/components/ListGroup';
import { ListRow } from '../src/components/ListRow';
import { Skeleton } from '../src/components/Skeleton';
import { ReviewPanel } from '../src/components/ReviewPanel';
import { ProfileCard } from '../src/components/ProfileCard';
import { DrawerLayout } from '../src/components/DrawerLayout';
import { StatGrid } from '../src/components/StatGrid';
import { StatTile } from '../src/components/StatTile';
import { Popover, PopoverRow } from '../src/components/Popover';
import { SelectSheet } from '../src/components/SelectSheet';
import { Spinner } from '../src/components/Spinner';

/** Components included in the D7 person-reference design-sync surface. */
export const componentSrcMap = {
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

export const previews = {
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
