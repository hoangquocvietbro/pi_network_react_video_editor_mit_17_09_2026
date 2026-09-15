import Link from "next/link";
import { LogoIcons } from "./logos";
import { ShieldCheck, FileText, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/70 bg-card/60 backdrop-blur-md text-muted-foreground transition-colors">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <LogoIcons.scenify className="h-7 w-7 rounded-md" />
              <span className="text-lg font-bold tracking-tight text-foreground">
                VEditor
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="h-2.5 w-2.5" />
                Pi Ecosystem
              </span>
            </div>
            <p className="text-sm text-muted-foreground/90 max-w-md leading-relaxed">
              Browser-based AI video creation studio built for Pi Network Pioneers.
              Record, edit, transcribe, and export stunning short-form videos with native Pi payments.
            </p>
            <p className="text-xs text-muted-foreground/75 italic max-w-md">
              Disclaimer: VEditor is an independent community application developed for the Pi Network ecosystem.
              It is not owned, operated by, or an official product of SocialChain Inc. or the Pi Core Team.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Studio
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/edit/new"
                  className="hover:text-foreground transition-colors"
                >
                  Create New Video
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="hover:text-foreground transition-colors"
                >
                  My Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="hover:text-foreground transition-colors"
                >
                  Pi Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal &amp; Trust
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Privacy Policy
                </Link>
              </li>
              <li className="text-xs text-muted-foreground/80 pt-1">
                Non-custodial: We never store your 24-word passphrase.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            &copy; {new Date().getFullYear()} VEditor Studio. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <span>&bull;</span>
            <span className="text-primary font-medium">Built with Remotion &amp; Pi SDK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
