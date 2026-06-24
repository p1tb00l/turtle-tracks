import React, { useState } from 'react';
import { BookOpen, ShieldAlert, Award, HelpingHand, Compass, Phone } from 'lucide-react';

export default function Guide() {
  const [activeSection, setActiveSection] = useState('probing');

  const SECTIONS = [
    { id: 'probing', label: 'Nest Probing Guide', icon: HelpingHand },
    { id: 'nest_chamber', label: 'Locating Nest Chamber', icon: Compass },
    { id: 'tracks', label: 'Track Identification', icon: BookOpen },
    { id: 'species', label: 'Species Identification', icon: Award },
    { id: 'equipment', label: 'Nest Protection', icon: ShieldAlert },
    { id: 'dna', label: 'DNA Sample Protocol', icon: Award },
    { id: 'contacts', label: 'Emergency Contacts', icon: Phone }
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
        
        {/* 1. NEST PROBING GUIDE */}
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

        {/* 2. LOCATING NEST CHAMBER */}
        {activeSection === 'nest_chamber' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>Locating the Nest Chamber</h3>
            
            <p style={{ fontSize: '0.9rem', color: '#8892b0' }}>
              Volunteers must use crawl tracks anatomy and standard search checklists to pinpoint where the turtle deposited her clutch:
            </p>

            <div className="glass-card" style={{ borderLeft: '4px solid #64ffda', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '2px' }}>Probing & Search Checklist</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Probe grid area around suspected body pit using leg weight (never arms).</li>
                <li>Find soft spot where probe suddenly gives way to cavity (chamber top).</li>
                <li><strong>Dig carefully by hand only</strong> (do not use shovels) once soft spot is verified.</li>
                <li>Feel for first egg to confirm nest chamber.</li>
              </ul>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #f4a261', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '2px' }}>Locating the Chamber via Crawl Anatomy</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong style={{ color: '#e6f1ff' }}>Crawl Centerline:</strong> The egg chamber lies along the central axis between the incoming and outgoing tracks.
                </li>
                <li>
                  <strong style={{ color: '#e6f1ff' }}>Crawl Apex:</strong> Measure 0.5 to 1.5 meters behind the apex (turnaround point) in the seaward/inland boundary.
                </li>
                <li>
                  <strong style={{ color: '#e6f1ff' }}>Body Pit & Thrown Sand:</strong> Look for the secondary body pit where fluffy, loose sand was thrown backward. The chamber is typically situated under the leading/front edge of this dry, thrown sand mound.
                </li>
                <li>
                  <strong style={{ color: '#e6f1ff' }}>Search Grid:</strong> If not found on the centerline, probe in a concentric grid extending 1 meter outward from the center of the body pit.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 3. TRACK IDENTIFICATION */}
        {activeSection === 'tracks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>Crawl & Track Diagnostics</h3>
            
            {/* Loggerhead */}
            <div className="glass-card" style={{ borderLeft: '4px solid #64ffda' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '4px' }}>Loggerhead Crawl (99.9% of Daufuskie Crawls)</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Track Pattern:</strong> Alternating (asymmetrical) flipper marks. One flipper moves forward, then the other (looks like a zipper).</li>
                <li><strong>Tail Drag:</strong> Comma-shaped, off-center tail marks. Not a continuous straight line.</li>
                <li><strong>Average Width:</strong> 70 to 90 centimeters.</li>
              </ul>
              <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(48, 60, 85, 0.4)', maxWidth: '380px' }}>
                <img src="/loggerhead_tracks.png" alt="Loggerhead Tracks" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>

            {/* Green */}
            <div className="glass-card" style={{ borderLeft: '4px solid #f4a261' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '4px' }}>Green Turtle Crawl (Rare)</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Track Pattern:</strong> Symmetrical flipper marks (both flippers move forward together, creating parallel bars).</li>
                <li><strong>Tail Drag:</strong> Straight, continuous drag line down the exact center.</li>
                <li><strong>Average Width:</strong> 90 to 110 centimeters.</li>
              </ul>
              <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(48, 60, 85, 0.4)', maxWidth: '380px' }}>
                <img src="/green_tracks.png" alt="Green Turtle Tracks" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>

            {/* Kemp's Ridley */}
            <div className="glass-card" style={{ borderLeft: '4px solid #a5b4fc' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '4px' }}>Kemp's Ridley Crawl (Extremely Rare)</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Track Pattern:</strong> Alternating (asymmetrical) flipper marks, shallow and light. Typically nest during daytime.</li>
                <li><strong>Tail Drag:</strong> Very faint, straight, or completely absent.</li>
                <li><strong>Average Width:</strong> Very narrow, 50 to 60 centimeters.</li>
              </ul>
              <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(48, 60, 85, 0.4)', maxWidth: '380px' }}>
                <img src="/kemps_ridley_tracks.png" alt="Kemp's Ridley Tracks" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>

            {/* False Crawl */}
            <div className="glass-card" style={{ borderLeft: '4px solid #ff7a59' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '4px' }}>False Crawl Field Signs</h4>
              <p style={{ fontSize: '0.85rem', color: '#8892b0', marginTop: '4px' }}>
                A false crawl is an aborted nesting attempt. Look for:
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#8892b0', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <li>A simple U-turn or loop back to the ocean.</li>
                <li>No body pit dug, or a very shallow scrape with no thrown sand.</li>
                <li>Crawl path hits an obstacle (e.g. seawall, driftwood, high light zone) and turns back.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 4. SPECIES IDENTIFICATION */}
        {activeSection === 'species' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>Extant Sea Turtle Species</h3>
            
            <p style={{ fontSize: '0.9rem', color: '#8892b0' }}>
              There are 7 extant sea turtle species globally. On South Carolina beaches, patrols primarily focus on Loggerheads, Greens, and Kemp's Ridleys.
            </p>

            {/* Loggerhead */}
            <div className="glass-card" style={{ borderLeft: '4px solid #64ffda' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1.05rem', marginBottom: '4px' }}>1. Loggerhead (*Caretta caretta*) &mdash; Primary Local Species</h4>
              <p style={{ fontSize: '0.85rem', color: '#8892b0', lineHeight: '1.4' }}>
                Named for their exceptionally large heads with powerful jaws. Carapace is reddish-brown and heart-shaped.
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li><strong>Carapace Length:</strong> 85 - 100 cm.</li>
                <li><strong>Scute Pattern:</strong> 5 pairs of costal scutes.</li>
                <li><strong>Nesting Season:</strong> Mid-May through August.</li>
              </ul>
              <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(48, 60, 85, 0.4)', maxWidth: '380px' }}>
                <img src="/loggerhead_species.png" alt="Loggerhead Turtle" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>

            {/* Green */}
            <div className="glass-card" style={{ borderLeft: '4px solid #f4a261' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1.05rem', marginBottom: '4px' }}>2. Green Sea Turtle (*Chelonia mydas*)</h4>
              <p style={{ fontSize: '0.85rem', color: '#8892b0', lineHeight: '1.4' }}>
                Named for the green color of their fat tissue. Carapace is smooth, oval-shaped, and ranges from greenish-brown to black.
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li><strong>Carapace Length:</strong> 90 - 110 cm.</li>
                <li><strong>Scute Pattern:</strong> 4 pairs of costal scutes. Single pair of prefrontal scales between eyes.</li>
                <li><strong>Nesting Season:</strong> Late June through August.</li>
              </ul>
              <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(48, 60, 85, 0.4)', maxWidth: '380px' }}>
                <img src="/green_species.png" alt="Green Sea Turtle" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>

            {/* Kemp's Ridley */}
            <div className="glass-card" style={{ borderLeft: '4px solid #a5b4fc' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1.05rem', marginBottom: '4px' }}>3. Kemp's Ridley (*Lepidochelys kempii*)</h4>
              <p style={{ fontSize: '0.85rem', color: '#8892b0', lineHeight: '1.4' }}>
                The smallest and most endangered sea turtle in the world. Carapace is circular, flat, and olive-green or grey.
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: '#8892b0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li><strong>Carapace Length:</strong> 60 - 70 cm.</li>
                <li><strong>Scute Pattern:</strong> 5 pairs of costal scutes.</li>
                <li><strong>Behavior:</strong> Known for nesting in synchronized daytime groups called "arribadas".</li>
              </ul>
              <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(48, 60, 85, 0.4)', maxWidth: '380px' }}>
                <img src="/kemps_ridley_species.png" alt="Kemp's Ridley Turtle" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>

            {/* Other 4 species */}
            <div className="glass-card" style={{ borderLeft: '4px solid #ff7a59' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '1rem', marginBottom: '6px' }}>Other Extant Species</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: '#8892b0' }}>
                <div>
                  <strong style={{ color: '#e6f1ff' }}>4. Leatherback (*Dermochelys coriacea*):</strong> The largest species. Possesses a black, leathery, shell-less carapace with 7 longitudinal ridges instead of hard scutes. Carapace length: 130 - 180 cm.
                </div>
                <div>
                  <strong style={{ color: '#e6f1ff' }}>5. Hawksbill (*Eretmochelys imbricata*):</strong> Named for their narrow hawk-like beak. Carapace scutes overlap like shingles, displaying a gorgeous tortoiseshell gold/brown pattern. 4 pairs of costal scutes.
                </div>
                <div>
                  <strong style={{ color: '#e6f1ff' }}>6. Olive Ridley (*Lepidochelys olivacea*):</strong> Carapace is circular and olive-green. Very similar to Kemp's Ridley, but has 6 or more pairs of costal scutes. Nest in massive arribadas.
                </div>
                <div>
                  <strong style={{ color: '#e6f1ff' }}>7. Flatback (*Natator depressus*):</strong> Named for their exceptionally flat carapace with upturned edges. Pale grey/green shell. Restricted entirely to waters surrounding Australia.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. NEST PROTECTION */}
        {activeSection === 'equipment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#64ffda', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '8px' }}>Nest Protection Setup</h3>
            
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
                  <span>Secure the DNR Warning Sign on the seaward-facing front PVC pole. Write the nest number clearly and legibly in waterproof marker.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64ffda', fontWeight: 'bold' }}>Step 4:</span>
                  <span>Wrap bright red boundary tape around the three PVC poles to alert beach walkers and vehicles.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64ffda', fontWeight: 'bold' }}>Step 5 (Optional Final Step):</span>
                  <span>Mount the metal cage over the mesh screen, anchoring it between the PVC poles. Wire it securely to the poles with tight corners to prevent predators from prying it up.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. DNA SAMPLE PROTOCOL */}
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

        {/* 7. EMERGENCY CONTACTS */}
        {activeSection === 'contacts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#ff7a59', borderBottom: '1px solid rgba(255, 122, 89, 0.2)', paddingBottom: '8px' }}>Emergency Contacts</h3>
            
            <div style={{ backgroundColor: 'rgba(255, 122, 89, 0.1)', borderLeft: '4px solid #ff7a59', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.4' }}>
              <strong style={{ color: '#e6f1ff', display: 'block', marginBottom: '6px' }}>Report Dead, Sick, or Injured Sea Turtles:</strong>
              To report a dead, sick, or injured sea turtle to the South Carolina Department of Natural Resources (SCDNR), call the 24-hour hotline at:
              <a href="tel:18009225431" style={{ display: 'block', fontSize: '1.25rem', color: '#ff7a59', fontWeight: 'bold', fontFamily: 'monospace', textDecoration: 'none', marginTop: '6px', letterSpacing: '0.02em' }}>
                1-800-922-5431
              </a>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <h4 style={{ color: '#e6f1ff', fontSize: '0.95rem', marginBottom: '2px' }}>Local & County Agencies</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(48, 60, 85, 0.25)', paddingBottom: '8px' }}>
                  <div>
                    <strong style={{ color: '#e6f1ff', display: 'block' }}>Daufuskie Island Fire District</strong>
                    <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Non-emergency support and first responders</span>
                  </div>
                  <a href="tel:8437852116" style={{ color: '#64ffda', fontFamily: 'monospace', fontWeight: 'bold', textDecoration: 'none' }}>(843) 785-2116</a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(48, 60, 85, 0.25)', paddingBottom: '8px' }}>
                  <div>
                    <strong style={{ color: '#e6f1ff', display: 'block' }}>Beaufort County Sheriff's Office</strong>
                    <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Dispatch and county safety services</span>
                  </div>
                  <a href="tel:8432553200" style={{ color: '#64ffda', fontFamily: 'monospace', fontWeight: 'bold', textDecoration: 'none' }}>(843) 255-3200</a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(48, 60, 85, 0.25)', paddingBottom: '8px' }}>
                  <div>
                    <strong style={{ color: '#e6f1ff', display: 'block' }}>SCDNR Sea Turtle Stranding Coordinator</strong>
                    <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Marine resources division, Charleston office</span>
                  </div>
                  <a href="tel:8439539015" style={{ color: '#64ffda', fontFamily: 'monospace', fontWeight: 'bold', textDecoration: 'none' }}>(843) 953-9015</a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#ff7a59', display: 'block' }}>Life Threatening Emergency</strong>
                    <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Police, medical, fire rescue</span>
                  </div>
                  <a href="tel:911" style={{ color: '#ff7a59', fontFamily: 'monospace', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.1rem' }}>911</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
