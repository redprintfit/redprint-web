import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Delete your Redprint account | Redprint",
  description:
    "How to delete your Redprint account and what happens to your data.",
};

/**
 * Account deletion instructions. Public and reachable without signing in —
 * Google Play's Data safety form requires a URL that states the app and
 * developer name, how to request deletion, and what data is deleted,
 * anonymised, or kept. Keep those three things intact when editing.
 *
 * Source of truth for the copy: ~/Desktop/RedprintReact.nosync/delete-account-page.md
 */
export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your Redprint account" lastUpdated="November 15, 2026">
      <p>
        This page explains how to delete your account in the{" "}
        <strong>Redprint</strong> app (published by <strong>Redprint Inc.</strong>{" "}
        on Google Play and the App Store) and what happens to your data.
      </p>

      <h2>Option 1: Delete in the app</h2>
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

      <h2>Option 2: Request deletion by email</h2>
      <p>
        If you can&apos;t access the app, email{" "}
        <strong>
          <a href="mailto:info@redprintfit.com">info@redprintfit.com</a>
        </strong>{" "}
        from the address on your account, with the subject{" "}
        <strong>&quot;Delete my Redprint account&quot;</strong>. We&apos;ll
        confirm when it&apos;s done.
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
          are processed by Stripe and Google Play under their own retention
          rules.
        </li>
        <li>
          <strong>Anonymous, aggregated statistics</strong> (for example, total
          workouts logged at a gym), which can&apos;t be linked back to you.
        </li>
      </ul>

      <p>Requests made by email are completed within 30 days.</p>

      <p>
        Questions? Contact{" "}
        <strong>
          <a href="mailto:info@redprintfit.com">info@redprintfit.com</a>
        </strong>
        .
      </p>
    </LegalPage>
  );
}
