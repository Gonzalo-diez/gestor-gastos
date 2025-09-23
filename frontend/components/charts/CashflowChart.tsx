"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CashflowChart({ data }: { data: any[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="income" />
          <Line type="monotone" dataKey="expense" />
          <Line type="monotone" dataKey="net" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

