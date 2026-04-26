import { useParams } from "react-router-dom";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";

const serviceDetails: Record<string, { title: string; description: string; content: string[] }> = {
  "security-operations": {
    title: "Security Operations",
    description: "Comprehensive risk assessment, asset protection, and executive security solutions tailored for high-stakes environments.",
    content: [
      "Our Security Operations division provides unparalleled protection, blending advanced surveillance technology with elite personnel to safeguard assets, personnel, and sensitive infrastructure globally.",
      "We specialize in threat assessment, vulnerability analysis, and the deployment of hardened security protocols for high-net-worth individuals, corporate entities, and governmental institutions.",
      "Whether operating in stable environments or emerging markets, our adaptive strategies ensure the continuous security and operational integrity of your interests."
    ]
  },
  "secure-logistics-transportation": {
    title: "Secure Logistics & Transportation",
    description: "End-to-end transport of high-value cargo with rigorous armored solutions.",
    content: [
      "Reliability and transparency are the hallmarks of our logistics network. We manage the secure transit of sensitive, high-value commodities through proprietary routes, utilizing armored transport and active monitoring.",
      "Our end-to-end management approach includes digitized chain-of-custody tracking, expert local liaison teams, and comprehensive insurance backing to mitigate risk during transit.",
      "We navigate complexities, from fragile supply chains to volatile regions, to ensure your cargo arrives securely and on time."
    ]
  },
  "commodity-trade": {
    title: "Commodity Trade",
    description: "Seamless facilitation of legal and compliant trade in high-value commodities.",
    content: [
      "We operate at the nexus of commodity markets, providing trade facilitation, regulatory advisory, and logistics orchestration for complex, cross-border transactions.",
      "Our compliance framework is designed to satisfy the most stringent international regulatory bodies, providing our partners with the legal security and confidence needed in high-value trades.",
      "We provide deep-market intelligence and direct access to essential commodities, efficiently bridging the gap between producers and processors worldwide."
    ]
  },
  "risk-intelligence": {
    title: "Risk & Intelligence",
    description: "Actionable strategic insight and sophisticated risk assessment analytics.",
    content: [
      "In an increasingly interconnected world, proactive risk mitigation is essential. Our team leverages extensive field networks and advanced analytical tools to provide clients with actionable, strategic intelligence.",
      "Our services encompass geopolitical risk assessment, market-entry analysis, and tailored advisory for complex investment and security decisions.",
      "By identifying threats before they materialize, we provide the necessary foresight to safeguard strategic objectives and capitalize on nuanced international opportunities."
    ]
  },
  "industrial-specialized-supply": {
    title: "Industrial & Specialized Supply",
    description: "Reliable procurement and supply chain management for critical industrial infrastructure.",
    content: [
      "We serve as a vital link in the industrial supply chain, managing the procurement, handling, and distribution of specialized minerals and industrial materials.",
      "Our logistical expertise ensures the Just-In-Time delivery of critical resources, optimizing operational efficiency while minimizing warehousing overhead.",
      "With a focus on supply chain resilience, we foster long-term partnerships with producers and consumers to ensure the consistent availability of the components required for high-performance industrial activity."
    ]
  },
  "global-partnerships": {
    title: "Global Partnerships",
    description: "Strategic collaboration bridging public and private sector interests for sustained growth.",
    content: [
      "We excel in orchestrating meaningful, collaborative outcomes by connecting key stakeholders across the public, corporate, and private sectors.",
      "Our partnership strategy focuses on shared objectives, transparency, and integrity, resulting in sustainable growth, infrastructure development, and improved operational efficacy.",
      "We actively manage these relationships to overcome bureaucratic, logistical, and political challenges, transforming potential points of friction into successful project delivery."
    ]
  }
};

export function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? serviceDetails[slug] : null;

  if (!service) {
    return <div className="min-h-screen pt-32 text-center text-white">Service not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-32">
      <Navbar />
      <main className="container mx-auto max-w-4xl pb-20 px-4">
        <h1 className="text-5xl font-serif text-gold mb-6">{service.title}</h1>
        <p className="text-2xl text-white mb-10 font-light">{service.description}</p>
        <div className="prose prose-invert prose-lg prose-gold">
          {service.content.map((paragraph, index) => (
            <p key={index} className="mb-6 leading-relaxed text-gray-300">{paragraph}</p>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
