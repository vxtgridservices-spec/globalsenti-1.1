import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Contact as ContactSection } from "@/src/components/sections/Contact";

export function Contact() {
  return (
    <PageLayout title="Contact Us" subtitle="Secure communication channels for private inquiries and consultations.">
      <ContactSection />
    </PageLayout>
  );
}
