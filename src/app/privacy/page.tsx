import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Database, EyeOff } from "lucide-react";
import { Footer } from "@/components/shared/footer";
import { LogoIcons } from "@/components/shared/logos";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for VEditor video studio on the Pi Network ecosystem."
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcons.scenify className="h-7 w-7 rounded-md" />
            <span className="font-bold text-lg tracking-tight">VEditor</span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
              Privacy Policy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/edit/new"
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Open Editor
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
        {/* Header Hero */}
        <div className="space-y-3 pb-8 border-b border-border/60">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Data Protection &amp; Pioneer Privacy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 12, 2026 &bull; Last Updated: September 12, 2026
          </p>
        </div>

        {/* Legal Text Body */}
        <div className="prose prose-invert max-w-none py-8 space-y-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">01.</span>
              Our Privacy Commitment
            </h2>
            <p>
              At <strong className="text-foreground">VEditor</strong>, we prioritize the privacy and autonomy of Pi Network Pioneers.
              We believe in data minimization: collecting only the minimum information necessary to authenticate your account, save your video projects, and render your timeline compositions.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">02.</span>
              Information We Collect
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-background/60 border border-border/70 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Pi Account Identification
                </div>
                <p className="text-xs text-muted-foreground">
                  When you sign in via the Pi Network SDK, we receive your public Pi Username and a unique Pi User ID (UID). We do NOT receive or store any password.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background/60 border border-border/70 space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Database className="h-4 w-4 text-primary" />
                  Project Timeline Data
                </div>
                <p className="text-xs text-muted-foreground">
                  Video layer metadata (text, durations, coordinates, animation presets) and user-uploaded media files stored to allow continuing your edits across sessions.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs sm:text-sm mt-3 flex items-start gap-2">
              <EyeOff className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-300">What We NEVER Collect:</strong> We never ask for, collect, process, or store your 24-word Pi Wallet Passphrase, your private keys, or your personal identification documents.
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">03.</span>
              How We Use Your Information
            </h2>
            <p>Your information is used strictly to provide and enhance video editing capabilities:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Authenticating your session and confirming your VIP pass or export credit balance.</li>
              <li>Storing and retrieving your video draft timeline compositions.</li>
              <li>Encoding, rendering, and delivering your MP4 video downloads.</li>
              <li>Ensuring system reliability, preventing abuse, and optimizing client-side performance.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">04.</span>
              Third-Party Infrastructure &amp; Services
            </h2>
            <p>We work with vetted service providers to deliver robust multimedia infrastructure:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong className="text-foreground">Pi Network SDK:</strong> Used for Pioneer single-sign-on and blockchain payment verification (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">sdk.minepi.com</code>).
              </li>
              <li>
                <strong className="text-foreground">Firebase Cloud Storage:</strong> Used to temporarily or persistently store project media assets (video clips, images, and audio tracks) uploaded by you.
              </li>
              <li>
                <strong className="text-foreground">Neon Serverless PostgreSQL:</strong> Encrypted relational storage for project timeline schemas and Pi transaction logs.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">05.</span>
              Your Data Rights &amp; Deletion
            </h2>
            <p>You maintain full control over your creative work and personal information:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong className="text-foreground">Project Deletion:</strong> You can delete any project directly from the <Link href="/projects" className="text-primary hover:underline">My Projects</Link> dashboard at any time.
              </li>
              <li>
                <strong className="text-foreground">Media Removal:</strong> Deleting a project or asset removes references from our database.
              </li>
              <li>
                <strong className="text-foreground">Right to Erasure:</strong> To request complete deletion of your Pi UID record and all associated media from our storage buckets, contact our support team.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">06.</span>
              Local Storage &amp; Cookies
            </h2>
            <p>
              We use browser <code className="text-xs bg-muted px-1.5 py-0.5 rounded">localStorage</code> and secure HTTP cookies strictly for functional operations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Preserving the active editing session and offline drafts.</li>
              <li>Caching UI preferences (dark mode, timeline zoom, preview quality).</li>
              <li>Storing temporary blob URLs for instant timeline scrubbing.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">07.</span>
              Contact Us
            </h2>
            <p>
              For privacy-related inquiries, data requests, or feedback regarding our privacy practices:
            </p>
            <p className="font-mono text-primary text-sm">
              privacy@veditor-studio.app
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
