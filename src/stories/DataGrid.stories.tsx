import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataGrid } from '../components/DataGrid/DataGrid';
import type { ColumnDef } from '../core/types';

const meta: Meta<typeof DataGrid> = {
  title: 'Components/DataGrid',
  component: DataGrid,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-screen p-8 bg-white flex flex-col items-center justify-center">
        <div className="w-full max-w-[1200px] h-[600px] bg-white rounded-lg shadow-xl overflow-hidden border border-zinc-200">
            <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DataGrid>;

// --- Mock Data Generator ---
const generateData = (count: number) => {
    const departments = ['Engineering', 'Sales', 'Marketing', 'Legal', 'Finance', 'HR'];
    const status = ['Active', 'On Leave', 'Terminated', 'Contractor'];
    
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        name: `Employee ${i + 1}`,
        email: `employee${i + 1}@acme.com`,
        department: departments[Math.floor(Math.random() * departments.length)],
        status: status[Math.floor(Math.random() * status.length)],
        balance: Math.floor(Math.random() * 100000),
        lastLogin: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
    }));
};

const columns: ColumnDef<unknown>[] = [
    { id: 'id', title: 'ID', width: 80, pinned: 'left', sortable: true },
    { id: 'name', title: 'Name', width: 200, pinned: 'left', sortable: true },
    { id: 'department', title: 'Department', width: 150, sortable: true },
    { id: 'status', title: 'Status', width: 120, sortable: true, render: (val: unknown) => {
        const colors: Record<string, string> = {
            'Active': 'bg-emerald-100 text-emerald-700',
            'On Leave': 'bg-amber-100 text-amber-700',
            'Terminated': 'bg-red-100 text-red-700',
            'Contractor': 'bg-blue-100 text-blue-700'
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[val as string] || 'bg-gray-100 text-gray-700'}`}>
                {val as string}
            </span>
        );
    }},
    { id: 'email', title: 'Email', width: 250, sortable: true },
    { id: 'balance', title: 'Balance', width: 150, sortable: true, render: (val) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val as number)
    },
    { id: 'lastLogin', title: 'Last Login', width: 150, sortable: true },
    // Add extra columns to force horizontal scroll
    { id: 'col1', title: 'Metric A', width: 120, render: () => Math.random().toFixed(2) },
    { id: 'col2', title: 'Metric B', width: 120, render: () => Math.random().toFixed(2) },
    { id: 'col3', title: 'Metric C', width: 120, render: () => Math.random().toFixed(2) },
    { id: 'actions', title: 'Actions', width: 100, pinned: 'right', render: () => (
        <button className="text-zinc-400 hover:text-zinc-600">Edit</button>
    )},
];

// --- Performance Tools ---
const FPSMeter = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
     let frameCount = 0;
     let lastTime = performance.now();
     let rafId: number;
     
     const loop = () => {
         const now = performance.now();
         frameCount++;
         
         if (now - lastTime >= 1000) {
             const fps = Math.round((frameCount * 1000) / (now - lastTime));
             if (ref.current) ref.current.innerText = `FPS: ${fps}`;
             frameCount = 0;
             lastTime = now;
         }
         rafId = requestAnimationFrame(loop);
     };
     
     rafId = requestAnimationFrame(loop);
     return () => cancelAnimationFrame(rafId);
  }, []);
  
  return (
      <div 
        ref={ref} 
        className="fixed top-4 right-4 z-50 bg-black/80 text-green-400 font-mono text-xs px-2 py-1 rounded"
      >
          FPS: --
      </div>
  );
};

// --- Stories ---

const bigData = generateData(50000);

export const StressTest100k: Story = {
  args: {
    data: generateData(100000),
    columns: columns,
    rowHeight: 36,
  },
  decorators: [
      (Story) => (
          <>
             <FPSMeter />
             <div className="relative">
                 <div className="absolute -top-8 left-0 text-xs text-red-600 font-bold uppercase tracking-wider">
                    ⚠️ Stress Test: 100k Rows
                 </div>
                 <Story />
             </div>
          </>
      )
  ]
};

export const AccessibilityHighContrast: Story = {
    args: {
        data: generateData(50),
        columns: columns,
    },
    decorators: [
        (Story) => (
            <div 
              style={{ filter: 'contrast(1.5) grayscale(1)' }} 
              className="border-4 border-black p-4 bg-white"
            >
                <h3 className="mb-4 font-bold uppercase underline">Simulation: High Contrast / Greyscale</h3>
                <Story />
            </div>
        )
    ]
};

export const EdgeCaseEmpty: Story = {
    args: {
        data: [],
        columns: columns,
    },
    render: (args) => (
        <div className="h-[300px] w-full border border-dashed border-zinc-300 rounded flex flex-col">
            <DataGrid {...args} />
        </div>
    )
};

export const BigData50k: Story = {
  args: {
    data: bigData,
    columns: columns,
    rowHeight: 36,
  },
};

export const SmallData: Story = {
    args: {
        data: generateData(100),
        columns: columns,
        rowHeight: 36,
    }
};
