import test from 'node:test';
import assert from 'node:assert/strict';
import { caseInfo, stages, sources, leads, events, decisions } from '../scenario.js';
import { getSnapshot, getLeadTrace, exportSnapshot } from '../model.js';

const findLead = (snapshot, id) => snapshot.leads.find((lead) => lead.id === id);
const findDecision = (snapshot, id) => snapshot.decisions.find((decision) => decision.id === id);

test('each replay contains only records and relationships available at that stage', () => {
  for (let index = 0; index < stages.length; index += 1) {
    const snapshot = getSnapshot(index);
    for (const kind of ['stages', 'sources', 'leads', 'events', 'decisions']) {
      for (const record of snapshot[kind]) assert.ok((record.stage ?? record.index) <= index, `${kind}: ${record.id}`);
    }
    const visibleIds = new Set([...snapshot.sources, ...snapshot.leads, ...snapshot.decisions].map((record) => record.id));
    for (const edge of snapshot.edges) {
      assert.ok(visibleIds.has(edge.from), edge.from);
      assert.ok(visibleIds.has(edge.to), edge.to);
    }
    for (const lead of snapshot.leads) {
      for (const source of lead.sourceChain) assert.ok(source.stage <= index);
      for (const event of lead.history) assert.ok(event.stage <= index);
    }
  }
  assert.equal(JSON.stringify(getSnapshot(2)).includes('source-social-post'), false);
  assert.equal(JSON.stringify(getSnapshot(3)).includes('source-market-footage'), false);
  assert.equal(JSON.stringify(getSnapshot(4)).includes('lead-library'), false);
  assert.equal(JSON.stringify(getSnapshot(5)).includes('lead-found-safe'), false);
});

test('the source link is learned at stage 3, not backdated into the earlier view', () => {
  const before = getSnapshot(2);
  assert.deepEqual(findLead(before, 'lead-north-tip').rootSourceIds, ['source-tip-north']);
  assert.deepEqual(findLead(before, 'lead-radio-tip').rootSourceIds, ['source-tip-radio']);
  assert.equal(before.stats.activeLeads, 3);
  assert.equal(before.stats.independentOrigins, 3);
  assert.equal(before.stats.unresolvedOrigins, 2);
  assert.equal(before.sources.find((source) => source.id === 'source-tip-north').originStatus, 'unresolved');
  assert.equal(before.edges.filter((edge) => edge.kind === 'derivation').length, 0);

  const after = getSnapshot(3);
  assert.deepEqual(findLead(after, 'lead-north-tip').rootSourceIds, ['source-witness']);
  assert.deepEqual(findLead(after, 'lead-radio-tip').rootSourceIds, ['source-witness']);
  assert.deepEqual(findLead(after, 'lead-north-tip').sourceChain.map((source) => source.id), ['source-tip-north', 'source-social-post', 'source-witness']);
  assert.equal(findLead(after, 'lead-north-tip').status, 'repeated');
  assert.equal(after.stats.activeLeads, 1);
  assert.equal(after.stats.independentOrigins, 1);
  assert.equal(after.stats.unresolvedOrigins, 0);
  assert.equal(after.stats.preservedReports, before.stats.preservedReports);
  assert.equal(findLead(getSnapshot(2), 'lead-north-tip').status, 'unverified');
});

test('human assessments refute the identification while preserving original reports', () => {
  const original = leads.find((lead) => lead.id === 'lead-red-van');
  const before = getSnapshot(3);
  const after = getSnapshot(4);
  assert.equal(findLead(before, original.id).status, 'active');
  assert.equal(findLead(after, original.id).status, 'refuted');
  assert.deepEqual(getLeadTrace(original.id, 4).originalRecord, original);
  assert.equal(findLead(after, original.id).summary, original.summary);
  for (const id of ['lead-red-van', 'lead-north-tip', 'lead-radio-tip']) {
    assert.equal(findLead(after, id).status, 'refuted');
    const assessment = findLead(after, id).history.find((event) => event.status === 'refuted');
    assert.equal(assessment.actor, 'Analyst D (fictional)');
    assert.ok(assessment.basedOn.includes('lead-footage-review'));
  }
  assert.deepEqual(findLead(after, 'lead-north-tip').history.filter((event) => event.status).map((event) => event.status), ['repeated', 'refuted']);
  assert.ok(after.stats.preservedReports >= before.stats.preservedReports);
});

test('the dependent decision is visibly flagged for human review and then superseded', () => {
  assert.equal(findDecision(getSnapshot(3), 'decision-van-search').status, 'active');
  const review = findDecision(getSnapshot(4), 'decision-van-search');
  assert.equal(review.status, 'review-required');
  assert.ok(review.history.some((event) => event.actor === 'Search coordinator (fictional)' && event.basedOn?.includes('lead-footage-review')));
  const redirected = getSnapshot(5);
  assert.equal(findDecision(redirected, 'decision-van-search').status, 'superseded');
  assert.deepEqual(findDecision(redirected, 'decision-footbridge-search').basedOn, ['lead-library', 'lead-footbridge', 'lead-footage-review']);
  assert.ok(getLeadTrace('lead-red-van', 4).decisions.some((decision) => decision.id === 'decision-van-search'));
});

test('independent source paths remain distinct and are not refuted by the van reassessment', () => {
  const snapshot = getSnapshot(5);
  assert.equal(snapshot.stats.activeLeads, 2);
  assert.equal(snapshot.stats.independentOrigins, 2);
  assert.deepEqual(findLead(snapshot, 'lead-library').rootSourceIds, ['source-library']);
  assert.deepEqual(findLead(snapshot, 'lead-footbridge').rootSourceIds, ['source-footbridge']);
  for (const id of ['lead-library', 'lead-footbridge']) {
    assert.equal(findLead(snapshot, id).status, 'active');
    assert.equal(findLead(snapshot, id).history.some((event) => event.status === 'refuted'), false);
  }
  const final = getSnapshot(6);
  assert.equal(findLead(final, 'lead-library').status, 'resolved');
  assert.equal(findLead(final, 'lead-footbridge').status, 'resolved');
  assert.equal(findLead(final, 'lead-red-van').status, 'refuted');
  assert.equal(final.stats.preservedReports, leads.length);
  assert.equal(final.stats.activeLeads, 0);
  assert.equal(findDecision(final, 'decision-footbridge-search').status, 'completed');
});

test('replay, export, and source fixture are deterministic and immutable', () => {
  const fixture = JSON.stringify({ caseInfo, stages, sources, leads, events, decisions });
  const first = JSON.stringify(getSnapshot(2));
  getSnapshot(6);
  assert.equal(JSON.stringify(getSnapshot(2)), first);
  assert.equal(JSON.stringify(exportSnapshot(3)), JSON.stringify(exportSnapshot(3)));
  assert.equal(JSON.stringify({ caseInfo, stages, sources, leads, events, decisions }), fixture);
  assert.ok(Object.isFrozen(leads));
  assert.ok(Object.isFrozen(leads[0]));
  assert.ok(Object.isFrozen(getSnapshot(6).leads[0].history));
  assert.throws(() => { leads[0].summary = 'changed'; }, TypeError);
  assert.throws(() => { getSnapshot(3).sources[0].derivedFrom.push('later-source'); }, TypeError);
});

test('JSON-LD export retains selected history and original report with clear limitations', () => {
  const early = exportSnapshot(2);
  const late = exportSnapshot(6);
  assert.equal(early.fictional, true);
  assert.equal(early['@context'].prov, 'http://www.w3.org/ns/prov#');
  assert.equal(early['@context']['@version'], 1.1);
  for (const term of ['selectedStage', 'snapshot', 'demo:record', 'demo:originalRecord', 'demo:assertion', 'demo:stage']) {
    assert.equal(early['@context'][term]['@type'], '@json');
  }
  assert.equal(early.selectedStage.index, 2);
  assert.equal(JSON.stringify(early).includes('source-social-post'), false);
  assert.equal(JSON.stringify(early).includes('lead-found-safe'), false);
  assert.ok(late.limitations.some((limit) => limit.includes('cryptographic')));
  assert.equal(late.snapshot.events.length, events.length);
  const pools = late['@graph'].filter((node) => node['demo:recordKind'] === 'record-pool');
  assert.equal(pools.length, 7);
  for (const pool of pools) {
    assert.ok(pool['@type'].includes('prov:Collection'));
    const poolStage = pool['demo:stage'].index;
    const members = pool['prov:hadMember'].map((ref) => ref['@id']);
    assert.equal(members.length, new Set(members).size);
    const then = getSnapshot(poolStage);
    for (const report of then.leads) assert.ok(members.some((id) => id.endsWith(`:${report.id}`)));
    for (const id of members) {
      const member = late['@graph'].find((node) => node['@id'] === id);
      assert.equal(member['@type'], 'prov:Entity');
      const availableAt = member['demo:record']?.stage ?? member['demo:originalRecord']?.stage ?? member['demo:assertion']?.stage;
      assert.ok(availableAt <= poolStage, `${id} in stage ${poolStage}`);
    }
  }
  const stage2Members = pools[2]['prov:hadMember'].map((ref) => ref['@id']);
  assert.equal(stage2Members.some((id) => id.endsWith(':source-social-post')), false);
  assert.equal(stage2Members.some((id) => id.endsWith(':event-van-refuted-assertion')), false);
  assert.ok(pools[3]['prov:hadMember'].some((ref) => ref['@id'].endsWith(':lead-red-van')));
  assert.ok(pools[4]['prov:hadMember'].some((ref) => ref['@id'].endsWith(':lead-red-van')));
  assert.ok(pools[4]['prov:hadMember'].some((ref) => ref['@id'].endsWith(':event-van-refuted-assertion')));
  const original = late['@graph'].find((node) => node['@id'].endsWith(':lead-red-van'));
  assert.deepEqual(original['demo:originalRecord'], leads.find((lead) => lead.id === 'lead-red-van'));
  assert.equal(original['demo:currentStatus'], 'refuted');
  const nodeIds = new Set(late['@graph'].map((node) => node['@id']));
  for (const node of late['@graph']) {
    for (const term of ['prov:used', 'prov:generated', 'prov:wasGeneratedBy', 'prov:wasDerivedFrom', 'prov:wasAttributedTo', 'prov:wasAssociatedWith', 'prov:hadMember', 'prov:wasRevisionOf']) {
      const refs = node[term] ? [node[term]].flat() : [];
      for (const ref of refs) assert.ok(nodeIds.has(ref['@id']), `${term}: ${ref['@id']}`);
    }
  }
});

test('unavailable leads and invalid stage requests do not disclose later records', () => {
  assert.equal(getLeadTrace('lead-found-safe', 5), null);
  assert.equal(getLeadTrace('unknown', 6), null);
  for (const invalid of [-1, 7, 1.5, '3', NaN, null]) {
    assert.throws(() => getSnapshot(invalid), RangeError);
    assert.throws(() => exportSnapshot(invalid), RangeError);
  }
});
