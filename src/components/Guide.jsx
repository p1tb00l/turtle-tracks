import React, { useState } from 'react';
import { BookOpen, ShieldAlert, Award, HelpingHand } from 'lucide-react';

export default function Guide() {
  const [activeSection, setActiveSection] = useState('probing');

  const SECTIONS = [
    { id: 'probing', label: 'Nest Probing Guide', icon: HelpingHand },
    { id: 'tracks', label: 'Track Identification', icon: BookOpen },
    { id: 'equipment', label: 'Cage & Mesh Setup', icon: ShieldAlert },
    { id: 'dna', label: 'DNA Sample Protocol', icon: Award }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#e6f1ff', marginBottom: '6px' }}>Field Reference Guide</h2>
        <p style={{ fontSize: '0.85rem', color: '#8892b0' }}>Official protocols & diagnostics for Daufuskie Island volunteers</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid rgba(48, 60, 85, 0.4)' }}>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                border: `1.5px solid ${isActive ? '#64ffda' : 'rgba(48, 60, 85, 0.6)'}`,
                backgroundColor: isActive ? 'rgba(100, 255, 218, 0.1)' : 'rgba(2, 12, 27, 0.4)',
                color: isActive ? '#64ffda' : '#8892b0',
                cursor: 'pointer',
                fontFamily: 'Montserrat',
                fontWeight: '600',
                fontSize: '0.75rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={14} />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {activeSection === 'probing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>Probing Technique</h3>
            
            <div style={{ backgroundColor: 'rgba(255, 122, 89, 0.1)', borderLeft: '4px solid #ff7a59', padding: '12px', borderRadius: '4px', fontSize: '0.85rem' }}>
              <strong>CRITICAL RULE:</strong> Always probe using the weight of your body and your <strong>legs</strong>. Never use your arms/wrists to push the probe into the sand, as you may crush the eggs or misread the resistance change.
            </div>

            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: '#8892b0' }}>
              <li>
                <strong style={{ color: '#e6f1ff' }}>Identify Body Pit:</strong> Look for areas with heavily thrown/disturbed sand. The chamber is typically located near the apex of the crawl, directly under the thickest mound of sand.
              </li>
              <li>
                <strong style={{ color: '#e6f1ff' }}>Insert Probe:</strong> Push the probe vertically down into the sand. You should feel firm, packed sand resistance.
              </li>
              <li>
                <strong style={{ color: '#e6f1ff' }}>Detect Soft Cavity:</strong> Walk around the crawl in a grid. When the probe sinks suddenly with minimal resistance (the "soft spot" or collapse feeling), you have pierced the top of the egg chamber.
              </li>
              <li>
                <strong style={{ color: '#e6f1ff' }}>Hand-Dig Only:</strong> Mark the exact spot. Carefully scoop the sand using your hands. <strong>Do not use shovels, trowels, or probes anymore.</strong> Dig straight down until you touch the top eggs.
              </li>
            </ol>
          </div>
        )}

        {activeSection === 'tracks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>Crawl Diagnostics</h3>
            
            <div className="glass-card" style={{ borderLeft: '4px solid #64ffda' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '4px' }}>Loggerhead Crawl (99.9% of Daufuskie Crawls)</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Track Pattern:</strong> Alternating (asymmetrical) flipper marks. One flipper moves forward, then the other (looks like a zipper).</li>
                <li><strong>Tail Drag:</strong> Comma-shaped, off-center tail marks. Not a continuous straight line.</li>
                <li><strong>Average Width:</strong> 70 to 90 centimeters.</li>
              </ul>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #f4a261' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '4px' }}>Green Turtle Crawl (Rare)</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Track Pattern:</strong> Symmetrical flipper marks (both flippers move forward together, creating parallel bars).</li>
                <li><strong>Tail Drag:</strong> Straight, continuous drag line down the exact center.</li>
                <li><strong>Average Width:</strong> 90 to 110 centimeters.</li>
              </ul>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #ff7a59' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '4px' }}>False Crawl Field Signs</h4>
              <p style={{ fontSize: '0.85rem', color: '#8892b0', marginTop: '4px' }}>
                A false crawl is an aborted nesting attempt. Look for:
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <li>A simple U-turn or loop back to the ocean.</li>
                <li>No body pit dug, or a very shallow scrape with no thrown sand.</li>
                <li>Crawl path hits an obstacle (e.g. seawall, debris, high light zone) and turns back.</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'equipment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>Mesh & Nest Protection Setup</h3>
            
            <div style={{ fontSize: '0.9rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>Once a nest is located and documented (or relocated), install the predator protection system immediately:</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64ffda', fontWeight: 'bold' }}>Step 1:</span>
                  <span>Center the plastic mesh screen directly over the dug/re-covered egg chamber. This mesh blocks raccoons and crabs from digging but allows hatchlings to crawl through.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64ffda', fontWeight: 'bold' }}>Step 2:</span>
                  <span>Drive three PVC poles deep into the sand, forming an equilateral triangle centered around the egg chamber.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64ffda', fontWeight: 'bold' }}>Step 3:</span>
                  <span>Mount the metal cage over the mesh screen, anchoring it between the PVC poles. Wire it securely to the poles with tight corners to prevent coyotes from prying it up.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64ffda', fontWeight: 'bold' }}>Step 4:</span>
                  <span>Secure the DNR Warning Sign on the seaward-facing front PVC pole. Write the nest number clearly and legibly in waterproof marker.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64ffda', fontWeight: 'bold' }}>Step 5:</span>
                  <span>Wrap bright red boundary tape around the three PVC poles to alert beach walkers and vehicles.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'dna' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>DNA Sampling Protocol</h3>
            
            <p style={{ fontSize: '0.9rem', color: '#8892b0' }}>
              South Carolina DNR requires one egg shell sample from each confirmed nest for genetic tagging database research.
            </p>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: '#e6f1ff' }}>Egg Extraction:</strong> Take exactly 1 egg from the chamber. If you accidentally broke or cracked an egg during probing/digging, you <strong>MUST</strong> use that broken egg shell.
              </div>
              <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '10px' }}>
                <strong style={{ color: '#e6f1ff' }}>Preparation:</strong> Squeeze out any egg white/yolk into the sand. Place the remaining outer eggshell membrane directly into the research preservative vial.
              </div>
              <div style={{ borderTop: '1px solid rgba(48, 60, 85, 0.4)', paddingTop: '10px' }}>
                <strong style={{ color: '#e6f1ff' }}>Labeling:</strong> Using a fine-point waterproof marker, write the <strong>Nest Number</strong> and **Date** on:
                <ul style={{ paddingLeft: '20px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', color: '#8892b0' }}>
                  <li>The side label of the vial.</li>
                  <li>The top cap of the vial.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
