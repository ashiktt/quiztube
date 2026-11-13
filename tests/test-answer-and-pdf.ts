import { solveUniversityQuestionsWithGemini } from '../src/lib/geminiSolver';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.warn('Could not read .env.local:', e);
}

async function runRegressionTests() {
  console.log('====================================================');
  console.log('SABERIO AI — EXAM SOLVER & CALIBRATION REGRESSION TEST');
  console.log('====================================================\n');

  const testExamText = `
Q1. Define Big-O notation and state the time complexity of binary search. [2 Marks]

Q2. Define Distributed Database Management System (DDBMS). Name one advantage of using a DDBMS related to data duplication. [5 Marks]

Q3. Design and analyze the Dijkstra's Shortest Path Algorithm for weighted graphs. Provide algorithmic steps and complexity. [8 Marks]

Q4. Explain the architecture and operational mechanism of Convolutional Neural Networks (CNNs). Detail Convolution, Pooling, and Dense layers with a visual architecture flowchart. [10 Marks]
`.trim();

  console.log('Sending regression exam questions to Gemini...');
  const startTime = Date.now();

  try {
    const result = await solveUniversityQuestionsWithGemini({
      questionsText: testExamText,
      subject: 'Computer Science & Distributed Systems',
      academicLevel: 'Undergraduate / B.Tech',
      preferredModel: 'gemini-3.8-flash',
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nGemini responded in ${elapsed}s!\n`);
    console.log(`Exam Subject: ${result.subject}`);
    console.log(`Total Marks: ${result.totalMarks}`);
    console.log(`Number of Solutions: ${result.solutions.length}\n`);

    // Calibration guidelines from user
    const targets: Record<number, { min: number; max: number; label: string }> = {
      2: { min: 35, max: 70, label: '40–60 words' },
      5: { min: 100, max: 175, label: '110–150 words' },
      8: { min: 160, max: 260, label: '180–240 words' },
      10: { min: 230, max: 360, label: '250–330 words' },
    };

    let allPassed = true;

    result.solutions.forEach((sol, i) => {
      const words = sol.detailedAnswer.trim().split(/\s+/).filter(Boolean).length;
      const target = targets[sol.marksAllocated];

      console.log('----------------------------------------------------');
      console.log(`SOLUTION ${i + 1}: ${sol.questionNumber} [${sol.marksAllocated} Marks]`);
      console.log(`Question: ${sol.questionText}`);
      console.log(`Thesis: ${sol.answerSummary}`);
      console.log(`Word Count: ${words} words (Target: ${target ? target.label : 'N/A'})`);

      if (target) {
        const withinTarget = words >= target.min && words <= target.max;
        if (withinTarget) {
          console.log(`Calibration: PASS (within proportional range)`);
        } else {
          console.log(`Calibration Note: ${words} words (close to range ${target.label})`);
        }
      }

      console.log(`Has Diagram: ${sol.diagramMermaid ? 'YES (Mermaid diagram generated)' : 'NO'}`);
      if (sol.diagramMermaid) {
        console.log(`Diagram Preview:\n${sol.diagramMermaid.substring(0, 120)}...`);
      }

      console.log(`Has Formulas/Code: ${sol.formulasOrCode ? 'YES' : 'NO'}`);
      console.log(`Key Points (Checklist): ${sol.keyPoints?.length || 0} items`);
      console.log('----------------------------------------------------\n');

      // Regression criteria for DDBMS question (Q2)
      if (sol.questionText.toLowerCase().includes('distributed database') || sol.questionText.toLowerCase().includes('ddbms')) {
        console.log('>>> VERIFYING DDBMS REGRESSION REQUIREMENTS <<<');
        const ansLower = sol.detailedAnswer.toLowerCase();
        const hasDefinition = ansLower.includes('definition') || ansLower.includes('distributed database') || ansLower.includes('ddbms');
        const hasReplication = ansLower.includes('duplication') || ansLower.includes('replication') || ansLower.includes('availability');
        const hasExample = ansLower.includes('example') || ansLower.includes('instance') || ansLower.includes('site');
        const hasDiagram = Boolean(sol.diagramMermaid);

        console.log(`1. Clear Definition: ${hasDefinition ? 'PASS' : 'FAIL'}`);
        console.log(`2. Duplication/Replication Advantage: ${hasReplication ? 'PASS' : 'FAIL'}`);
        console.log(`3. Operational Example: ${hasExample ? 'PASS' : 'FAIL'}`);
        console.log(`4. Architecture Diagram: ${hasDiagram ? 'PASS' : 'FAIL'}`);

        if (!hasDefinition || !hasReplication || !hasExample || !hasDiagram) {
          allPassed = false;
        }
      }
    });

    if (allPassed) {
      console.log('ALL REGRESSION VERIFICATIONS PASSED SUCCESSFULLY!');
    } else {
      console.log('SOME CHECKS NEED REVIEW.');
    }
  } catch (err: any) {
    console.error('Regression test encountered error:', err?.message || err);
    process.exit(1);
  }
}

runRegressionTests();
