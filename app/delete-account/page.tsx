import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Delete your Redprint account",
  description:
    "How to request deletion of your Redprint account, what data is deleted, what we keep, and how long it takes.",
};

/**
 * Account deletion instructions. Public, server-rendered, and reachable
 * without signing in — this URL goes into the Play Console Data safety
 * form, so it must load for a crawler with no JS and no session.
 *
 * Google Play requires all of the following; keep them when editing:
 *   - the app and developer name ("Redprint", "Redprint Inc.")
 *   - a way to REQUEST deletion that works without the app (the email,
 *     which is why it comes first, above the in-app steps)
 *   - the steps to request it
 *   - what is deleted, what is kept, and the retention period
 *   - any prerequisite steps (here: cancelling a paid subscription)
 *
 * Copy is verbatim from ~/Desktop/RedprintReact.nosync/delete-account-page.md
 */

/** Pre-fills the subject so requests arrive consistently labelled. */
const DELETE_MAILTO =
  "mailto:info@redprintfit.com?subject=Delete%20my%20Redprint%20account";

function DeleteEmailLink() {
  return <a href={DELETE_MAILTO}>info@redprintfit.com</a>;
}

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your Redprint account" lastUpdated="November 15, 2026">
      <p>
        This page explains how to delete your account in the{" "}
        <strong>Redprint</strong> app (published by <strong>Redprint Inc.</strong>{" "}
        on Google Play and the App Store) and what happens to your data.
      </p>

      <h2>Request deletion by email (no app needed)</h2>
      <p>
        Email{" "}
        <strong>
          <DeleteEmailLink />
        </strong>{" "}
        from the address on your Redprint account, with the subject{" "}
        <strong>&quot;Delete my Redprint account&quot;</strong>. You don&apos;t
        need the app installed. We&apos;ll confirm by email when it&apos;s done,
        within 30 days.
      </p>

      <h2>Or delete it yourself in the app</h2>
      <ol>
        <li>Open Redprint and sign in.</li>
        <li>
          Tap <strong>Profile</strong>, then the <strong>Settings</strong> gear
          (top right).
        </li>
        <li>
          Tap <strong>Delete account</strong>.
        </li>
        <li>
          Confirm it&apos;s you by signing in again, then tap{" "}
          <strong>Delete My Account</strong>.
        </li>
      </ol>

      <h2>If you have a paid subscription</h2>
      <p>
        If you pay for Redprint Pro, cancel it before deleting your account:
        open Redprint Pro in the app and tap <strong>Manage subscription</strong>
        . If you no longer have the app, say so in your deletion email and
        we&apos;ll cancel it for you. Pro paid for by your gym or school
        doesn&apos;t need cancelling.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>
          <strong>Immediately when you delete in the app:</strong> your login
          and your profile (name, username, email, profile details).
        </li>
        <li>
          <strong>Within 24 hours:</strong> your workout history and logs, posts
          and their photos, comments, likes, direct messages (for both you and
          the person you messaged), notifications, AI coach conversations,
          followers and following, group memberships, challenge and leaderboard
          entries, trainer–client connections, trainer availability and payout
          details, and any other photos you uploaded.
        </li>
      </ul>

      <h2>What we anonymise</h2>
      <p>
        We remove your name and account from these, but keep the content so it
        still works for other people:
      </p>
      <ul>
        <li>
          <strong>Messages you posted in group chats</strong>, which then show
          as &quot;Deleted user&quot;.
        </li>
        <li>
          <strong>
            Routines and workouts you created that other members have downloaded
            or bought.
          </strong>{" "}
          They keep access to what they have.
        </li>
        <li>
          <strong>Groups you created</strong> are handed over to another member.
          A group with no other members is deleted.
        </li>
      </ul>

      <h2>What we keep</h2>
      <ul>
        <li>
          <strong>Purchase, payment and booking records</strong>, which
          we&apos;re legally required to keep for tax and accounting. Payments
          are processed by Stripe, which keeps its own records under its own
          retention rules.
        </li>
        <li>
          <strong>Anonymous, aggregated statistics</strong> (for example, total
          workouts logged at a gym), which can&apos;t be linked back to you.
        </li>
      </ul>

      <p>
        Questions? Contact{" "}
        <strong>
          <DeleteEmailLink />
        </strong>
        .
      </p>
    </LegalPage>
  );
}
