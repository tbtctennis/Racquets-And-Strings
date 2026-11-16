# TTL vs Racquets & Strings: tech team brief

Based on this repo and the local R&S clone. The R&S side is a snapshot from early September (its planning docs run to 31 Aug). TTL has changed a lot since, so please confirm where R&S stands today.

---

## The big picture

| Area | What changed in TTL |
|---|---|
| Scoring | A score counts the moment it is entered. Organizers no longer approve results |
| Seeding | Top players are spread fairly across the bracket, and first-round matchups favour players from the same area |
| GTA | 322 courts across 24 nearby cities added to the map |
| Database | A cleaner, consistent data layout, live since 2 October |
| UI/UX | One consistent design, built page by page; one button style |
| Homepage | New support band with Contribute, Subscribe and Volunteer in a new lime colour; FAQ for player rules |
| Newsletter | One mailing list; one-tap subscribe for members |
| Matches | A simpler page for challenges, rallies and tournament matches |
| Past events | Anyone can look back at finished tournaments |
| Roles | Organizers are per event; stringers and coaches are members with a role |
| Year-end points | The season structure is ready, the actual rollover is not yet |
| Privacy | Written to Canadian privacy and anti-spam law; private contact details; self-service account deletion |

---

## 1. Scoring: no organizer approval

**Before:** a challenge or rally result had to be reported by one player and confirmed by the other, and organizers confirmed results.

**Now:**
- When a player enters a score, it counts immediately. Nobody has to approve it.
- All scoring goes through the server. Nobody's browser can write a result directly, organizers included, so points can't be faked or paid twice.
- Every score entered is kept as a permanent record, including corrections and undos.

**If a second score is entered for the same match:**
- *Same winner:* the player who entered the first score can fix the games for 7 days. If the other player enters a different score, it only replaces the first if it is closer.
- *Different winner:* it becomes a dispute. The first result stands, the organizer is alerted and picks the right one.
- Organizers can still correct a result at any time, except changing the winner after the next round has been played.

**Points:**
- Group matches: 3 for a win, 1 for a loss.
- Knockouts: the loser earns more the further they got (1 point in the first round up to 10 in the final). The champion gets 20.
- Walkovers pay points but don't count as played matches.
- Challenges: +3 for a win, −3 for a loss. Rallies: +2 and +1.

A tournament counts as finished only when every draw in it has played its final.

---

## 2. Seeding and first-round placement

**Who is ranked higher:** league points first, then matches played, then name. A doubles team is ranked by its stronger partner.

**How many seeds:** 2 seeds in draws up to 8 players, 4 in a draw of 16, 8 in a draw of 32.

**Where they go:**
- The top two seeds sit at opposite ends of the bracket, so they can only meet in the final.
- Seeds 3 and 4 (and 5 to 8 in a big draw) are placed in fixed spots chosen by lot, so they land in different quarters of the bracket.
- Byes go to the top seeds first. Any left over are given out at random.

**Who plays whom in round one:**
1. Players from the same zone are matched first.
2. If none is left, the player whose home court is closest.
3. If that can't be worked out, anyone.

**Fair and repeatable:** the random draw is based on the event and its players, so everyone sees the same draw, and the draw you preview is exactly the one that gets created. It only changes if the list of players changes. Organizers can still move anyone by hand.

**Round robin:** players are grouped by area and skill level into groups of 3 to 5. The top two in each group are seeded. Group winners are then placed into the knockout the same way as above.

**Late joiners:** nobody is placed automatically. They wait on an "unplaced" list until an organizer puts them in. The old automatic placement put people in the wrong draw, so we removed it.

---

## 3. GTA expansion

- The court list now covers **182 Toronto courts and 322 courts in 24 nearby cities** (York, Peel, Durham and Halton).
- A court outside Toronto belongs to its **city** the way Toronto courts belong to a zone: a court in Markham is in the "Markham" zone.
- City borders come from OpenStreetMap. They are used behind the scenes to work out which city a court is in; they are not drawn on the map.
- Each city gets its own "visit every court" challenge. The citywide Explorer challenge stays Toronto-only.
- The map's zone filter only shows cities that have courts.

**Still to do:** the zone pickers on profiles and tournaments only list the 7 Toronto zones. Someone whose courts are all in Markham is currently put in the "Unassigned" draw. Cities need to be added to those pickers.

---

## 4. UI structure

- **One design, one set of rules.** The homepage is the reference, and the rest of the site was brought in line with it in late October.
- **Simple, consistent look:** two shades of text only, cards without borders or shadows, one button style with fixed sizes, nothing smaller than 12 px text, one dropdown style throughout.
- **Code layout:** each page keeps its small visual parts in one file next to it, instead of many tiny files. Editing a page no longer means opening six files.
- **Three dashboards** inside Profile:
  - *Player:* requests that need you, matches to play, head-to-head records, task progress, playing preferences.
  - *Provider* (stringers and coaches): their bookings.
  - *Organizer:* disputes, refunds, players waiting for a draw, court issue reports, recent results.
- Panels that moved into the dashboards were removed from their old pages.

---

## 4A. Buttons, lime and the homepage

**Buttons**
- One button style across the whole site, in three fixed heights: standard, a smaller one used only inside crowded rows (like Score or Accept), and a large one.
- Every button has the same rounded shape, the same keyboard focus ring and the same "disabled" look.
- Primary actions use the clay (terracotta) colour. There is no second button recipe.

**Lime**
- Lime is a new colour reserved for **support actions only**: Contribute, Subscribe to Newsletter and Volunteer with Us.
- It makes those three read as a different kind of action from the clay Join and primary buttons.
- The label is always dark green, in both light and dark mode, so it stays readable.
- Two small exceptions, both owner decisions: a light lime tint behind a walkover on a player's match card, and the player-count pill on the Tasks bonus cards.
- We don't use lime for anything else, and we don't use clay for support actions.

**Homepage**
- The homepage is the design reference for the rest of the site.
- Below the main content sits a **FAQ**, which is now the source of truth for player-facing rules. The old Google Doc guide is out of date and no longer linked.
- A **support band** holds the three lime buttons.
- The floating Report button for visitors was removed, to cut down the number of filled buttons on the page. Reporting a court issue now lives on the Courts map.

**Contribute**
- The Donate button was renamed **Contribute** on screen. It has no destination yet, because the site takes no money. The name is still "Donate" inside the code.
- Terms: a refunds section is still to be discussed (the only thing that comes back is points, and only with organizer approval).

**Volunteer with Us**
- Opens a short form. Visitors don't need an account; their entry is saved without a name.
- Organizers can read the sign-ups. Nobody else can.

**Newsletter**
- There is **one mailing list**. The Subscribe button and the court-report form (when a signed-out reporter leaves an email) both feed it.
- *Signed-in members:* one tap subscribes them, using the email already on their account. They get a confirmation notification, and the Subscribe button disappears once they're on the list.
- *Visitors:* a short form asks for an email.
- Each member can be on the list only once. Visitors can sign up twice, so exports should remove duplicates by email.
- Sending and unsubscribing are handled by Brevo.
- Separately, **Served Up** is our in-app newsletter. It is a magazine-style page with issues, articles and a crossword.

---

## 5. Matches page

- The page is a grid of cards: one for each live tournament you are in, plus Challenges and Rallies.
- **Challenges and rallies work the same way:** send a request, the other player accepts or declines, then someone enters the score.
- Each tab suggests about 20 people, each tagged with why: New, Most matches, Nearby, or Re-Match.
- A tournament match only blocks a challenge between two players until it has been played. After that, the normal 3-day wait before a rematch applies.
- Requests nobody answers close on their own: rallies after 30 days, challenges after 40.
- We always say "rally", never "friendly".
- Members who are away can be hidden from the lists without affecting their points.

---

## 6. Looking back at past events

- Finished tournaments are listed under Events → Completed, and the homepage "Matches played" number links there.
- Opening one shows two finished draws picked at random (one men's and one women's when both exist), as the same picture cards used for live draws, followed by a results list with every score, the date and the court.
- **Privacy:** if you're signed out, players show as "Player A", "Player B" and so on. Signed-in members see real names. Contact details are never shown.
- This view reads from a dedicated, public-safe feed, so match records themselves stay members-only.

---

## 7. Roles (short)

- Every event has its own organizers, plus the super admin, who can manage anything.
- Stringers, coaches and organizers are regular members who have been given a role. Only the super admin can give or remove a role.
- Hiding a button in the app doesn't grant access: permissions are enforced on the server, not just on screen.

---

## 8. Year-end points (short)

- Each season's points are stored, and half of last season's total carries into the new one.
- Points members can spend are kept separate from ranking points, so a year-end reset won't wipe anyone's balance.
- **The actual rollover has not been built yet.**
- R&S reached the same conclusion: the ranking halves, the spendable balance carries over in full.

---

## 9. Database changes

The database was reshaped in one go on **2 October** during the monthly maintenance window.

**The rules of the new layout:**
- Every record in a collection has every field. A field that doesn't apply holds an empty value, so nothing is ever "missing".
- Dates are always real dates, never text.
- Records are told apart by a type and subtype, not by living in different collections.
- Anything owned by a person points to their account ID.

**What actually changed:**
- **Contact details separated:** the public member record no longer holds email or phone. They live in a private record that only the member, their connections and organizers can read.
- **One stats record per member:** match record, task progress and points spent are in one place.
- **One history of scores:** every score, correction and undo is kept in a single list, replacing several overlapping ones.
- **New server-only records** for bonuses, past seasons, bookings and who may see whose contact details. Browsers can read some of these but never write to them.
- **Cleaner wording:** one word for a withdrawn player, unread notifications are flagged consistently, and event organizers are a simple list.
- **About two dozen old collections retired** (old match, challenge, rally, court visit and report records, and others). Their contents were archived, not just deleted.

**Safety:** there is still only one environment (production) and no backups, so any bulk change is tested with a dry run first.

---

---

## 10. Privacy and personal information (PIPEDA and CASL)

We serve North America only, so the privacy policy is written to Canada's PIPEDA and anti-spam law (CASL). Nothing specific to the EU or UK is built; whether to serve those members is undecided.

**What is in place**
- **Age:** members must tick that they are 17 or older at signup. The Terms say the same.
- **Consent:** members agree to the Terms and Privacy Policy at signup. When the policy changes materially, everyone is asked to agree again the next time they sign in.
- **Contact details are private.** Phone, email and WhatsApp live in a private record. Only the member, someone they are playing or booking with, and organizers can see them. The public member record never holds them.
- **Joining an event:** a required tick says the member may be contacted about the event and that their contact details are shared with their opponents.
- **Location data:** the exact coordinates of a court check-in are erased after 30 days.
- **Last-active date** is kept private, not on the public profile.
- **Court report photos** no longer carry the member's ID.
- **Fonts are bundled** with the site, so visitors' browsers don't contact Google Fonts.
- **The data export to Sheets** leaves out contact details, notifications and connections.
- **Newsletter:** unsubscribing is handled by Brevo, which records it (CASL).
- **The privacy policy names every outside service** that handles member data: Firebase, Google Analytics, Resend, Twilio and Meta (WhatsApp), Brevo, Google Sheets, Google Cloud Vision (photo checks), OpenFreeMap and OpenStreetMap. A new one must be added to the policy before it is used.
- **A named privacy contact** is now in the policy.

**Deleting an account**
- A member can delete their account themselves. It is immediate and final (we have no backups).
- Removed: their profile, contact details, preferences, mailing-list entries, notifications, marketplace listings, photos and sign-in.
- Kept but renamed "Former member": match and score records, so other players' results and standings stay correct.
- Unplayed tournament matches become walkovers for the opponent, and the organizer is told without the member's name.
- Not allowed while the member holds a role (organizer, stringer, coach) or has a booking in progress.

**Still to decide or do**
- Whether to serve EU/UK members. If yes: an opt-in cookie banner before analytics loads, a stated legal basis for each use of data, a transfer mechanism for US storage, an EU representative, and a way to opt out of texts without removing a phone number.
- A refunds section for the Terms.
