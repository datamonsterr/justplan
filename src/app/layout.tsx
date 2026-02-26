import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Providers } from "@/providers/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JustPlan - Smart Task Management",
  description: "Task management with automatic scheduling and custom workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          borderRadius: "0.375rem",
        },
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "blockButton",
          shimmer: false,
        },
        elements: {
          rootBox: "clerk-theme",
          card: "clerk-card",
          headerTitle: "clerk-header-title",
          headerSubtitle: "clerk-header-subtitle",
          socialButtonsBlockButton: "clerk-social-button",
          socialButtonsBlockButtonText: "clerk-social-button-text",
          dividerLine: "clerk-divider",
          dividerText: "clerk-divider-text",
          formFieldLabel: "clerk-label",
          formFieldInput: "clerk-input",
          formButtonPrimary: "clerk-button-primary",
          footerActionLink: "clerk-link",
          identityPreviewText: "clerk-text",
          identityPreviewEditButton: "clerk-link",
          formFieldInputShowPasswordButton: "clerk-icon-button",
          alert: "clerk-alert",
          alertText: "clerk-alert-text",
          avatarBox: "clerk-avatar",
          userButtonPopoverCard: "clerk-popover",
          userButtonPopoverActionButton: "clerk-popover-button",
          userButtonPopoverActionButtonText: "clerk-popover-button-text",
          userButtonPopoverFooter: "clerk-popover-footer",
          userPreviewMainIdentifier: "clerk-text",
          userPreviewSecondaryIdentifier: "clerk-text-secondary",
          modalContent: "clerk-modal",
          modalCloseButton: "clerk-modal-close",
          formFieldInputGroup: "clerk-input-group",
          otpCodeFieldInput: "clerk-otp-input",
          formResendCodeLink: "clerk-link",
          selectButton: "clerk-select",
          selectOptionsContainer: "clerk-select-options",
          selectOption: "clerk-select-option",
          badge: "clerk-badge",
          profileSectionTitleText: "clerk-section-title",
          accordionTriggerButton: "clerk-accordion-trigger",
          navbarButton: "clerk-navbar-button",
          navbarButtonIcon: "clerk-navbar-icon",
          breadcrumbs: "clerk-breadcrumbs",
          breadcrumbsItem: "clerk-breadcrumbs-item",
          breadcrumbsItemDivider: "clerk-breadcrumbs-divider",
          // Hide decorative elements
          logoBox: "hidden",
          logoImage: "hidden",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Providers
            themeProps={{
              attribute: "class",
              defaultTheme: "system",
              enableSystem: true,
              disableTransitionOnChange: false,
            }}
          >
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
