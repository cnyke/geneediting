"use client";

import { useState, useEffect } from "react";

const QUESTIONS = [
  "If you could, would you choose the eye color of your child?",
  "Would you choose the sex of your child?",
  "Huntingtons disease is a genetic neurodegenerative disorder which begins with mood changes and jerky walking, and eventually leads to dementia and difficulty with coordinated movement. It involves the basal ganglia, the brain region shown here. If you could ensure your child would not be born with Huntingtons disease, would you?",
  "Hemophilia is a genetic disorder which impedes the ability of blood to clot, which would normally stop bleeding when a blood vessel is broken. If you could ensure your child would not be born with hemophilia, would you?",
  "If you could choose the height of your child, would you?",
  "Tay-Sachs disease is a genetic disorder which leads to deterioration of mental and physical abilities. Here it is represented by the brain stem. If you could ensure your child would not be born with Tay-Sachs disease, would you?",
  "If possible, would you decrease the likelihood of your child developing alcoholism?",
  "If you could decrease the likelihood of your child developing obesity, would you?",
  "Intelligence is represented here by the frontal cortex, a region of the brain associated with executive function. If you could increase the chances of your child having above average intelligence, would you?",
  "Would you choose to decrease the likelihood of your child developing depression?",
  "If you could improve the natural athleticism of your child, would you?",
];

const SVG_NAMES = [
  "eyecolor.svg",
  "sex.svg",
  "huntingtons.svg",
  "hemophilia.svg",
  "height.svg",
  "taysachs.svg",
  "alcoholism.svg",
  "obesity.svg",
  "intelligence.svg",
  "depression.svg",
  "athleticism.svg",
];

export default function Home() {
  // Local state for answers
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(11).fill(null));
  const [status, setStatus] = useState<string | null>(null);
  const [aggregate, setAggregate] = useState<{ yes: number; no: number }[] | null>(null);
  const [loadingAgg, setLoadingAgg] = useState(false);

  const handleAnswer = (idx: number, value: boolean) => {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? value : a)));
  };

  const handleSubmit = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        setStatus("Thank you for your submission!");
        setAnswers(Array(11).fill(null));
      } else {
        setStatus("There was an error submitting your answers.");
      }
    } catch {
      setStatus("There was an error submitting your answers.");
    }
  };

  useEffect(() => {
    async function fetchAgg() {
      setLoadingAgg(true);
      try {
        const res = await fetch("/api/aggregate");
        const data = await res.json();
        setAggregate(data.counts);
      } catch {
        setAggregate(null);
      }
      setLoadingAgg(false);
    }
    fetchAgg();
  }, []);

  return (
    <div style={{ color: '#ededed', padding: '0.2rem 0' }}>
      <h1 style={{ fontWeight: 600, fontSize: '2rem', marginBottom: '1.5rem' }}>Public Opinion on Gene Editing</h1>
      <div style={{ marginBottom: '2rem', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: 700 }}>
        <p>This project explores public opinion on the adoption of gene editing technologies.</p>
        <br></br>
        <p>Humans are in the midst of a biotechnology revolution. This offers us the chance—unprecedented in the entire 3.5 billion year course of evolution on this planet—to intentionally change the course of the future of our species. There are some genetic diseases which could be eliminated. There are clinics which allow patients to choose the sex of their child. The technology to choose a child&apos;s hair and eye color is available now. Can we change the next generation&apos;s predisposition to depression or alcoholism? Should we?</p>
        <br></br>
        <p>The disorders and physical features represented here are traits which could potentially be affected by human gene editing or embryo screening.</p>
        <br></br>
        <p>Do we want to live in a society in which people are choosing these things for their children? Vote below, then see what others have chosen.</p>
      
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600 }}
      >
        {QUESTIONS.map((q, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src={`/images/${SVG_NAMES[idx].replace('.svg', '.png')}`} 
              alt={SVG_NAMES[idx].replace('.svg', '')}
              style={{ width: 125, height: 'auto', opacity: 1 }}
            />
            <span style={{ flex: 1 }}>{q}</span>
            <button
              type="button"
              onClick={() => handleAnswer(idx, true)}
              style={{
                borderRadius: '50%',
                width: 40,
                height: 40,
                background: answers[idx] === true ? '#4caf50' : '#222',
                color: '#fff',
                border: '2px solid #4caf50',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s',
              }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(idx, false)}
              style={{
                borderRadius: '50%',
                width: 40,
                height: 40,
                background: answers[idx] === false ? '#e53935' : '#222',
                color: '#fff',
                border: '2px solid #e53935',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s',
              }}
            >
              No
            </button>
          </div>
        ))}
        <button
          type="submit"
          style={{
            marginTop: '2rem',
            padding: '0.75rem 2rem',
            borderRadius: 24,
            background: '#4caf50',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: 'pointer',
          }}
        >
          Submit
        </button>
      </form>
      {status && (
        <div style={{ marginTop: '1rem', color: status.startsWith('Thank') ? '#4caf50' : '#e53935', fontWeight: 600 }}>
          {status}
        </div>
      )}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontWeight: 600, fontSize: '1.3rem', marginBottom: '1rem' }}>Results</h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '1rem', lineHeight: 1.5, maxWidth: 700, color: '#ababab' }}>
          This child represents the society of decades to come by displaying respondents&apos; opinions. The brightness of each organ reflects the number of people who would choose it for their children. See below for a breakdown of the results. 
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
          {/* SVG Visualization */}
          <div style={{ minHeight: 600, background: '#111', borderRadius: 12, padding: 24, color: '#888', position: 'relative', width: 600, height: 600 }}>
            {loadingAgg && <span>Loading...</span>}
            {aggregate && aggregate.length === 11 && (
              <div style={{ position: 'relative', width: 550, height: 550 }}>
                {/* Outline SVG always at 15% opacity */}
                <img
                  src={'/BodySVGs/outline.svg'}
                  alt={'outline'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 550,
                    height: 550,
                    opacity: 0.15,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                {SVG_NAMES.map((svg, idx) => {
                  const total = aggregate[idx].yes + aggregate[idx].no;
                  // Opacity: 5% minimum, 100% max
                  const opacity = total > 0 ? 0.05 + 0.95 * (aggregate[idx].yes / total) : 0.05;
                  return (
                    <img
                      key={svg}
                      src={`/BodySVGs/${svg}`}
                      alt={svg.replace('.svg', '')}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 550,
                        height: 550,
                        opacity,
                        pointerEvents: 'none',
                        transition: 'opacity 0.5s',
                        zIndex: 1,
                      }}
                    />
                  );
                })}
              </div>
            )}
            {!loadingAgg && (!aggregate || aggregate.length !== 11) && <span>No data yet.</span>}
          </div>
          
          {/* Bar Chart */}
          <div style={{ width: '100%', maxWidth: 800 }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>Response Breakdown</h3>
            {loadingAgg && <span>Loading...</span>}
            {aggregate && aggregate.length === 11 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {QUESTIONS.map((question, idx) => {
                  const total = aggregate[idx].yes + aggregate[idx].no;
                  const yesPercent = total > 0 ? (aggregate[idx].yes / total) * 100 : 0;
                  const noPercent = total > 0 ? (aggregate[idx].no / total) * 100 : 0;
                  
                  return (
                    <div key={idx} style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.3rem', color: '#ababab', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img 
                          src={`/images/${SVG_NAMES[idx].replace('.svg', '.png')}`} 
                          alt={SVG_NAMES[idx].replace('.svg', '')}
                          style={{ width: 125, height: 'auto', opacity: 1 }}
                        />
                        <span style={{ flex: 1 }}>{question}</span>
                      </div>
                      <div style={{ display: 'flex', height: 20, width: '100%', border: '1px solid #444', borderRadius: 4, overflow: 'hidden' }}>
                        {/* Yes bar (white) */}
                        <div 
                          style={{ 
                            width: `${yesPercent}%`, 
                            backgroundColor: '#ffffff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            color: '#000',
                            fontWeight: 600
                          }}
                        >
                          {yesPercent > 15 ? `${Math.round(yesPercent)}%` : ''}
                        </div>
                        {/* No bar (outlined) */}
                        <div 
                          style={{ 
                            width: `${noPercent}%`, 
                            backgroundColor: 'transparent', 
                            border: '1px solid #000',
                            borderLeft: yesPercent > 0 ? 'none' : '1px solid #000',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            color: '#ababab',
                            fontWeight: 600
                          }}
                        >
                          {noPercent > 15 ? `${Math.round(noPercent)}%` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.2rem' }}>
                        Yes: {aggregate[idx].yes} • No: {aggregate[idx].no} • Total: {total}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!loadingAgg && (!aggregate || aggregate.length !== 11) && <span>No data yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
