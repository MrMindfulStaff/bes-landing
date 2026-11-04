import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LEGAL_CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | The Black Entrepreneurship Society",
  description:
    "The terms that govern membership in The Black Entrepreneurship Society at jointhebes.com.",
};

// DRAFT for Reginald's approval. Items to confirm before merging:
//   - the legal entity name behind "The Black Entrepreneurship Society"
//   - section 3 (Membership and payment) and section 4 (Affiliate program) depend on the
//     pending pricing decision. As written they describe today's reality: free to join,
//     with the paid-membership and affiliate terms taking effect only if/when pricing launches.
//   - governing law is set to Wisconsin (Mindful Companies is Milwaukee-based)
//   - the contact mailbox (LEGAL_CONTACT_EMAIL in components/legal/LegalPage.tsx)

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <>
          <p>
            Welcome to The Black Entrepreneurship Society (&ldquo;BES&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;), a Mindful Companies venture. These
            Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you and BES
            that governs your use of jointhebes.com and the member community, courses,
            templates, events, messaging, AI assistant, and affiliate program offered
            through it (together, the &ldquo;Platform&rdquo;).
          </p>
          <p>
            By creating an account or using the Platform you agree to these Terms and
            to our <Link href="/privacy">Privacy Policy</Link>. If you do not agree,
            please do not use the Platform.
          </p>
        </>
      }
      sections={[
        {
          title: "Who can join",
          body: (
            <p>
              You must be at least 18 years old and able to enter a binding contract to
              become a member. You agree to give us accurate information when you sign
              up, to keep your login details private, and to let us know right away if
              you believe someone else is using your account. You are responsible for
              everything that happens under your account.
            </p>
          ),
        },
        {
          title: "What membership includes",
          body: (
            <p>
              Membership gives you access to the private community, the course library,
              downloadable templates and checklists, member events, direct messaging,
              the BES AI assistant, and the points, levels, and badges that recognize
              your participation. We may add, change, or retire features over time as
              the Platform grows.
            </p>
          ),
        },
        {
          title: "Membership and payment",
          body: (
            <>
              <p>
                Membership is currently free. If we introduce a paid membership, we will
                tell you the price and billing terms clearly before you are charged, and
                no existing member will be charged without first agreeing to those
                terms.
              </p>
              <p>
                For any paid membership: fees are billed in advance for each billing
                period through our payment processor; you can cancel at any time from
                your account, and cancellation takes effect at the end of the current
                billing period, with no further charges after that; fees already paid
                are not refunded except where the law requires it; and we may change
                prices with at least 30 days&rsquo; notice, applied from your next
                billing period.
              </p>
              <p>
                You may close your account at any time. There is no long-term
                commitment.
              </p>
            </>
          ),
        },
        {
          title: "Affiliate program",
          body: (
            <>
              <p>
                Members may share a personal referral link. If we operate a paid
                membership, the referring member earns a recurring commission of 40% of
                the membership fee actually paid by each member they refer, for as long
                as that referred member remains a paying member in good standing.
                Commissions are calculated on net fees received (after refunds,
                chargebacks, and payment processing failures).
              </p>
              <p>
                Payouts are made through the method we announce in the member area, on
                a schedule we publish there, once a minimum balance is reached.
                Self-referrals, referrals of existing members, incentives paid to the
                person being referred, misleading claims about BES, and spam are not
                permitted and will forfeit commissions. We may change or end the
                affiliate program on 30 days&rsquo; notice; commissions already earned
                will still be paid. You are responsible for any taxes on commissions you
                receive.
              </p>
            </>
          ),
        },
        {
          title: "Community rules",
          body: (
            <>
              <p>
                BES is a space for Black founders to build together. Keep it that way.
                You agree not to:
              </p>
              <ul>
                <li>harass, threaten, demean, or discriminate against anyone;</li>
                <li>
                  post content that is unlawful, defamatory, pornographic, or that
                  infringes someone else&rsquo;s rights;
                </li>
                <li>
                  spam, pitch unsolicited offers in direct messages, or promote
                  multi-level marketing, get-rich-quick schemes, or unregistered
                  securities;
                </li>
                <li>
                  scrape, copy, or redistribute course content, templates, or member
                  information outside the Platform;
                </li>
                <li>share your login, create multiple accounts, or impersonate anyone;</li>
                <li>
                  interfere with the Platform&rsquo;s security or try to access data
                  that isn&rsquo;t yours.
                </li>
              </ul>
              <p>
                We may remove content and suspend or close accounts that break these
                rules, at our discretion and without refund.
              </p>
            </>
          ),
        },
        {
          title: "Your content",
          body: (
            <p>
              You own what you post. By posting it on the Platform you give BES a
              non-exclusive, worldwide, royalty-free license to host, display, and
              share it within the Platform so the community can see it, and to feature
              member wins (with your name) in Society communications unless you ask us
              not to. You confirm you have the right to post what you share. If you
              delete content or your account, we will stop displaying it, except that
              comments in other members&rsquo; threads may remain in anonymized form.
            </p>
          ),
        },
        {
          title: "Our content",
          body: (
            <p>
              The courses, lessons, templates, checklists, frameworks, branding, and
              everything else BES provides are owned by BES or our licensors. You may
              use them for your own business while you are a member. You may not
              resell, republish, or share them outside the Platform, or use them to
              build a competing product.
            </p>
          ),
        },
        {
          title: "AI mentors and the BES AI assistant",
          body: (
            <p>
              Some accounts in the community are clearly labeled &ldquo;BES
              Mentor&rdquo; and are operated by AI; they are there to keep conversations
              going and point you to resources. The BES AI assistant answers questions
              using our course library and your profile. Both are educational tools.
              They can be wrong, and nothing they say is professional advice (see the
              next section).
            </p>
          ),
        },
        {
          title: "Education, not professional advice",
          body: (
            <p>
              Everything on the Platform, including courses on legal structure, taxes,
              finance, and capital, is general business education. It is not legal,
              tax, accounting, financial, or investment advice, and using the Platform
              does not create a professional relationship with BES or anyone who posts
              here. Talk to a licensed professional about your own situation before you
              act. Results from any strategy depend on you and your market; we make no
              promise about the revenue, funding, or outcomes you will achieve.
            </p>
          ),
        },
        {
          title: "Disclaimer and limitation of liability",
          body: (
            <>
              <p>
                The Platform is provided &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo;. To the fullest extent the law allows, we disclaim all
                warranties, express or implied, including fitness for a particular
                purpose, and we do not promise the Platform will be uninterrupted or
                error-free.
              </p>
              <p>
                To the fullest extent the law allows, BES and its owners, staff, and
                partners will not be liable for any indirect, incidental, special, or
                consequential damages, or for lost profits, revenue, or data, arising
                from your use of the Platform. Our total liability to you for any claim
                will not exceed the greater of the amount you paid us in the 12 months
                before the claim or one hundred US dollars ($100).
              </p>
            </>
          ),
        },
        {
          title: "Ending your membership",
          body: (
            <p>
              You can close your account at any time. We can suspend or close your
              account if you break these Terms, if required by law, or if we wind down
              the Platform. Sections on content, disclaimers, limitation of liability,
              and governing law survive the end of your membership.
            </p>
          ),
        },
        {
          title: "Changes to these Terms",
          body: (
            <p>
              We may update these Terms from time to time. For meaningful changes we
              will update the effective date above and notify members in the community
              or by email before the changes take effect. Continued use after that date
              means you accept the updated Terms.
            </p>
          ),
        },
        {
          title: "Governing law",
          body: (
            <p>
              These Terms are governed by the laws of the State of Wisconsin, without
              regard to its conflict-of-law rules. Any dispute will be brought in the
              state or federal courts located in Milwaukee County, Wisconsin, and you
              consent to their jurisdiction. Before filing, you agree to contact us and
              give us 30 days to try to resolve the issue informally.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about these Terms:{" "}
              <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
