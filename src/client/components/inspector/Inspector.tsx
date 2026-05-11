import { useDesignStore } from '../../store/designStore.js';
import { useUiStore } from '../../store/uiStore.js';
import { NODE_TYPE_LABELS, NODE_TYPE_COLORS } from '../../../shared/types/nodes.js';
import type { NodeType } from '../../../shared/types/nodes.js';
import { NETWORK_PLANE_LABELS, NETWORK_PLANE_COLORS } from '../../../shared/types/links.js';
import type { NetworkPlane } from '../../../shared/types/links.js';

function Field({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string | number | undefined;
  type?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label className="stlab-label">{label}</label>
      <input className="stlab-input" type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  onChange: (val: string) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label className="stlab-label">{label}</label>
      <select className="stlab-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NodeInspector({ nodeId }: { nodeId: string }) {
  const { nodes, updateNodeData } = useDesignStore();
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const data = node.data as Record<string, unknown>;
  const nodeType = data['nodeType'] as NodeType | undefined;
  const color = nodeType ? NODE_TYPE_COLORS[nodeType] : '#64748b';

  const set = (key: string) => (val: string) => updateNodeData(nodeId, { [key]: val });
  const setNum = (key: string) => (val: string) => updateNodeData(nodeId, { [key]: val ? Number(val) : undefined });

  return (
    <div>
      <div style={{ padding: '12px 16px', background: color, borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
          {nodeType ? NODE_TYPE_LABELS[nodeType] : 'Node'}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <Field label="Label" value={data['label'] as string} onChange={set('label')} />
        <Field label="Device Type" value={data['deviceType'] as string} onChange={set('deviceType')} />

        {(nodeType === 'single_source' || nodeType === 'group_source') && (
          <>
            <SelectField
              label="Signal Type"
              value={data['signalType'] as string}
              onChange={set('signalType')}
              options={[
                { value: 'video', label: 'Video' },
                { value: 'audio', label: 'Audio' },
                { value: 'combined', label: 'Combined' },
                { value: 'anc', label: 'ANC' },
              ]}
            />
            <Field label="Resolution" value={data['resolution'] as string} onChange={set('resolution')} />
            <Field
              label="Video Refresh Rate"
              value={data['videoRefreshRate'] as string}
              onChange={set('videoRefreshRate')}
            />
            <Field
              label="Video Bit Depth"
              value={data['videoBitDepth'] as number}
              type="number"
              onChange={setNum('videoBitDepth')}
            />
            <Field
              label="Audio Channels"
              value={data['audioChannels'] as number}
              type="number"
              onChange={setNum('audioChannels')}
            />
            <Field
              label="Audio Bit Depth"
              value={data['audioBitDepth'] as number}
              type="number"
              onChange={setNum('audioBitDepth')}
            />
            <SelectField
              label="Sender Type (ST 2110-21)"
              value={data['senderType'] as string}
              onChange={set('senderType')}
              options={[
                { value: 'N', label: 'Narrow (N)' },
                { value: 'NL', label: 'Narrow-Linear (NL)' },
                { value: 'W', label: 'Wide (W)' },
              ]}
            />
          </>
        )}

        {(nodeType === 'dedicated_switch' || nodeType === 'shared_switch') && (
          <>
            <Field
              label="Port Count"
              value={data['portCount'] as number}
              type="number"
              onChange={setNum('portCount')}
            />
            <Field
              label="Port Speed (Gbps)"
              value={data['portSpeedGbps'] as number}
              type="number"
              onChange={setNum('portSpeedGbps')}
            />
            <Field
              label="Backplane Capacity (Gbps)"
              value={data['backplaneCapacityGbps'] as number}
              type="number"
              onChange={setNum('backplaneCapacityGbps')}
            />
            {nodeType === 'shared_switch' && (
              <Field
                label="Non-ST2110 Load (Gbps)"
                value={data['existingNonSt2110LoadGbps'] as number}
                type="number"
                onChange={setNum('existingNonSt2110LoadGbps')}
              />
            )}
            <SelectField
              label="PTP Clock Mode"
              value={data['ptpClockMode'] as string}
              onChange={set('ptpClockMode')}
              options={[
                { value: 'boundary', label: 'Boundary Clock' },
                { value: 'transparent', label: 'Transparent Clock' },
              ]}
            />
          </>
        )}

        {nodeType === 'grandmaster_clock' && (
          <>
            <Field
              label="Domain Number"
              value={data['domainNumber'] as number}
              type="number"
              onChange={setNum('domainNumber')}
            />
            <Field
              label="Priority 1"
              value={data['priority1'] as number}
              type="number"
              onChange={setNum('priority1')}
            />
            <Field
              label="Priority 2"
              value={data['priority2'] as number}
              type="number"
              onChange={setNum('priority2')}
            />
            <Field
              label="Clock Class"
              value={data['clockClass'] as number}
              type="number"
              onChange={setNum('clockClass')}
            />
            <SelectField
              label="Redundancy Role"
              value={data['redundancyRole'] as string}
              onChange={set('redundancyRole')}
              options={[
                { value: 'primary', label: 'Primary' },
                { value: 'secondary', label: 'Secondary' },
              ]}
            />
            <SelectField
              label="Delay Mechanism"
              value={data['delayMechanism'] as string}
              onChange={set('delayMechanism')}
              options={[
                { value: 'E2E', label: 'End-to-End (E2E)' },
                { value: 'P2P', label: 'Peer-to-Peer (P2P)' },
              ]}
            />
            <Field label="Clock Identity" value={data['clockIdentity'] as string} onChange={set('clockIdentity')} />
          </>
        )}

        {nodeType === 'nmos_device' && (
          <>
            <Field label="Device Role" value={data['deviceRole'] as string} onChange={set('deviceRole')} />
            <Field label="API Endpoint" value={data['apiEndpoint'] as string} onChange={set('apiEndpoint')} />
            <SelectField
              label="Registration Mode"
              value={data['registrationMode'] as string}
              onChange={set('registrationMode')}
              options={[
                { value: 'peer-to-peer', label: 'Peer-to-Peer' },
                { value: 'registered', label: 'Registered' },
              ]}
            />
          </>
        )}

        <Field label="Management IP" value={data['managementIp'] as string} onChange={set('managementIp')} />
        <div style={{ marginBottom: 10 }}>
          <label className="stlab-label">Notes</label>
          <textarea
            className="stlab-input"
            style={{ height: 60, resize: 'vertical' }}
            value={(data['notes'] as string) ?? ''}
            onChange={(e) => updateNodeData(nodeId, { notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function EdgeInspector({ edgeId }: { edgeId: string }) {
  const { edges } = useDesignStore();
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return null;

  const data = edge.data as Record<string, unknown>;
  const plane = data['networkPlane'] as NetworkPlane | undefined;
  const color = plane ? NETWORK_PLANE_COLORS[plane] : '#6B7280';

  return (
    <div>
      <div style={{ padding: '12px 16px', background: color, borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
          Link
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 10 }}>
          <label className="stlab-label">Network Plane</label>
          <select
            className="stlab-input"
            value={plane ?? 'media'}
            onChange={() => {
              // Edge data updates handled via store
            }}
          >
            {Object.entries(NETWORK_PLANE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label className="stlab-label">Capacity (Mbps)</label>
          <input
            className="stlab-input"
            type="number"
            value={(data['capacityMbps'] as number) ?? 10000}
            onChange={() => {}}
          />
        </div>
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6,
            fontSize: 11,
            color: '#94a3b8',
          }}
        >
          <div>
            <strong>Source:</strong> {edge.source}
          </div>
          <div>
            <strong>Target:</strong> {edge.target}
          </div>
          <div>
            <strong>Plane:</strong> {plane ? NETWORK_PLANE_LABELS[plane] : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Inspector() {
  const { selectedNodeId, selectedEdgeId } = useUiStore();

  if (!selectedNodeId && !selectedEdgeId) {
    return (
      <div style={{ padding: 20, color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>☉</div>
        <div>Select a node or link</div>
        <div style={{ marginTop: 4, fontSize: 11 }}>to inspect its properties</div>
      </div>
    );
  }

  return (
    <div>
      {selectedNodeId && <NodeInspector nodeId={selectedNodeId} />}
      {selectedEdgeId && <EdgeInspector edgeId={selectedEdgeId} />}
    </div>
  );
}
