import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { riskTrendData } from "@/data/mockData";

export function RiskTrendChart() {
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Risk Trend</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={riskTrendData}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(215, 20%, 55%)" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 8%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="1"
              stroke="hsl(0, 84%, 60%)"
              fill="url(#colorCritical)"
              name="Critical"
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke="hsl(25, 95%, 53%)"
              fill="url(#colorHigh)"
              name="High"
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke="hsl(45, 93%, 47%)"
              fill="url(#colorMedium)"
              name="Medium"
            />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke="hsl(142, 71%, 45%)"
              fill="url(#colorLow)"
              name="Low"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
