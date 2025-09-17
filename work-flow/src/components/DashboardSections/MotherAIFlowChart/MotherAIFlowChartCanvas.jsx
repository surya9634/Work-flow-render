import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Save, Plus, Wand2, Focus, Sparkles } from 'lucide-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Futuristic node styles
const cardBase = 'rounded-xl shadow-xl border backdrop-blur-md';
const neon = 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30';
const neonGlow = 'ring-1 ring-blue-400/30 hover:ring-purple-400/40 transition-all duration-300';

// Mother AI Node UI
function MotherNode({ data }) {
  return (
    <div className={`${cardBase} ${neon} ${neonGlow} p-3 text-white w-[240px] relative`}
         style={{ boxShadow: '0 0 30px rgba(88, 101, 242, 0.25)' }}>
      {/* Incoming handles on left/right (visual only), outgoing at bottom */}
      <Handle type="source" position={Position.Bottom} id="out" style={{ background: '#4f46e5' }} />
      <div className="text-xs uppercase tracking-wider text-blue-200/90">Mother AI</div>
      <div className="text-lg font-semibold">
        {data?.name || 'Mother AI'}
      </div>
      <div className="mt-2 text-[11px] text-blue-100/70 line-clamp-3">
        {data?.systemPrompt ? data.systemPrompt : 'Central router that detects intent and confirms before routing.'}
      </div>
    </div>
  );
}

// Campaign Node UI
function CampaignNode({ data }) {
  return (
    <div className={`${cardBase} ${neonGlow} p-3 w-[240px] bg-white/90 border-gray-200 relative`}
         style={{ boxShadow: '0 0 26px rgba(147, 51, 234, 0.20)' }}>
      {/* Incoming handle at top */}
      <Handle type="target" position={Position.Top} id="in" style={{ background: '#9333ea' }} />
      <div className="text-[11px] uppercase tracking-wider text-gray-500">Campaign</div>
      <div className="text-base font-semibold text-gray-900 truncate">{data?.label || data?.name || 'Campaign'}</div>
      <div className="mt-1 text-xs text-gray-600 truncate">
        {data?.campaignName || data?.campaignId || '—'}
      </div>
      {Array.isArray(data?.keywords) && data.keywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.keywords.slice(0, 3).map((k) => (
            <span key={k} className="px-2 py-0.5 text-[10px] rounded-full bg-blue-50 text-blue-700 border border-blue-200">{k}</span>
          ))}
          {data.keywords.length > 3 && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-50 text-gray-700 border border-gray-200">+{data.keywords.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  mother: MotherNode,
  campaign: CampaignNode,
};

// Derive elements array for backend from campaign nodes
function deriveElementsFromGraph(nodes, edges) {
  const mother = nodes.find((n) => n.type === 'mother');
  const allowedTargets = new Set(
    edges.filter((e) => e.source === (mother?.id || 'mother')).map((e) => e.target)
  );
  return nodes
    .filter((n) => n.type === 'campaign' && (allowedTargets.size === 0 || allowedTargets.has(n.id)))
    .map((n) => ({
      id: n.data?.elementId || `el_${n.id}`,
      campaignId: n.data?.campaignId || '',
      label: n.data?.label || n.data?.name || '',
      keywords: Array.isArray(n.data?.keywords) ? n.data.keywords : [],
    }));
}

// Simple radial auto-layout around the Mother node
function radialLayout(nodes, centerId) {
  const center = nodes.find((n) => n.id === centerId) || nodes[0];
  if (!center) return nodes;
  const others = nodes.filter((n) => n.id !== center.id);
  const R = 300; // radius
  const cx = center.position?.x ?? 0;
  const cy = center.position?.y ?? 0;
  const step = (2 * Math.PI) / Math.max(1, others.length);
  return nodes.map((n, i) => {
    if (n.id === center.id) return n;
    const angle = i * step;
    return {
      ...n,
      position: {
        x: cx + Math.cos(angle) * R,
        y: cy + Math.sin(angle) * R,
      },
    };
  });
}

export default function MotherAIFlowChartCanvas({ current, setCurrent, campaignOptions }) {
  const initialGraph = useMemo(() => {
    // If graph exists, load it; else build from elements
    if (current?.graph?.nodes && current?.graph?.edges) {
      return {
        nodes: current.graph.nodes,
        edges: current.graph.edges,
      };
    }

    const motherNode = {
      id: current?.id || 'mother',
      type: 'mother',
      data: {
        name: current?.name || 'Mother AI',
        systemPrompt: current?.systemPrompt || '',
      },
      position: { x: 0, y: 0 },
    };

    const campaignNodes = (current?.elements || []).map((el, idx) => ({
      id: el.id.replace(/^el_/, '') || `c_${idx + 1}`,
      type: 'campaign',
      data: {
        elementId: el.id,
        campaignId: el.campaignId,
        campaignName: campaignOptions.find((c) => c.id === el.campaignId)?.name || el.campaignId,
        label: el.label || '',
        keywords: el.keywords || [],
      },
      position: { x: 220 + idx * 100, y: 120 + idx * 30 },
    }));

    const edges = campaignNodes.map((cn) => ({
      id: `e_${motherNode.id}_${cn.id}`,
      source: motherNode.id,
      target: cn.id,
      animated: true,
      style: { stroke: '#6E59A5' },
      markerEnd: { type: 'arrowclosed', color: '#6E59A5' },
    }));

    const laidOut = radialLayout([motherNode, ...campaignNodes], motherNode.id);
    return { nodes: laidOut, edges };
  }, [current, campaignOptions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [selected, setSelected] = useState(null);

  // Reflect Mother AI changes into the mother node
  useEffect(() => {
    setNodes((nds) => nds.map((n) => n.type === 'mother' ? {
      ...n,
      data: {
        ...n.data,
        name: current?.name || 'Mother AI',
        systemPrompt: current?.systemPrompt || '',
      },
    } : n));
  }, [current?.name, current?.systemPrompt, setNodes]);

  const isValidConnection = useCallback((conn) => {
    const source = nodes.find(n => n.id === conn.source);
    const target = nodes.find(n => n.id === conn.target);
    return source?.type === 'mother' && target?.type === 'campaign';
  }, [nodes]);

  const onConnect = useCallback((params) => {
    const ok = isValidConnection(params);
    if (!ok) return;
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#2563eb' }, markerEnd: { type: 'arrowclosed', color: '#2563eb' } }, eds));
  }, [setEdges, isValidConnection]);

  const addCampaignNode = () => {
    const id = `c_${Date.now()}`;
    const newNode = {
      id,
      type: 'campaign',
      data: { elementId: `el_${id}`, label: 'New Campaign', campaignId: '', keywords: [] },
      position: { x: (Math.random() * 400) - 200, y: (Math.random() * 400) - 200 },
    };
    setNodes((nds) => [...nds, newNode]);
    // Ensure a mother node exists and edge connects
    const mother = nodes.find((n) => n.type === 'mother');
    const motherId = mother ? mother.id : (current?.id || 'mother');
    if (!mother) {
      setNodes((nds) => [
        ...nds,
        {
          id: motherId,
          type: 'mother',
          data: { name: current?.name || 'Mother AI', systemPrompt: current?.systemPrompt || '' },
          position: { x: 0, y: 0 },
        },
      ]);
    }
    setEdges((eds) => [...eds, { id: `e_${motherId}_${id}`, source: motherId, target: id, animated: true, style: { stroke: '#6E59A5' }, markerEnd: { type: 'arrowclosed', color: '#6E59A5' } }]);
  };

  const autoLayout = () => {
    setNodes((nds) => radialLayout(nds, (nds.find(n => n.type === 'mother') || nds[0])?.id));
  };

  const syncToParent = () => {
    // Update current.graph and elements for persistence
    const elements = deriveElementsFromGraph(nodes, edges);
    setCurrent((prev) => ({
      ...prev,
      graph: { nodes, edges },
      elements,
    }));
  };

  // Selection handling to drive the inspector
  const onSelectionChange = useCallback(({ nodes: n }) => {
    setSelected(n && n[0] ? n[0] : null);
  }, []);

  const updateSelected = (patch) => {
    if (!selected) return;
    setNodes((nds) => nds.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, ...patch } } : n)));
  };

  // Keyboard shortcuts: Delete/Backspace to remove selected node (except mother), F to fit
  function KeyboardShortcuts({ selected, setNodes, setEdges }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
      const onKey = (e) => {
        const tag = document.activeElement?.tagName;
        const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable;
        if (inInput) return; // don't interfere with typing in forms

        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (!selected || selected.type === 'mother') return;
          e.preventDefault();
          setNodes((nds) => nds.filter((n) => n.id !== selected.id));
          setEdges((eds) => eds.filter((ed) => ed.source !== selected.id && ed.target !== selected.id));
        } else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          fitView({ padding: 0.2 });
        }
      };

      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [selected, setNodes, setEdges, fitView]);

    return null;
  }

  // Inspector panel for campaign node
  const Inspector = () => {
    if (!selected || selected.type === 'mother') return (
      <div className="text-sm text-gray-500">Select a campaign node to edit its properties.</div>
    );
    const d = selected.data || {};
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Label</label>
          <input className="mt-1 w-full border rounded px-2 py-1" value={d.label || ''} onChange={(e) => updateSelected({ label: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Campaign</label>
          <select className="mt-1 w-full border rounded px-2 py-1" value={d.campaignId || ''} onChange={(e) => updateSelected({ campaignId: e.target.value, campaignName: (campaignOptions.find(c => c.id === e.target.value)?.name || e.target.value) })}>
            <option value="">Select campaign</option>
            {campaignOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Keywords (comma-separated)</label>
          <input className="mt-1 w-full border rounded px-2 py-1" value={(Array.isArray(d.keywords) ? d.keywords : []).join(', ')} onChange={(e) => updateSelected({ keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
        </div>
        <button onClick={syncToParent} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          <Save className="w-4 h-4" /> Sync to Form
        </button>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-[540px]">
      {/* Canvas */}
      <div className="lg:col-span-3 relative rounded-xl overflow-hidden border bg-white">
        {/* Toolbar */}
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <button onClick={addCampaignNode} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 text-white rounded-lg shadow hover:bg-black text-sm">
            <Plus className="w-4 h-4" /> Add Node
          </button>
          <button onClick={autoLayout} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow text-sm">
            <Wand2 className="w-4 h-4" /> Auto Layout
          </button>
          <button onClick={syncToParent} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm">
            <Save className="w-4 h-4" /> Sync
          </button>
        </div>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            isValidConnection={isValidConnection}
            fitView
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <KeyboardShortcuts selected={selected} setNodes={setNodes} setEdges={setEdges} />
            <MiniMap nodeColor={(n) => (n.type === 'mother' ? '#4f46e5' : '#a855f7')} nodeStrokeColor="#111827" maskColor="rgba(17,24,39,0.06)" />
            <Controls position="bottom-right">
              <Focus className="w-4 h-4" />
            </Controls>
            <Background variant="lines" gap={24} color="#e5e7eb" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Inspector */}
      <div className="bg-white rounded-xl border p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <div className="font-medium">Inspector</div>
        </div>
        <Inspector />
        <div className="pt-2 border-t text-xs text-gray-500">
          Tip: Use the canvas to connect Mother AI to Campaign nodes. Click Sync, then use Save above.
        </div>
      </div>
    </div>
  );
}