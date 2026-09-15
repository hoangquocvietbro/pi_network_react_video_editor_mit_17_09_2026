import Link from "next/link";
import { ArrowLeft, FileText, Shield, Sparkles } from "lucide-react";
import { Footer } from "@/components/shared/footer";
import { LogoIcons } from "@/components/shared/logos";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for VEditor video studio on the Pi Network ecosystem."
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcons.scenify className="h-7 w-7 rounded-md" />
            <span className="font-bold text-lg tracking-tight">VEditor</span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
              Terms of Service
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
            <FileText className="h-3.5 w-3.5" />
            Pi Network Community App Standard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms of Service
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
              Acceptance of Terms &amp; Pi Network Ecosystem
            </h2>
            <p>
              Welcome to <strong className="text-foreground">VEditor</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;).
              By accessing or using VEditor through the Pi Browser or any web interface, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service (&quot;Terms&quot;) and our <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the Service. Your continued use of the application constitutes acceptance of any updates or amendments made to these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">02.</span>
              Non-Custodial Architecture &amp; Wallet Security
            </h2>
            <div className="p-3.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs sm:text-sm">
              <strong>CRITICAL NOTICE:</strong> VEditor is strictly a non-custodial application. We will NEVER request, store, transmit, or have access to your 24-word Pi Wallet Passphrase or private key.
            </div>
            <p>
              Authentication is performed securely via the official Pi Network JavaScript SDK (<code className="text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">Pi.authenticate</code>). All transactions are signed directly within the native, secure sandbox of the official Pi Browser or Pi Wallet interface.
            </p>
            <p>
              You are solely responsible for maintaining the confidentiality of your credentials and your Pi Wallet Passphrase. VEditor cannot recover lost passphrases or reverse transactions executed on the blockchain.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">03.</span>
              Pi Payments, VIP Passes, and Virtual Goods
            </h2>
            <p>
              VEditor offers optional premium features—including VIP Passes (ad-free editing and prioritized rendering), cloud rendering credits, and AI subtitle processing—payable via Pi cryptocurrency (Testnet or Mainnet, depending on operational network deployment).
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong className="text-foreground">Consumption upon Delivery:</strong> Digital goods, licenses, and cloud render processing are deemed delivered immediately upon transaction confirmation on the Pi blockchain and database synchronization.
              </li>
              <li>
                <strong className="text-foreground">Pricing &amp; Adjustments:</strong> We reserve the right to adjust service pricing in Pi at our discretion to reflect computational infrastructure costs.
              </li>
              <li>
                <strong className="text-foreground">Refund Policy:</strong> Due to the irreversible nature of decentralized blockchain transfers and the immediate allocation of computing power, Pi payments are non-refundable, except where required by applicable consumer protection laws.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">04.</span>
              User Content &amp; Intellectual Property
            </h2>
            <p>
              You retain all ownership rights to any videos, audio tracks, images, text, and project assets (&quot;User Content&quot;) that you upload, edit, or produce through VEditor.
            </p>
            <p>
              By uploading or processing content, you grant VEditor a limited, non-exclusive license strictly necessary to store, transform, encode, and render your video compositions as instructed by your timeline actions.
            </p>
            <p>
              You agree <strong className="text-foreground">NOT</strong> to upload or create content that:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Infringes on copyrights, trademarks, or proprietary rights of third parties.</li>
              <li>Contains hate speech, defamation, harassment, violence, child exploitation, or illegal activities.</li>
              <li>Violates the Pi Network Community Guidelines or developer conduct codes.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">05.</span>
              Independent Community Application Disclaimer
            </h2>
            <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 text-primary-foreground text-xs sm:text-sm">
              <span className="font-semibold text-primary">Ecosystem Notice:</span> VEditor is developed as an independent third-party community utility. It is not owned, operated by, endorsed by, or affiliated with SocialChain Inc., the Pi Core Team, or any of their subsidiaries.
            </div>
            <p>
              &quot;Pi,&quot; &quot;Pi Network,&quot; and the Pi logo are trademarks of the Pi Community Company / SocialChain Inc. Use of the Pi SDK is strictly conducted under the Pi Developer Platform terms.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">06.</span>
              Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p>
              VEditor is provided on an <strong className="text-foreground">&quot;AS IS&quot;</strong> and <strong className="text-foreground">&quot;AS AVAILABLE&quot;</strong> basis without warranties of any kind, either express or implied.
            </p>
            <p>
              In no event shall VEditor, its developers, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, video render interruptions, browser crashes, or failed blockchain network synchronization.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 bg-card/40 border border-border/60 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">07.</span>
              Contact &amp; Support
            </h2>
            <p>
              If you have any questions, copyright concerns, or feedback regarding these Terms, please contact our community support team at:
            </p>
            <p className="font-mono text-primary text-sm">
              support@veditor-studio.app
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
