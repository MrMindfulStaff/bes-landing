import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LEGAL_CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | The Black Entrepreneurship Society",
  description:
    "How The Black Entrepreneurship Society collects, uses, and protects member information.",
};

// DRAFT for Reginald's approval. Items to confirm before merging:
//   - the legal entity name behind "The Black Entrepreneurship Society" (currently described as a Mindful Companies venture)
//   - the contact mailbox (LEGAL_CONTACT_EMAIL in components/legal/LegalPage.tsx)
//   - the payments paragraph in section 3 only applies once a paid membership exists (pricing decision pending)

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <>
          <p>
            The Black Entrepreneurship Society (&ldquo;BES&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;), a Mindful Companies venture, runs the community at
            jointhebes.com (the &ldquo;Platform&rdquo;). This policy explains what
            information we collect when you visit the site or become a member, how we
            use it, and the choices you have.
          </p>
          <p>
            The short version: we collect what we need to run a private member
            community and nothing more. We do not sell your information.
          </p>
        </>
      }
      sections={[
        {
          title: "Information we collect",
          body: (
            <>
              <p>
                <strong className="text-white">Account information.</strong> When you
                join, we collect your name, email address, and a password (or, if you
                sign in with Google, the name, email, and profile image Google shares
                with us).
              </p>
              <p>
                <strong className="text-white">Profile information you choose to add.</strong>{" "}
                Your bio, headline, industry, location, profile photo, and cover image.
                These are visible to other members.
              </p>
              <p>
                <strong className="text-white">Content you create.</strong> Posts,
                comments, likes, event RSVPs, direct messages, questions you ask the
                BES AI assistant, and any files you upload.
              </p>
              <p>
                <strong className="text-white">Learning activity.</strong> Which courses
                you enroll in, lessons you complete, points and badges you earn, and your
                activity streak.
              </p>
              <p>
                <strong className="text-white">Technical information.</strong> Standard
                server logs (IP address, browser type, pages visited, timestamps) and
                the session cookies needed to keep you logged in.
              </p>
              <p>
                <strong className="text-white">Referral and lead information.</strong>{" "}
                If you arrive through a member&rsquo;s referral link or submit your
                email to receive a resource, we record that so we can credit the
                referrer and send you what you asked for.
              </p>
            </>
          ),
        },
        {
          title: "How we use it",
          body: (
            <ul>
              <li>To create and secure your account and keep you logged in.</li>
              <li>
                To run the community: show your posts and profile to other members,
                deliver direct messages, track course progress, and award points and
                badges.
              </li>
              <li>
                To power the BES AI assistant, which answers your questions using the
                course library, your profile, and the member directory.
              </li>
              <li>
                To send you platform notifications and, occasionally, announcements
                from the Society. You can turn off email announcements at any time.
              </li>
              <li>To credit referrals under our affiliate program.</li>
              <li>To understand how the Platform is used so we can improve it.</li>
              <li>To comply with the law and enforce our Terms of Service.</li>
            </ul>
          ),
        },
        {
          title: "Who we share it with",
          body: (
            <>
              <p>
                We do not sell or rent your personal information. We share it only with
                the service providers that make the Platform work, each of which handles
                it under its own privacy commitments:
              </p>
              <ul>
                <li>
                  <strong className="text-white">Supabase</strong> hosts our database,
                  authentication, and file storage.
                </li>
                <li>
                  <strong className="text-white">Vercel</strong> hosts the website.
                </li>
                <li>
                  <strong className="text-white">Google</strong>, if you choose to sign in
                  with your Google account.
                </li>
                <li>
                  <strong className="text-white">Anthropic</strong> processes the
                  questions you send to the BES AI assistant, along with the context
                  needed to answer them. Your conversations with the assistant are not
                  used to train Anthropic&rsquo;s models.
                </li>
                <li>
                  <strong className="text-white">Resend</strong> delivers email
                  announcements and account emails.
                </li>
                <li>
                  <strong className="text-white">Stripe</strong> processes payments if
                  and when a paid membership is offered. We never see or store your full
                  card number.
                </li>
              </ul>
              <p>
                We may also disclose information if required by law, or to protect the
                rights, safety, or property of BES, our members, or others.
              </p>
            </>
          ),
        },
        {
          title: "What other members can see",
          body: (
            <p>
              BES is a private community: only logged-in members can see the member
              area. Inside it, your profile, posts, comments, likes, badges, and
              leaderboard position are visible to other members. Direct messages are
              visible only to the people in the conversation and to administrators
              where needed to investigate abuse or a legal request. Nothing in the
              member area is visible to the public.
            </p>
          ),
        },
        {
          title: "AI mentors and the BES AI assistant",
          body: (
            <p>
              Some accounts in the community are clearly labeled &ldquo;BES
              Mentor&rdquo; and are operated by AI. They may read and respond to public
              posts. The BES AI assistant is a tool for general business education; its
              answers are not professional legal, tax, financial, or investment advice.
            </p>
          ),
        },
        {
          title: "Cookies",
          body: (
            <p>
              We use strictly necessary cookies to keep you signed in and to protect
              your session. We do not use advertising cookies or third-party tracking
              pixels on the Platform. You can clear cookies in your browser at any time,
              which will log you out.
            </p>
          ),
        },
        {
          title: "How long we keep it",
          body: (
            <p>
              We keep your information for as long as your account is active. If you
              delete your account, we delete or anonymize your profile and personal
              information within 30 days, except where we must keep records to comply
              with the law, resolve disputes, or honor affiliate payouts. Posts and
              comments you made may remain in the community in anonymized form so that
              conversations stay readable for other members.
            </p>
          ),
        },
        {
          title: "Your choices and rights",
          body: (
            <ul>
              <li>
                You can view and edit your profile at any time from the member area.
              </li>
              <li>
                You can request a copy of your information, or ask us to correct or
                delete it, by emailing{" "}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
              </li>
              <li>
                You can opt out of email announcements using the link in any announcement
                email. Account and security emails will still be sent.
              </li>
              <li>
                If you live somewhere that gives you additional privacy rights (for
                example California or the European Union), we will honor those rights
                as the law requires.
              </li>
            </ul>
          ),
        },
        {
          title: "Security",
          body: (
            <p>
              We protect your information with encryption in transit, access controls on
              our database, and row-level security that limits what each account can
              read. No system is perfectly secure, so please use a strong, unique
              password and let us know right away if you suspect your account has been
              accessed without permission.
            </p>
          ),
        },
        {
          title: "Children",
          body: (
            <p>
              The Platform is for business owners and founders and is not directed to
              anyone under 18. We do not knowingly collect information from children. If
              you believe a child has created an account, contact us and we will remove
              it.
            </p>
          ),
        },
        {
          title: "Changes to this policy",
          body: (
            <p>
              If we make meaningful changes, we will update the effective date above and
              notify members in the community or by email before the changes take
              effect. Continued use of the Platform after that date means you accept the
              updated policy.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Privacy questions or requests:{" "}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. See
              also our <Link href="/terms">Terms of Service</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
