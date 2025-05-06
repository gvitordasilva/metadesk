
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const data = [
  { name: "WhatsApp", value: 45, color: "#25D366" },
  { name: "Chat", value: 25, color: "#7ae4ff" },
  { name: "E-mail", value: 15, color: "#a18aff" },
  { name: "Telefone", value: 10, color: "#f5ff55" },
  { name: "Outros", value: 5, color: "#4deb92" },
];

export function ChannelMetrics() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribuição por Canais</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Volume']} 
                labelFormatter={() => ''}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
