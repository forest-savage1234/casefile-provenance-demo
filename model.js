import { caseInfo, stages, sources, leads, events, decisions } from './scenario.js';

const clone = (value) => JSON.parse(JSON.stringify(value));
const openStatuses = new Set(['active', 'unverified']);

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function validateIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index >= stages.length) {
    throw new RangeError(`Stage must be an integer from 0 to ${stages.length - 1}.`);
  }
}

/**
 * Replay only assertions received through this stage. A later source link or
 * assessment cannot alter what an earlier replay presents as known.
 *
 * stats.records: all visible source, report, event, and decision records.
 * stats.preservedReports: immutable lead-report count, including closed reports.
 * stats.activeLeads: search-category reports currently active or unverified.
 * stats.independentOrigins: distinct terminal source nodes of active search
 * reports, including unresolved origins. This is a graph count, not proof of
 * real-world independence. stats.unresolvedOrigins identifies unresolved roots.
 */
export function getSnapshot(index = 0) {
  validateIndex(index);
  const visibleEvents = clone(events.filter((event) => event.stage <= index));
  const visibleSources = clone(sources.filter((source) => source.stage <= index));
  const visibleSourceMap = new Map(visibleSources.map((source) => [source.id, source]));
  for (const source of visibleSources) {
    source.derivedFrom = [];
    source.relationHistory = visibleEvents.filter((event) => event.kind === 'source-linked' && event.sourceId === source.id);
    for (const event of source.relationHistory) {
      if (visibleSourceMap.has(event.parentSourceId) && !source.derivedFrom.includes(event.parentSourceId)) {
        source.derivedFrom.push(event.parentSourceId);
      }
    }
  }
  for (const source of visibleSources) {
    source.originStatus = source.derivedFrom.length ? 'linked' : source.kind === 'Unestablished source relationship' ? 'unresolved' : 'recorded-origin';
  }

  function sourceChain(sourceId, seen = new Set()) {
    if (seen.has(sourceId)) return [];
    seen.add(sourceId);
    const source = visibleSourceMap.get(sourceId);
    if (!source) return [];
    return [source, ...source.derivedFrom.flatMap((parentId) => sourceChain(parentId, seen))];
  }

  const visibleLeads = leads.filter((lead) => lead.stage <= index).map((lead) => {
    const history = visibleEvents.filter((event) => event.leadId === lead.id);
    const assessments = history.filter((event) => event.kind === 'lead-assessment');
    const chain = sourceChain(lead.sourceId);
    return {
      ...clone(lead),
      status: assessments.at(-1)?.status ?? lead.initialStatus,
      history,
      sourceChain: chain,
      rootSourceIds: chain.filter((source) => source.derivedFrom.length === 0).map((source) => source.id),
    };
  });
  const visibleDecisions = decisions.filter((decision) => decision.stage <= index).map((decision) => {
    const history = visibleEvents.filter((event) => event.decisionId === decision.id);
    const assessments = history.filter((event) => event.kind === 'decision-assessment');
    return { ...clone(decision), status: assessments.at(-1)?.status ?? decision.initialStatus, history };
  });

  const edges = [];
  for (const source of visibleSources) {
    for (const parentId of source.derivedFrom) {
      edges.push({ from: parentId, to: source.id, label: 'account repeated in', kind: 'derivation' });
    }
  }
  for (const lead of visibleLeads) {
    edges.push({ from: lead.sourceId, to: lead.id, label: 'recorded as', kind: 'report' });
  }
  for (const decision of visibleDecisions) {
    for (const leadId of decision.basedOn) {
      edges.push({ from: leadId, to: decision.id, label: 'recorded basis for', kind: 'decision' });
    }
  }
  const seenAssessmentEdges = new Set();
  for (const event of visibleEvents.filter((item) => item.kind.endsWith('-assessment'))) {
    for (const basisId of event.basedOn ?? []) {
      const targetId = event.leadId ?? event.decisionId;
      const key = `${basisId}:${targetId}:${event.status}`;
      if (seenAssessmentEdges.has(key)) continue;
      seenAssessmentEdges.add(key);
      edges.push({ from: basisId, to: targetId, label: event.status === 'refuted' ? 'basis for refutation' : `basis for ${event.status}`, kind: 'assessment', eventId: event.id });
    }
  }
  const active = visibleLeads.filter((lead) => lead.category === 'search' && openStatuses.has(lead.status));
  const activeRoots = [...new Set(active.flatMap((lead) => lead.rootSourceIds))];
  return freeze({
    caseInfo: clone(caseInfo),
    stage: clone(stages[index]),
    stages: clone(stages.slice(0, index + 1)),
    sources: visibleSources,
    leads: visibleLeads,
    events: visibleEvents,
    decisions: visibleDecisions,
    edges,
    stats: {
      records: visibleSources.length + visibleLeads.length + visibleEvents.length + visibleDecisions.length,
      activeLeads: active.length,
      independentOrigins: activeRoots.length,
      unresolvedOrigins: activeRoots.filter((id) => visibleSourceMap.get(id).originStatus === 'unresolved').length,
      preservedReports: visibleLeads.length,
    },
  });
}

/** A report, the source chain known then, and explicitly recorded dependencies. */
export function getLeadTrace(leadId, index = 0) {
  const snapshot = getSnapshot(index);
  const lead = snapshot.leads.find((item) => item.id === leadId);
  if (!lead) return null;
  return freeze({
    stage: snapshot.stage,
    lead,
    originalRecord: clone(leads.find((item) => item.id === leadId)),
    sources: lead.sourceChain,
    events: snapshot.events.filter((event) => event.leadId === leadId || event.basedOn?.includes(leadId) || lead.sourceChain.some((source) => source.id === event.sourceId)),
    decisions: snapshot.decisions.filter((decision) => decision.basedOn.includes(leadId) || decision.history.some((event) => event.basedOn?.includes(leadId))),
    edges: snapshot.edges.filter((edge) => edge.from === leadId || edge.to === leadId || lead.sourceChain.some((source) => source.id === edge.from || source.id === edge.to)),
  });
}

/**
 * Deterministic JSON-LD teaching export. PROV describes recorded derivations and
 * activities; demo terms retain assessments and exercise metadata. It asserts
 * no cryptographic integrity, legal admissibility, verified custody, or verified
 * real-world independence. The export represents only the selected stage.
 */
export function exportSnapshot(index = 0) {
  const snapshot = getSnapshot(index);
  const iri = (id) => `urn:dfrws:fictional-case-014:${id}`;
  const ref = (id) => ({ '@id': iri(id) });
  const actorNames = [...new Set([
    ...snapshot.sources.map((source) => source.actor),
    ...snapshot.leads.map((lead) => lead.actor),
    ...snapshot.events.map((event) => event.actor),
    ...snapshot.decisions.map((decision) => decision.actor),
  ])];
  const actorId = (name) => `agent-${encodeURIComponent(name)}`;
  return freeze({
    '@context': {
      '@version': 1.1,
      prov: 'http://www.w3.org/ns/prov#',
      demo: 'https://example.org/fictional-provenance-demo#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      label: 'rdfs:label',
      summary: 'demo:summary',
      fictional: 'demo:fictional',
      notice: 'demo:notice',
      limitations: 'demo:limitations',
      selectedStage: { '@id': 'demo:selectedStage', '@type': '@json' },
      snapshot: { '@id': 'demo:snapshot', '@type': '@json' },
      'demo:record': { '@id': 'demo:record', '@type': '@json' },
      'demo:originalRecord': { '@id': 'demo:originalRecord', '@type': '@json' },
      'demo:assertion': { '@id': 'demo:assertion', '@type': '@json' },
      'demo:stage': { '@id': 'demo:stage', '@type': '@json' },
    },
    '@id': iri(`bundle-stage-${index}`),
    '@type': 'prov:Bundle',
    fictional: true,
    notice: caseInfo.notice,
    limitations: [
      'Scripted fictional replay; no real case or personal data.',
      'Source relationships and assessments are recorded assertions by fictional people.',
      'Known source-root counts do not prove real-world independence.',
      'No signatures, cryptographic tamper detection, verified chain of custody, access controls, or production validation.',
      'Exercise times are local labels on one fictional day; they are not machine-verifiable timestamps.',
      'Generic demo terms use an example.org vocabulary; this is not an ontology-conformance certification.',
    ],
    selectedStage: clone(snapshot.stage),
    snapshot: clone(snapshot),
    '@graph': [
      ...snapshot.stages.map((stage) => ({
        '@id': iri(`record-pool-stage-${stage.index}`), '@type': ['prov:Entity', 'prov:Collection'],
        label: `Record pool membership through ${stage.time}`,
        'demo:recordKind': 'record-pool', 'demo:stage': clone(stage),
        ...(stage.index > 0 ? { 'prov:wasRevisionOf': ref(`record-pool-stage-${stage.index - 1}`) } : {}),
        'prov:hadMember': [
          ...snapshot.sources.filter((record) => record.stage <= stage.index).map((record) => record.id),
          ...snapshot.leads.filter((record) => record.stage <= stage.index).map((record) => record.id),
          ...snapshot.decisions.filter((record) => record.stage <= stage.index).map((record) => record.id),
          ...snapshot.events.filter((event) => event.stage <= stage.index && !['record-added', 'decision-recorded'].includes(event.kind)).map((event) => `${event.id}-assertion`),
        ].map(ref),
      })),
      ...actorNames.map((name) => ({ '@id': iri(actorId(name)), '@type': 'prov:Agent', label: name })),
      ...snapshot.sources.map((source) => ({
        '@id': iri(source.id), '@type': 'prov:Entity', label: source.label,
        'demo:recordKind': 'source', 'demo:record': clone(source),
        'prov:wasAttributedTo': ref(actorId(source.actor)),
        'prov:wasDerivedFrom': source.derivedFrom.map(ref),
      })),
      ...snapshot.leads.map((lead) => ({
        '@id': iri(lead.id), '@type': 'prov:Entity', label: lead.title,
        'demo:recordKind': 'lead-report', 'demo:originalRecord': clone(leads.find((item) => item.id === lead.id)),
        'demo:currentStatus': lead.status,
        'prov:wasAttributedTo': ref(actorId(lead.actor)),
        'prov:wasDerivedFrom': ref(lead.sourceId),
      })),
      ...snapshot.decisions.map((decision) => ({
        '@id': iri(decision.id), '@type': 'prov:Entity', label: decision.title,
        'demo:recordKind': 'decision-record', 'demo:originalRecord': clone(decisions.find((item) => item.id === decision.id)),
        'demo:currentStatus': decision.status,
        'demo:basedOn': decision.basedOn.map(ref),
        'demo:history': decision.history.map((event) => ref(event.id)),
        'prov:wasAttributedTo': ref(actorId(decision.actor)),
      })),
      ...snapshot.events.map((event) => ({
        '@id': iri(event.id), '@type': 'prov:Activity', summary: event.summary,
        'demo:recordKind': event.kind, 'demo:record': clone(event),
        'prov:wasAssociatedWith': ref(actorId(event.actor)),
        'prov:used': [...new Set([...(event.basedOn ?? []), event.sourceId, event.parentSourceId, ...(event.kind.endsWith('-assessment') ? [event.leadId, event.decisionId] : [])].filter(Boolean))].map(ref),
        'prov:generated': ref(event.kind === 'record-added' ? event.leadId : event.kind === 'decision-recorded' ? event.decisionId : `${event.id}-assertion`),
      })),
      ...snapshot.events.filter((event) => !['record-added', 'decision-recorded'].includes(event.kind)).map((event) => ({
        '@id': iri(`${event.id}-assertion`), '@type': 'prov:Entity',
        label: event.kind === 'source-linked' ? 'Recorded source-link assertion' : 'Recorded human assessment',
        'demo:recordKind': 'assertion', 'demo:assertion': clone(event),
        'prov:wasGeneratedBy': ref(event.id),
        'prov:wasAttributedTo': ref(actorId(event.actor)),
      })),
    ],
  });
}
