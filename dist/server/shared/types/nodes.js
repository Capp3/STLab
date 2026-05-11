export const NODE_TYPE_LABELS = {
    single_source: 'Single Source',
    group_source: 'Group Source',
    single_destination: 'Single Destination',
    group_destination: 'Group Destination',
    dedicated_switch: 'Dedicated Switch',
    shared_switch: 'Shared Switch',
    grandmaster_clock: 'Grandmaster Clock',
    nmos_device: 'NMOS Device',
};
export const NODE_TYPE_COLORS = {
    single_source: '#3B82F6',
    group_source: '#2563EB',
    single_destination: '#10B981',
    group_destination: '#059669',
    dedicated_switch: '#8B5CF6',
    shared_switch: '#F59E0B',
    grandmaster_clock: '#EAB308',
    nmos_device: '#06B6D4',
};
export const NODE_CATEGORIES = [
    {
        label: 'Sources',
        types: ['single_source', 'group_source'],
    },
    {
        label: 'Destinations',
        types: ['single_destination', 'group_destination'],
    },
    {
        label: 'Switches',
        types: ['dedicated_switch', 'shared_switch'],
    },
    {
        label: 'Timing & Control',
        types: ['grandmaster_clock', 'nmos_device'],
    },
];
