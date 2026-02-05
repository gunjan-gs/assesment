import { useState, useMemo } from 'react'
import { DataGrid } from './components/DataGrid'
import { Badge } from './components/ui/Badge'
import type { ColumnDef } from './core/types'
import './App.css'

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  age: number;
}

const generateData = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    firstName: `First${i}`,
    lastName: `Last${i}`,
    email: `user${i}@example.com`,
    role: i % 3 === 0 ? 'Admin' : 'User',
    status: i % 2 === 0 ? 'Active' : 'Inactive',
    age: 20 + (i % 40)
  }));
};

function App() {
  const [rowCount] = useState(50000);
  const rows = useMemo(() => generateData(rowCount), [rowCount]);

  const columns: ColumnDef<User>[] = [
    { id: 'id', title: 'ID', width: 80, pinned: 'left' },
    { id: 'firstName', title: 'First Name', width: 150 },
    { id: 'lastName', title: 'Last Name', width: 150 },
    { id: 'email', title: 'Email', width: 250 },
    { 
      id: 'role', 
      title: 'Role', 
      width: 140,
      render: (value: unknown) => {
        const strValue = value as string;
        const color = strValue === 'Admin' ? 'indigo' : 'zinc';
        return <Badge color={color} variant="soft">{strValue}</Badge>;
      }
    },
    { 
      id: 'status', 
      title: 'Status', 
      width: 140,
      render: (value: unknown) => {
        const strValue = value as string;
        const color = strValue === 'Active' ? 'emerald' : 'rose';
        return <Badge color={color} dot>{strValue}</Badge>;
      }
    },
    { id: 'age', title: 'Age', width: 80 },
  ];

  return (
    <div className="p-8 h-screen flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Production DataGrid Audit Fix</h1>
      <p className="text-gray-600">Rendering {rowCount.toLocaleString()} rows with virtualization.</p>
      
      <div className="flex-1 overflow-hidden">
        <DataGrid 
          columns={columns}
          data={rows}
          className="h-full"
        />
      </div>
    </div>
  )
}

export default App
