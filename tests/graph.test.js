import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConflictGraph, validateGraph } from '../js/graph.js';
import { greedyColoring, welshPowellColoring, dsaturColoring, verifyColoring, colorClasses } from '../js/coloring.js';
import { parseCSV, validateRegistrationRows } from '../js/validation.js';
import { projectRegistrations } from '../js/project-data.js';
import { generalInputState } from '../js/general-mode.js';

test('registration graph extracts distinct subjects and unique pair conflicts',()=>{
  const graph=buildConflictGraph([{studentId:'S1',subjects:['MA101','CS101','PH101']},{studentId:'S2',subjects:['MA101','CS101']},{studentId:'S3',subjects:['CS101']}]);
  assert.deepEqual(graph.vertices,['CS101','MA101','PH101']);
  assert.equal(graph.edges.length,3); // pair conflicts from the three-subject registration are all present.
  assert.deepEqual(new Set(graph.edges.map(e=>e.join('|'))),new Set(['CS101|MA101','CS101|PH101','MA101|PH101']));
});
test('isolated subjects survive graph construction',()=>assert.deepEqual(buildConflictGraph([{studentId:'S1',subjects:['AB101']}]),{vertices:['AB101'],edges:[]}));
test('all implemented algorithms return proper colorings',()=>{
  const graph={vertices:['A','B','C','D','E'],edges:[['A','B'],['A','C'],['B','C'],['C','D'],['D','E']]};
  for(const run of [greedyColoring,welshPowellColoring,dsaturColoring]){const result=run(graph);assert.equal(result.size,5);assert.equal(verifyColoring(graph,result).valid,true);assert.equal([...colorClasses(result).values()].flat().length,5)}
});
test('empty graph has a valid empty coloring',()=>{const graph={vertices:[],edges:[]};assert.equal(verifyColoring(graph,dsaturColoring(graph)).valid,true)});
test('general graph validation rejects bounds, loops, duplicates and unknown labels',()=>{
  assert.equal(validateGraph(['A'],[]).valid,true);
  assert.match(validateGraph([],[]).errors.join(' '),/between 1 and 50/);
  assert.match(validateGraph(['A'],[['A','A']]).errors.join(' '),/self-loop/);
  assert.match(validateGraph(['A','B'],[['A','B'],['B','A']]).errors.join(' '),/Duplicate edge/);
  assert.match(validateGraph(['A'],[['A','B']]).errors.join(' '),/unknown vertex/);
  assert.match(validateGraph(Array.from({length:51},(_,i)=>`V${i}`),[]).errors.join(' '),/between 1 and 50/);
  assert.match(validateGraph(['A','B'],Array.from({length:51},()=>['A','B'])).errors.join(' '),/no more than 50/);
});
test('registration validation catches missing values, invalid codes and duplicate registrations',()=>{
  const result=validateRegistrationRows([{studentId:'',subjects:''},{studentId:'S1',subjects:'MATH1'},{studentId:'S2',subjects:'CS101 CS101'},{studentId:'S3',subjects:'PH101'},{studentId:'S3',subjects:'PH101'}]);
  assert.equal(result.valid,false);const all=result.errors.join(' ');assert.match(all,/student ID is missing/);assert.match(all,/at least one subject/);assert.match(all,/invalid subject code/);assert.match(all,/duplicate subject codes/);assert.match(all,/duplicate registration/);
});
test('CSV parser supports quoted cells and required column names',()=>{
  const parsed=parseCSV('student_id,subject_codes\r\n"Student, One","CS101, MA101"');
  assert.deepEqual(parsed.errors,[]);assert.equal(parsed.rows[0].studentId,'Student, One');assert.equal(parsed.rows[0].subjects,'CS101, MA101');
  assert.match(parseCSV('name,courses\nS1,CS101').errors.join(' '),/must include student_id and subject_codes/);
});

test('supplied DMGT dataset loads exactly 20 students and its actual distinct subjects',()=>{
  const exactRows=[
    'S1|25CS2304 25CS2101 25CS2203','S2|25CS2101 25CS2201 25CS2302',
    'S3|25CS2304 25CS2303 25CS2103','S4|25CS2201 25CS2302 25CS2102',
    'S5|25CS2101 25CS2203 25CS2401','S6|25CS2304 25CS2201 25CS2102',
    'S7|25CS2303 25CS2302 25CS2401','S8|25CS2103 25CS2304 25CS2203',
    'S9|25CS2201 25CS2102 25CS2401','S10|25CS2302 25CS2303 25CS2101',
    'S11|25CS2101 25CS2302 25CS2103','S12|25CS2203 25CS2102 25CS2401',
    'S13|25CS2304 25CS2103 25CS2201','S14|25CS2201 25CS2303 25CS2401',
    'S15|25CS2304 25CS2302 25CS2102','S16|25CS2101 25CS2203 25CS2303',
    'S17|25CS2202 25CS2304 25CS2102','S18|25CS2102 25CS2303 25CS2401',
    'S19|25CS2201 25CS2302 25CS2103','S20|25CS2304 25CS2101 25CS2401'
  ];
  assert.deepEqual(projectRegistrations.map(r=>`${r.studentId}|${r.subjects.join(' ')}`),exactRows);
  assert.equal(projectRegistrations.length,20);
  assert.deepEqual(projectRegistrations.map(r=>r.studentId),Array.from({length:20},(_,i)=>`S${i+1}`));
  assert.ok(projectRegistrations.every(r=>r.subjects.length===3));
  const graph=buildConflictGraph(projectRegistrations);
  // The supplied records contain ten distinct subject codes (not six).
  assert.equal(graph.vertices.length,10);
  assert.ok(graph.vertices.includes('25CS2202'));
  assert.equal(validateRegistrationRows(projectRegistrations).valid,true);
  // Every edge is derived from at least one shared registration; each student's
  // three courses contribute their full set of pair conflicts.
  const expected=new Set();
  for(const registration of projectRegistrations){
    for(let i=0;i<registration.subjects.length;i++)for(let j=i+1;j<registration.subjects.length;j++){
      expected.add([registration.subjects[i],registration.subjects[j]].sort().join('|'));
    }
  }
  assert.deepEqual(new Set(graph.edges.map(e=>e.join('|'))),expected);
  for(const [a,b] of graph.edges)assert.ok(projectRegistrations.some(r=>r.subjects.includes(a)&&r.subjects.includes(b)));
  for(const run of [greedyColoring,welshPowellColoring,dsaturColoring]){
    const colors=run(graph);
    assert.equal(verifyColoring(graph,colors).valid,true);
    assert.equal(colors.size,10);
  }
});

test('year-first subject codes are accepted while malformed codes are rejected',()=>{
  const good=validateRegistrationRows([{studentId:'S1',subjects:'25CS2304 25CS2101 25CS2203 25CS2401'}]);
  assert.equal(good.valid,true);
  const bad=validateRegistrationRows([{studentId:'S2',subjects:'25CS23X4'}]);
  assert.equal(bad.valid,false);
  assert.match(bad.errors.join(' '),/invalid subject code/);
});

test('invalid general graph input clears stale visualization and coloring state',()=>{
  const staleGraph={vertices:['A','B'],edges:[['A','B']]};
  const staleColors=new Map([['A',0],['B',1]]);
  const invalidInputs=[
    validateGraph(['A','B','C'],[['A','D']]),
    validateGraph(['A','B'],[['A','A']]),
    validateGraph(['A','B'],[['A','B'],['B','A']]),
    validateGraph([],[]),
    validateGraph(Array.from({length:51},(_,i)=>`V${i}`),[]),
    validateGraph(['A','B'],Array.from({length:51},()=>['A','B']))
  ];
  for(const checked of invalidInputs){
    assert.equal(checked.valid,false);
    const next=generalInputState(checked,{graph:staleGraph,colors:staleColors});
    assert.deepEqual(next.graph,{vertices:[],edges:[]});
    assert.equal(next.colors,null);
  }
});
