import React, { useState } from 'react';
import Home from './Home';
import Auth from './Auth';
import { useNavigate } from 'react-router-dom';
// import { Globe } from 'lucide-react';
import {
  Brain,
  Users,
  Workflow,
  Shield,
  Rocket,
  ChevronRight,
  PenTool as Token,
  MessageSquare,
  Vote,
  Wallet,
  Code,
  Target,
  TrendingUp,
  Zap,
  Award,
  Globe,
  UserCircle,
  Lightbulb,
  Building2,
  Megaphone,
  Bot,
  DollarSign,
  Milestone,
  Lock,
  Timer,
  Briefcase,
  LineChart,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAddress, useDisconnect } from '@thirdweb-dev/react';


function Index() {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [activePhase, setActivePhase] = useState(1);
const [showAuth, setShowAuth] = useState(false); // New state variable
const [showHome, setShowHome] = useState(false); // New state for Home page
const navigate = useNavigate();

const address = useAddress();
const disconnect = useDisconnect();

const handleSignOut = () => {
  console.log(`${address} signed out`);
  disconnect(); // Disconnect the wallet
  setIsAuthenticated(false); // Set isAuthenticated to false
  setShowHome(false); // Hide Home page

}

if (showAuth) {
  return <Auth setShowAuth={setShowAuth} setShowHome={setShowHome} />; // Pass setShowHome
}
if (showHome) {
  return <Home handleSignOut={handleSignOut} />; // Render Home component when showHome is true

}
return (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative">
    {/* Background Pattern */}
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 to-gray-800/95" />

    {/* Floating Elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
    </div>

    <div className="relative">
      {/* Hero Section */}
      <header className="container mx-auto px-6 pt-8">
        <nav className="fixed top-0 left-0 w-full bg-gray-900 flex justify-between items-center px-6 py-4 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <Globe className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">IMARA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#roles" className="text-gray-300 hover:text-white transition-colors">Roles</a>
            <a href="#process" className="text-gray-300 hover:text-white transition-colors">Process</a>
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#benefits" className="text-gray-300 hover:text-white transition-colors">Benefits</a>
            <button
              onClick={() => navigate('/tasks')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Tasks
            </button>
            <button
              onClick={() => setShowAuth(true)} // Added onClick handler
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg transition-all">
              Sign In
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400 text-transparent bg-clip-text leading-tight">
            Transform Ideas into Reality with IMARA
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            A decentralized tool where brilliant ideas meet collaborative execution, powered by blockchain and a vibrant community of innovators.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowAuth(true)} 
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2">
              Launch Your Idea <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-white/20"
            >
              Open Tasks
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-12 px-6 bg-white/5 backdrop-blur-sm rounded-2xl mb-20">
          <StatCard number="2+" label="Active Projects" />
          <StatCard number="5+" label="Community Members" />
          <StatCard number="$0" label="Total Investments" />
          <StatCard number="85%" label="Success Rate" />
        </div>
      </header>

      {/* User Roles Section */}
      <section id="roles" className="py-20 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            {/* <div className="inline-block px-4 py-1 bg-purple-500/10 rounded-full text-purple-400 text-sm font-semibold mb-4">
              Ecosystem Participants
            </div> */}
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Diverse Community</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              IMARA brings together various stakeholders, each playing a crucial role in bringing ideas to life.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RoleCard
              icon={<Lightbulb />}
              title="Ideators"
              description="Visionaries who bring fresh ideas and concepts to the platform, ready to see them transformed into reality."
            />
            <RoleCard
              icon={<Building2 />}
              title="Builders"
              description="Skilled developers and implementors who turn concepts into working solutions through their expertise."
            />
            <RoleCard
              icon={<UserCircle />}
              title="Project Managers"
              description="Professionals who monitor project milestones, verify progress, and deliver detailed reports to ensure accountability and success"
            />
          </div>
        </div>
      </section>
      {/* Project Lifecycle Section */}
      <section id="process" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">From Concept to Reality</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience our structured approach to bringing ideas to life through collaborative effort.
            </p>
          </div>

          {/* Phase Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[1, 2, 3].map((phase) => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`px-6 py-3 rounded-lg transition-all ${activePhase === phase
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
              >
                Phase {phase}
              </button>
            ))}
          </div>

          {/* Phase Content */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8">
            {activePhase === 1 && (
              <PhaseContent
                title="Idea Creation"
                description="Transform your concept into a structured project within the IMARA ecosystem."
                steps={[
                  { icon: <Lightbulb />, text: "Submit your innovative idea" },
                  { icon: <Target />, text: "Set project goals and vision" }
                ]}
              />
            )}
            {activePhase === 2 && (
              <PhaseContent
                title="Team Building"
                description="Stake to be part of a team and collaborate to build"
                steps={[
                  { icon: <Users />, text: "Open roles for bidding" },
                  { icon: <Vote />, text: "Review and select contributors" },
                  { icon: <Briefcase />, text: "Establish project workspace" }
                ]}
              />
            )}
            {activePhase === 3 && (
              <PhaseContent
                title="Execution"
                description="Bring your idea to life through structured milestones."
                steps={[
                  { icon: <Milestone />, text: "Create project milestones" },
                  { icon: <Timer />, text: "Track progress and deliverables" },
                  { icon: <CheckCircle2 />, text: "Complete and move to the chosen protocal" }
                ]}
              />
            )}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our comprehensive suite of tools and features empowers your journey from ideation to execution.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Token />}
              title="Idea Initialization"
              description="Create your idea and state the goals and everything needed for your project"
            />
            <FeatureCard
              icon={<MessageSquare />}
              title="Collaboration Hub"
              description="Connect with experts and developers in a unified workspace"
            />
            <FeatureCard
              icon={<Target />}
              title="Progress Tracking"
              description="Monitor project milestones and achievements in real-time"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The IMARA Advantage</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the benefits of our governance tool for idea development.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BenefitCard
              icon={<Workflow />}
              title="Streamlined Execution"
              description="Transform complex ideas into manageable, achievable milestones with expert guidance"
            />
            <BenefitCard
              icon={<Shield />}
              title="Secure & Transparent"
              description="Blockchain-powered security ensuring transparent processes and fair compensation"
            />
            <BenefitCard
              icon={<TrendingUp />}
              title="Market Growth"
              description="Access to a growing ecosystem of innovators, investors, and industry experts"
            />
            <BenefitCard
              icon={<Award />}
              title="Quality Assurance"
              description="Rigorous vetting process ensures high-quality projects and contributors"
            />
            <BenefitCard
              icon={<Globe />}
              title="Global Reach"
              description="Connect with talent and opportunities from around the world"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Bring Your Ideas to Life?</h2>
              <p className="text-xl text-gray-100 mb-12 max-w-2xl mx-auto">
                Join our community of innovators, creators, and builders. Transform the way ideas become reality.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-gray-100">
                  Join IMARA Today
                </button>
                <button className="bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-white/20">
                  Schedule a Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-sm py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold">IMARA</span>
              </div>
              <p className="text-gray-400">
                Transforming how ideas evolve into impactful realities through collaboration.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#process" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 IMARA Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
);
}

function StatCard({ number, label }) {
return (
  <div className="text-center">
    <div className="text-3xl font-bold mb-1">{number}</div>
    <div className="text-gray-400 text-sm">{label}</div>
  </div>
);
}

function RoleCard({ icon, title, description }) {
return (
  <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl hover:bg-gray-700/50 transition-all group">
    <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { className: "w-7 h-7 text-purple-400" })}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);
}

function FeatureCard({ icon, title, description }) {
return (
  <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl hover:bg-gray-700/50 transition-all group">
    <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { className: "w-7 h-7 text-blue-400" })}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);
}

function BenefitCard({ icon, title, description }) {
return (
  <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl hover:bg-gray-700/50 transition-all group">
    <div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { className: "w-7 h-7 text-indigo-400" })}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);
}

function PhaseContent({ title, description, steps }) {
return (
  <div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-gray-400 mb-8">{description}</p>
    <div className="grid md:grid-cols-3 gap-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            {React.cloneElement(step.icon, { className: "w-6 h-6 text-blue-400" })}
          </div>
          <div className="flex-1">
            <p className="text-gray-300">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}


export default Index;
