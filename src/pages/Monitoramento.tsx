
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dailyData = [
  { name: "Dom", atendimentos: 45, solicitacoes: 32, tma: 7.2 },
  { name: "Seg", atendimentos: 78, solicitacoes: 45, tma: 6.8 },
  { name: "Ter", atendimentos: 92, solicitacoes: 58, tma: 5.9 },
  { name: "Qua", atendimentos: 85, solicitacoes: 61, tma: 6.3 },
  { name: "Qui", atendimentos: 110, solicitacoes: 70, tma: 5.5 },
  { name: "Sex", atendimentos: 120, solicitacoes: 85, tma: 5.2 },
  { name: "Sab", atendimentos: 60, solicitacoes: 40, tma: 6.4 },
];

const channelData = [
  { name: "WhatsApp", value: 45, color: "#25D366" },
  { name: "Chat", value: 25, color: "#7ae4ff" },
  { name: "E-mail", value: 15, color: "#a18aff" },
  { name: "Telefone", value: 10, color: "#f5ff55" },
  { name: "Outros", value: 5, color: "#4deb92" },
];

const satisfacaoData = [
  { name: "Muito satisfeito", value: 45, color: "#4deb92" },
  { name: "Satisfeito", value: 30, color: "#a1ecb7" },
  { name: "Neutro", value: 15, color: "#f5ff55" },
  { name: "Insatisfeito", value: 7, color: "#ffb07a" },
  { name: "Muito insatisfeito", value: 3, color: "#ff7a7a" },
];

export default function Monitoramento() {
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Monitoramento</h1>
            <p className="text-muted-foreground">
              Indicadores de performance e qualidade
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Atualizado há 5 minutos
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="mb-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
            <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
            <TabsTrigger value="satisfacao">Satisfação</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Volume de Atendimentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={dailyData}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 0,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="atendimentos"
                          stroke="#f5ff55"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Atendimentos"
                        />
                        <Line
                          type="monotone"
                          dataKey="solicitacoes"
                          stroke="#4deb92"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Solicitações"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Canais de Atendimento</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {channelData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Volume"]}
                          labelFormatter={() => ""}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tempo Médio de Atendimento</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailyData}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 0,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          label={{
                            value: "Minutos",
                            angle: -90,
                            position: "insideLeft",
                            style: { textAnchor: "middle" },
                          }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(245, 255, 85, 0.1)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="tma"
                          fill="#a18aff"
                          name="TMA (min)"
                          radius={[4, 4, 0, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Satisfação do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={satisfacaoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {satisfacaoData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}%`, ""]}
                          labelFormatter={(label) => label}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="atendimentos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Conteúdo detalhado sobre atendimentos será exibido aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitacoes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Solicitações</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Conteúdo detalhado sobre solicitações será exibido aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="satisfacao" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Satisfação</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Conteúdo detalhado sobre métricas de satisfação será exibido aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
