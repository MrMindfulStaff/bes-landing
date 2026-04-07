const SKOOL_URL = "https://www.skool.com/blackwealth";

const courses = [
  {
    title: "Documents & Legal Infrastructure",
    subtitle: "Building Your Business Foundation",
    desc: "Set your business up the right way from day one with essential legal documents, structures, and compliance frameworks.",
    image: "/images/course-documents-legal.webp",
  },
  {
    title: "Marketing & Brand",
    subtitle: "Creating a Business That Stands Out",
    desc: "Build a clear brand identity that attracts your ideal customers and sets you apart from the competition.",
    image: "/images/course-marketing-brand.webp",
  },
  {
    title: "Sales & Customer Acquisition",
    subtitle: "Turning Leads Into Revenue",
    desc: "Learn how to attract leads, build trust, and close deals that keep your revenue growing.",
    image: "/images/course-sales.webp",
  },
  {
    title: "Customer Service & Satisfaction",
    subtitle: "Building Loyal Customers",
    desc: "Deliver exceptional customer experiences that turn first-time buyers into lifelong advocates.",
    image: "/images/course-customer-service.webp",
  },
  {    title: "Financial Advantage",
    subtitle: "Managing Money for Growth",
    desc: "Master bookkeeping, cash flow management, and financial planning to fuel sustainable growth.",
    image: "/images/course-financial-advantage.webp",
  },
  {
    title: "Access to Capital",
    subtitle: "Funding Your Business the Smart Way",
    desc: "Break down how to secure funding — from grants and loans to investors and creative financing.",
    image: "/images/course-access-capital.webp",
  },
  {
    title: "Taxes & Tax Strategy",
    subtitle: "Keeping More of What You Earn",
    desc: "Smart tax planning that protects your profits and keeps you compliant with the basics of business taxation.",
    image: "/images/course-taxes.webp",
  },
  {
    title: "Operations & Workflow",
    subtitle: "Running Your Business Smoothly",
    desc: "Design workflows and systems that save time, reduce errors, and let you focus on growth.",
    image: "/images/course-operations.webp",
  },
  {
    title: "Mindset & Inner Game",
    subtitle: "Strengthening the Entrepreneur Within",
    desc: "Build resilience, confidence, and the mental toughness every founder needs to win long-term.",
    image: "/images/course-mindset.webp",
  },
  {
    title: "Technology & System Selection",
    subtitle: "Choosing Tools That Work",
    desc: "Select the right platforms and systems that make your business run smarter, not harder.",
    image: "/images/course-technology.webp",
  },
  {
    title: "Staffing & Team Building",
    subtitle: "Building the Right Crew",
    desc: "Hire right, manage well, and build a team that amplifies your vision and output.",
    image: "/images/course-staffing.webp",
  },
  {
    title: "Exit & Legacy Planning",
    subtitle: "Building What Lasts",
    desc: "Prepare for stepping away on your terms — whether that means selling, transitioning, or building generational wealth.",
    image: "/images/bes-logo.webp",
  },
];

const communityFeatures = [
  {
    title: "Real Conversations",
    desc: "Connect with founders walking the same path. Ask questions, share wins, get honest feedback.",
    icon: "💬",
  },
  {
    title: "Templates & Checklists",
    desc: "Ready-to-use business documents, checklists, and frameworks you can deploy immediately.",
    icon: "📄",
  },
  {
    title: "Flowers on Friday",
    desc: "Every week we celebrate Black excellence — spotlighting member wins and inspiring stories.",
    icon: "🌻",
  },
  {
    title: "Partnerships & Collaboration",
    desc: "Find co-founders, partners, and collaborators who share your vision and values.",
    icon: "🤝",
  },
];

function JoinButton({ size = "lg", className = "" }) {
  const sizeClasses =
    size === "lg"
      ? "px-10 py-4 text-lg"
      : size === "md"
        ? "px-8 py-3 text-base"
        : "px-6 py-2.5 text-sm";

  return (
    <a
      href={SKOOL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block gold-bg-gradient text-black font-bold rounded-lg hover:opacity-90 transition-opacity ${sizeClasses} ${className}`}
    >
      Join The Society — $50/mo
    </a>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/bes-logo.webp"
            alt="BES Logo"
            className="w-10 h-10 rounded-full object-contain"
          />
          <span className="font-bold text-lg hidden sm:block">
            The Black Entrepreneurship Society
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <a href="#about" className="hover:text-gold transition-colors">
            About
          </a>
          <a href="#curriculum" className="hover:text-gold transition-colors">
            Curriculum          </a>
          <a href="#community" className="hover:text-gold transition-colors">
            Community
          </a>
          <a href="#founder" className="hover:text-gold transition-colors">
            Founder
          </a>
          <a href="#pricing" className="hover:text-gold transition-colors">
            Pricing
          </a>
          <a href="#affiliate" className="hover:text-gold transition-colors">
            Earn
          </a>
        </div>
        <JoinButton size="sm" />
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(201,168,76,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <div className="fade-in stagger-1 mb-8">
          <img
            src="/images/bes-banner.webp"
            alt="The Black Entrepreneurship Society"
            className="mx-auto max-w-xs sm:max-w-sm md:max-w-md"
          />
        </div>

        <div className="fade-in stagger-1">
          <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-6">
            Built for Black Founders. By a Black Founder.
          </p>
        </div>

        <h1
          className="fade-in stagger-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-8"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          The Same Playbooks.
          <br />
          <span className="gold-gradient">Designed for Us.</span>
        </h1>

        <p className="fade-in stagger-3 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          A private community giving Black entrepreneurs the systems, tools, and
          connections that corporations use to win — rebuilt from the ground up
          for our people.
        </p>

        <div className="fade-in stagger-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <JoinButton />
          <a
            href="#curriculum"
            className="inline-block px-10 py-4 text-lg font-semibold rounded-lg border border-dark-border text-gray-300 hover:border-gold hover:text-gold transition-all"
          >
            See What&apos;s Inside
          </a>
        </div>

        <div className="fade-in stagger-5 flex items-center justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-gold font-bold text-lg">45+</span>
            <span>Members</span>
          </div>
          <div className="w-px h-6 bg-dark-border" />
          <div className="flex items-center gap-2">
            <span className="text-gold font-bold text-lg">12</span>
            <span>Courses</span>
          </div>
          <div className="w-px h-6 bg-dark-border" />
          <div className="flex items-center gap-2">
            <span className="text-gold font-bold text-lg">24/7</span>
            <span>Community</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            Why We Exist
          </p>
          <h2
            className="text-4xl sm:text-5xl font-black mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            This Ain&apos;t Just Another
            <br />
            <span className="gold-gradient">Business Group</span>
          </h2>        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
            <p>
              Black entrepreneurs start businesses at higher rates than any
              other group — but most don&apos;t make it past year two. Not
              because of lack of hustle. Because of lack of{" "}
              <span className="text-gold font-semibold">infrastructure</span>.
            </p>
            <p>
              The Black Entrepreneurship Society was built to change that. We
              give our people the same systems, playbooks, and power moves that
              big corporations use — but designed for us, by us.
            </p>
            <p>
              This is a private hub where Black founders get real tools,
              strategies, and connections to win in business. No fluff. No
              gatekeeping. Just the blueprint.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Step-by-step guides to start and grow your business",
              "Templates and checklists you can use right away",
              "Real conversations with people walking the same path",
              "Resources for capital, marketing, systems, and more",
              "Weekly spotlights celebrating Black excellence",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg bg-dark-card border border-dark-border"
              >
                <div className="w-6 h-6 rounded-full gold-bg-gradient flex-shrink-0 flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Curriculum() {
  return (
    <section id="curriculum" className="py-24 px-6 bg-dark-card/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            The Curriculum
          </p>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            12 Courses.{" "}
            <span className="gold-gradient">Zero Guesswork.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From formation to exit — every stage of your business journey is
            covered with actionable, no-fluff training.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <div
              key={i}
              className="card-hover p-6 rounded-xl bg-dark-card border border-dark-border group"
            >
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors">
                {course.title}
              </h3>
              <p className="text-gold text-sm font-medium mb-3">
                {course.subtitle}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                {course.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Community() {
  return (    <section id="community" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            More Than Courses
          </p>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            A Community That{" "}
            <span className="gold-gradient">Moves Together</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The courses give you the knowledge. The community gives you the
            momentum.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {communityFeatures.map((feature, i) => (
            <div
              key={i}
              className="card-hover p-8 rounded-xl bg-dark-card border border-dark-border"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-center text-sm text-gold font-semibold tracking-[0.2em] uppercase mb-8">
            What Members Are Saying
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "Ronald L.",
                quote:
                  "I love the platform to gain some clarity. This is exactly what I needed to organize my business thinking.",
              },
              {
                name: "Annette C.",
                quote:
                  "I'm an artist looking to start selling art. This community gave me the business foundation I was missing.",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-dark-card border border-dark-border"
              >
                <div className="flex items-center gap-1 text-gold mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 italic mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-gray-500">BES Member</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section id="founder" className="py-24 px-6 bg-dark-card/50">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-2 flex justify-center">
            <div className="w-64 h-64 rounded-2xl gold-bg-gradient p-[2px]">
              <img
                src="/images/founder-reginald.webp"
                alt="Reginald Reed - Founder"
                className="w-full h-full rounded-2xl object-cover"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-4">
              Meet the Founder
            </p>
            <h2
              className="text-4xl sm:text-5xl font-black mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Built by Someone Who{" "}
              <span className="gold-gradient">Walks the Walk</span>
            </h2>
            <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
              <p>
                Reginald Reed is a system architect, process improvement                specialist, and tech founder based in Milwaukee, Wisconsin.
              </p>
              <p>
                As the founder of The Mindful Companies — a portfolio spanning
                workforce development, staffing, technology, and community
                impact — Reginald didn&apos;t just study entrepreneurship. He
                built the infrastructure from scratch.
              </p>
              <p>
                The Black Entrepreneurship Society is the playbook he wished
                existed when he started. Every course, every template, every
                system inside was forged in the real work of building businesses
                that serve our communities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhoItsFor() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-4">
          Is This For You?
        </p>
        <h2
          className="text-4xl sm:text-5xl font-black mb-12"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Built for Builders{" "}
          <span className="gold-gradient">At Every Stage</span>
        </h2>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              stage: "Just Starting",
              desc: "You have the idea and the drive — you need the roadmap. Get the legal foundation, branding, and first-customer strategy to launch right.",
              icon: "🚀",
            },
            {
              stage: "Growing",
              desc: "Revenue is coming in but you need systems. Scale your operations, team, finances, and customer base without burning out.",
              icon: "📈",
            },
            {
              stage: "Scaling & Legacy",
              desc: "You've built something real. Now build it to last. Master exit planning, team building, and generational wealth strategies.",
              icon: "🏛️",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="card-hover p-8 rounded-xl bg-dark-card border border-dark-border text-left"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gold mb-3">
                {item.stage}
              </h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-dark-card/50">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-4">
          Simple Pricing
        </p>
        <h2
          className="text-4xl sm:text-5xl font-black mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          One Membership.{" "}
          <span className="gold-gradient">Everything Included.</span>
        </h2>
        <p className="text-gray-400 text-lg mb-12">
          No tiers. No upsells. No hidden fees. You get the full experience.
        </p>

        <div className="max-w-md mx-auto rounded-2xl bg-dark border-2 border-gold p-10">
          <p className="text-sm text-gold font-semibold uppercase tracking-wider mb-2">
            Full Access
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-6">
            <span
              className="text-6xl font-black text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              $50
            </span>
            <span className="text-gray-400 text-lg">/month</span>
          </div>

          <div className="space-y-3 text-left mb-10">
            {[
              "All 12 business courses",
              "Templates, checklists & frameworks",
              "Private community access",
              "Weekly Flowers on Friday spotlights",
              "Partnership & collaboration channels",
              "Direct support from the founder",              "New content added regularly",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gold flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-200">{item}</span>
              </div>
            ))}
          </div>

          <JoinButton className="w-full text-center" />

          <p className="text-xs text-gray-500 mt-4">
            Cancel anytime. No long-term commitment.
          </p>
        </div>
      </div>
    </section>
  );
}

function Affiliate() {
  return (
    <section id="affiliate" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            Earn While You Build
          </p>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Share the Society.{" "}
            <span className="gold-gradient">Get Paid Monthly.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Know someone who needs this? Our affiliate program pays you for
            every founder you bring in — and it keeps paying.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            {
              step: "1",
              title: "Share Your Link",
              desc: "Every member gets a unique referral link. Share it on social media, in conversations, or with your network.",
            },
            {
              step: "2",
              title: "They Join",
              desc: "When someone signs up through your link, they get the full BES experience — all 12 courses, community, everything.",
            },
            {
              step: "3",
              title: "You Get Paid",
              desc: "Earn 40% recurring commission — that's $20/month for every member you refer, for as long as they stay.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="card-hover p-8 rounded-xl bg-dark-card border border-dark-border text-center"
            >
              <div className="w-12 h-12 rounded-full gold-bg-gradient flex items-center justify-center text-black font-black text-xl mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto rounded-2xl bg-dark-card border border-gold/30 p-8 md:p-10">
          <div className="grid sm:grid-cols-3 gap-6 text-center mb-8">
            <div>
              <p
                className="text-4xl font-black gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                40%
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Recurring Commission
              </p>
            </div>
            <div>
              <p
                className="text-4xl font-black gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                $20
              </p>
              <p className="text-gray-400 text-sm mt-1">Per Referral / Month</p>
            </div>
            <div>
              <p
                className="text-4xl font-black gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}              >
                &infin;
              </p>
              <p className="text-gray-400 text-sm mt-1">No Cap on Earnings</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-300 mb-6">
              Refer 10 members and you&apos;re earning{" "}
              <span className="text-gold font-bold">$200/month</span>.
              Refer 50 and that&apos;s{" "}
              <span className="text-gold font-bold">$1,000/month</span> — just
              for sharing something you believe in.
            </p>
            <JoinButton size="md" />
            <p className="text-xs text-gray-500 mt-3">
              Affiliate access included with every membership
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "What exactly do I get when I join?",
      a: "Immediate access to all 12 business courses, downloadable templates and checklists, the private community forum, weekly spotlights, and direct access to ask questions and connect with other Black founders.",
    },
    {
      q: "I'm brand new to business. Is this for me?",
      a: "Absolutely. The curriculum starts with foundational courses like Documents & Legal Infrastructure and walks you all the way through to Exit & Legacy Planning. Wherever you are, there's a course that meets you there.",
    },
    {
      q: "How is this different from free business content online?",
      a: "Free content is scattered and generic. BES is a structured, end-to-end system built specifically for Black entrepreneurs — with templates you can use today, a community of founders who understand your journey, and a founder who's building alongside you.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. There are no contracts or commitments. Stay as long as the value is there for you.",
    },
    {
      q: "Is there a referral program?",
      a: "Yes — members earn 40% recurring commission ($20/month) for every person they refer who joins. For as long as they stay.",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-black"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Frequently Asked <span className="gold-gradient">Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl bg-dark-card border border-dark-border overflow-hidden"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <span className="font-semibold text-white pr-4">{faq.q}</span>
                <svg
                  className="w-5 h-5 text-gold flex-shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-dark-card/50">
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-4xl sm:text-5xl font-black mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Ready to Build{" "}
          <span className="gold-gradient">the Right Way?</span>
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop piecing it together alone. Join a community of Black founders who
          are building real businesses with real systems — together.
        </p>
        <JoinButton />
        <p className="text-sm text-gray-500 mt-6">          $50/month &bull; Cancel anytime &bull; Full access from day one
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-dark-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/images/bes-logo.webp"
            alt="BES Logo"
            className="w-8 h-8 rounded-full object-contain"
          />
          <span className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} The Black Entrepreneurship
            Society. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <span>A Mindful Companies venture</span>
          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gold transition-colors"
          >
            Join on Skool
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <WhoItsFor />
      <Curriculum />
      <Community />
      <Founder />
      <Pricing />
      <Affiliate />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}